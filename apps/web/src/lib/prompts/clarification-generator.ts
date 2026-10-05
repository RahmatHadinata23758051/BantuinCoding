import { z } from 'zod'

// ============================================================
// Clarification Generator Prompt & Schema Module
// Dedicated prompt module for multi-round interview generation.
// ============================================================

export const ClarificationQuestionSchema = z.object({
  question: z.string().min(5, 'Question too short'),
  impact: z
    .string()
    .describe('Why this question matters — the architectural or functional decision it affects'),
  suggested_options: z
    .array(z.string())
    .optional()
    .describe('Structured multiple choice options (if applicable)'),
})

export const ClarificationRoundSchema = z
  .object({
    questions: z
      .array(ClarificationQuestionSchema)
      .max(7)
      .describe('1-7 targeted questions, or none when the context is already sufficient'),
    is_context_sufficient: z
      .boolean()
      .describe('Set to true if current information is sufficient to build full docs pack without further questions'),
  })
  .superRefine((value, context) => {
    if (value.is_context_sufficient && value.questions.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['questions'],
        message: 'Questions must be empty when context is sufficient',
      })
    }

    if (!value.is_context_sufficient && value.questions.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['questions'],
        message: 'At least one clarification question is required',
      })
    }
  })

export type ClarificationQuestionInput = z.infer<typeof ClarificationQuestionSchema>
export type ClarificationRoundResult = z.infer<typeof ClarificationRoundSchema>

export const CLARIFICATION_GENERATOR_SYSTEM_PROMPT = `You are an expert Lead Business Analyst and Software Architect conducting a targeted project discovery interview.

Your goal is to turn missing information, ambiguities, and critical architectural decisions into 3 to 7 focused, high-impact clarification questions.

Rules:
1. Generate between 3 and 7 questions per round while critical uncertainty remains.
2. Focus ONLY on high-impact uncertainties (auth strategy, scale, core data entities, third-party integrations, compliance).
3. Do NOT ask questions that have already been answered in previous rounds.
4. For each question, provide 2-4 structured suggested options when standard patterns exist, but allow the user to know free text is also acceptable.
5. Provide a clear "impact" explaining WHY answering this question matters for the architecture.
6. Set is_context_sufficient to true ONLY if all critical architectural decisions are clear enough to write a complete PRD/SRS pack.
7. When is_context_sufficient is true, return an empty questions array. When it is false, return at least one question.`

export function buildClarificationUserPrompt(
  projectName: string,
  rawIdea: string,
  analysisJson: string,
  previousQAJson: string,
  currentRound: number,
  language: string = 'id',
): string {
  const languageDirective =
    language === 'id'
      ? 'CRITICAL LANGUAGE DIRECTIVE: You MUST output all questions, impacts, and suggested_options in natural, professional Indonesian (Bahasa Indonesia).'
      : 'CRITICAL LANGUAGE DIRECTIVE: You MUST output all questions, impacts, and suggested_options in professional English.'

  return `Project: ${projectName}
Round: ${currentRound}
${languageDirective}

Raw Idea:
"""
${rawIdea}
"""

Requirement Analysis:
"""
${analysisJson}
"""

Previously Answered Questions (DO NOT REPEAT):
"""
${previousQAJson}
"""

Generate Round ${currentRound} clarification questions according to the language directive.`
}
