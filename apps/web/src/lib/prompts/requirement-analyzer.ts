import { z } from 'zod'

// ============================================================
// Requirement Analyzer Prompt & Schema Module
// Dedicated prompt module per architecture specification.
// ============================================================

export const RequirementAnalysisSchema = z.object({
  known_facts: z
    .array(z.string())
    .describe('Confirmed facts explicitly stated or unambiguously implied in the user input'),
  missing_information: z
    .array(z.string())
    .describe('Critical missing details required to build the full documentation pack'),
  ambiguities: z
    .array(z.string())
    .describe('Vague terms, unclear scope boundaries, or underspecified features'),
  important_decisions: z
    .array(z.string())
    .describe('High-impact architectural or business choices that require explicit user confirmation'),
  optional_decisions: z
    .array(z.string())
    .describe('Nice-to-have options or non-critical design preferences'),
  risk_flags: z
    .array(z.string())
    .describe('Potential security, scaling, compliance, or technical risks identified in the idea'),
}).strict()

export type RequirementAnalysisResult = z.infer<typeof RequirementAnalysisSchema>

export const REQUIREMENT_ANALYZER_SYSTEM_PROMPT = `You are an expert Principal Software Architect and Requirements Engineer.

Your task is to analyze a raw software project idea provided by a user and extract a structured analysis pack.

You must categorize your findings into six distinct arrays:
1. known_facts: Explicit facts or clear requirements directly stated by the user.
2. missing_information: Essential technical or functional requirements that are absent (e.g. auth method, database type, hosting platform, target users, scale expectations).
3. ambiguities: Vague, subjective, or underspecified statements in the input.
4. important_decisions: High-stakes technical/architectural decisions that will shape the project foundation (e.g. BYOK vs managed keys, SQL vs NoSQL, SSR vs SPA).
5. optional_decisions: Secondary choices or feature enhancements.
6. risk_flags: Security risks (e.g. API key exposure, regulatory compliance), operational risks, or technical pitfalls.

Be thorough, precise, and professional. Avoid generic fluff.`

export function buildRequirementAnalysisUserPrompt(
  projectName: string,
  rawIdea: string,
  classification: string,
  targetAgent: string,
  language: string = 'id',
): string {
  const languageDirective =
    language === 'id'
      ? 'CRITICAL LANGUAGE DIRECTIVE: You MUST analyze and write all known_facts, missing_information, ambiguities, important_decisions, optional_decisions, and risk_flags in natural, professional Indonesian (Bahasa Indonesia).'
      : 'CRITICAL LANGUAGE DIRECTIVE: You MUST analyze and write all fields in professional English.'

  return `Project Name: ${projectName}
Project Type: ${classification}
Target Agent: ${targetAgent}
${languageDirective}

Raw Idea Input:
"""
${rawIdea}
"""

Analyze the above input and generate the structured JSON report according to the language directive.`
}
