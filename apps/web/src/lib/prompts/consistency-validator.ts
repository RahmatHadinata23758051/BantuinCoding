import { z } from 'zod'
import { buildAuthoritativeContextBlock } from './canonical-context'

// ============================================================
// Consistency Validator Prompt & Schema Module (BK-016)
// Performs cross-document consistency checks before export.
// ============================================================

export const ConsistencyIssueSchema = z.object({
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  classification: z.enum(['BLOCKER', 'WARNING']).optional(),
  category: z.enum([
    'STACK_MISMATCH',
    'DATABASE_MISMATCH',
    'FATAL_ARCHITECTURE_CONTRADICTION',
    'AUTH_MISMATCH',
    'MISSING_SPEC',
    'INVALID_BACKLOG_DOC_REF',
    'TERMINOLOGY_MISMATCH',
    'SECRET_LEAKAGE',
    'INVALID_DESIGN_SYSTEM',
    'AGENT_DESIGN_HIERARCHY_MISSING',
    'CONTRAST_WARNING',
    'DESIGN_TOKEN_MISMATCH',
  ]),
  description: z.string(),
  affected_documents: z.array(z.string()),
  recommendation: z.string(),
})

export type ConsistencyIssue = z.infer<typeof ConsistencyIssueSchema>

export interface ConsistencyReportOutput {
  isConsistent: boolean
  blocksExport: boolean
  auditMode: 'ai-assisted' | 'deterministic-only'
  score: number
  issues: ConsistencyIssue[]
  summary: string
}

/**
 * Classifies an issue as an export blocker or advisory warning.
 * Only confirmed genuine credential/secret leakage or fatal architectural stack
 * contradictions (HIGH severity STACK_MISMATCH / DATABASE_MISMATCH) may block export.
 */
export function isBlockerIssue(issue: {
  category: string
  severity?: string
  classification?: 'BLOCKER' | 'WARNING'
}): boolean {
  if (issue.classification === 'BLOCKER') return true
  if (issue.classification === 'WARNING') return false
  if (issue.category === 'SECRET_LEAKAGE') return true
  if (issue.category === 'FATAL_ARCHITECTURE_CONTRADICTION') return true
  const isHighSeverity = issue.severity === 'HIGH' || (issue.severity as string) === 'error'
  if (
    (issue.category === 'STACK_MISMATCH' || issue.category === 'DATABASE_MISMATCH') &&
    isHighSeverity
  ) {
    return true
  }
  return false
}

const BaseConsistencyReportSchema = z
  .object({
    isConsistent: z.boolean().optional(),
    is_consistent: z.boolean().optional(),
    blocksExport: z.boolean().optional(),
    blocks_export: z.boolean().optional(),
    auditMode: z.enum(['ai-assisted', 'deterministic-only']).optional(),
    audit_mode: z.enum(['ai-assisted', 'deterministic-only']).optional(),
    score: z.number().min(0).max(100).describe('Consistency score between 0 and 100'),
    issues: z.array(ConsistencyIssueSchema),
    summary: z.string(),
  })
  .refine((data) => data.isConsistent !== undefined || data.is_consistent !== undefined, {
    message: 'isConsistent or is_consistent is required',
    path: ['isConsistent'],
  })

type ConsistencyReportInput = {
  isConsistent?: boolean
  is_consistent?: boolean
  blocksExport?: boolean
  blocks_export?: boolean
  auditMode?: 'ai-assisted' | 'deterministic-only'
  audit_mode?: 'ai-assisted' | 'deterministic-only'
  score: number
  issues: ConsistencyIssue[]
  summary: string
}

export const ConsistencyReportSchema: z.ZodType<
  ConsistencyReportOutput,
  z.ZodTypeDef,
  ConsistencyReportInput
> = BaseConsistencyReportSchema.transform((val) => {
  const issues = val.issues.map((issue) => ({
    ...issue,
    classification: issue.classification ?? (isBlockerIssue(issue) ? 'BLOCKER' : 'WARNING'),
  }))
  const blocksExport =
    val.blocksExport ??
    val.blocks_export ??
    issues.some((issue) => issue.classification === 'BLOCKER')

  return {
    isConsistent: (val.isConsistent ?? val.is_consistent)!,
    blocksExport,
    auditMode: val.auditMode ?? val.audit_mode ?? 'ai-assisted',
    score: val.score,
    issues,
    summary: val.summary,
  }
})

export const CONSISTENCY_VALIDATOR_SYSTEM_PROMPT = `You are a Principal Technical Quality Auditor performing a focused cross-document validation across a generated documentation pack.

Inspect only the supplied current-pack documents. Do not invent issues from information that is absent.

CHECKS TO PERFORM:
1. Stack mismatch: Ensure frontend/backend/database choices are uniform across the supplied documents.
2. Database mismatch: Check whether database choices or entities differ between documents.
3. Auth mismatch: Check whether authentication mechanisms differ between documents.
4. Missing spec: Identify a feature mentioned in PRD that is missing from an available requirements document.
5. Backlog reference: Ensure document paths referenced in BACKLOG.md exist in the supplied pack.
6. Terminology mismatch: Check for conflicting names of core domain entities.
7. Authoritative decisions: Verify that generated documents strictly follow [CONFIRMED] canonical decisions and constraints, and do not contradict them.
8. DESIGN.md color contrast: report advisory findings only when a confidently parsed foreground/background token pair falls below WCAG 2.1 AA targets. Do not infer token roles when names or formats are ambiguous.
9. DESIGN.md token parity: report when a clearly paired color token differs between YAML front matter and the :root CSS block; if either representation is ambiguous or cannot be parsed safely, do not report a mismatch.

RESPONSE CONTRACT:
Return one JSON object with isConsistent, score, issues, and summary. Each issue must include severity (HIGH, MEDIUM, or LOW), category, description, affected_documents, and recommendation. Only label a finding BLOCKER when the supplied documents conclusively establish genuine credential leakage or a fatal, confirmed architecture contradiction that makes the stated product impossible to build. All other findings are WARNING. Do not label speculative or inferred findings as blockers. Do not report secrets' values.

Allowed categories: STACK_MISMATCH, DATABASE_MISMATCH, AUTH_MISMATCH, MISSING_SPEC, INVALID_BACKLOG_DOC_REF, TERMINOLOGY_MISMATCH, SECRET_LEAKAGE, INVALID_DESIGN_SYSTEM, AGENT_DESIGN_HIERARCHY_MISSING, CONTRAST_WARNING, DESIGN_TOKEN_MISMATCH. Do not use markdown fences or prose outside the JSON object.`

export function buildConsistencyValidatorUserPrompt(
  projectName: string,
  artifactsJson: string,
  contextJson = '',
): string {
  const authoritativeBlock = buildAuthoritativeContextBlock(contextJson)

  return `Project Name: ${projectName}

${authoritativeBlock}

Current Documentation Pack Artifacts (JSON):
"""
${artifactsJson}
"""

Return the required JSON report only. Perform a focused consistency audit using the supplied documents and treat the canonical decisions block as the source of truth.`
}
