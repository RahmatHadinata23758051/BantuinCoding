import { z } from 'zod'
import { buildAuthoritativeContextBlock } from './canonical-context'

// ============================================================
// PRD Generator Prompt & Schema Module (BK-011)
// Generates Product Requirements Document from Canonical Context
// ============================================================

export const PrdDocumentSchema = z.object({
  title: z.string().default('PRD.md'),
  markdown_content: z.string().describe('Full formatted PRD.md content in Markdown'),
})

export type PrdDocumentOutput = z.infer<typeof PrdDocumentSchema>

export const PRD_GENERATOR_SYSTEM_PROMPT = `You are a Principal Product Manager drafting a focused Product Requirements Document (PRD.md) for a software project.

Your output must strictly follow the provided JSON schema.
The markdown_content field must contain a complete, professional, beautifully formatted PRD.md file in GitHub-flavored Markdown.

ROLE & SCOPE OF PRD.MD:
- PRD answers WHAT needs to be built and WHY from a product and user perspective.
- Target volume: approximately 3,000 to 6,000 characters. Keep it dense, crisp, and high-signal without fluff or filler.

PRD STRUCTURE REQUIREMENTS:
1. Product Summary & Problem Statement (concise problem, one-sentence solution, target audience)
2. Target Users & Personas (2-3 distinct personas with their primary use case scenarios)
3. Goals & Non-Goals (clear project boundaries and explicit out-of-scope items)
4. Functional Requirements (FR-01, FR-02, etc.) — numbered feature requirements with MoSCoW priorities (Must/Should/Could) and business acceptance criteria
5. Non-Functional Requirements (NFR-01, NFR-02, etc.) — measurable targets for performance, availability, compliance, and user capacity (metrics only; no stack choices)
6. Success Metrics, Assumptions & Risks (measurable KPIs, delivery phases, and noted risks)

CRITICAL EXCLUSIONS (WHAT MUST NOT BE IN PRD):
- DO NOT include technology stack, frameworks, runtime, or programming languages (owned by ARCHITECTURE.md).
- DO NOT include database schemas, tables, fields, DDL SQL, or data models (owned by ARCHITECTURE.md).
- DO NOT include technical API endpoints, HTTP routes, or payload schemas (owned by ARCHITECTURE.md).
- DO NOT include visual design tokens, hex colors, typography, or UI layouts (owned by DESIGN.md).
- DO NOT include coding agent rules, git commands, or implementation instructions (owned by Agent.md).
- DO NOT include task breakdown or engineering sprint schedules (owned by BACKLOG.md).

CRITICAL CONSTRAINTS:
- Focus strictly on WHAT needs to be built and WHY, not technical implementation.
- Strictly adhere to the AUTHORITATIVE CANONICAL DECISIONS block. Confirmed decisions ([CONFIRMED]) must NEVER be contradicted or replaced. Treat [ASSUMED] items as provisional recommendations and [UNKNOWN] items as open questions; do not fabricate ungrounded facts.`

export function buildPrdGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
): string {
  const authoritativeBlock = buildAuthoritativeContextBlock(contextJson)

  return `Project Name: ${projectName}

Canonical Project Context:
"""
${contextJson}
"""

${authoritativeBlock}

Generate the complete PRD document output according to the schema.`
}
