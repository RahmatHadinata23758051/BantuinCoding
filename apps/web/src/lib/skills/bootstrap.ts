export interface VerifiedSkillDefinition {
  mode: 'ui-ux-pro-max-cli' | 'skills-cli' | 'superpowers-plugin'
  source: string
  skillId: string
  agents: readonly string[]
  prerequisite: string
  command: string
}

export const UI_UX_PRO_MAX_INSTALLATION: VerifiedSkillDefinition = {
  mode: 'ui-ux-pro-max-cli',
  source: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
  skillId: 'ui-ux-pro-max',
  agents: ['claude', 'codex', 'cursor', 'universal'],
  prerequisite: 'Node.js and npm',
  command: 'npx ui-ux-pro-max-cli init --ai <agent>',
} as const

export const SUPERPOWERS_INSTALLATION: VerifiedSkillDefinition = {
  mode: 'superpowers-plugin',
  source: 'https://github.com/obra/superpowers',
  skillId: 'superpowers',
  agents: ['claude', 'codex', 'cursor', 'universal'],
  prerequisite: 'Git or agent plugin manager',
  command: '/plugin install superpowers@claude-plugins-official',
} as const

export const VERIFIED_SKILL_INSTALLATIONS: Record<string, VerifiedSkillDefinition> = {
  'ui-ux-pro-max': UI_UX_PRO_MAX_INSTALLATION,
  'superpowers': SUPERPOWERS_INSTALLATION,
} as const

type SkillInstallation = {
  installation_mode?: string
  installation_source?: string
  installation_skill_id?: string
  installation_agents?: string[]
  prerequisite?: string
  installation_hint?: string
}

export function getVerifiedSkillInstallCommand(
  name: string,
  installation: SkillInstallation | null | undefined,
  targetAgent?: string,
): string | undefined {
  const verified = VERIFIED_SKILL_INSTALLATIONS[name]
  if (!verified) {
    return undefined
  }

  if (
    installation?.installation_mode !== verified.mode ||
    installation.installation_source !== verified.source ||
    installation.installation_skill_id !== verified.skillId ||
    installation.installation_hint !== verified.command ||
    installation.prerequisite !== verified.prerequisite ||
    JSON.stringify(installation.installation_agents) !== JSON.stringify(verified.agents)
  ) {
    return undefined
  }

  const agent = targetAgent === 'CLAUDE_CODE'
    ? 'claude'
    : targetAgent === 'CODEX'
      ? 'codex'
      : targetAgent === 'CURSOR'
        ? 'cursor'
        : 'universal'

  if (!verified.agents.includes(agent)) {
    return undefined
  }

  if (verified.mode === 'superpowers-plugin') {
    if (agent === 'claude') {
      return '/plugin install superpowers@claude-plugins-official'
    }
    if (agent === 'cursor') {
      return '/add-plugin superpowers'
    }
    if (agent === 'codex') {
      return '/plugins install superpowers'
    }
    return 'git clone https://github.com/obra/superpowers.git'
  }

  if (verified.mode === 'skills-cli') {
    const cliAgent = agent === 'claude' ? 'claude-code' : agent
    if (cliAgent === 'universal') {
      return verified.command.replace(' -a <agent>', '').replace('<agent>', '')
    }
    return verified.command.replace('<agent>', cliAgent)
  }

  return verified.command.replace('<agent>', agent)
}
