import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import { scanContentForSecrets } from '@/lib/export/export-service'
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
    const relevantDocsLines = backlog.match(/(?:\*\*Relevant Docs:\*\*|Relevant Docs:)[^\n]*/gi)
    const rawRefs = relevantDocsLines
      ? relevantDocsLines.flatMap((line) => line.match(/[A-Z0-9_\-]+\.md/gi) || [])
      : (backlog.match(/[A-Z0-9_\-]+\.md/gi) || [])
    const docRefs = new Set(rawRefs)
    const existingPaths = new Set(artifacts.map((a) => a.path.toLowerCase()))

    for (const ref of docRefs) {
      if (!existingPaths.has(ref.toLowerCase()) && ref.toLowerCase() !== 'backlog.md' && ref.toLowerCase() !== 'readme.md') {
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

  // Rule 3: Secret Leakage Preflight Check
  for (const art of artifacts) {
    try {
      scanContentForSecrets(art.content, art.path)
    } catch {
      issues.push({
        severity: 'HIGH',
        category: 'SECRET_LEAKAGE',
        description: `Potential secret or API key pattern detected in ${art.path}. Remove or replace credentials with empty placeholders before export.`,
        affected_documents: [art.path],
        recommendation: `Sanitize credentials, connection strings, or private keys in ${art.path} with placeholder values like "" or \${VAR_NAME}.`,
      })
    }
  }

  // Rule 4: DESIGN.md System Tokens Check
  const design = docMap.get('DESIGN') || ''
  if (design) {
    const hasFrontMatter = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.test(design.trim())
    const hasRequiredTokens =
      /colors\s*:/i.test(design) &&
      /typography\s*:/i.test(design) &&
      /rounded\s*:/i.test(design) &&
      /spacing\s*:/i.test(design) &&
      /iconography\s*:/i.test(design)

    if (!hasFrontMatter || !hasRequiredTokens) {
      issues.push({
        severity: 'MEDIUM',
        category: 'INVALID_DESIGN_SYSTEM',
        description: 'DESIGN.md is missing required machine-readable YAML front matter tokens (colors, typography, rounded, spacing, or iconography).',
        affected_documents: ['DESIGN.md'],
        recommendation: 'Ensure DESIGN.md starts with a YAML front matter block specifying colors, typography, rounded, spacing, and iconography tokens.',
      })
    }
  }

  // Rule 5: AGENT.md & DESIGN.md Consistency Check
  const agent = docMap.get('AGENT') || ''
  if (agent && design) {
    if (!agent.includes('DESIGN.md')) {
      issues.push({
        severity: 'MEDIUM',
        category: 'AGENT_DESIGN_HIERARCHY_MISSING',
        description: 'Agent.md does not establish DESIGN.md in its document hierarchy as the visual authority.',
        affected_documents: ['Agent.md', 'DESIGN.md'],
        recommendation: 'Ensure Agent.md establishes DESIGN.md as the sole visual/interaction authority.',
      })
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
        select: {
          id: true,
          contentJson: true,
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
    project.contexts[0]?.contentJson,
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
