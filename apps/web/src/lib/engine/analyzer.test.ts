import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  RequirementAnalysisSchema,
  buildRequirementAnalysisUserPrompt,
  REQUIREMENT_ANALYZER_SYSTEM_PROMPT,
} from '@/lib/prompts/requirement-analyzer'
import { analyzeProjectRequirements } from '@/lib/engine/requirement-analyzer'

// ============================================================
// Mocks
// ============================================================

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
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

vi.mock('@/lib/engine/analysis-store', () => ({
  persistRequirementAnalysis: vi.fn(),
}))

describe('Requirement Analysis Schema', () => {
  it('validates a correct analysis object', () => {
    const validData = {
      known_facts: ['User wants a multi-tenant SaaS', 'Next.js + Postgres stack requested'],
      missing_information: ['Auth provider preference', 'Payment gateway choice'],
      ambiguities: ['"Fast performance" not quantified'],
      important_decisions: ['BYOK vs managed API key handling'],
      optional_decisions: ['Dark mode support'],
      risk_flags: ['API key leakage in client components'],
    }

    const result = RequirementAnalysisSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects missing required arrays', () => {
    const invalidData = {
      known_facts: ['Fact 1'],
      // missing missing_information, ambiguities, etc.
    }

    const result = RequirementAnalysisSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

describe('Requirement Analysis Prompt Builder', () => {
  it('builds a prompt containing project metadata and raw idea text', () => {
    const prompt = buildRequirementAnalysisUserPrompt(
      'Acme Analytics',
      'I want a dashboard for multi-tenant analytics.',
      'DASHBOARD',
      'CLAUDE_CODE',
    )

    expect(prompt).toContain('Project Name: Acme Analytics')
    expect(prompt).toContain('Project Type: DASHBOARD')
    expect(prompt).toContain('Target Agent: CLAUDE_CODE')
    expect(prompt).toContain('I want a dashboard for multi-tenant analytics.')
  })

  it('system prompt includes explicit architectural instructions', () => {
    expect(REQUIREMENT_ANALYZER_SYSTEM_PROMPT).toContain('known_facts')
    expect(REQUIREMENT_ANALYZER_SYSTEM_PROMPT).toContain('missing_information')
    expect(REQUIREMENT_ANALYZER_SYSTEM_PROMPT).toContain('risk_flags')
  })
})

describe('Requirement Analyzer Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project does not exist', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      analyzeProjectRequirements({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('throws error if user has no BYOK provider session', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test',
      rawIdea: 'Test idea long enough text',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'CONFIGURED',
      language: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    await expect(
      analyzeProjectRequirements({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No active AI provider session found')
  })

  it('transitions status to ANALYZING and returns analysis result on success', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    const { updateProject } = await import('@/lib/projects/project-service')
    const { persistRequirementAnalysis } = await import('@/lib/engine/analysis-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test',
      rawIdea: 'Test idea description',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'CONFIGURED',
      language: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const mockGenerate = vi.fn().mockResolvedValueOnce({
      known_facts: ['Fact 1'],
      missing_information: ['Info 1'],
      ambiguities: ['Ambiguity 1'],
      important_decisions: ['Decision 1'],
      optional_decisions: ['Opt 1'],
      risk_flags: ['Risk 1'],
    })

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: mockGenerate,
    })

    const result = await analyzeProjectRequirements({ userId: 'u-1', projectId: 'p-1' })

    expect(updateProject).toHaveBeenCalledWith('u-1', 'p-1', { status: 'ANALYZING' })
    expect(result.known_facts).toEqual(['Fact 1'])
    expect(persistRequirementAnalysis).toHaveBeenCalledWith({
      projectId: 'p-1',
      analysis: result,
    })
  })

  it('marks status GENERATION_FAILED when all retries fail', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test',
      rawIdea: 'Test idea description',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'CONFIGURED',
      language: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockRejectedValue(new Error('API quota exceeded')),
    })

    await expect(
      analyzeProjectRequirements({ userId: 'u-1', projectId: 'p-1', retryCount: 1 }),
    ).rejects.toThrow('Requirement analysis failed after 1 attempts')

    expect(db.project.update).toHaveBeenCalledWith({
      where: { id: 'p-1' },
      data: { status: 'GENERATION_FAILED' },
    })
  })
})
