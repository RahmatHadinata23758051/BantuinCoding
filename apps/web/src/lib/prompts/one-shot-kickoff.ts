import { getVerifiedSkillInstallCommand } from '@/lib/skills/bootstrap'

export interface OneShotKickoffPromptSkill {
  name: string
  purpose: string
  trigger: string
  metadata?: {
    applicable_phases?: string[]
    applicable_task_types?: string[]
    installation_hint?: string
    installation_mode?: string
    installation_source?: string
    installation_skill_id?: string
    installation_agents?: string[]
    prerequisite?: string
    initialization_hint?: string
  } | null
}

export interface OneShotKickoffPromptData {
  name: string
  classification: string
  targetAgent?: string
  skills?: OneShotKickoffPromptSkill[]
}

export function generateOneShotKickoffPrompt(data: OneShotKickoffPromptData): string {
  const targetAgent = data.targetAgent ?? 'OTHER'
  const skills = data.skills ?? []

  const resolvedSkills = skills.map((skill) => {
    const metadata = skill.metadata
    const setupCommand = getVerifiedSkillInstallCommand(skill.name, metadata, targetAgent)
    return [
      `- ${skill.name}: ${skill.purpose}`,
      `  Trigger: ${skill.trigger}`,
      setupCommand ? `  Verified project-local setup: ${setupCommand}` : '  Setup: instruction-only; do not invent an installation command.',
      metadata?.prerequisite ? `  Prerequisite: ${metadata.prerequisite}` : null,
      metadata?.initialization_hint ? `  Initialize: ${metadata.initialization_hint}` : null,
    ].filter(Boolean).join('\n')
  }).join('\n')

  const skillsSection = skills.length > 0
    ? `## Skill bootstrap and activation\nTarget coding agent: ${targetAgent}. Detect its actual CLI and supported project-local skills folder; inspect existing skill files first.\n${resolvedSkills}\nUse only the verified project-local commands above. Confirm before global installation or overwriting files. Check prerequisites, initialize only missing skill files, then read each skill instruction file and apply it whenever its trigger matches. If no verified command is shown, keep the recommendation as manual guidance and do not guess.`
    : '## Skill bootstrap and activation\nNo resolved skill recommendations are available. Do not invent skills or installation commands.'

  return `# Project implementation brief — ${data.name}

Prepare an implementation plan for **${data.name}** (${data.classification}). Use the generated pack as the source of project context, and keep the human owner in control of scope, sequencing, and execution.

## Pack reading order
Read the available specification files before making implementation decisions:
1. \`PRD.md\` — product goals, scope, user flows, and non-goals
2. \`ARCHITECTURE.md\` — system boundaries, data flow, and technical structure
3. \`DESIGN.md\` — the visual authority for interface direction, interaction, responsive behavior, and accessibility
4. \`Agent.md\` — coding-agent workflow, constraints, and quality expectations
5. \`BACKLOG.md\` — implementation tasks, acceptance criteria, and verification steps
6. \`SRS.md\` — read this only when it is included in the pack; it provides detailed software requirements for higher-complexity projects

The lean pack generates \`PRD.md\`, conditional \`SRS.md\`, \`ARCHITECTURE.md\`, \`DESIGN.md\`, \`Agent.md\`, and \`BACKLOG.md\`. Guidance that older packs may have placed in standalone \`RULES.md\` or \`SKILLS.md\` is incorporated into \`Agent.md\`; do not expect those standalone files.

${skillsSection}

## Working guidance
- Treat \`DESIGN.md\` as the visual source of truth. Do not invent a competing visual system or override it with conventions from this prompt.
- Review the backlog and its dependencies, then propose the next appropriate task for the human owner’s approval before implementation.
- Follow the pack’s quality gates, verify your work with the relevant checks, and report assumptions, changes, and unresolved decisions clearly.
- Do not assume that every backlog item is in scope for this session; do not silently expand the project beyond the generated requirements.`
}
