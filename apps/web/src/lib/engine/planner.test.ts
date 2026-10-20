import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ArtifactPlanSchema,
  ARTIFACT_PLANNER_SYSTEM_PROMPT,
  SUPPORTED_PLANNED_ARTIFACT_TYPES,
  buildArtifactPlannerUserPrompt,
} from '@/lib/prompts/artifact-planner'
import {
  ensureDesignArtifact,
  getDefaultArtifactPlan,
  planProjectArtifacts,
  requiresDesignArtifact,
} from '@/lib/engine/artifact-planner'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
    artifact: {
      upsert: vi.fn(),
    },
    artifactPlanItem: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => callback({
      artifact: { upsert: vi.fn(), updateMany: vi.fn() },
      artifactPlanItem: { deleteMany: vi.fn(), create: vi.fn() },
    })),
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

describe('Artifact Plan Schema', () => {
  it('documents only end-to-end supported artifacts in the planning contract', () => {
    expect(ARTIFACT_PLANNER_SYSTEM_PROMPT).toContain('SRS.md is not generated')
    expect(ARTIFACT_PLANNER_SYSTEM_PROMPT).toContain('BACKLOG.md')
    expect(ARTIFACT_PLANNER_SYSTEM_PROMPT).not.toContain('DATABASE (docs/DATABASE.md)')
    expect(SUPPORTED_PLANNED_ARTIFACT_TYPES).toEqual(['PRD', 'ARCHITECTURE', 'DESIGN', 'AGENT', 'BACKLOG'])
    for (const unsupportedType of ['SRS', 'RULES', 'SKILLS', 'DATABASE', 'API', 'SECURITY', 'TESTING'] as const) {
      expect(ArtifactPlanSchema.safeParse({
        classification: 'SAAS',
        artifacts: [{ type: unsupportedType, path: `${unsupportedType}.md`, reason: 'Unsupported', isRequired: true }],
        rationale: 'Unsupported plan',
      }).success).toBe(false)
    }
  })

  it('validates a correct artifact plan object', () => {
    const plan = {
      classification: 'SAAS' as const,
      artifacts: [
        { type: 'PRD' as const, path: 'PRD.md', reason: 'Reqs', isRequired: true },
              ],
      rationale: 'Standard SaaS pack',
    }

    const result = ArtifactPlanSchema.safeParse(plan)
    expect(result.success).toBe(true)
  })
})

describe('getDefaultArtifactPlan', () => {
  it('LANDING_PAGE gets minimal pack (4 docs: PRD, DESIGN, Agent, BACKLOG)', () => {
    const plan = getDefaultArtifactPlan('LANDING_PAGE')
    expect(plan.artifacts).toHaveLength(4)
    const types = plan.artifacts.map((a) => a.type)
    expect(types).toContain('PRD')
    expect(types).toContain('DESIGN')
    expect(types).toContain('AGENT')
    expect(types).toContain('BACKLOG')
    expect(types).not.toContain('SRS')
    expect(types).not.toContain('ARCHITECTURE')
    expect(types).not.toContain('RULES')
    expect(types).not.toContain('SKILLS')
    expect(types).not.toContain('DATABASE')
  })

  it('SAAS gets the five-file lean pack', () => {
    const plan = getDefaultArtifactPlan('SAAS')
    expect(plan.artifacts).toHaveLength(5)
    expect(plan.artifacts.map((a) => a.type)).toEqual([
      'PRD',
      'ARCHITECTURE',
      'DESIGN',
      'AGENT',
      'BACKLOG',
    ])
  })
})

describe('requiresDesignArtifact & ensureDesignArtifact', () => {
  it('requires DESIGN for UI classifications', () => {
    expect(requiresDesignArtifact('LANDING_PAGE')).toBe(true)
    expect(requiresDesignArtifact('SAAS')).toBe(true)
  })

  it('omits DESIGN for API_SERVICE without design/styling context', () => {
    expect(requiresDesignArtifact('API_SERVICE')).toBe(false)
    expect(
      requiresDesignArtifact(
        'API_SERVICE',
        JSON.stringify({ summary: 'Backend API' }),
      ),
    ).toBe(false)
  })

  it('requires DESIGN for API_SERVICE when confirmed styling/design context exists', () => {
    expect(
      requiresDesignArtifact(
        'API_SERVICE',
        JSON.stringify({
          design_direction: { value: 'Minimalist dashboard', provenance: 'confirmed' },
        }),
      ),
    ).toBe(true)
  })

  it('omits unsupported artifacts before persisting plan items and placeholder rows', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    const txArtifactUpsert = vi.fn()
    const txPlanCreate = vi.fn()
    const txArtifactUpdateMany = vi.fn()
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'SaaS Project',
      classification: 'SAAS',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'test-key',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce({
        classification: 'SAAS',
        artifacts: [
          { type: 'PRD', path: 'PRD.md', reason: 'Requirements', isRequired: true },
          { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', reason: 'Technical design', isRequired: true },
          { type: 'DESIGN', path: 'DESIGN.md', reason: 'Visual contract', isRequired: true },
          { type: 'API', path: 'docs/API.md', reason: 'API spec', isRequired: true },
        ],
        rationale: 'Model proposal',
      }),
    })
    vi.mocked(db.$transaction).mockImplementationOnce(async (callback) => callback({
      artifact: { upsert: txArtifactUpsert, updateMany: txArtifactUpdateMany },
      artifactPlanItem: { deleteMany: vi.fn(), create: txPlanCreate },
    } as never))

    const plan = await planProjectArtifacts({ userId: 'u-1', projectId: 'p-1' })

    expect(plan.artifacts.map(({ type }) => type)).toEqual(['PRD', 'ARCHITECTURE', 'DESIGN'])
    expect(plan.rationale).toContain('Unsupported artifact types omitted: API')
    expect(txPlanCreate).toHaveBeenCalledTimes(3)
    expect(txArtifactUpsert).toHaveBeenCalledTimes(3)
    expect(txPlanCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'PRD' }) }))
    expect(txPlanCreate).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'API' }) }))
  })

  it('normalizes provider plan to insert required DESIGN before ARCHITECTURE', () => {
    const rawPlan = {
      classification: 'SAAS' as const,
      artifacts: [
        { type: 'PRD' as const, path: 'PRD.md', reason: 'Reqs', isRequired: true },
        { type: 'ARCHITECTURE' as const, path: 'ARCHITECTURE.md', reason: 'Arch', isRequired: true },
      ],
      rationale: 'Missing design',
    }

    const normalized = ensureDesignArtifact(rawPlan)
    expect(normalized.artifacts.map((a) => a.type)).toEqual(['PRD', 'DESIGN', 'ARCHITECTURE'])
    expect(normalized.artifacts[1]).toEqual({
      type: 'DESIGN',
      path: 'DESIGN.md',
      reason: 'Locked visual contract and UI system',
      isRequired: true,
    })
  })

})

describe('Artifact Planner Prompt Builder', () => {
  it('builds prompt containing project name and classification', () => {
    const prompt = buildArtifactPlannerUserPrompt(
      'Acme SaaS',
      'SAAS',
      '{"project_name":"Acme"}',
    )
    expect(prompt).toContain('Project Name: Acme SaaS')
    expect(prompt).toContain('Declared Classification: SAAS')
  })
})

describe('Artifact Planner Engine — planProjectArtifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      planProjectArtifacts({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('throws error if no current context exists', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test',
      classification: 'SAAS',
      contexts: [],
    } as never)

    await expect(
      planProjectArtifacts({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No Canonical Project Context found')
  })

  it('blocks artifact planning when no active BYOK session exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test',
      classification: 'LANDING_PAGE',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    await expect(
      planProjectArtifacts({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No active AI provider session found')
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('uses AI provider plan when BYOK session is active', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test',
      classification: 'SAAS',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const customPlan = {
      classification: 'SAAS' as const,
      artifacts: [
        { type: 'PRD' as const, path: 'PRD.md', reason: 'Reqs', isRequired: true },
                { type: 'ARCHITECTURE' as const, path: 'ARCHITECTURE.md', reason: 'Arch', isRequired: true },
        { type: 'AGENT' as const, path: 'Agent.md', reason: 'Agent', isRequired: true },
        { type: 'BACKLOG' as const, path: 'BACKLOG.md', reason: 'Backlog', isRequired: true },
      ],
      rationale: 'AI generated plan',
    }

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce(customPlan),
    })

    const plan = await planProjectArtifacts({ userId: 'u-1', projectId: 'p-1' })
    expect(plan.rationale).toBe('AI generated plan')
    expect(plan.artifacts).toContainEqual({
      type: 'DESIGN',
      path: 'DESIGN.md',
      reason: 'Locked visual contract and UI system',
      isRequired: true,
    })
    expect(db.$transaction).toHaveBeenCalledTimes(1)
  })
})
