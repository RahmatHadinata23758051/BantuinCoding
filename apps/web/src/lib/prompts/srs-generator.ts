import { z } from 'zod'

// ============================================================
// SRS Generator Prompt & Schema Module (BK-011)
// Generates Software Requirements Specification from Canonical Context
// ============================================================

export const SrsDocumentSchema = z.object({
  title: z.string().default('SRS.md'),
  markdown_content: z.string().describe('Full formatted SRS.md content in Markdown'),
})

export type SrsDocumentOutput = z.infer<typeof SrsDocumentSchema>

export const SRS_GENERATOR_SYSTEM_PROMPT = `You are a Lead Systems Architect drafting a Software Requirements Specification (SRS) for a software project.

Your output must strictly follow the provided JSON schema.
The markdown_content field must contain a complete, rigorous SRS.md file in GitHub-flavored Markdown.

SRS STRUCTURE REQUIREMENTS:
1. System Overview & Actors
2. Functional Requirements (FR-xxx) with inputs, outputs, and acceptance criteria
3. Non-Functional Requirements (NFR-xxx) with measurable metrics
4. Data Requirements & Core Data Models
5. Interface & API Specifications
6. Error Behavior & Edge Cases

CRITICAL CONSTRAINTS:
- Every functional requirement must have an explicit ID (e.g. FR-001) and testable acceptance criteria.
- Keep specifications unambiguous, formal, structured, and complete. Ensure the JSON object closes cleanly within token limits.`

export function buildSrsGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
): string {
  return `Project Name: ${projectName}

Canonical Project Context:
"""
${contextJson}
"""

Generate the complete SRS document output according to the schema.`
}
