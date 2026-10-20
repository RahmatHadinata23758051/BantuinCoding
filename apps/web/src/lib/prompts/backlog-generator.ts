import { z } from 'zod'
import { buildAuthoritativeContextBlock } from './canonical-context'

// ============================================================
// Backlog Generator Prompt & Schema Module (BK-014)
// Generates structured, dependency-aware backlog tasks & BACKLOG.md
// ============================================================

export const GeneratedBacklogTaskSchema = z.object({
  id: z.string().describe('e.g., BK-001'),
  title: z.string(),
  description: z.string().trim().min(1),
  dependencies: z.array(z.string()).describe('Array of task IDs this task depends on'),
  acceptance_criteria: z.array(z.string().trim().min(1)).min(1),
  definition_of_done: z.string().trim().min(1),
  relevant_docs: z.array(z.string()),
  recommended_skills: z.array(z.string()),
})

export type GeneratedBacklogTask = z.infer<typeof GeneratedBacklogTaskSchema>

export const GeneratedBacklogPhaseSchema = z.object({
  name: z.string().describe('e.g., Phase 1 — Project Foundation'),
  order: z.number(),
  description: z.string().optional(),
  tasks: z.array(GeneratedBacklogTaskSchema).min(1, 'Each backlog phase must contain at least one task'),
})

export type GeneratedBacklogPhase = z.infer<typeof GeneratedBacklogPhaseSchema>

export const BacklogGeneratorOutputSchema = z.object({
  phases: z.array(GeneratedBacklogPhaseSchema),
})

export type BacklogGeneratorOutput = z.infer<typeof BacklogGeneratorOutputSchema>

export const BACKLOG_GENERATOR_SYSTEM_PROMPT = `You are a Principal Engineering Project Manager & Agile Architect specializing in task decomposition for autonomous coding agents (Claude Code, Cursor, Codex, OpenCode).

Your job is to generate a comprehensive, highly granular, phased, dependency-aware backlog.

TASK DECOMPOSITION & GRANULARITY STANDARDS (CRITICAL):
1. NO MONOLITHIC TASKS: Do NOT create broad tasks like "Build backend" or "Build frontend" or "Create UI".
2. GROUNDED WORKSTREAMS: Break work into concrete project-specific units. Choose tools, libraries, data stores, frameworks, test runners, package managers, and commands ONLY when confirmed by canonical context or explicitly specified in the current document references. Unknown tooling is not permission to invent dependencies or install commands; use repository-provided instructions when available.
   - Backend: Break down only the actual storage, service, and API boundaries supported by the project facts.
   - Domain logic: Identify concrete business rules, state transitions, and validation requirements from supplied documents.
   - User interface: Specify screens, forms, interaction behavior, and loading/empty/error states grounded in the product requirements.
   - Integration and security: Name only confirmed integrations and security controls; never invent providers, protocols, or infrastructure.
   - Verification: Use project-specific, documented checks; when tooling is unknown, state the observable behavior to verify without inventing a command.
3. ATOMIC & INDEPENDENT: Each task must be executable by a coding agent in a single focused session without needing uncommitted changes from future tasks.
4. EXPLICIT DEPENDENCY CHAINS: Tasks must explicitly reference exact parent task IDs (e.g., BK-003 depends on ['BK-001', 'BK-002']). No circular dependencies. Roots start with empty dependencies.
5. EXPLICIT VERIFICATION & DEFINITION OF DONE:
   - Every task MUST specify one or more concrete, observable acceptance criteria; never use filler such as "AC", "done", "it works", or "TBD".
   - Definition of done must give a project-appropriate verification method grounded in available repository instructions; do not invent commands when tooling is unknown.
   - Frontend tasks MUST include the exact planned design document path in relevant_docs when a design document is included in the references.
6. Only return the phases and structured task graph. The Markdown file will be generated automatically by the server based on your structured tasks.
7. Any UI or design tasks must reference DESIGN.md for every visual decision and must not define a palette, border system, radius system, shadow system, typography system, or visual archetype of its own.
8. Strictly adhere to the AUTHORITATIVE CANONICAL DECISIONS block. Backlog tasks must be grounded in confirmed project decisions, entities, and requirements. Do not invent ungrounded components, microservices, or external tools.
9. GROUNDED SKILL RECOMMENDATIONS: Each task's recommended_skills array must ONLY contain exact skill names listed in the Available Project Skills catalog. If no matching skill is appropriate or no skills are available, use an empty array []. Never invent or hallucinate skill names.`

export interface BacklogDocumentReference {
  type: string
  path: string
  content: string
}

export const MAX_BACKLOG_REFERENCE_CHARS = 7_000
export const MAX_BACKLOG_PROMPT_CHARS = 48_000

const PRIORITY_SECTION = /requirement|functional|non-functional|security|constraint|data|export|performance|design|token|stack|architecture|decision|entity|scope|acceptance|api|auth|database|deployment|accessibility|workflow/i

export function summarizeBacklogReference(content: string): string {
  if (content.length <= MAX_BACKLOG_REFERENCE_CHARS) return content

  const lines = content.split(/\r?\n/)
  const sections: Array<{ heading: string; content: string; priority: boolean }> = []
  const preamble: string[] = []
  let current: string[] = []
  let heading = 'Document opening'

  const saveSection = () => {
    if (current.length === 0) return
    const sectionContent = current.join('\n')
    sections.push({ heading, content: sectionContent, priority: PRIORITY_SECTION.test(`${heading}\n${sectionContent}`) })
  }

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)$/)
    if (match) {
      saveSection()
      heading = match[1].trim()
      current = [line]
    } else if (current.length > 0) {
      current.push(line)
    } else {
      preamble.push(line)
    }
  }
  saveSection()
  if (sections.length === 0) {
    throw new Error(`A ${MAX_BACKLOG_REFERENCE_CHARS}-character backlog reference limit cannot preserve this unsectioned document; add Markdown headings or shorten the document.`)
  }

  const selected = new Set<number>()
  let selectedChars = preamble.join('\n').length
  for (const [index, section] of sections.entries()) {
    if (!section.priority) continue
    if (selectedChars + section.content.length > MAX_BACKLOG_REFERENCE_CHARS) {
      throw new Error(`Priority sections in a backlog reference exceed the ${MAX_BACKLOG_REFERENCE_CHARS}-character limit; shorten the source document and retry.`)
    }
    selected.add(index)
    selectedChars += section.content.length
  }

  for (const [index, section] of sections.entries()) {
    if (selected.has(index)) continue
    if (selectedChars + section.content.length <= MAX_BACKLOG_REFERENCE_CHARS) {
      selected.add(index)
      selectedChars += section.content.length
    }
  }

  const omitted = sections.filter((_, index) => !selected.has(index)).map(({ heading: title }) => title)
  const excerpt = [...preamble, ...sections.filter((_, index) => selected.has(index)).map(({ content: body }) => body)].join('\n\n')
  const omissionNotice = omitted.length > 0
    ? `\n\nOmitted complete sections (not provided; do not infer their contents): ${omitted.join('; ')}`
    : ''
  if (excerpt.length + omissionNotice.length > MAX_BACKLOG_REFERENCE_CHARS) {
    throw new Error(`Backlog reference section labels exceed the ${MAX_BACKLOG_REFERENCE_CHARS}-character limit; shorten the source document and retry.`)
  }

  return `${excerpt}${omissionNotice}`
}

export function buildBacklogGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
  references: BacklogDocumentReference[],
  availableSkills: string[] = [],
): string {
  const authoritativeBlock = buildAuthoritativeContextBlock(contextJson)
  const skillsBlock = availableSkills.length > 0
    ? `Available Project Skills Catalog (tasks must ONLY recommend skills from this list):\n${availableSkills.map((s) => `- ${s}`).join('\n')}`
    : `Available Project Skills Catalog:\n(No resolved skills provided; recommended_skills array on every task must be empty: [])`
  const referencesBlock = references.length > 0
    ? references.map(({ type, path, content }) => `${type} Reference (${path}):\n"""\n${content}\n"""`).join('\n\n')
    : '(No current planned document references are available.)'

  const prompt = `Project Name: ${projectName}

Canonical Project Context:
"""
${contextJson}
"""

${authoritativeBlock}

${skillsBlock}

Current Planned Document References:
${referencesBlock}

Generate the complete phased backlog output according to the schema. Use only these current-context document references; frontend and interaction tasks must reference DESIGN.md when it is included.`

  if (prompt.length > MAX_BACKLOG_PROMPT_CHARS) {
    throw new Error(`Backlog generation input exceeds the ${MAX_BACKLOG_PROMPT_CHARS}-character limit. Reduce the project context or resolved skill catalog and retry.`)
  }

  return prompt
}
