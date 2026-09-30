import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  CanonicalContextSchema,
  buildContextNormalizerUserPrompt,
  CONTEXT_NORMALIZER_SYSTEM_PROMPT,
} from '@/lib/prompts/context-normalizer'
import {
  generateCanonicalContext,
  getCurrentContext,
} from '@/lib/engine/context-engine'

vi.mock('@repo/db', () => {
  const projectContext = {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  }
  const artifact = { updateMany: vi.fn() }

  return {
    db: {
      project: {
        findFirst: vi.fn(),
      },
      projectContext,
      artifact,
      $transaction: vi.fn(async (callback: (tx: { projectContext: typeof projectContext; artifact: typeof artifact }) => unknown) =>
        callback({ projectContext, artifact }),
      ),
    },
  }
})

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
  getCurrentRequirementAnalysis: vi.fn(),
}))

describe('Canonical Context Schema', () => {
  it('validates a complete Canonical Context object with provenance', () => {
    const validData = {
      project_name: 'Acme SaaS',
      summary: 'Multi-tenant SaaS application for issue tracking',
      target_users: [{ value: 'Software developers', provenance: 'confirmed' as const }],
      goals: [{ value: 'Reduce onboard time to under 5 mins', provenance: 'confirmed' as const }],
      non_goals: [{ value: 'No built-in video chat', provenance: 'confirmed' as const }],
      functional_requirements: [
        {
          id: 'FR-001',
          title: 'User Authentication',
          description: 'Login with email/password',
          provenance: 'confirmed' as const,
        },
      ],
      non_functional_requirements: [
        {
          category: 'Security',
          requirement: 'BYOK API keys stored in memory only',
          provenance: 'confirmed' as const,
        },
      ],
      core_entities: [
        { name: 'User', fields: ['id', 'email', 'name'] },
        { name: 'Project', fields: ['id', 'name', 'userId'] },
      ],
      technical_constraints: [{ value: 'Monorepo architecture', provenance: 'confirmed' as const }],
      stack_preferences: {
        frontend: { value: 'Next.js 16', provenance: 'confirmed' as const },
        backend: { value: 'Next.js App Router', provenance: 'confirmed' as const },
        database: { value: 'PostgreSQL + Prisma', provenance: 'confirmed' as const },
        styling: { value: 'Tailwind CSS 4', provenance: 'confirmed' as const },
      },
      design_direction: { value: 'Developer tool — focused and keyboard-friendly', provenance: 'confirmed' as const },
      security_requirements: [{ value: 'No API key leakage', provenance: 'confirmed' as const }],
      integrations: [{ value: 'Linear API', provenance: 'assumed' as const }],
      deployment_target: { value: 'Vercel / Docker', provenance: 'unknown' as const },
      agent_target: 'CLAUDE_CODE',
      confirmed_decisions: [{ value: 'BYOK model', provenance: 'confirmed' as const }],
      open_questions: [{ value: 'Final deployment target', provenance: 'unknown' as const }],
      assumptions: [{ value: 'Single-instance deployment for MVP', provenance: 'assumed' as const }],
    }

    const result = CanonicalContextSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid provenance enum values', () => {
    const invalidData = {
      project_name: 'Test',
      summary: 'Summary',
      target_users: [{ value: 'Devs', provenance: 'INVALID_PROVENANCE' }],
    }
    const result = CanonicalContextSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

describe('Context Normalizer Prompt Builder', () => {
  it('builds user prompt containing raw input and analysis JSON', () => {
    const prompt = buildContextNormalizerUserPrompt(
      'Acme App',
      'Raw idea text',
      'SAAS',
      'CLAUDE_CODE',
      '{"known_facts":[]}',
      '[]',
    )
    expect(prompt).toContain('Project Name: Acme App')
    expect(prompt).toContain('Project Type: SAAS')
    expect(prompt).toContain('Raw Idea Input:')
    expect(prompt).toContain('Answered Clarification Questions:')
  })

  it('system prompt includes strict provenance rules', () => {
    expect(CONTEXT_NORMALIZER_SYSTEM_PROMPT).toContain('PROVENANCE RULES')
    expect(CONTEXT_NORMALIZER_SYSTEM_PROMPT).toContain('confirmed')
    expect(CONTEXT_NORMALIZER_SYSTEM_PROMPT).toContain('assumed')
  })
})

describe('Context Engine — generateCanonicalContext', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { db } = await import('@repo/db')
    const { getCurrentRequirementAnalysis } = await import('@/lib/engine/analysis-store')

    vi.mocked(getCurrentRequirementAnalysis).mockResolvedValue({
      id: 'analysis-1',
      version: 1,
      analysis: {
        known_facts: [],
        missing_information: [],
        ambiguities: [],
        important_decisions: [],
        optional_decisions: [],
        risk_flags: [],
      },
      createdAt: new Date(),
    })
    vi.mocked(db.projectContext.findFirst).mockResolvedValue(null)
    vi.mocked(db.projectContext.create).mockResolvedValue({ id: 'ctx-created' } as never)
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      generateCanonicalContext({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('saves versioned snapshot and transitions status to CONTEXT_READY', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    const { updateProject } = await import('@/lib/projects/project-service')
    const { getCurrentRequirementAnalysis } = await import('@/lib/engine/analysis-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      rawIdea: 'Raw idea description',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'CLARIFYING',
      createdAt: new Date(),
      updatedAt: new Date(),
      clarificationQuestions: [],
      contexts: [],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const mockContext = {
      project_name: 'Test Project',
      summary: 'Summary text',
      target_users: [],
      goals: [],
      non_goals: [],
      functional_requirements: [],
      non_functional_requirements: [],
      core_entities: [],
      technical_constraints: [],
      stack_preferences: {
        frontend: { value: 'Next.js', provenance: 'confirmed' as const },
        backend: { value: 'Node', provenance: 'confirmed' as const },
        database: { value: 'Postgres', provenance: 'confirmed' as const },
        styling: { value: 'Tailwind', provenance: 'confirmed' as const },
      },
      design_direction: { value: 'Clean', provenance: 'assumed' as const },
      security_requirements: [],
      integrations: [],
      deployment_target: { value: 'Vercel', provenance: 'assumed' as const },
      agent_target: 'CLAUDE_CODE',
      confirmed_decisions: [{ value: 'BYOK', provenance: 'confirmed' as const }],
      open_questions: [],
      assumptions: [],
    }

    const mockGenerate = vi.fn().mockResolvedValueOnce(mockContext)
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: mockGenerate,
    })

    const result = await generateCanonicalContext({ userId: 'u-1', projectId: 'p-1' })

    expect(result.version).toBe(1)
    expect(db.projectContext.create).toHaveBeenCalledWith({
      data: {
        projectId: 'p-1',
        version: 1,
        contentJson: JSON.stringify(mockContext),
        isCurrent: true,
      },
    })
    expect(updateProject).toHaveBeenCalledWith('u-1', 'p-1', { status: 'CONTEXT_READY' })
    expect(getCurrentRequirementAnalysis).toHaveBeenCalledWith('p-1')
    expect(mockGenerate.mock.calls[0]?.[0]).toContain('"known_facts":[]')
  })

  it('requires explicit acceptance when a round-limit assumption question exists', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test', rawIdea: 'Idea',
      classification: 'SAAS', targetAgent: 'CLAUDE_CODE', contexts: [],
      clarificationQuestions: [{
        id: 'q-4', round: 4, status: 'ANSWERED',
        question: 'Confirm that unresolved items may proceed as explicit assumptions?',
        answer: 'Do not proceed',
      }],
    } as never)

    await expect(generateCanonicalContext({ userId: 'u-1', projectId: 'p-1' }))
      .rejects.toThrow('Confirm unresolved items as explicit assumptions')
    expect(createProvider).not.toHaveBeenCalled()
  })

  it('does not mark the project ready when the snapshot transaction fails', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    const { updateProject } = await import('@/lib/projects/project-service')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test', rawIdea: 'Idea',
      classification: 'SAAS', targetAgent: 'CLAUDE_CODE',
      clarificationQuestions: [], contexts: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key',
    })
    const generated = {
      project_name: 'Test', summary: 'Summary', target_users: [], goals: [], non_goals: [],
      functional_requirements: [], non_functional_requirements: [], core_entities: [],
      technical_constraints: [],
      stack_preferences: {
        frontend: { value: 'Unknown', provenance: 'unknown' as const },
        backend: { value: 'Unknown', provenance: 'unknown' as const },
        database: { value: 'Unknown', provenance: 'unknown' as const },
        styling: { value: 'Unknown', provenance: 'unknown' as const },
      },
      design_direction: { value: 'Unknown', provenance: 'unknown' as const },
      security_requirements: [], integrations: [],
      deployment_target: { value: 'Unknown', provenance: 'unknown' as const },
      agent_target: 'CLAUDE_CODE', confirmed_decisions: [], open_questions: [], assumptions: [],
    }
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC', testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce(generated),
    })
    vi.mocked(db.$transaction).mockRejectedValueOnce(new Error('transaction failed'))

    await expect(generateCanonicalContext({ userId: 'u-1', projectId: 'p-1' }))
      .rejects.toThrow('transaction failed')
    expect(updateProject).not.toHaveBeenCalledWith('u-1', 'p-1', { status: 'CONTEXT_READY' })
  })

  it('increments version and preserves confirmed decisions from previous version', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    const prevContext = {
      project_name: 'Test Project',
      summary: 'Previous summary',
      target_users: [],
      goals: [{ value: 'Launch MVP', provenance: 'confirmed' as const }],
      non_goals: [],
      functional_requirements: [
        {
          id: 'FR-001',
          title: 'Authentication',
          description: 'Email login is required',
          provenance: 'confirmed' as const,
        },
      ],
      non_functional_requirements: [],
      core_entities: [],
      technical_constraints: [{ value: 'PostgreSQL', provenance: 'confirmed' as const }],
      stack_preferences: {
        frontend: { value: 'Next.js', provenance: 'confirmed' as const },
        backend: { value: 'Node', provenance: 'assumed' as const },
        database: { value: 'Postgres', provenance: 'confirmed' as const },
        styling: { value: 'Tailwind', provenance: 'assumed' as const },
      },
      design_direction: { value: 'Editorial developer tool', provenance: 'confirmed' as const },
      security_requirements: [{ value: 'BYOK keys stay in memory', provenance: 'confirmed' as const }],
      integrations: [],
      deployment_target: { value: 'Vercel', provenance: 'confirmed' as const },
      agent_target: 'CLAUDE_CODE',
      confirmed_decisions: [
        { value: 'Monorepo Architecture', provenance: 'confirmed' as const },
        { value: 'BYOK Security', provenance: 'confirmed' as const },
      ],
      open_questions: [],
      assumptions: [{ value: 'Single instance MVP', provenance: 'assumed' as const }],
    }

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      rawIdea: 'Raw idea description',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'CLARIFYING',
      createdAt: new Date(),
      updatedAt: new Date(),
      clarificationQuestions: [],
      contexts: [
        {
          version: 1,
          contentJson: JSON.stringify(prevContext),
          isCurrent: true,
        },
      ],
    } as never)

    // First call: inside transaction for preservation (isCurrent: true)
    // Second call: inside transaction for version (orderBy version desc)
    // Third call: after transaction for final context (isCurrent: true)
    const expectedMergedContext = {
      ...prevContext,
      confirmed_decisions: [
        { value: 'Monorepo Architecture', provenance: 'confirmed' as const },
        { value: 'BYOK Security', provenance: 'confirmed' as const },
        { value: 'New Decision', provenance: 'confirmed' as const },
      ],
      design_direction: { value: 'Editorial developer tool', provenance: 'confirmed' as const },
      deployment_target: { value: 'Vercel', provenance: 'confirmed' as const },
      assumptions: [{ value: 'Small initial user base', provenance: 'assumed' as const }],
      goals: [{ value: 'Launch MVP', provenance: 'confirmed' as const }],
      functional_requirements: [
        { id: 'FR-001', title: 'Launch MVP', description: 'Launch the MVP', provenance: 'confirmed' as const },
      ],
      technical_constraints: [{ value: 'PostgreSQL', provenance: 'confirmed' as const }],
      security_requirements: [{ value: 'BYOK keys stay in memory', provenance: 'confirmed' as const }],
      open_questions: [{ value: 'Billing model', provenance: 'unknown' as const }],
    }

    vi.mocked(db.projectContext.findFirst)
      .mockResolvedValueOnce({ version: 1, contentJson: JSON.stringify(prevContext), isCurrent: true } as never)
      .mockResolvedValueOnce({ version: 1 } as never)
      .mockResolvedValueOnce({ version: 2, contentJson: JSON.stringify(expectedMergedContext), isCurrent: true } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const newGeneratedContext = {
      project_name: 'Test Project',
      summary: 'Summary text',
      target_users: [],
      goals: [],
      non_goals: [],
      functional_requirements: [],
      non_functional_requirements: [],
      core_entities: [],
      technical_constraints: [],
      stack_preferences: {
        frontend: { value: 'Next.js', provenance: 'confirmed' as const },
        backend: { value: 'Node', provenance: 'confirmed' as const },
        database: { value: 'Postgres', provenance: 'confirmed' as const },
        styling: { value: 'Tailwind', provenance: 'confirmed' as const },
      },
      design_direction: { value: 'Generic dashboard', provenance: 'assumed' as const },
      security_requirements: [],
      integrations: [],
      deployment_target: { value: 'Unknown', provenance: 'unknown' as const },
      agent_target: 'CLAUDE_CODE',
      confirmed_decisions: [{ value: 'New Decision', provenance: 'confirmed' as const }],
      open_questions: [{ value: 'Billing model', provenance: 'unknown' as const }],
      assumptions: [{ value: 'Small initial user base', provenance: 'assumed' as const }],
    }

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce(newGeneratedContext),
    })

    const result = await generateCanonicalContext({ userId: 'u-1', projectId: 'p-1' })

    expect(result.version).toBe(2)
    expect(result.context.confirmed_decisions).toEqual(expect.arrayContaining([
      { value: 'Monorepo Architecture', provenance: 'confirmed' },
      { value: 'BYOK Security', provenance: 'confirmed' },
      { value: 'New Decision', provenance: 'confirmed' },
    ]))
    expect(result.context.goals).toContainEqual({ value: 'Launch MVP', provenance: 'confirmed' })
    expect(result.context.functional_requirements).toContainEqual(
      expect.objectContaining({ id: 'FR-001', provenance: 'confirmed' }),
    )
    expect(result.context.technical_constraints).toContainEqual({
      value: 'PostgreSQL',
      provenance: 'confirmed',
    })
    expect(result.context.design_direction).toEqual({
      value: 'Editorial developer tool',
      provenance: 'confirmed',
    })
    expect(result.context.deployment_target).toEqual({ value: 'Vercel', provenance: 'confirmed' })
    expect(result.context.assumptions).toContainEqual({
      value: 'Small initial user base',
      provenance: 'assumed',
    })
    expect(result.context.open_questions).toContainEqual({
      value: 'Billing model',
      provenance: 'unknown',
    })
  })
})

describe('Context Engine — getCurrentContext', () => {
  it('returns validated current context snapshot', async () => {
    const { db } = await import('@repo/db')
    const sampleContent = {
      project_name: 'Sample App',
      summary: 'Summary',
      target_users: [],
      goals: [],
      non_goals: [],
      functional_requirements: [],
      non_functional_requirements: [],
      core_entities: [],
      technical_constraints: [],
      stack_preferences: {
        frontend: { value: 'Unknown', provenance: 'unknown' },
        backend: { value: 'Unknown', provenance: 'unknown' },
        database: { value: 'Unknown', provenance: 'unknown' },
        styling: { value: 'Unknown', provenance: 'unknown' },
      },
      design_direction: { value: 'Unknown', provenance: 'unknown' },
      security_requirements: [],
      integrations: [],
      deployment_target: { value: 'Unknown', provenance: 'unknown' },
      agent_target: 'CLAUDE_CODE',
      confirmed_decisions: [],
      open_questions: [],
      assumptions: [],
    }

    vi.mocked(db.projectContext.findFirst).mockResolvedValueOnce({
      id: 'ctx-1',
      projectId: 'p-1',
      version: 1,
      contentJson: JSON.stringify(sampleContent),
      isCurrent: true,
      createdAt: new Date(),
    })

    const result = await getCurrentContext('u-1', 'p-1')
    expect(result).not.toBeNull()
    expect(result?.version).toBe(1)
    expect(result?.content.project_name).toBe('Sample App')
  })

  it('rejects an invalid persisted current context safely', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.projectContext.findFirst).mockResolvedValueOnce({
      id: 'ctx-1',
      projectId: 'p-1',
      version: 1,
      contentJson: JSON.stringify({ project_name: 'Incomplete context' }),
      isCurrent: true,
      createdAt: new Date(),
    })

    await expect(getCurrentContext('u-1', 'p-1')).rejects.toThrow(
      'Persisted canonical context is invalid.',
    )
  })
})
