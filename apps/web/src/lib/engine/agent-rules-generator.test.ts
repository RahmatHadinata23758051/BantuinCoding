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

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
    artifact: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

vi.mock('@/lib/projects/project-service', () => ({
  updateProject: vi.fn(),
}))

describe('Agent Rules Prompt & Schema', () => {
  it('validates a valid Agent output object (consolidated)', () => {
    const data = {
      agent_content: '# Agent.md\n\nRole & Workflow',
      rules_content: '',
    }
    const result = AgentRulesDocumentSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('builds user prompt with exact resolved skill details', () => {
    const prompt = buildAgentRulesGeneratorUserPrompt(
      'Acme',
      'CLAUDE_CODE',
      '{"name":"Acme"}',
      [{
        name: 'ui-ux-pro-max',
        source: 'skillsllm.com',
        purpose: 'Improves accessible UI implementation.',
        trigger: 'When building frontend screens.',
        installationHint: 'npx skills-llm install ui-ux-pro-max',
      }],
    )

    expect(prompt).toContain('Project Name: Acme')
    expect(prompt).toContain('Target: Any modern AI coding agent')
    expect(prompt).toContain('ui-ux-pro-max')
    expect(prompt).toContain('Improves accessible UI implementation.')
    expect(prompt).toContain('When building frontend screens.')
    expect(prompt).toContain('npx skills-llm install ui-ux-pro-max')
    expect(prompt).toContain('Recommended Agent Skills')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('unified operational contract')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain(
      'DESIGN for visual/interaction scope',
    )
  })

  it('does not invent skills when recommendations are unresolved', () => {
    const prompt = buildAgentRulesGeneratorUserPrompt('Acme', '{}')

    expect(prompt).toContain('Skill recommendations have not been resolved yet')
    expect(prompt).toContain('do not invent skills')
  })
})

describe('Agent Rules Fallback Generators', () => {
  it('generates fallback Agent.md markdown without inventing unresolved skills', () => {
    const md = generateFallbackAgentMd('Acme App', 'CLAUDE_CODE')
    expect(md).toContain('# Agent.md — Universal Operational Contract for AI Coding Agents')
    expect(md).toContain('Project: Acme App')
    expect(md).toContain('Document Hierarchy Precedence')
    expect(md).toContain('DESIGN.md (visual and interaction scope)')
    expect(md).toContain('Skill recommendations have not been resolved yet')
    expect(md).not.toContain('ui-ux-pro-max')
  })

  it('renders only explicitly supplied fallback skills', () => {
    const md = generateFallbackAgentMd('Acme App', 'CLAUDE_CODE', [{
      name: 'catalog-skill',
      purpose: 'Catalog purpose',
      trigger: 'When the catalog skill applies.',
    }])

    expect(md).toContain('catalog-skill')
    expect(md).not.toContain('ui-ux-pro-max')
  })

  it('generates fallback RULES.md markdown', () => {
    const md = generateFallbackRulesMd('Acme App')
    expect(md).toContain('# Agent.md — Operational Rules for Acme App')
    expect(md).toContain('BYOK API keys must remain session-scoped')
  })
})

describe('Agent Rules Engine — generateAgentAndRulesArtifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('blocks AGENT and RULES generation when no active BYOK session exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      targetAgent: 'CLAUDE_CODE',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    await expect(
      generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No active AI provider session found')
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('uses AI provider when BYOK session is active', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      targetAgent: 'CLAUDE_CODE',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
      skillRecommendations: [{
        name: 'ui-ux-pro-max',
        source: 'skillsllm.com',
        purpose: 'Improves accessible UI implementation.',
        trigger: 'When building frontend screens.',
        metadata: JSON.stringify({ installation_hint: 'npx skills-llm install ui-ux-pro-max' }),
      }],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const mockAiResponse = {
      agent_content: '# AI Agent.md',
    }

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue(mockAiResponse),
    })

    const results = await generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-1' })

    expect(results[0]?.content).toBe('# AI Agent.md')
    expect(results[1]).toBeUndefined()

    const provider = vi.mocked(createProvider).mock.results[0]?.value
    expect(provider?.generateStructured).toHaveBeenCalledWith(
      expect.stringContaining('ui-ux-pro-max'),
      AgentRulesDocumentSchema,
      expect.any(Object),
    )
  })

  it('preserves a current READY Agent artifact during incomplete retry', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      contexts: [{
        id: 'ctx-1',
        isCurrent: true,
        contentJson: '{}',
        artifactPlans: [{ type: 'AGENT', isRequired: true }],
      }],
      artifacts: [{ type: 'AGENT', contextId: 'ctx-1', status: 'READY' }],
    } as never)

    await expect(regenerateIncompleteAgentArtifacts({ userId: 'u-1', projectId: 'p-1' })).resolves.toEqual([])
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('skips Agent retry when Agent is not in the current plan', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [] }],
      artifacts: [],
    } as never)

    await expect(regenerateIncompleteAgentArtifacts({ userId: 'u-1', projectId: 'p-1' })).resolves.toEqual([])
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('marks Agent & Rules artifacts FAILED when AI provider throws', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      targetAgent: 'CLAUDE_CODE',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockRejectedValue(new Error('Provider down')),
    })

    await expect(
      generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('Provider down')

    expect(db.artifact.update).toHaveBeenCalledWith({
      where: { projectId_type: { projectId: 'p-1', type: 'AGENT' } },
      data: { status: 'FAILED' },
    })
  })
})
