import { z } from 'zod'

// ============================================================
// Consistency Validator Prompt & Schema Module (BK-016)
// Performs cross-document consistency checks before export.
// ============================================================

export const ConsistencyIssueSchema = z.object({
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  category: z.enum([
    'STACK_MISMATCH',
    'DATABASE_MISMATCH',
    'AUTH_MISMATCH',
    'MISSING_SPEC',
    'INVALID_BACKLOG_DOC_REF',
    'TERMINOLOGY_MISMATCH',
  ]),
  description: z.string(),
  affected_documents: z.array(z.string()),
  recommendation: z.string(),
})

export type ConsistencyIssue = z.infer<typeof ConsistencyIssueSchema>

export interface ConsistencyReportOutput {
  isConsistent: boolean
  score: number
  issues: ConsistencyIssue[]
  summary: string
}

const BaseConsistencyReportSchema = z
  .object({
    isConsistent: z.boolean().optional(),
    is_consistent: z.boolean().optional(),
    score: z.number().min(0).max(100).describe('Consistency score between 0 and 100'),
    issues: z.array(ConsistencyIssueSchema),
    summary: z.string(),
  })
  .refine((data) => data.isConsistent !== undefined || data.is_consistent !== undefined, {
    message: 'isConsistent or is_consistent is required',
    path: ['isConsistent'],
  })

export const ConsistencyReportSchema: z.ZodSchema<ConsistencyReportOutput> =
  BaseConsistencyReportSchema.transform((val) => ({
    isConsistent: (val.isConsistent ?? val.is_consistent)!,
    score: val.score,
    issues: val.issues,
    summary: val.summary,
  }))

export const CONSISTENCY_VALIDATOR_SYSTEM_PROMPT = `You are a Principal Technical Quality Auditor performing cross-document validation across a generated documentation pack.

Your job is to inspect all generated documents (PRD, SRS, ARCHITECTURE, AGENT, RULES, SKILLS, BACKLOG) for conflicts, discrepancies, or missing references.

CHECKS TO PERFORM:
1. Stack Mismatch: Ensure frontend/backend/database stack is uniform across PRD, SRS, and ARCHITECTURE.
2. Database Mismatch: Check if database choices or entities differ between documents.
3. Auth Mismatch: Check if auth mechanisms differ between PRD and SRS/ARCHITECTURE.
4. Missing Specs: Identify features mentioned in PRD that are missing from SRS functional requirements.
5. Backlog References: Ensure docs referenced in BACKLOG.md actually exist in the pack.
6. Terminology Discrepancies: Check for conflicting names of core domain entities.`

export function buildConsistencyValidatorUserPrompt(
  projectName: string,
  artifactsJson: string,
): string {
  return `Project Name: ${projectName}

Generated Documentation Pack Artifacts:
"""
${artifactsJson}
"""

Perform a comprehensive cross-document consistency audit.`
}
