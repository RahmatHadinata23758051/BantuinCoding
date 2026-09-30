import { z } from 'zod'

// ============================================================
// PRD Generator Prompt & Schema Module (BK-011)
// Generates Product Requirements Document from Canonical Context
// ============================================================

export const PrdDocumentSchema = z.object({
  title: z.string().default('PRD.md'),
  product_summary: z.string().optional(),
  problem_statement: z.string().optional(),
  target_users: z.array(
    z.object({
      role: z.string(),
      description: z.string(),
    }),
  ).optional(),
  goals: z.array(z.string()).optional(),
  non_goals: z.array(z.string()).optional(),
  core_user_flows: z.array(
    z.object({
      flow_name: z.string(),
      steps: z.array(z.string()),
    }),
  ).optional(),
  feature_roadmap: z.array(
    z.object({
      phase: z.string(),
      features: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
          acceptance_criteria: z.array(z.string()).optional(),
        }),
      ),
    }),
  ).optional(),
  markdown_content: z.string().describe('Full formatted PRD.md content in Markdown'),
})

export type PrdDocumentOutput = z.infer<typeof PrdDocumentSchema>

export const PRD_GENERATOR_SYSTEM_PROMPT = `You are a Principal Product Manager drafting a comprehensive PRD (Product Requirements Document) for a software project.

Your output must strictly follow the provided JSON schema.
The markdown_content field must contain a complete, professional, beautifully formatted PRD.md file in GitHub-flavored Markdown.

PRD STRUCTURE REQUIREMENTS:
1. Product Summary & Problem Statement
2. Target Users & Personas
3. Goals & Non-Goals
4. Core User Flows
5. Feature Roadmap & Acceptance Criteria
6. Dependencies & Constraints

CRITICAL CONSTRAINTS:
- PRD must NOT contain code-level implementation instructions that belong in AGENT.md, RULES.md, or ARCHITECTURE.md.
- Focus on WHAT needs to be built and WHY, not low-level code implementation.`

export function buildPrdGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
): string {
  return `Project Name: ${projectName}

Canonical Project Context:
"""
${contextJson}
"""

Generate the complete PRD document output according to the schema.`
}
