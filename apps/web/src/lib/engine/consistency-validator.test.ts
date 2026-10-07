import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ConsistencyReportSchema,
  buildConsistencyValidatorUserPrompt,
  CONSISTENCY_VALIDATOR_SYSTEM_PROMPT,
} from '@/lib/prompts/consistency-validator'
import {
  validateRuleBasedConsistency,
  auditProjectConsistency,
} from '@/lib/engine/consistency-validator'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

describe('Consistency Validator Schema & Prompt', () => {
  it('validates a valid ConsistencyReport object', () => {
    const reportData = {
      isConsistent: true,
      score: 100,
      issues: [],
      summary: 'No conflicts detected',
    }
    const result = ConsistencyReportSchema.safeParse(reportData)
    expect(result.success).toBe(true)
  })

  it('builds user prompt with project name and artifacts', () => {
    const prompt = buildConsistencyValidatorUserPrompt('Acme App', '[{"type":"PRD"}]')
    expect(prompt).toContain('Project Name: Acme App')
    expect(prompt).toContain('[{"type":"PRD"}]')
    expect(CONSISTENCY_VALIDATOR_SYSTEM_PROMPT).toContain('Technical Quality Auditor')
  })
})

describe('Rule-Based Consistency Validator', () => {
  it('detects database mismatch between PRD and Architecture', () => {
    const artifacts = [
      { type: 'PRD', path: 'PRD.md', content: 'We will use MongoDB for user data.' },
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: 'Database: PostgreSQL + Prisma' },
    ]

    const report = validateRuleBasedConsistency(artifacts)
    expect(report.isConsistent).toBe(false)
    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]?.category).toBe('DATABASE_MISMATCH')
  })

  it('detects invalid document reference in Backlog', () => {
    const artifacts = [
      { type: 'BACKLOG', path: 'BACKLOG.md', content: 'Relevant Docs: NON_EXISTENT_FILE.md' },
    ]

    const report = validateRuleBasedConsistency(artifacts)
    expect(report.issues.some((i) => i.category === 'INVALID_BACKLOG_DOC_REF')).toBe(true)
  })
})

describe('Consistency Validator Engine — auditProjectConsistency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      auditProjectConsistency({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('uses deterministic validation when no active BYOK session exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'context-current',
          artifactPlans: [
            { type: 'PRD', path: 'PRD.md', isRequired: true },
            { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', isRequired: true },
          ],
        },
      ],
      artifacts: [
        {
          contextId: 'context-current',
          type: 'PRD',
          path: 'PRD.md',
          content: '# PRD',
          status: 'READY',
        },
        {
          contextId: 'context-current',
          type: 'ARCHITECTURE',
          path: 'ARCHITECTURE.md',
          content: '# Architecture',
          status: 'READY',
        },
      ],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    await expect(
      auditProjectConsistency({ userId: 'u-1', projectId: 'p-1' }),
    ).resolves.toMatchObject({ isConsistent: true, issues: [] })
  })

  it('excludes stale and unplanned artifacts from the audit', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'context-current',
          artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }],
        },
      ],
      artifacts: [
        {
          contextId: 'context-current',
          type: 'PRD',
          path: 'PRD.md',
          content: '# Current PRD',
          status: 'READY',
        },
        {
          contextId: 'context-old',
          type: 'ARCHITECTURE',
          path: 'ARCHITECTURE.md',
          content: 'MongoDB',
          status: 'READY',
        },
        {
          contextId: 'context-current',
          type: 'SKILLS',
          path: 'SKILLS.md',
          content: 'stale unplanned document',
          status: 'READY',
        },
      ],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'test-model',
      apiKey: 'test-key',
    } as never)
    vi.mocked(createProvider).mockReturnValueOnce({
      generateStructured: vi.fn().mockResolvedValue({
        isConsistent: true,
        score: 100,
        issues: [],
        summary: 'Consistent',
      }),
    } as never)

    await auditProjectConsistency({ userId: 'u-1', projectId: 'p-1' })

    const providerPrompt = vi.mocked(createProvider).mock.results[0]?.value
      .generateStructured.mock.calls[0]?.[0] as string
    expect(providerPrompt).toContain('Current PRD')
    expect(providerPrompt).not.toContain('MongoDB')
    expect(providerPrompt).not.toContain('stale unplanned document')
  })

  it('falls back to deterministic results when the AI report is malformed', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'context-current',
          artifactPlans: [
            { type: 'PRD', path: 'PRD.md', isRequired: true },
            { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', isRequired: true },
          ],
        },
      ],
      artifacts: [
        {
          contextId: 'context-current',
          type: 'PRD',
          path: 'PRD.md',
          content: 'MongoDB',
          status: 'READY',
        },
        {
          contextId: 'context-current',
          type: 'ARCHITECTURE',
          path: 'ARCHITECTURE.md',
          content: 'PostgreSQL',
          status: 'READY',
        },
      ],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'test-model',
      apiKey: 'test-key',
    } as never)
    vi.mocked(createProvider).mockReturnValueOnce({
      generateStructured: vi.fn().mockRejectedValue(new Error('schema validation failed')),
    } as never)

    await expect(
      auditProjectConsistency({ userId: 'u-1', projectId: 'p-1' }),
    ).resolves.toMatchObject({
      isConsistent: false,
      issues: [expect.objectContaining({ category: 'DATABASE_MISMATCH' })],
    })
  })
})
