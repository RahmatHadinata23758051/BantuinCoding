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

  it('matches existing document references case-insensitively', () => {
    const report = validateRuleBasedConsistency([
      { type: 'BACKLOG', path: 'BACKLOG.md', content: 'Relevant Docs: Architecture.md, Architecture.md' },
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: '# Architecture' },
    ])

    expect(report.issues).toEqual([])
  })

  it('reports repeated missing document references only once', () => {
    const report = validateRuleBasedConsistency([
      { type: 'BACKLOG', path: 'BACKLOG.md', content: 'Relevant Docs: UNKNOWN.md, UNKNOWN.md' },
    ])

    expect(report.issues.filter((issue) => issue.category === 'INVALID_BACKLOG_DOC_REF')).toHaveLength(1)
  })

  it('does not treat markdown filenames mentioned in task descriptions as backlog document references', () => {
    const report = validateRuleBasedConsistency([
      {
        type: 'BACKLOG',
        path: 'BACKLOG.md',
        content: `### TASK-007 — Build specification compiler
**Description:** Generates standard markdown files ('prd.md', 'system-architecture.md', 'task-breakdown.md').
**Relevant Docs:** PRD.md, ARCHITECTURE.md`,
      },
      { type: 'PRD', path: 'PRD.md', content: '# PRD' },
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: '# Architecture' },
    ])

    expect(report.issues.filter((issue) => issue.category === 'INVALID_BACKLOG_DOC_REF')).toHaveLength(0)
    expect(report.isConsistent).toBe(true)
  })

  it('blocks secret-containing artifacts and reports no matched secret values', () => {
    const report = validateRuleBasedConsistency([
      {
        type: 'ARCHITECTURE',
        path: 'ARCHITECTURE.md',
        content: 'DATABASE_URL="postgresql://user:private_password@db-host/app"',
      },
    ])

    expect(report.isConsistent).toBe(false)
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        severity: 'HIGH',
        category: 'SECRET_LEAKAGE',
        affected_documents: ['ARCHITECTURE.md'],
      }),
    )
    expect(JSON.stringify(report)).not.toContain('private_password')
  })

  it('allows empty environment placeholders during validation', () => {
    const report = validateRuleBasedConsistency([
      {
        type: 'ARCHITECTURE',
        path: 'ARCHITECTURE.md',
        content: 'DATABASE_URL=""\nNEXTAUTH_SECRET=""',
      },
    ])

    expect(report.isConsistent).toBe(true)
    expect(report.issues).toEqual([])
  })

  it('detects missing YAML front matter tokens in DESIGN.md', () => {
    const report = validateRuleBasedConsistency([
      {
        type: 'DESIGN',
        path: 'DESIGN.md',
        content: '# DESIGN.md\nNo front matter',
      },
    ])

    expect(report.issues.some((i) => i.category === 'INVALID_DESIGN_SYSTEM')).toBe(true)
  })

  it('passes validation when DESIGN.md has valid YAML front matter and Agent.md references DESIGN.md', () => {
    const validDesign = `---
name: "Acme Design System"
archetype: "Contemporary Institutional"
colors:
  canvas: "#FFF"
typography:
  body: { fontFamily: "Inter" }
rounded:
  sm: "2px"
spacing:
  sm: "8px"
iconography:
  library: "lucide-react"
---
# DESIGN.md`

    const report = validateRuleBasedConsistency([
      {
        type: 'DESIGN',
        path: 'DESIGN.md',
        content: validDesign,
      },
      {
        type: 'AGENT',
        path: 'Agent.md',
        content: '# Agent.md\nPrecedence: DESIGN.md is visual authority',
      },
    ])

    expect(report.issues).toHaveLength(0)
    expect(report.isConsistent).toBe(true)
  })

  it('detects when Agent.md fails to reference DESIGN.md', () => {
    const validDesign = `---
name: "Acme Design System"
archetype: "Contemporary Institutional"
colors:
  canvas: "#FFF"
typography:
  body: { fontFamily: "Inter" }
rounded:
  sm: "2px"
spacing:
  sm: "8px"
iconography:
  library: "lucide-react"
---
# DESIGN.md`

    const report = validateRuleBasedConsistency([
      {
        type: 'DESIGN',
        path: 'DESIGN.md',
        content: validDesign,
      },
      {
        type: 'AGENT',
        path: 'Agent.md',
        content: '# Agent.md\nNo mention of design document',
      },
    ])

    expect(report.issues.some((i) => i.category === 'AGENT_DESIGN_HIERARCHY_MISSING')).toBe(true)
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
