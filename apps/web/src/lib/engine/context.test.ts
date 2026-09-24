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

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
    projectContext: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
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
      design_direction: 'Developer tool — focused, keyboard-friendly, dark theme',
      security_requirements: ['No API key leakage'],
      integrations: ['Linear API'],
      deployment_target: 'Vercel / Docker',
      agent_target: 'CLAUDE_CODE',
      confirmed_decisions: ['BYOK model', 'Monorepo'],
      open_questions: [],
      assumptions: ['Single-instance deployment for MVP'],
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
  beforeEach(() => {
    vi.clearAllMocks()
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
      design_direction: 'Clean',
      security_requirements: [],
      integrations: [],
      deployment_target: 'Vercel',
      agent_target: 'CLAUDE_CODE',
      confirmed_decisions: ['BYOK'],
      open_questions: [],
      assumptions: [],
    }

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce(mockContext),
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
  })

  it('increments version and preserves confirmed decisions from previous version', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    const prevContext = {
      confirmed_decisions: ['Monorepo Architecture', 'BYOK Security'],
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
      design_direction: 'Clean',
      security_requirements: [],
      integrations: [],
      deployment_target: 'Vercel',
      agent_target: 'CLAUDE_CODE',
      confirmed_decisions: ['New Decision'],
      open_questions: [],
      assumptions: [],
    }

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce(newGeneratedContext),
    })

    const result = await generateCanonicalContext({ userId: 'u-1', projectId: 'p-1' })

    expect(result.version).toBe(2)
    // Confirmed decisions from v1 MUST be merged into v2
    expect(result.context.confirmed_decisions).toContain('Monorepo Architecture')
    expect(result.context.confirmed_decisions).toContain('BYOK Security')
    expect(result.context.confirmed_decisions).toContain('New Decision')
  })
})

describe('Context Engine — getCurrentContext', () => {
  it('returns parsed current context snapshot', async () => {
    const { db } = await import('@repo/db')
    const sampleContent = { project_name: 'Sample App', summary: 'Summary' }

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
})
