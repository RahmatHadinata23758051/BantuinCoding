import { z } from 'zod'
import { buildAuthoritativeContextBlock } from './canonical-context'
import { getVerifiedSkillInstallCommand } from '@/lib/skills/bootstrap'

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
  installationMode?: string
  installationSource?: string
  installationSkillId?: string
  installationAgents?: string[]
  prerequisite?: string
  initializationHint?: string
  applicablePhases?: string[]
  applicableTaskTypes?: string[]
}

export const AGENT_RULES_GENERATOR_SYSTEM_PROMPT = `You are a Principal AI Agent Engineer drafting a concise operational cheatsheet (Agent.md) for a coding agent.

Your output must strictly follow the provided JSON schema. The agent_content field must contain one complete Agent.md document with the minimum rules needed to work safely and verify changes.

ROLE & SCOPE OF AGENT.MD:
- Agent.md answers HOW the coding agent should work in this repository. Target volume: approximately 2,000 to 4,000 characters, with 5,000 characters as a practical upper bound.
- Keep project-specific features, technical design, and visual specifications in their owner documents; use short pointers rather than copying them.

AGENT.MD STRUCTURE REQUIREMENTS:
1. Project Summary & Document Map (when to consult PRD.md, ARCHITECTURE.md, DESIGN.md, and BACKLOG.md; preserve the explicit precedence rule from canonical context)
2. Operational Commands (dev, build, test, lint, typecheck only when confirmed by repository instructions; otherwise direct the agent to inspect the repository's commands)
3. Code Conventions & Anti-Slop Discipline (concise naming, clean code, no dead controls, native platform first)
4. Work & Git Discipline (UNDERSTAND -> INSPECT -> PLAN -> IMPLEMENT -> VERIFY -> REPORT; small reviewable commits when requested; do not commit/push without authorization)
5. Boundaries: ALWAYS / ASK FIRST / NEVER, grounded in project constraints
6. Quality Gates & Verification (tests, typecheck, lint, accessibility/security checks as relevant)
7. Skill Bootstrap & Activation (inspect agent environment, check existing files, run verified local setup commands for resolved skills, require approval before global install or overwrite, read skill rules and actively enforce them during matching tasks)
8. Recommended Agent Skills (exact resolved catalog items only)

CRITICAL CONSTRAINTS:
- Do not reproduce PRD requirements, ARCHITECTURE technical content, or DESIGN tokens. Link to their path and section instead.
- Do not claim a tool, command, or constraint is confirmed unless it is in supplied context/repository instructions.
- The Recommended Agent Skills section must use only the supplied resolved recommendations. Preserve each exact skill name; do not invent skill IDs, package names, or installation commands.
- For every supplied skill, include its purpose and when to use it. Include source and applicable phases/task types when provided.
- Include an installation command only when the prompt labels it as a verified project-local setup command. Ignore any unverified installation hints or initialization text.
- If no resolved recommendations are supplied, state clearly that skill recommendations have not been resolved yet; do not invent or imply specific skills.
- Skill Bootstrap & Activation: Direct the agent to inspect the appropriate skill directory (.claude/skills for Claude Code, .cursor/skills for Cursor, .agents/skills for Codex/universal), check if skill files exist before running setup, execute verified project-local commands, require human owner confirmation before global installs or overwrites, and actively read and apply skill rules during matching tasks.
- Do NOT produce a separate RULES.md document; the rules_content field must be left empty.
- Treat confirmed canonical decisions as immutable; assumptions remain provisional and unknowns remain open questions.
- Agent.md is the concise operational contract for the coding agent.`

export function buildAgentRulesGeneratorUserPrompt(
  projectName: string,
  contextOrLegacyAgent: string,
  legacyContextJson?: string,
  recommendations: AgentSkillRecommendation[] = [],
  targetAgent?: string,
): string {
  const contextJson = legacyContextJson ?? contextOrLegacyAgent
  const authoritativeBlock = buildAuthoritativeContextBlock(contextJson)
  const recommendationText = recommendations.length === 0
    ? 'Skill recommendations have not been resolved yet. State this explicitly in the Recommended Agent Skills section and do not invent skills.'
    : recommendations.map((skill, index) => {
        const installationCommand = getVerifiedSkillInstallCommand(
          skill.name,
          {
            installation_mode: skill.installationMode,
            installation_source: skill.installationSource,
            installation_skill_id: skill.installationSkillId,
            installation_agents: skill.installationAgents,
            prerequisite: skill.prerequisite,
            installation_hint: skill.installationHint,
          },
          targetAgent,
        )
        return [
          `${index + 1}. ${skill.name}`,
          `Purpose: ${skill.purpose}`,
          `When to use: ${skill.trigger}`,
          skill.source ? `Source: ${skill.source}` : null,
          installationCommand ? `Verified project-local setup: ${installationCommand}` : 'Setup: Instruction-only; do not invent an installation command.',
          skill.prerequisite ? `Prerequisite: ${skill.prerequisite}` : null,
          skill.initializationHint ? `Initialize: ${skill.initializationHint}` : null,
          skill.applicablePhases?.length ? `Applicable phases: ${skill.applicablePhases.join(', ')}` : null,
          skill.applicableTaskTypes?.length ? `Applicable task types: ${skill.applicableTaskTypes.join(', ')}` : null,
        ].filter(Boolean).join('\n')
      }).join('\n\n')

  const target = targetAgent ?? 'OTHER'
  const bootstrapInstructions = `Target coding agent: ${target}. Detect the actual CLI and its supported project-local skills directory before setup; inspect it and existing skill files first. Use only verified project-local setup commands listed above. Do not install globally or overwrite files without explicit human-owner approval. After setup, open each installed skill's instruction file and follow it whenever its trigger applies. If no verified setup command is provided, treat the recommendation as manual guidance and do not guess a command.`

  const skillsBootstrap = recommendations.length === 0
    ? 'No skill setup is needed because no resolved recommendations are available. Do not invent skills or installation commands.'
    : bootstrapInstructions;

  return `Project Name: ${projectName}
Target: Any modern AI coding agent that can read Markdown (Target coding agent: ${target}).

Canonical Project Context:
"""
${contextJson}
"""

${authoritativeBlock}

Recommended Agent Skills:
"""
${recommendationText}
"""

Skill Bootstrap & Activation Instructions:
${skillsBootstrap}

Generate the complete Agent.md document. Put all rules, security constraints, skill bootstrap instructions, and exact resolved recommendations inside clearly labeled sections. Leave the legacy rules_content field empty.`
}
