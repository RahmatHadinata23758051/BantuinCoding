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

  it('blocks AI consistency validation when no active BYOK session exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      artifacts: [
        { type: 'PRD', path: 'PRD.md', content: '# PRD' },
        { type: 'SRS', path: 'SRS.md', content: '# SRS' },
      ],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    await expect(
      auditProjectConsistency({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No active AI provider session found')
  })
})
