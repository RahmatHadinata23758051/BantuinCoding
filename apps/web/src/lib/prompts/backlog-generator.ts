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

export const BACKLOG_GENERATOR_SYSTEM_PROMPT = `You are a Principal Engineering Project Manager & Agile Architect.

Your job is to generate a comprehensive, phased, dependency-aware backlog for a coding agent.

RULES:
1. Break down the project into logical sequential phases (e.g. Phase 1 — Foundation, Phase 2 — Core Engine, etc.).
2. Every task must be atomic: not too broad ("build backend") and not too trivial ("declare a variable").
3. Explicit dependencies: Tasks must explicitly reference parent task IDs (e.g. BK-002 depends on ['BK-001']).
4. NO circular dependencies.
5. Every task must have clear, testable acceptance criteria and a solid definition of done.
6. The backlog_md_content field must contain a beautifully rendered, phase-grouped BACKLOG.md file in Markdown.`

export function buildBacklogGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
  prdJson: string,
  srsJson: string,
  architectureJson: string,
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

Generate the complete phased backlog output according to the schema.`
}
