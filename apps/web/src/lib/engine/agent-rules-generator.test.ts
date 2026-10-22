import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AgentRulesDocumentSchema,
  buildAgentRulesGeneratorUserPrompt,
  AGENT_RULES_GENERATOR_SYSTEM_PROMPT,
} from '@/lib/prompts/agent-rules-generator'
import {
  generateAgentAndRulesArtifacts,
  regenerateIncompleteAgentArtifacts,
  generateFallbackAgentMd,
  generateFallbackRulesMd,
} from '@/lib/engine/agent-rules-generator'
import { generateOneShotKickoffPrompt } from '@/lib/prompts/one-shot-kickoff'

vi.mock('@repo/db', () => ({
  db: {
    project: { findFirst: vi.fn() },
    artifact: { upsert: vi.fn(), update: vi.fn() },
  },
}))
vi.mock('@/lib/byok/session-store', () => ({ getProviderConfig: vi.fn() }))
vi.mock('@/lib/ai/provider', () => ({ createProvider: vi.fn() }))
vi.mock('@/lib/projects/project-service', () => ({ updateProject: vi.fn() }))

const verifiedSkill = {
  name: 'ui-ux-pro-max',
  purpose: 'Improves accessible UI implementation.',
  trigger: 'When building frontend screens.',
  installationHint: 'npx ui-ux-pro-max-cli init --ai <agent>',
  installationMode: 'ui-ux-pro-max-cli',
  installationSource: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
  installationSkillId: 'ui-ux-pro-max',
  installationAgents: ['claude', 'codex', 'cursor', 'universal'],
  prerequisite: 'Node.js and npm',
}

describe('Agent Rules Prompt & Schema', () => {
  it('validates a valid Agent output object (consolidated)', () => {
    expect(AgentRulesDocumentSchema.safeParse({ agent_content: '# Agent.md', rules_content: '' }).success).toBe(true)
  })

  it('builds user prompt with verified setup for the selected agent', () => {
    const prompt = buildAgentRulesGeneratorUserPrompt('Acme', '{}', undefined, [verifiedSkill], 'CLAUDE_CODE')

    expect(prompt).toContain('Project Name: Acme')
    expect(prompt).toContain('Target coding agent: CLAUDE_CODE')
    expect(prompt).toContain('ui-ux-pro-max')
    expect(prompt).toContain('Improves accessible UI implementation.')
    expect(prompt).toContain('When building frontend screens.')
    expect(prompt).toContain('npx ui-ux-pro-max-cli init --ai claude')
    expect(prompt).toContain('Recommended Agent Skills')
    expect(prompt).toContain('Do not install globally or overwrite files without explicit human-owner approval')
    expect(prompt).toContain('follow it whenever its trigger applies')
    expect(prompt).not.toContain('skills-llm')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('concise operational cheatsheet')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('Boundaries: ALWAYS / ASK FIRST / NEVER')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('Treat confirmed canonical decisions as immutable')
  })

  it('omits stale or forged installation commands', () => {
    const prompt = buildAgentRulesGeneratorUserPrompt('Acme', '{}', undefined, [{
      name: 'ui-ux-pro-max', purpose: 'Accessible UI.', trigger: 'When building screens.',
      installationHint: 'npx skills-llm install ui-ux-pro-max',
    }], 'CLAUDE_CODE')

    expect(prompt).not.toContain('npx skills-llm install ui-ux-pro-max')
    expect(prompt).toContain('Setup: Instruction-only')
  })

  it('maps target agents and leaves unverified recommendations instruction-only', () => {
    const prompt = buildAgentRulesGeneratorUserPrompt('Acme', '{}', undefined, [verifiedSkill], 'CODEX')
    const manual = buildAgentRulesGeneratorUserPrompt('Acme', '{}', undefined, [{
      name: 'local-only', purpose: 'Local guidance.', trigger: 'When applicable.',
      installationHint: 'npx dangerous-package install',
    }], 'CODEX')

    expect(prompt).toContain('npx ui-ux-pro-max-cli init --ai codex')
    expect(manual).not.toContain('npx dangerous-package')
    expect(manual).toContain('Setup: Instruction-only')
  })

  it('does not invent skills when recommendations are unresolved', () => {
    const prompt = buildAgentRulesGeneratorUserPrompt('Acme', '{}')
    expect(prompt).toContain('Skill recommendations have not been resolved yet')
    expect(prompt).toContain('do not invent skills')
  })

  it('instructs honest skill activation, visual quality gates, and adaptive composition in system prompt', () => {
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('Recommendations do not prove activation')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('record only skills actually loaded')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('Claim visual verification only when rendered evidence was actually inspected')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('do not impose universal layouts or invent business data/screen scope')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).not.toContain('antislop')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).not.toContain('anti-slop-ui')
  })
})

describe('One-shot kickoff prompt', () => {
  it('includes selected skill setup and preserves proposal-first approval', () => {
    const prompt = generateOneShotKickoffPrompt({
      name: 'Acme', classification: 'SAAS', targetAgent: 'CLAUDE_CODE', skills: [{
        ...verifiedSkill,
        metadata: {
          installation_mode: verifiedSkill.installationMode,
          installation_source: verifiedSkill.installationSource,
          installation_skill_id: verifiedSkill.installationSkillId,
          installation_agents: verifiedSkill.installationAgents,
          installation_hint: verifiedSkill.installationHint,
          prerequisite: verifiedSkill.prerequisite,
        },
      }],
    })

    expect(prompt).toContain('npx ui-ux-pro-max-cli init --ai claude')
    expect(prompt).toContain('read each skill instruction file and apply it whenever its trigger matches')
    expect(prompt).toContain('propose the next appropriate task for the human owner’s approval before implementation')
  })

  it('does not fabricate installation instructions when no skills are resolved', () => {
    const prompt = generateOneShotKickoffPrompt({ name: 'Acme', classification: 'SAAS', skills: [] })
    expect(prompt).toContain('No resolved skill recommendations are available')
    expect(prompt).not.toContain('npx ')
  })
})

describe('Agent Rules Fallback Generators', () => {
  it('generates fallback Agent.md without inventing unresolved skills', () => {
    const md = generateFallbackAgentMd('Acme App', 'CLAUDE_CODE')
    expect(md).toContain('# Agent.md — Universal Operational Contract for AI Coding Agents')
    expect(md).toContain('Project: Acme App')
    expect(md).toContain('Skill recommendations have not been resolved yet')
    expect(md).not.toContain('ui-ux-pro-max')
  })

  it('includes only validated setup commands for selected fallback skills', () => {
    const md = generateFallbackAgentMd('Acme App', 'CLAUDE_CODE', [verifiedSkill])
    const instructionOnly = generateFallbackAgentMd('Acme App', 'CLAUDE_CODE', [{
      name: 'other', purpose: 'Safe guidance.', trigger: 'When relevant.', installationHint: 'npm install attacker-package',
    }])

    expect(md).toContain('npx ui-ux-pro-max-cli init --ai claude')
    expect(md).toContain('Skill Bootstrap & Activation')
    expect(instructionOnly).not.toContain('attacker-package')
  })

  it('generates fallback RULES.md markdown', () => {
    const md = generateFallbackRulesMd('Acme App')
    expect(md).toContain('# Agent.md — Operational Rules for Acme App')
    expect(md).toContain('BYOK API keys must remain session-scoped')
  })

  it('frames DESIGN.md adaptively without immutable token ceiling or hardcoded skills in fallback', () => {
    const md = generateFallbackAgentMd('Acme App', 'CLAUDE_CODE', [verifiedSkill])
    expect(md).toContain('refine adaptable choices coherently without treating initial tokens as an aesthetic ceiling')
    expect(md).not.toContain('strict immutable data')
    expect(md).not.toContain('Never invent arbitrary styles or override tokens')
    expect(md).not.toContain('antislop')
    expect(md).not.toContain('anti-slop-ui')
    expect(md).toContain('Functional tests and acceptance criteria pass')
    expect(md).toContain('inspect rendered representative screens at desktop and narrow/mobile widths')
    expect(md).toContain('Claim visual verification only when rendered evidence was inspected; otherwise report the limitation.')
    expect(md).toContain('when supported by the documented workflow; do not invent product behavior')
  })
})

describe('Agent Rules Engine — generateAgentAndRulesArtifacts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)
    await expect(generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-invalid' })).rejects.toThrow('Project not found')
  })

  it('blocks generation without an active BYOK session', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test Project', targetAgent: 'CLAUDE_CODE',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce(null)
    await expect(generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('No active AI provider session found')
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('does not pass stale persisted install hints into the provider prompt', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test Project', targetAgent: 'CLAUDE_CODE',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
      skillRecommendations: [{
        name: 'ui-ux-pro-max', source: 'skillsllm.com', purpose: 'Improves UI.', trigger: 'When building UI.',
        metadata: JSON.stringify({ installation_hint: 'npx skills-llm install ui-ux-pro-max' }),
      }],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'test', apiKey: 'sk-test' })
    const generateStructured = vi.fn().mockResolvedValue({ agent_content: 'Agent' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })

    await generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-1' })
    const prompt = generateStructured.mock.calls[0]?.[0] as string
    expect(prompt).not.toContain('skills-llm')
    expect(prompt).toContain('Setup: Instruction-only')
  })

  it('uses the provider when BYOK session is active', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test Project', targetAgent: 'CLAUDE_CODE',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
      skillRecommendations: [{
        name: 'ui-ux-pro-max', source: 'skillsllm.com', purpose: 'Improves accessible UI implementation.',
        trigger: 'When building frontend screens.',
        metadata: JSON.stringify({ installation_hint: 'npx skills-llm install ui-ux-pro-max' }),
      }],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-test' })
    const generateStructured = vi.fn().mockResolvedValue({ agent_content: '# AI Agent.md' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })

    const results = await generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-1' })
    expect(results[0]?.content).toBe('# AI Agent.md')
    expect(results[1]).toBeUndefined()
    expect(generateStructured.mock.calls[0]?.[0]).toContain('ui-ux-pro-max')
    expect(generateStructured.mock.calls[0]?.[0]).not.toContain('skills-llm')
  })

  it('preserves a current READY Agent artifact during incomplete retry', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'AGENT', isRequired: true }] }],
      artifacts: [{ type: 'AGENT', contextId: 'ctx-1', status: 'READY' }],
    } as never)
    await expect(regenerateIncompleteAgentArtifacts({ userId: 'u-1', projectId: 'p-1' })).resolves.toEqual([])
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('skips Agent retry when Agent is not in the current plan', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [] }], artifacts: [],
    } as never)
    await expect(regenerateIncompleteAgentArtifacts({ userId: 'u-1', projectId: 'p-1' })).resolves.toEqual([])
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('marks Agent artifact FAILED when the provider throws', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test Project', targetAgent: 'CLAUDE_CODE',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'test', apiKey: 'sk-test' })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockRejectedValue(new Error('Provider down')),
    })
    await expect(generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('Provider down')
    expect(db.artifact.update).toHaveBeenCalledWith({
      where: { projectId_type: { projectId: 'p-1', type: 'AGENT' } }, data: { status: 'FAILED' },
    })
  })
})
