import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AgentRulesDocumentSchema,
  buildAgentRulesGeneratorUserPrompt,
  AGENT_RULES_GENERATOR_SYSTEM_PROMPT,
} from '@/lib/prompts/agent-rules-generator'
import {
  generateAgentAndRulesArtifacts,
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
  it('validates a valid Agent & Rules output object', () => {
    const data = {
      agent_content: '# Agent.md\n\nRole & Workflow',
      rules_content: '# RULES.md\n\nHard Constraints',
    }
    const result = AgentRulesDocumentSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('builds user prompt with target agent and context', () => {
    const prompt = buildAgentRulesGeneratorUserPrompt('Acme', 'CLAUDE_CODE', '{"name":"Acme"}')
    expect(prompt).toContain('Project Name: Acme')
    expect(prompt).toContain('Target Coding Agent: CLAUDE_CODE')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain('operational contracts')
    expect(AGENT_RULES_GENERATOR_SYSTEM_PROMPT).toContain(
      'DESIGN for visual/interaction scope',
    )
  })
})

describe('Agent Rules Fallback Generators', () => {
  it('generates fallback Agent.md markdown', () => {
    const md = generateFallbackAgentMd('Acme App', 'CLAUDE_CODE')
    expect(md).toContain('# Agent.md — Operational Contract for CLAUDE_CODE')
    expect(md).toContain('Project: Acme App')
    expect(md).toContain('Document Hierarchy Precedence')
    expect(md).toContain('DESIGN.md (visual and interaction scope)')
  })

  it('generates fallback RULES.md markdown', () => {
    const md = generateFallbackRulesMd('Acme App')
    expect(md).toContain('# RULES.md — Hard Constraints for Acme App')
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
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const mockAiResponse = {
      agent_content: '# AI Agent.md',
      rules_content: '# AI RULES.md',
    }

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue(mockAiResponse),
    })

    const results = await generateAgentAndRulesArtifacts({ userId: 'u-1', projectId: 'p-1' })

    expect(results[0]?.content).toBe('# AI Agent.md')
    expect(results[1]?.content).toBe('# AI RULES.md')
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
    expect(db.artifact.update).toHaveBeenCalledWith({
      where: { projectId_type: { projectId: 'p-1', type: 'RULES' } },
      data: { status: 'FAILED' },
    })
  })
})
