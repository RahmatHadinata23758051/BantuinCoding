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
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')

  const artifactsSummary = project.artifacts.map((a) => ({
    type: a.type,
    path: a.path,
    content: a.content,
  }))

  const providerConfig = getProviderConfig(userId)
  let report: ConsistencyReportOutput

  if (providerConfig) {
    const provider = createProvider(providerConfig)
    const userPrompt = buildConsistencyValidatorUserPrompt(
      project.name,
      JSON.stringify(artifactsSummary),
    )

    try {
      report = await provider.generateStructured(
        userPrompt,
        ConsistencyReportSchema,
        {
          system: CONSISTENCY_VALIDATOR_SYSTEM_PROMPT,
          maxTokens: 2048,
          temperature: 0.1,
        },
      )
    } catch {
      report = validateRuleBasedConsistency(artifactsSummary)
    }
  } else {
    report = validateRuleBasedConsistency(artifactsSummary)
  }

  return report
}
