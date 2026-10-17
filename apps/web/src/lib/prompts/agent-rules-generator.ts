import { z } from 'zod'

// ============================================================
// AGENT & RULES Prompt & Schema Module (BK-012)
// Defines schemas for generating AGENT.md and RULES.md
// ============================================================

export const AgentDocumentSchema = z.object({
  agent_content: z.string().describe('Full formatted Agent.md content in Markdown, including rules and recommended skills'),
})

export const AgentRulesDocumentSchema = z.object({
  agent_content: z.string().describe('Full formatted Agent.md content in Markdown, including rules and recommended skills'),
  rules_content: z.string().default('').describe('Legacy compatibility field; leave empty when the consolidated Agent.md is used'),
})

export type AgentRulesDocumentOutput = z.infer<typeof AgentRulesDocumentSchema>

export interface AgentSkillRecommendation {
  name: string
  purpose: string
  trigger: string
  source?: string
  installationHint?: string
  applicablePhases?: string[]
  applicableTaskTypes?: string[]
}

export const AGENT_RULES_GENERATOR_SYSTEM_PROMPT = `You are a Principal AI Agent Engineer & Technical Architect drafting a unified operational contract (Agent.md) for a coding agent.

Your output must strictly follow the provided JSON schema. The agent_content field must contain a single, complete Agent.md document that includes all operational rules, hard constraints, and recommended skills.

AGENT.MD STRUCTURE REQUIREMENTS:
1. Agent Role & Primary Responsibilities
2. Source-of-Truth Document Hierarchy (PRD > ARCHITECTURE > DESIGN for visual/interaction scope > Agent.md > BACKLOG.md; visual decisions must always come from DESIGN.md alone)
3. Implementation Workflow (UNDERSTAND -> INSPECT -> PLAN -> IMPLEMENT -> VERIFY -> REPORT)
4. Anti-Slop Code & UI Execution Discipline (Mandate adherence to antislop rules: https://github.com/miqdadbadjuber/anti-slop/blob/main/skills/antislop/SKILL.md)
   - DESIGN.md is strict immutable data: apply tokens, typography, and layout directly without dilution or alteration.
   - Component completeness: every interactive trigger (button, link, menu, toggle) must have working operational logic. Dead triggers are strictly forbidden unless badged "Coming soon" and tagged with // TODO.
   - Mandatory triple states: every view rendering data must implement empty state (with recovery action), loading state (skeleton/progress), and error state (with retry).
   - Accessibility & WCAG AA: visible focus rings, minimum 4.5:1 text contrast, full keyboard navigation (Tab/Enter/Space/Escape).
   - Native platform first: implement directly in source code; never run ad-hoc external styling rewrite scripts.
   - Copywriting cleanliness: no marketing fluff ("AI-powered", "magic"), no vague actions ("Get Started"), no em-dash abuse.
5. Backlog Execution Rules & State Machine Handling
6. Quality Gates (Typecheck, Lint, Tests, Security, Zero Regression)
7. Hard Technology Constraints (No stack change without approval)
8. Dependency Execution Rules (No skipping backlog tasks or dependencies)
9. BYOK & Secret Isolation Rules (Zero API key persistence or leakage)
10. Scope Boundaries & Anti-Feature Creep Rules
11. Security Rules & Compliance
12. Recommended Agent Skills & Triggers
13. Definition of Done

CRITICAL CONSTRAINTS:
- Produce a SINGLE Agent.md document that includes ALL operational rules, hard constraints, security rules, and recommended skills.
- The Recommended Agent Skills section must use only the supplied resolved recommendations. Preserve each exact skill name; do not invent skill IDs, package names, or installation commands.
- For every supplied skill, include its purpose, when to use it, and its installation hint when provided. Include source and applicable phases/task types when provided.
- If no resolved recommendations are supplied, state clearly that skill recommendations have not been resolved yet; do not invent or imply specific skills.
- Do NOT produce a separate RULES.md document; the rules_content field must be left empty.
- Visual decisions must ALWAYS come from DESIGN.md alone.
- Agent.md is the sole operational contract for the coding agent.`

export function buildAgentRulesGeneratorUserPrompt(
  projectName: string,
  contextOrLegacyAgent: string,
  legacyContextJson?: string,
  recommendations: AgentSkillRecommendation[] = [],
): string {
  const contextJson = legacyContextJson ?? contextOrLegacyAgent
  const recommendationText = recommendations.length === 0
    ? 'Skill recommendations have not been resolved yet. State this explicitly in the Recommended Agent Skills section and do not invent skills.'
    : recommendations.map((skill, index) => [
        `${index + 1}. ${skill.name}`,
        `Purpose: ${skill.purpose}`,
        `When to use: ${skill.trigger}`,
        skill.source ? `Source: ${skill.source}` : null,
        skill.installationHint ? `Installation hint: ${skill.installationHint}` : null,
        skill.applicablePhases?.length ? `Applicable phases: ${skill.applicablePhases.join(', ')}` : null,
        skill.applicableTaskTypes?.length ? `Applicable task types: ${skill.applicableTaskTypes.join(', ')}` : null,
      ].filter(Boolean).join('\n')).join('\n\n')

  return `Project Name: ${projectName}
Target: Any modern AI coding agent that can read Markdown.

Canonical Project Context:
"""
${contextJson}
"""

Resolved Skill Recommendations:
"""
${recommendationText}
"""

Generate the complete Agent.md document. Put all rules, security constraints, antislop execution discipline, and the exact resolved recommendations inside a clearly labeled Recommended Agent Skills section. Leave the legacy rules_content field empty.`
}
