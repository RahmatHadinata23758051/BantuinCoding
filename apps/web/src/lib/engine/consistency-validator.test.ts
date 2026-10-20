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

const VALID_ARCHITECTURE = Array.from(
  { length: 8 },
  (_, index) => `## ${index + 1}. Section ${index + 1}`,
).join('\n')

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
    if (result.success) {
      expect(result.data.blocksExport).toBe(false)
      expect(result.data.auditMode).toBe('ai-assisted')
    }
  })

  it('classifies confirmed secret leakage and high-severity stack contradictions as blockers', () => {
    const result = ConsistencyReportSchema.parse({
      isConsistent: false,
      score: 50,
      issues: [
        {
          severity: 'HIGH',
          category: 'SECRET_LEAKAGE',
          description: 'A credential appears in ARCHITECTURE.md',
          affected_documents: ['ARCHITECTURE.md'],
          recommendation: 'Remove the credential and rotate it.',
        },
        {
          severity: 'HIGH',
          category: 'DATABASE_MISMATCH',
          description: 'The documents specify incompatible database engines.',
          affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
          recommendation: 'Choose one database engine.',
        },
      ],
      summary: 'Critical findings require correction.',
    })

    expect(result.blocksExport).toBe(true)
    expect(result.issues.map((issue) => issue.classification)).toEqual(['BLOCKER', 'BLOCKER'])
  })

  it('keeps low-severity design findings advisory and exportable', () => {
    const result = ConsistencyReportSchema.parse({
      isConsistent: true,
      score: 92,
      issues: [
        {
          severity: 'LOW',
          category: 'CONTRAST_WARNING',
          description: 'Text contrast is slightly below target.',
          affected_documents: ['DESIGN.md'],
          recommendation: 'Adjust the text token.',
        },
      ],
      summary: 'Only advisory findings.',
    })

    expect(result.blocksExport).toBe(false)
    expect(result.issues[0]?.classification).toBe('WARNING')
  })

  it('builds user prompt with project name and artifacts', () => {
    const prompt = buildConsistencyValidatorUserPrompt('Acme App', '[{"type":"PRD"}]')
    expect(prompt).toContain('Project Name: Acme App')
    expect(prompt).toContain('[{"type":"PRD"}]')
    expect(CONSISTENCY_VALIDATOR_SYSTEM_PROMPT).toContain('Technical Quality Auditor')
  })
})

describe('Rule-Based Consistency Validator', () => {
  it('blocks a declared database that contradicts confirmed canonical context', () => {
    const context = JSON.stringify({
      stack_preferences: {
        database: { value: 'PostgreSQL', provenance: 'confirmed' },
        frontend: { value: 'React and TypeScript', provenance: 'confirmed' },
      },
    })
    const report = validateRuleBasedConsistency([
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: 'Database: SQLite\nFrontend: React and TypeScript' },
    ], context)

    expect(report.blocksExport).toBe(true)
    expect(report.issues).toContainEqual(expect.objectContaining({
      category: 'DATABASE_MISMATCH',
      classification: 'BLOCKER',
      affected_documents: ['ARCHITECTURE.md'],
    }))
    expect(report.issues.some((issue) => issue.category === 'STACK_MISMATCH')).toBe(false)
  })

  it('does not infer a stack blocker from assumed context or unstructured mentions', () => {
    const context = JSON.stringify({
      stack_preferences: { database: { value: 'PostgreSQL', provenance: 'assumed' } },
    })
    const report = validateRuleBasedConsistency([
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: 'The import job may read old SQLite exports.' },
    ], context)

    expect(report.blocksExport).toBe(false)
    expect(report.issues).toEqual([])
  })

  it('blocks explicit stack declarations that contradict confirmed context', () => {
    const context = JSON.stringify({
      stack_preferences: {
        frontend: { value: 'Next.js 16', provenance: 'confirmed' },
        backend: { value: 'Node.js', provenance: 'confirmed' },
        database: { value: 'PostgreSQL', provenance: 'confirmed' },
      },
    })
    const report = validateRuleBasedConsistency([
      {
        type: 'ARCHITECTURE',
        path: 'ARCHITECTURE.md',
        content: 'Frontend: Vue\nBackend: Python\nDatabase: MySQL',
      },
    ], context)

    expect(report.issues.filter((issue) => issue.classification === 'BLOCKER')).toHaveLength(3)
    expect(report.blocksExport).toBe(true)
  })

  it('recognizes Next.js as matching a confirmed frontend framework', () => {
    const context = JSON.stringify({
      stack_preferences: { frontend: { value: 'Next.js 16', provenance: 'confirmed' } },
    })
    const report = validateRuleBasedConsistency([
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: 'Frontend: Next.js 16 and TypeScript' },
    ], context)

    expect(report.issues).toEqual([])
  })

  it('does not treat technology mentions outside labeled declarations as stack conflicts', () => {
    const context = JSON.stringify({
      stack_preferences: { database: { value: 'PostgreSQL', provenance: 'confirmed' } },
    })
    const report = validateRuleBasedConsistency([
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: 'The migration guide explains how SQLite data is imported.' },
    ], context)

    expect(report.issues).toEqual([])
  })

  it('accepts canonical paths when an explicit backlog reference uses a leading dot segment', () => {
    const report = validateRuleBasedConsistency([
      { type: 'BACKLOG', path: 'BACKLOG.md', content: '**Relevant Docs:** ./Architecture.md' },
      { type: 'ARCHITECTURE', path: 'Architecture.md', content: '# Architecture' },
    ])

    expect(report.issues).toEqual([])
  })

  it('blocks a missing document in an explicit backlog relevant-docs entry', () => {
    const report = validateRuleBasedConsistency([
      { type: 'PRD', path: 'PRD.md', content: '# Product requirements' },
      { type: 'BACKLOG', path: 'BACKLOG.md', content: '**Relevant Docs:** PRD.md, SRS.md' },
    ])

    expect(report.blocksExport).toBe(true)
    expect(report.issues).toContainEqual(expect.objectContaining({
      category: 'INVALID_BACKLOG_DOC_REF',
      classification: 'BLOCKER',
      affected_documents: ['BACKLOG.md', 'SRS.md'],
    }))
  })

  it('accepts confirmed stack matches and its documented default alias', () => {
    const context = JSON.stringify({
      stack_preferences: { database: { value: 'PostgreSQL', provenance: 'confirmed' } },
    })
    const report = validateRuleBasedConsistency([
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: 'Database: PostgreSQL' },
    ], context)

    expect(report.blocksExport).toBe(false)
    expect(report.issues).toEqual([])
  })

  it('deduplicates explicit backlog references after normalization', () => {
    const report = validateRuleBasedConsistency([
      { type: 'BACKLOG', path: 'BACKLOG.md', content: '**Relevant Docs:** ./UNKNOWN.md, UNKNOWN.md' },
    ])

    expect(report.issues.filter((issue) => issue.category === 'INVALID_BACKLOG_DOC_REF')).toHaveLength(1)
  })

  it('detects database mismatch between PRD and Architecture', () => {
    const report = validateRuleBasedConsistency([
      { type: 'PRD', path: 'PRD.md', content: 'Database: MongoDB' },
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: 'Database: PostgreSQL' },
    ])

    expect(report.issues).toContainEqual(expect.objectContaining({ category: 'DATABASE_MISMATCH' }))
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
          content: `${VALID_ARCHITECTURE}\n# Architecture`,
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
          contentJson: JSON.stringify({
            stack_preferences: { database: { value: 'PostgreSQL', provenance: 'confirmed' } },
          }),
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
          content: `${VALID_ARCHITECTURE}\nPostgreSQL`,
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
      blocksExport: false,
      auditMode: 'deterministic-only',
      issues: [expect.objectContaining({ category: 'DATABASE_MISMATCH', classification: 'WARNING' })],
    })
  })

  it('treats AI-only findings as advisory warnings and does not block export when deterministic checks pass', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Consistent Project',
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
          content: '# PRD\nConsistent specification',
          status: 'READY',
        },
        {
          contextId: 'context-current',
          type: 'ARCHITECTURE',
          path: 'ARCHITECTURE.md',
          content: `${VALID_ARCHITECTURE}\n# Architecture\nConsistent stack`,
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
        isConsistent: false,
        score: 82,
        issues: [
          {
            severity: 'HIGH',
            category: 'TERMINOLOGY_MISMATCH',
            description: 'AI detected subtle terminology differences in user entity descriptions',
            affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
            recommendation: 'Align terminology for consistency.',
          },
        ],
        summary: 'AI suggested terminology adjustments',
      }),
    } as never)

    const result = await auditProjectConsistency({ userId: 'u-1', projectId: 'p-1' })
    expect(result.auditMode).toBe('ai-assisted')
    expect(result.blocksExport).toBe(false)
    expect(result.issues[0]?.classification).toBe('WARNING')
  })

  it('preserves deterministic stack blockers even when the AI report says export is safe', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Confirmed Stack Project',
      contexts: [{
        id: 'context-current',
        contentJson: JSON.stringify({
          stack_preferences: { database: { value: 'PostgreSQL', provenance: 'confirmed' } },
        }),
        artifactPlans: [
          { type: 'PRD', path: 'PRD.md', isRequired: true },
          { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', isRequired: true },
        ],
      }],
      artifacts: [
        { contextId: 'context-current', type: 'PRD', path: 'PRD.md', content: '# Product', status: 'READY' },
        {
          contextId: 'context-current',
          type: 'ARCHITECTURE',
          path: 'ARCHITECTURE.md',
          content: `${VALID_ARCHITECTURE}\nDatabase: SQLite`,
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
        blocksExport: false,
        score: 100,
        issues: [],
        summary: 'AI found no export blockers.',
      }),
    } as never)

    const result = await auditProjectConsistency({ userId: 'u-1', projectId: 'p-1' })

    expect(result.blocksExport).toBe(true)
    expect(result.issues).toContainEqual(expect.objectContaining({
      category: 'DATABASE_MISMATCH',
      classification: 'BLOCKER',
    }))
  })

  it('blocks export when a required artifact is structurally incomplete', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Truncated Project',
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
          content: '## 1. Overview\n## 2. Stack\n## 3. Components\n## 4. Data Flow\n### 4.1 Sync\n### 4.2 Webhook',
          status: 'READY',
        },
      ],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    const result = await auditProjectConsistency({ userId: 'u-1', projectId: 'p-1' })
    expect(result.isConsistent).toBe(false)
    expect(result.blocksExport).toBe(true)
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        category: 'STRUCTURAL_INTEGRITY',
        classification: 'BLOCKER',
        affected_documents: ['ARCHITECTURE.md'],
      }),
    )
  })
})
