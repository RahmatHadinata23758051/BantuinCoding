import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  CONSISTENCY_VALIDATOR_SYSTEM_PROMPT,
  ConsistencyReportSchema,
  buildConsistencyValidatorUserPrompt,
  type ConsistencyIssue,
  type ConsistencyReportOutput,
} from '@/lib/prompts/consistency-validator'

const MAX_ARTIFACT_CONTENT_LENGTH = 12_000
const AI_AUDIT_TIMEOUT_MS = 20_000

interface ConsistencyArtifact {
  type: string
  path: string
  content: string
}

function summarizeArtifactContent(content: string): string {
  if (content.length <= MAX_ARTIFACT_CONTENT_LENGTH) return content

  return `${content.slice(0, MAX_ARTIFACT_CONTENT_LENGTH)}\n\n[Document truncated for consistency audit.]`
}

function mergeConsistencyReports(
  deterministic: ConsistencyReportOutput,
  ai: ConsistencyReportOutput,
): ConsistencyReportOutput {
  const issues = [...deterministic.issues]
  const knownIssues = new Set(
    issues.map((issue) => `${issue.category}:${issue.description}`),
  )

  for (const issue of ai.issues) {
    const key = `${issue.category}:${issue.description}`
    if (!knownIssues.has(key)) {
      issues.push(issue)
      knownIssues.add(key)
    }
  }

  const highCount = issues.filter((issue) => issue.severity === 'HIGH').length
  const mediumCount = issues.filter((issue) => issue.severity === 'MEDIUM').length
  const lowCount = issues.filter((issue) => issue.severity === 'LOW').length
  const score = Math.max(0, 100 - highCount * 25 - mediumCount * 10 - lowCount * 5)

  return {
    isConsistent: score >= 80,
    score,
    issues,
    summary:
      issues.length === 0
        ? 'Documentation pack is cross-document consistent.'
        : `Found ${issues.length} consistency issues requiring attention.`,
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Consistency audit provider timed out')),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

function getCurrentPackArtifacts(project: {
  contexts: Array<{
    id: string
    artifactPlans: Array<{ type: string; path: string; isRequired: boolean }>
  }>
  artifacts: Array<{
    contextId: string
    type: string
    path: string
    content: string
    status: string
  }>
}): ConsistencyArtifact[] {
  const currentContext = project.contexts[0]
  if (!currentContext) return []

  const requiredPlan = currentContext.artifactPlans.filter((plan) => plan.isRequired)
  const requiredTypes = new Set(requiredPlan.map((plan) => plan.type))
  const plannedPaths = new Map(requiredPlan.map((plan) => [plan.type, plan.path]))

  return project.artifacts
    .filter(
      (artifact) =>
        artifact.contextId === currentContext.id &&
        requiredTypes.has(artifact.type) &&
        (artifact.status === 'READY' || artifact.status === 'MODIFIED'),
    )
    .map((artifact) => ({
      type: artifact.type,
      path: plannedPaths.get(artifact.type) ?? artifact.path,
      content: artifact.content,
    }))
}

/**
 * Deterministic rule-based consistency validator.
 * Performs fast local static analysis across document content.
 */
export function validateRuleBasedConsistency(
  artifacts: { type: string; path: string; content: string }[],
): ConsistencyReportOutput {
  const issues: ConsistencyIssue[] = []
  const docMap = new Map<string, string>()

  for (const art of artifacts) {
    docMap.set(art.type, art.content || '')
  }

  const prd = docMap.get('PRD') || ''
  const arch = docMap.get('ARCHITECTURE') || ''
  const backlog = docMap.get('BACKLOG') || ''

  // Rule 1: Stack check
  if (arch && prd) {
    const archLower = arch.toLowerCase()
    const prdLower = prd.toLowerCase()

    if (archLower.includes('postgresql') && prdLower.includes('mongodb')) {
      issues.push({
        severity: 'HIGH',
        category: 'DATABASE_MISMATCH',
        description: 'ARCHITECTURE specifies PostgreSQL, but PRD mentions MongoDB.',
        affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
        recommendation: 'Align database technology across PRD and ARCHITECTURE.',
      })
    }
  }

  // Rule 2: Backlog Doc References Check
  if (backlog) {
    const docRefs = backlog.match(/[A-Z0-9_\-]+\.md/gi) || []
    const existingPaths = new Set(artifacts.map((a) => a.path))

    for (const ref of docRefs) {
      if (!existingPaths.has(ref) && ref !== 'BACKLOG.md' && ref !== 'README.md') {
        issues.push({
          severity: 'MEDIUM',
          category: 'INVALID_BACKLOG_DOC_REF',
          description: `BACKLOG.md references non-existent document file: ${ref}`,
          affected_documents: ['BACKLOG.md', ref],
          recommendation: `Remove or update reference to ${ref} in BACKLOG.md`,
        })
      }
    }
  }

  // Calculate consistency score
  const highCount = issues.filter((i) => i.severity === 'HIGH').length
  const medCount = issues.filter((i) => i.severity === 'MEDIUM').length
  const lowCount = issues.filter((i) => i.severity === 'LOW').length

  const score = Math.max(0, 100 - (highCount * 25 + medCount * 10 + lowCount * 5))
  const isConsistent = score >= 80

  return {
    isConsistent,
    score,
    issues,
    summary: isConsistent
      ? 'Documentation pack is cross-document consistent.'
      : `Found ${issues.length} consistency issues requiring attention.`,
  }
}

export interface AuditConsistencyOptions {
  userId: string
  projectId: string
}

/**
 * Validates cross-document consistency for a project using AI provider or rule-based fallback.
 */
export async function auditProjectConsistency({
  userId,
  projectId,
}: AuditConsistencyOptions): Promise<ConsistencyReportOutput> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
        include: {
          artifactPlans: {
            where: { isRequired: true },
            select: { type: true, path: true, isRequired: true },
          },
        },
      },
      artifacts: {
        select: {
          contextId: true,
          type: true,
          path: true,
          content: true,
          status: true,
        },
      },
    },
  })

  if (!project) throw new Error('Project not found')

  const artifacts = getCurrentPackArtifacts(project)
  const deterministicReport = validateRuleBasedConsistency(artifacts)

  // Deterministic validation is authoritative for known safety checks and
  // allows export validation to complete even when the optional AI audit fails.
  const providerConfig = getProviderConfig(userId)
  if (!providerConfig || artifacts.length === 0) return deterministicReport

  const provider = createProvider(providerConfig)
  const artifactsSummary = artifacts.map((artifact) => ({
    ...artifact,
    content: summarizeArtifactContent(artifact.content),
  }))
  const userPrompt = buildConsistencyValidatorUserPrompt(
    project.name,
    JSON.stringify(artifactsSummary),
  )

  try {
    const aiReport = await withTimeout(
      provider.generateStructured(
        userPrompt,
        ConsistencyReportSchema,
        {
          system: CONSISTENCY_VALIDATOR_SYSTEM_PROMPT,
          maxTokens: 2048,
          temperature: 0.1,
        },
      ),
      AI_AUDIT_TIMEOUT_MS,
    )

    return mergeConsistencyReports(deterministicReport, aiReport)
  } catch {
    return deterministicReport
  }
}

export { getCurrentPackArtifacts }
export { summarizeArtifactContent }
