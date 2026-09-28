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
  defaultFallbackPhases,
} from '@/lib/engine/backlog-generator'

const dbMocks = vi.hoisted(() => {
  const tx = {
    backlogPhase: { deleteMany: vi.fn(), create: vi.fn() },
    backlogTask: { create: vi.fn() },
    backlogDependency: { create: vi.fn() },
    artifact: { upsert: vi.fn() },
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

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

describe('Backlog Generator Schema & Prompt', () => {
  it('validates a valid BacklogGeneratorOutput object', () => {
    const data = {
      phases: defaultFallbackPhases,
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
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('Engineering Project Manager')
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
        phases: defaultFallbackPhases,
        backlog_md_content: '# BACKLOG',
      }),
    })
    dbMocks.tx.backlogPhase.create
      .mockResolvedValueOnce({ id: 'phase-1' })
      .mockResolvedValueOnce({ id: 'phase-2' })
    dbMocks.tx.backlogTask.create
      .mockResolvedValueOnce({ id: 'task-1' })
      .mockResolvedValueOnce({ id: 'task-2' })
      .mockResolvedValueOnce({ id: 'task-3' })

    await generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })

    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(dbMocks.tx.backlogPhase.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'p-1' } })
    expect(dbMocks.tx.backlogTask.create).toHaveBeenCalled()
    expect(dbMocks.tx.backlogDependency.create).toHaveBeenCalled()
    expect(dbMocks.tx.artifact.upsert).toHaveBeenCalled()
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
        phases: defaultFallbackPhases,
        backlog_md_content: '# BACKLOG',
      }),
    })
    vi.mocked(db.$transaction).mockRejectedValueOnce(new Error('write failed'))

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' }))
      .rejects.toThrow('Backlog replacement failed. The previous backlog was preserved.')
    expect(dbMocks.tx.artifact.upsert).not.toHaveBeenCalled()
  })

  it('generates backlog markdown content correctly', () => {
    const md = generateBacklogMdContent('Acme Project', defaultFallbackPhases)
    expect(md).toContain('# BACKLOG.md — Acme Project')
    expect(md).toContain('BK-001 — Initialize project structure')
    expect(md).toContain('BK-002 — Setup database models')
  })
})
