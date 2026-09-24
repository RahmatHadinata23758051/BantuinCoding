import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ArtifactPlanSchema,
  buildArtifactPlannerUserPrompt,
} from '@/lib/prompts/artifact-planner'
import {
  getDefaultArtifactPlan,
  planProjectArtifacts,
} from '@/lib/engine/artifact-planner'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
    artifact: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

describe('Artifact Plan Schema', () => {
  it('validates a correct artifact plan object', () => {
    const plan = {
      classification: 'SAAS' as const,
      artifacts: [
        { type: 'PRD' as const, path: 'PRD.md', reason: 'Reqs', isRequired: true },
        { type: 'SRS' as const, path: 'SRS.md', reason: 'Specs', isRequired: true },
      ],
      rationale: 'Standard SaaS pack',
    }

    const result = ArtifactPlanSchema.safeParse(plan)
    expect(result.success).toBe(true)
  })
})

describe('getDefaultArtifactPlan', () => {
  it('LANDING_PAGE gets minimal pack (7 core mandatory docs)', () => {
    const plan = getDefaultArtifactPlan('LANDING_PAGE')
    expect(plan.artifacts).toHaveLength(7)
    const types = plan.artifacts.map((a) => a.type)
    expect(types).toContain('PRD')
    expect(types).toContain('SRS')
    expect(types).toContain('ARCHITECTURE')
    expect(types).toContain('AGENT')
    expect(types).toContain('RULES')
    expect(types).toContain('SKILLS')
    expect(types).toContain('BACKLOG')
    expect(types).not.toContain('DATABASE')
  })

  it('SAAS gets extended pack (includes DATABASE, API, SECURITY, TESTING, README)', () => {
    const plan = getDefaultArtifactPlan('SAAS')
    expect(plan.artifacts.length).toBeGreaterThan(7)
    const types = plan.artifacts.map((a) => a.type)
    expect(types).toContain('DATABASE')
    expect(types).toContain('API')
    expect(types).toContain('SECURITY')
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

  it('uses default plan when no BYOK session is active', async () => {
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

    const plan = await planProjectArtifacts({ userId: 'u-1', projectId: 'p-1' })
    expect(plan.artifacts).toHaveLength(7)
    expect(db.artifact.upsert).toHaveBeenCalledTimes(7)
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
        { type: 'SRS' as const, path: 'SRS.md', reason: 'Specs', isRequired: true },
        { type: 'ARCHITECTURE' as const, path: 'ARCHITECTURE.md', reason: 'Arch', isRequired: true },
        { type: 'AGENT' as const, path: 'Agent.md', reason: 'Agent', isRequired: true },
        { type: 'RULES' as const, path: 'RULES.md', reason: 'Rules', isRequired: true },
        { type: 'SKILLS' as const, path: 'SKILLS.md', reason: 'Skills', isRequired: true },
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
    expect(db.artifact.upsert).toHaveBeenCalledTimes(7)
  })
})
