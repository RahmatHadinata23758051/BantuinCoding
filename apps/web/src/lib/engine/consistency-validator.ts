import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import { scanContentForSecrets } from '@/lib/export/export-service'
import { validateDesignTokensAndContrast } from '@/lib/engine/design-token-validator'
import { validateArtifactIntegrity } from '@/lib/engine/artifact-integrity'
import {
  CONSISTENCY_VALIDATOR_SYSTEM_PROMPT,
  ConsistencyReportSchema,
  buildConsistencyValidatorUserPrompt,
  isBlockerIssue,
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

const STACK_CHOICES: Record<string, string[][]> = {
  frontend: [['react', 'next.js', 'nextjs', 'vue', 'svelte', 'angular'], ['typescript', 'javascript']],
  backend: [['node.js', 'nodejs', 'python', 'bun', 'deno', 'java', 'go', 'rust']],
  database: [['postgresql', 'postgres', 'mysql', 'sqlite', 'mongodb', 'mariadb', 'dynamodb']],
  styling: [['tailwind', 'css modules', 'styled-components', 'sass']],
}

function confirmedStack(contextJson: string): Record<string, string> {
  try {
    const context = JSON.parse(contextJson) as Record<string, unknown>
    const preferences = context.stack_preferences
    if (typeof preferences !== 'object' || preferences === null) return {}
    return Object.fromEntries(Object.entries(preferences as Record<string, unknown>).flatMap(([key, value]) => {
      if (typeof value !== 'object' || value === null) return []
      const item = value as Record<string, unknown>
      return typeof item.provenance === 'string' && item.provenance.toLowerCase() === 'confirmed' && typeof item.value === 'string'
        ? [[key, item.value]]
        : []
    }))
  } catch {
    return {}
  }
}

function choiceIn(text: string, choices: string[]): string[] {
  const matches = choices.filter((choice) =>
    new RegExp(`(^|[^a-z0-9])${choice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i').test(text),
  ).map((choice) => {
    if (choice === 'postgres') return 'postgresql'
    if (choice === 'nextjs' || choice === 'next.js' || choice === 'react') return 'react'
    return choice
  })
  return [...new Set(matches)]
}

function confirmedStackIssues(
  artifacts: ConsistencyArtifact[],
  contextJson: string,
): ConsistencyIssue[] {
  const stack = confirmedStack(contextJson)
  const issues: ConsistencyIssue[] = []
  const declarations = /^\s*(?:[-*]\s*)?\*{0,2}(database|db|frontend|front-end|backend|back-end|styling)\*{0,2}\s*:\s*([^\n|]+).*$/gim

  for (const artifact of artifacts) {
    for (const [, rawDimension, value] of artifact.content.matchAll(declarations)) {
      const label = rawDimension.toLowerCase().replace(/[- ]/g, '')
      const dimension = label === 'db' ? 'database' : label.startsWith('front') ? 'frontend' : label.startsWith('back') ? 'backend' : label
      const confirmed = stack[dimension]
      const groups = STACK_CHOICES[dimension]
      if (!confirmed || !groups) continue

      for (const choices of groups) {
        const expected = choiceIn(confirmed, choices)
        const documented = choiceIn(value, choices)
        if (expected.length !== 1 || documented.length !== 1 || expected[0] === documented[0]) continue
        const category = dimension === 'database' ? 'DATABASE_MISMATCH' : 'STACK_MISMATCH'
        if (issues.some((issue) =>
          issue.category === category &&
          issue.affected_documents[0] === artifact.path &&
          issue.description.startsWith(`${artifact.path} declares ${dimension} choice`),
        )) continue
        issues.push({
          severity: 'HIGH',
          classification: 'BLOCKER',
          category,
          description: `${artifact.path} declares ${dimension} choice "${documented[0]}" that conflicts with confirmed project context.`,
          affected_documents: [artifact.path],
          recommendation: `Update the ${dimension} choice to match confirmed project context, then rerun validation.`,
        })
      }
    }
  }

  return issues
}

function summarizeArtifactContent(content: string): string {
  if (content.length <= MAX_ARTIFACT_CONTENT_LENGTH) return content
  return `${content.slice(0, MAX_ARTIFACT_CONTENT_LENGTH)}\n\n[Document truncated for consistency audit.]`
}

function finalizeReport(
  report: Omit<ConsistencyReportOutput, 'blocksExport' | 'auditMode'> & {
    blocksExport?: boolean
    auditMode?: ConsistencyReportOutput['auditMode']
  },
  auditMode: ConsistencyReportOutput['auditMode'],
): ConsistencyReportOutput {
  const issues = report.issues.map((issue) => ({
    ...issue,
    classification: issue.classification ?? (isBlockerIssue(issue) ? 'BLOCKER' : 'WARNING'),
  }))
  const blocksExport = report.blocksExport ?? issues.some((issue) => issue.classification === 'BLOCKER')
  return {
    ...report,
    issues,
    blocksExport,
    auditMode,
    isConsistent: report.isConsistent && !blocksExport,
  }
}

function mergeConsistencyReports(
  deterministic: ConsistencyReportOutput,
  ai: ConsistencyReportOutput,
): ConsistencyReportOutput {
  const issues = [...deterministic.issues]
  const knownIssues = new Set(issues.map((issue) => `${issue.category}:${issue.description}`))
  for (const issue of ai.issues) {
    const key = `${issue.category}:${issue.description}`
    if (!knownIssues.has(key)) {
      issues.push({ ...issue, classification: 'WARNING' })
      knownIssues.add(key)
    }
  }

  const highCount = issues.filter((issue) => issue.severity === 'HIGH').length
  const mediumCount = issues.filter((issue) => issue.severity === 'MEDIUM').length
  const lowCount = issues.filter((issue) => issue.severity === 'LOW').length
  const score = Math.max(0, 100 - highCount * 25 - mediumCount * 10 - lowCount * 5)
  return finalizeReport({
    isConsistent: score >= 80,
    score,
    issues,
    summary: issues.length === 0
      ? 'Documentation pack is cross-document consistent.'
      : `Found ${issues.length} consistency issues requiring attention.`,
  }, 'ai-assisted')
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

function normalizeDocPath(path: string): string {
  return path.trim().replace(/\\/g, '/').replace(/^(?:\.\/)+/, '').toLowerCase()
}

function addBacklogReferenceBlockers(
  report: ConsistencyReportOutput,
  artifacts: ConsistencyArtifact[],
): ConsistencyReportOutput {
  const backlog = artifacts.find((artifact) => artifact.type === 'BACKLOG')
  if (!backlog) return report
  const includedPaths = new Set(artifacts.map((artifact) => normalizeDocPath(artifact.path)))
  const issues: ConsistencyIssue[] = []
  const relevantDocLines = backlog.content.matchAll(/^(?:\*\*Relevant Docs:\*\*|Relevant Docs:)\s*([^\n]*)$/gim)
  for (const [, line] of relevantDocLines) {
    for (const item of line.split(/[,;]/)) {
      const path = item.trim().replace(/^`|`$/g, '')
      const normalizedPath = normalizeDocPath(path)
      if (!/\.md$/i.test(path) || normalizedPath === 'readme.md' || includedPaths.has(normalizedPath)) continue
      const alreadyReported = report.issues.some((issue) =>
        issue.category === 'INVALID_BACKLOG_DOC_REF' && normalizeDocPath(issue.affected_documents[1] ?? '') === normalizedPath,
      )
      if (alreadyReported || issues.some((issue) => normalizeDocPath(issue.affected_documents[1] ?? '') === normalizedPath)) continue
      issues.push({
        severity: 'HIGH',
        classification: 'BLOCKER',
        category: 'INVALID_BACKLOG_DOC_REF',
        description: `${backlog.path} references a document that is not included in the current pack: ${path}`,
        affected_documents: [backlog.path, path],
        recommendation: 'Remove the reference or include the planned document, then rerun validation.',
      })
    }
  }
  if (issues.length === 0) return report
  return finalizeReport({
    ...report,
    isConsistent: false,
    blocksExport: true,
    issues: [...report.issues, ...issues],
    summary: `Found ${report.issues.length + issues.length} consistency issues requiring attention.`,
  }, report.auditMode)
}

function addStructuralIntegrityBlockers(
  report: ConsistencyReportOutput,
  artifacts: ConsistencyArtifact[],
): ConsistencyReportOutput {
  const structuralIssues: ConsistencyIssue[] = artifacts.flatMap((artifact) => {
    const integrityIssues = validateArtifactIntegrity(artifact.type, artifact.content)
    if (integrityIssues.length === 0) return []
    return [{
      severity: 'HIGH',
      classification: 'BLOCKER',
      category: 'STRUCTURAL_INTEGRITY',
      description: `${artifact.path} is structurally incomplete: ${integrityIssues.join(' ')}`,
      affected_documents: [artifact.path],
      recommendation: `Regenerate ${artifact.path} and ensure required sections and code fences are complete.`,
    }]
  })
  if (structuralIssues.length === 0) return report
  return finalizeReport({
    ...report,
    isConsistent: false,
    blocksExport: true,
    issues: [...report.issues, ...structuralIssues],
    summary: `Found ${report.issues.length + structuralIssues.length} consistency issues requiring attention.`,
  }, report.auditMode)
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
    .filter((artifact) =>
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
  contextJson = '',
): ConsistencyReportOutput {
  const issues: ConsistencyIssue[] = []
  const docMap = new Map<string, string>()
  for (const artifact of artifacts) docMap.set(artifact.type, artifact.content || '')

  const prd = docMap.get('PRD') || ''
  const arch = docMap.get('ARCHITECTURE') || ''
  const backlog = artifacts.find((artifact) => artifact.type === 'BACKLOG')

  // Legacy cross-document rule remains advisory unless confirmed context proves the conflict.
  if (arch && prd && arch.toLowerCase().includes('postgresql') && prd.toLowerCase().includes('mongodb')) {
    issues.push({
      severity: 'HIGH',
      classification: 'WARNING',
      category: 'DATABASE_MISMATCH',
      description: 'ARCHITECTURE specifies PostgreSQL, but PRD mentions MongoDB.',
      affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
      recommendation: 'Align database technology across PRD and ARCHITECTURE.',
    })
  }

  if (backlog) {
    const relevantDocsLines = backlog.content.match(/(?:\*\*Relevant Docs:\*\*|Relevant Docs:)[^\n]*/gi)
    const rawRefs = relevantDocsLines
      ? relevantDocsLines.flatMap((line) => line.match(/[A-Z0-9_\-]+\.md/gi) || [])
      : backlog.content.match(/[A-Z0-9_\-]+\.md/gi) || []
    const refsByNormalizedPath = new Map<string, string>()
    for (const ref of rawRefs) {
      const normalized = normalizeDocPath(ref)
      if (!refsByNormalizedPath.has(normalized)) refsByNormalizedPath.set(normalized, ref)
    }
    const existingPaths = new Set(artifacts.map((artifact) => normalizeDocPath(artifact.path)))
    for (const [normalized, original] of refsByNormalizedPath) {
      if (existingPaths.has(normalized) || normalized === 'backlog.md' || normalized === 'readme.md') continue
      const path = rawRefs.find((ref) => normalizeDocPath(ref) === normalized) ?? original
      issues.push({
        severity: 'MEDIUM',
        category: 'INVALID_BACKLOG_DOC_REF',
        description: `${backlog.path} references non-existent document file: ${normalized}`,
        affected_documents: [backlog.path, path],
        recommendation: `Remove or update reference to ${path} in ${backlog.path}`,
      })
    }
  }

  for (const artifact of artifacts) {
    try {
      scanContentForSecrets(artifact.content, artifact.path)
    } catch {
      issues.push({
        severity: 'HIGH',
        category: 'SECRET_LEAKAGE',
        description: `Potential secret or API key pattern detected in ${artifact.path}. Remove or replace credentials with empty placeholders before export.`,
        affected_documents: [artifact.path],
        recommendation: `Sanitize credentials, connection strings, or private keys in ${artifact.path} with placeholder values like "" or \${VAR_NAME}.`,
      })
    }
  }

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
    } else {
      issues.push(...validateDesignTokensAndContrast(design))
    }
  }

  const agent = docMap.get('AGENT') || ''
  if (agent && design && !agent.includes('DESIGN.md')) {
    issues.push({
      severity: 'MEDIUM',
      category: 'AGENT_DESIGN_HIERARCHY_MISSING',
      description: 'Agent.md does not establish DESIGN.md in its document hierarchy as the visual authority.',
      affected_documents: ['Agent.md', 'DESIGN.md'],
      recommendation: 'Ensure Agent.md establishes DESIGN.md as the sole visual/interaction authority.',
    })
  }

  issues.push(...confirmedStackIssues(artifacts, contextJson))
  if (backlog) {
    const includedPaths = new Set(artifacts.map((artifact) => normalizeDocPath(artifact.path)))
    const explicitReferences = backlog.content.matchAll(/^(?:\*\*Relevant Docs:\*\*|Relevant Docs:)\s*([^\n]*)$/gim)
    for (const [, line] of explicitReferences) {
      for (const rawPath of line.split(/[,;]/)) {
        const path = rawPath.trim().replace(/^`|`$/g, '')
        const normalized = normalizeDocPath(path)
        if (!/\.md$/i.test(path) || normalized === 'readme.md' || includedPaths.has(normalized)) continue
        const existingIssue = issues.find((issue) =>
          issue.category === 'INVALID_BACKLOG_DOC_REF' && normalizeDocPath(issue.affected_documents[1] ?? '') === normalized,
        )
        if (existingIssue) {
          existingIssue.severity = 'HIGH'
          existingIssue.classification = 'BLOCKER'
          existingIssue.recommendation = 'Remove the reference or include the planned document, then rerun validation.'
          continue
        }
        issues.push({
          severity: 'HIGH',
          classification: 'BLOCKER',
          category: 'INVALID_BACKLOG_DOC_REF',
          description: `${backlog.path} references a document that is not included in the current pack: ${path}`,
          affected_documents: [backlog.path, path],
          recommendation: 'Remove the reference or include the planned document, then rerun validation.',
        })
      }
    }
  }

  const highCount = issues.filter((issue) => issue.severity === 'HIGH').length
  const mediumCount = issues.filter((issue) => issue.severity === 'MEDIUM').length
  const lowCount = issues.filter((issue) => issue.severity === 'LOW').length
  const score = Math.max(0, 100 - highCount * 25 - mediumCount * 10 - lowCount * 5)
  const isConsistent = score >= 80
  return finalizeReport({
    isConsistent,
    score,
    issues,
    summary: isConsistent
      ? 'Documentation pack is cross-document consistent.'
      : `Found ${issues.length} consistency issues requiring attention.`,
  }, 'deterministic-only')
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
  const currentContextJson = project.contexts[0]?.contentJson ?? ''
  const deterministicReport = addStructuralIntegrityBlockers(
    addBacklogReferenceBlockers(validateRuleBasedConsistency(artifacts, currentContextJson), artifacts),
    artifacts,
  )
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
    currentContextJson,
  )

  try {
    const aiReport = await withTimeout(
      provider.generateStructured(userPrompt, ConsistencyReportSchema, {
        system: CONSISTENCY_VALIDATOR_SYSTEM_PROMPT,
        maxTokens: 2048,
        temperature: 0.1,
      }),
      AI_AUDIT_TIMEOUT_MS,
    )
    return mergeConsistencyReports(deterministicReport, aiReport)
  } catch {
    return deterministicReport
  }
}

export { getCurrentPackArtifacts }
export { summarizeArtifactContent }
