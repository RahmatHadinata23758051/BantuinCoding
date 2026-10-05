import { z } from 'zod'

// ============================================================
// PRD Generator Prompt & Schema Module (BK-011)
// Generates Product Requirements Document from Canonical Context
// ============================================================

export const PrdDocumentSchema = z.object({
  title: z.string().default('PRD.md'),
  markdown_content: z.string().describe('Full formatted PRD.md content in Markdown'),
})

export type PrdDocumentOutput = z.infer<typeof PrdDocumentSchema>

export const PRD_GENERATOR_SYSTEM_PROMPT = `You are a Principal Product Manager drafting a comprehensive PRD (Product Requirements Document) for a software project.
This PRD absorbs all traditional SRS content - it is the SINGLE source of truth for product and technical requirements.

Your output must strictly follow the provided JSON schema.
The markdown_content field must contain a complete, professional, beautifully formatted PRD.md file in GitHub-flavored Markdown.

PRD STRUCTURE REQUIREMENTS:
1. Product Summary & Problem Statement
2. Target Users & Personas
3. Goals & Non-Goals
4. Core User Flows
5. Feature Roadmap & Acceptance Criteria
6. Dependencies & Constraints
7. Functional Requirements (FR-xxx) — inputs, outputs, acceptance criteria
8. Non-Functional Requirements (NFR-xxx) — measurable metrics for performance, security, scalability
9. Data Requirements & Core Data Models
10. Interface & API Specifications
11. Error Behavior & Edge Cases

CRITICAL CONSTRAINTS:
- PRD must NOT contain code-level implementation instructions that belong in AGENT.md or ARCHITECTURE.md.
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
