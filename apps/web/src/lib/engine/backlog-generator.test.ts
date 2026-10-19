import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  BacklogGeneratorOutputSchema,
  buildBacklogGeneratorUserPrompt,
  BACKLOG_GENERATOR_SYSTEM_PROMPT,
  type GeneratedBacklogPhase,
} from '@/lib/prompts/backlog-generator'
import { validateBacklogDependencies } from '@/lib/engine/backlog-validator'
import {
  generateProjectBacklog,
  generateBacklogMdContent,
} from '@/lib/engine/backlog-generator'
import { internalCatalogFallback } from '@/lib/engine/skill-resolver'

const dbMocks = vi.hoisted(() => {
  const tx = {
    backlogPhase: { deleteMany: vi.fn(), create: vi.fn() },
    backlogTask: { create: vi.fn() },
    backlogDependency: { create: vi.fn() },
    artifact: { upsert: vi.fn(), update: vi.fn() },
  }
  return { tx }
})

vi.mock('@repo/db', () => ({
  db: {
    project: { findFirst: vi.fn() },
    backlogPhase: dbMocks.tx.backlogPhase,
    backlogTask: dbMocks.tx.backlogTask,
    backlogDependency: dbMocks.tx.backlogDependency,
    artifact: dbMocks.tx.artifact,
    $transaction: vi.fn(async (callback) => callback(dbMocks.tx)),
  },
}))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
}))


const mockPhases: GeneratedBacklogPhase[] = [
  {
    name: 'Phase 1',
    order: 1,
    description: 'Desc',
    tasks: [
      {
        id: 'BK-001',
        title: 'Initialize project scaffold and tooling',
        description: '...',
        dependencies: [],
        acceptance_criteria: [],
        definition_of_done: 'done',
        relevant_docs: [],
        recommended_skills: []
      },
      {
        id: 'BK-002',
        title: 'Define Prisma database schema and migrations',
        description: '...',
        dependencies: ['BK-001'],
        acceptance_criteria: [],
        definition_of_done: 'done',
        relevant_docs: [],
        recommended_skills: []
      }
    ]
  }
]

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

describe('Backlog Generator Schema & Prompt', () => {
  it('validates a valid BacklogGeneratorOutput object', () => {
    const data = {
      phases: mockPhases,
      backlog_md_content: '# BACKLOG.md',
    }
    const result = BacklogGeneratorOutputSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('builds user prompt containing references', () => {
    const prompt = buildBacklogGeneratorUserPrompt('Acme', '{}', 'PRD', 'SRS', 'ARCH')
    expect(prompt).toContain('Project Name: Acme')
    expect(prompt).toContain('PRD Reference:')
    expect(prompt).toContain('SRS Reference:')
    expect(prompt).toContain('Architecture Reference:')
    expect(prompt).toContain('DESIGN Reference (not planned for this project):')
    expect(prompt).toContain('recommended_skills array on every task must be empty: []')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('Engineering Project Manager')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('exact skill names listed in the Available Project Skills catalog')
  })

  it('includes only the resolved skill catalog as recommendation options', () => {
    const prompt = buildBacklogGeneratorUserPrompt(
      'Acme', '{}', 'PRD', 'SRS', 'ARCH', '', ['verified-skill'],
    )

    expect(prompt).toContain('Available Project Skills Catalog')
    expect(prompt).toContain('- verified-skill')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('Never invent or hallucinate skill names')
  })

  it('uses neutral task applicability labels in the internal fallback catalog', () => {
    expect(internalCatalogFallback.every((skill) =>
      skill.applicable_phases.every((phase) => !/^Phase\s+\d+/i.test(phase)),
    )).toBe(true)
  })

  it('includes DESIGN reference and instruction for frontend tasks when present', () => {
    const prompt = buildBacklogGeneratorUserPrompt(
      'Acme',
      '{}',
      'PRD',
      'SRS',
      'ARCH',
      '# DESIGN.md\n\nUse hard shadows and warm paper.',
    )

    expect(prompt).toContain('DESIGN Reference:')
    expect(prompt).toContain('Use hard shadows and warm paper.')
    expect(prompt).toContain('Frontend and interaction tasks must reference DESIGN.md')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('include DESIGN.md in relevant_docs')
  })
})

describe('Backlog Dependency Validator', () => {
  it('passes validation for valid linear dependencies', () => {
    const validPhases: GeneratedBacklogPhase[] = [
      {
        name: 'Phase 1',
        order: 1,
        tasks: [
          {
            id: 'BK-001',
            title: 'Task 1',
            description: 'Desc',
            dependencies: [],
            acceptance_criteria: ['AC1'],
            definition_of_done: 'DoD1',
            relevant_docs: ['SRS'],
            recommended_skills: ['ts'],
          },
          {
            id: 'BK-002',
            title: 'Task 2',
            description: 'Desc',
            dependencies: ['BK-001'],
            acceptance_criteria: ['AC2'],
            definition_of_done: 'DoD2',
            relevant_docs: ['SRS'],
            recommended_skills: ['ts'],
          },
        ],
      },
    ]

    const result = validateBacklogDependencies(validPhases)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.taskStatusMap['BK-001']).toBe('READY')
    expect(result.taskStatusMap['BK-002']).toBe('READY')
  })

  it('resolves valid dependencies declared later', () => {
    const forwardReference: GeneratedBacklogPhase[] = [
      {
        name: 'Phase 1',
        order: 1,
        tasks: [
          {
            id: 'BK-001',
            title: 'Task 1',
            description: 'Desc',
            dependencies: ['BK-002'],
            acceptance_criteria: ['AC1'],
            definition_of_done: 'DoD1',
            relevant_docs: ['SRS'],
            recommended_skills: [],
          },
          {
            id: 'BK-002',
            title: 'Task 2',
            description: 'Desc',
            dependencies: [],
            acceptance_criteria: ['AC2'],
            definition_of_done: 'DoD2',
            relevant_docs: ['SRS'],
            recommended_skills: [],
          },
        ],
      },
    ]

    const result = validateBacklogDependencies(forwardReference)
    expect(result.isValid).toBe(true)
    expect(result.taskStatusMap['BK-001']).toBe('READY')
  })

  it('fails validation when referencing a missing dependency', () => {
    const invalidPhases: GeneratedBacklogPhase[] = [
      {
        name: 'Phase 1',
        order: 1,
        tasks: [
          {
            id: 'BK-002',
            title: 'Task 2',
            description: 'Desc',
            dependencies: ['BK-NON-EXISTENT'],
            acceptance_criteria: ['AC2'],
            definition_of_done: 'DoD2',
            relevant_docs: ['SRS'],
            recommended_skills: ['ts'],
          },
        ],
      },
    ]

    const result = validateBacklogDependencies(invalidPhases)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('non-existent dependency')
    expect(result.taskStatusMap['BK-002']).toBe('PENDING')
  })

  it('fails validation when circular dependency is detected', () => {
    const circularPhases: GeneratedBacklogPhase[] = [
      {
        name: 'Phase 1',
        order: 1,
        tasks: [
          {
            id: 'BK-001',
            title: 'Task 1',
            description: 'Desc',
            dependencies: ['BK-002'],
            acceptance_criteria: ['AC1'],
            definition_of_done: 'DoD1',
            relevant_docs: ['SRS'],
            recommended_skills: ['ts'],
          },
          {
            id: 'BK-002',
            title: 'Task 2',
            description: 'Desc',
            dependencies: ['BK-001'],
            acceptance_criteria: ['AC2'],
            definition_of_done: 'DoD2',
            relevant_docs: ['SRS'],
            recommended_skills: ['ts'],
          },
        ],
      },
    ]

    const result = validateBacklogDependencies(circularPhases)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Circular dependency detected')
  })
})

describe('Backlog Generator Engine — generateProjectBacklog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      generateProjectBacklog({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('blocks backlog generation when no active BYOK session exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
      artifacts: [],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    await expect(
      generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No active AI provider session found')
    expect(db.backlogPhase.deleteMany).not.toHaveBeenCalled()
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('replaces phases, tasks, dependencies, and artifact in one transaction', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }], artifacts: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC', testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce({
        phases: mockPhases,
      }),
    })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: `phase-${data.order}`, ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: `task-${data.taskKey}`, ...data }))

    await generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })

    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(dbMocks.tx.backlogPhase.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'p-1' } })
    expect(dbMocks.tx.backlogTask.create).toHaveBeenCalled()
    expect(dbMocks.tx.backlogDependency.create).toHaveBeenCalled()
    expect(dbMocks.tx.artifact.upsert).toHaveBeenCalled()
  })

  it('passes resolved skill names to the prompt and filters invented recommendations', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
      skillRecommendations: [{ name: 'verified-skill' }],
      artifacts: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key',
    })
    const generateStructured = vi.fn().mockResolvedValueOnce({
      phases: [{
        name: 'Phase 1', order: 1, tasks: [{
          id: 'BK-001', title: 'Task', description: 'Desc', dependencies: [],
          acceptance_criteria: ['AC'], definition_of_done: 'Done', relevant_docs: [],
          recommended_skills: ['verified-skill', 'invented-skill'],
        }],
      }],
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured,
    })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    const output = await generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })

    expect(generateStructured.mock.calls[0]?.[0]).toContain('- verified-skill')
    expect(output.phases[0]?.tasks[0]?.recommended_skills).toEqual(['verified-skill'])
    expect(dbMocks.tx.backlogTask.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ recommendedSkills: '["verified-skill"]' }),
    }))
  })

  it('rejects an empty phase before replacing the existing backlog', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }], artifacts: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC', testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce({
        phases: [{ name: 'Empty phase', order: 1, tasks: [] }],
      }),
    })

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' }))
      .rejects.toThrow('Each backlog phase must contain at least one task')
    expect(dbMocks.tx.backlogPhase.deleteMany).not.toHaveBeenCalled()
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(dbMocks.tx.artifact.update).toHaveBeenCalledWith({
      where: { projectId_type: { projectId: 'p-1', type: 'BACKLOG' } },
      data: { status: 'FAILED' },
    })
  })

  it('reports a safe failure when atomic replacement rolls back', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }], artifacts: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC', testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce({
        phases: mockPhases,
      }),
    })
    vi.mocked(db.$transaction).mockRejectedValueOnce(new Error('write failed'))

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' }))
      .rejects.toThrow('Backlog replacement failed. The previous backlog was preserved.')
    // Artifact is set to GENERATING before transaction; upsert is called once
    expect(dbMocks.tx.artifact.upsert).toHaveBeenCalledTimes(1)
    // On transaction failure, artifact is marked FAILED outside transaction for observability
    expect(dbMocks.tx.artifact.update).toHaveBeenCalledWith({
      where: { projectId_type: { projectId: 'p-1', type: 'BACKLOG' } },
      data: { status: 'FAILED' },
    })
  })

  it('generates backlog markdown content correctly', () => {
    const md = generateBacklogMdContent('Acme Project', mockPhases)
    expect(md).toContain('# BACKLOG.md — Acme Project')
    expect(md).toContain('BK-001 — Initialize project scaffold and tooling')
    expect(md).toContain('BK-002 — Define Prisma database schema and migrations')
  })
})
