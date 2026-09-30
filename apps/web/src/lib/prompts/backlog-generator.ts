import { z } from 'zod'

// ============================================================
// Backlog Generator Prompt & Schema Module (BK-014)
// Generates structured, dependency-aware backlog tasks & BACKLOG.md
// ============================================================

export const GeneratedBacklogTaskSchema = z.object({
  id: z.string().describe('e.g., BK-001'),
  title: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()).describe('Array of task IDs this task depends on'),
  acceptance_criteria: z.array(z.string()),
  definition_of_done: z.string(),
  relevant_docs: z.array(z.string()),
  recommended_skills: z.array(z.string()),
})

export type GeneratedBacklogTask = z.infer<typeof GeneratedBacklogTaskSchema>

export const GeneratedBacklogPhaseSchema = z.object({
  name: z.string().describe('e.g., Phase 1 — Project Foundation'),
  order: z.number(),
  description: z.string().optional(),
  tasks: z.array(GeneratedBacklogTaskSchema),
})

export type GeneratedBacklogPhase = z.infer<typeof GeneratedBacklogPhaseSchema>

export const BacklogGeneratorOutputSchema = z.object({
  phases: z.array(GeneratedBacklogPhaseSchema),
  backlog_md_content: z.string().describe('Full BACKLOG.md file formatted in GitHub-flavored Markdown'),
})

export type BacklogGeneratorOutput = z.infer<typeof BacklogGeneratorOutputSchema>

export const BACKLOG_GENERATOR_SYSTEM_PROMPT = `You are a Principal Engineering Project Manager & Agile Architect specializing in task decomposition for autonomous coding agents (Claude Code, Cursor, Codex, OpenCode).

Your job is to generate a comprehensive, highly granular, phased, dependency-aware backlog.

TASK DECOMPOSITION & GRANULARITY STANDARDS (CRITICAL):
1. NO MONOLITHIC TASKS: Do NOT create broad tasks like "Build backend" or "Build frontend" or "Create UI".
2. BREAK DOWN BY WORKSTREAM & CONCRETE UNITS:
   - Backend Foundation: Project scaffold, ORM/Prisma schema, migration files, seed scripts, database client singleton.
   - Domain Engines & Business Logic: Domain services, state machines, business validation rules, utility functions.
   - API Route Handlers: Individual REST/Server Action endpoints, request validation (Zod), auth middleware, error mapping.
   - Frontend Primitives & Tokens: Component tokens (colors, borders, shadows matching DESIGN.md), base UI components (Button, Input, Panel, Select, Badge).
   - Frontend Feature Views: Specific screens, page layouts, form handling, client-side validation, loading/empty/error states.
   - Integration & Security: API client fetchers, session handling, CSRF/secret protection, input sanitization.
   - Quality Gates & Testing: Unit tests per service, route integration tests, typecheck & lint verification.
3. ATOMIC & INDEPENDENT: Each task must be executable by a coding agent in a single focused session without needing uncommitted changes from future tasks.
4. EXPLICIT DEPENDENCY CHAINS: Tasks must explicitly reference exact parent task IDs (e.g., BK-003 depends on ['BK-001', 'BK-002']). No circular dependencies. Roots start with empty dependencies.
5. EXPLICIT VERIFICATION & DEFINITION OF DONE:
   - Every task MUST specify concrete acceptance criteria with testable conditions.
   - Definition of done must name verification commands (e.g., "Passes pnpm typecheck and unit tests").
   - Frontend, interaction, responsive, accessibility, and design-system tasks MUST consume DESIGN.md and include DESIGN.md in relevant_docs.
6. The backlog_md_content field must contain a beautifully rendered, phase-grouped BACKLOG.md file in Markdown with clear task ledger format.`

export function buildBacklogGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
  prdJson: string,
  srsJson: string,
  architectureJson: string,
  designJson = '',
): string {
  return `Project Name: ${projectName}

Canonical Project Context:
"""
${contextJson}
"""

PRD Reference:
"""
${prdJson}
"""

SRS Reference:
"""
${srsJson}
"""

Architecture Reference:
"""
${architectureJson}
"""

DESIGN Reference${designJson ? '' : ' (not planned for this project)'}:
"""
${designJson}
"""

Generate the complete phased backlog output according to the schema. Frontend and interaction tasks must reference DESIGN.md when the DESIGN Reference is present.`
}
