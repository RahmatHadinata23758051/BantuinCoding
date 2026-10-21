import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProvider } from '@/lib/ai/provider'
import { getProviderConfig } from '@/lib/byok/session-store'
import {
  BacklogGeneratorOutputSchema,
  buildBacklogGeneratorUserPrompt,
  BACKLOG_GENERATOR_SYSTEM_PROMPT,
  MAX_BACKLOG_PROMPT_CHARS,
  MAX_BACKLOG_REFERENCE_CHARS,
  summarizeBacklogReference,
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
        description: 'Create the runnable application foundation.',
        dependencies: [],
        acceptance_criteria: ['The application starts using the documented project setup.'],
        definition_of_done: 'The startup behavior is verified with the project instructions.',
        relevant_docs: ['PRD.md'],
        recommended_skills: [],
      },
      {
        id: 'BK-002',
        title: 'Implement the confirmed record persistence behavior',
        description: 'Persist the confirmed entities using the project-defined storage approach.',
        dependencies: ['BK-001'],
        acceptance_criteria: ['Records preserve the confirmed fields and can be retrieved after creation.'],
        definition_of_done: 'Persistence behavior is verified against the documented project requirements.',
        relevant_docs: ['PRD.md'],
        recommended_skills: [],
      },
    ],
  },
]

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getProviderConfig).mockReset()
  vi.mocked(createProvider).mockReset()
})

describe('Backlog Generator Schema & Prompt', () => {
  it('retains late priority sections within the bounded section-aware summary', () => {
    const content = [
      '# Long specification',
      `## Overview\n${'overview '.repeat(700)}`,
      `## User stories\n${'story '.repeat(700)}`,
      `## Security constraints\n${'guard '.repeat(300)}\nConfirmed security requirement SEC-42: never expose tokens.`,
      `## Export decisions\n${'export '.repeat(300)}\nConfirmed export decision: exclude private files.`,
    ].join('\n\n')

    const summary = summarizeBacklogReference(content)
    expect(summary.length).toBeLessThanOrEqual(MAX_BACKLOG_REFERENCE_CHARS)
    expect(summary).toContain('SEC-42: never expose tokens')
    expect(summary).toContain('Confirmed export decision: exclude private files')
    expect(summary).toContain('Omitted complete sections')
  })

  it('truncates oversized priority sections without exceeding the reference limit', () => {
    const content = `# Long spec\n\n## Security\n${'critical security constraint '.repeat(900)}`
    const summary = summarizeBacklogReference(content)

    expect(summary.length).toBeLessThanOrEqual(MAX_BACKLOG_REFERENCE_CHARS)
    expect(summary).toContain('## Security')
    expect(summary).toContain('section truncated for reference brevity')
    expect(summary).toContain('Truncated sections')
  })

  it('bounds a long unsectioned document without requiring headings', () => {
    const summary = summarizeBacklogReference('Unsectioned content '.repeat(MAX_BACKLOG_REFERENCE_CHARS))

    expect(summary.length).toBeLessThanOrEqual(MAX_BACKLOG_REFERENCE_CHARS)
    expect(summary).toContain('document truncated for reference brevity')
  })

  it('bounds summary notices when many sections are omitted', () => {
    const content = Array.from({ length: 400 }, (_, index) => `## Overview ${index}\n${'detail '.repeat(100)}`).join('\n\n')
    const summary = summarizeBacklogReference(content)

    expect(summary.length).toBeLessThanOrEqual(MAX_BACKLOG_REFERENCE_CHARS)
    expect(summary).toContain('Omitted complete sections')
  })

  it('fits comprehensive priority sections by keeping document-order excerpts', () => {
    const content = Array.from({ length: 8 }, (_, index) => `## Security requirement ${index}\n${`fact-${index} `.repeat(800)}`).join('\n\n')
    const summary = summarizeBacklogReference(content)

    expect(summary.length).toBeLessThanOrEqual(MAX_BACKLOG_REFERENCE_CHARS)
    expect(summary).toContain('fact-0')
    expect(summary).toContain('Truncated sections')
    expect(summary).toContain('Omitted complete sections')
  })

  it('validates generated backlog grounding against full source references', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    const fullSource = `# PRD\n\n## Stack\n${'documented details '.repeat(1200)}\nUse Prisma for persistence.`
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-current', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-current', content: fullSource, status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generated = vi.fn().mockResolvedValueOnce({ phases: [{ name: 'Phase 1', order: 1, tasks: [{
      id: 'BK-001', title: 'Persist confirmed records with Prisma', description: 'Use Prisma for persistence.', dependencies: [],
      acceptance_criteria: ['Persistence follows the documented Prisma data model.'],
      definition_of_done: 'Persistence behavior is verified against the documented Prisma constraints.', relevant_docs: ['PRD.md'], recommended_skills: [],
    }] }] })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: generated })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })).resolves.toBeDefined()
    expect(generated.mock.calls[0]?.[0]).not.toContain('Use Prisma for persistence.')
  })

  it('fails before the provider when the complete prompt exceeds its maximum size', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-current', isCurrent: true, contentJson: 'x'.repeat(MAX_BACKLOG_PROMPT_CHARS), artifactPlans: [] }],
      artifacts: [], skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('Backlog generation input exceeds')
    expect(dbMocks.tx.artifact.upsert).not.toHaveBeenCalled()
  })

  it('keeps the bounded provider input below the configured prompt ceiling for large references', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-current', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-current', content: `# PRD\n\n## Requirements\n${'requirement '.repeat(20_000)}`, status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generated = vi.fn().mockResolvedValueOnce({ phases: mockPhases })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: generated })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    await generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })
    const prompt = generated.mock.calls[0]?.[0] as string
    expect(prompt.length).toBeLessThanOrEqual(MAX_BACKLOG_PROMPT_CHARS)
    expect(prompt).toContain('section truncated for reference brevity')
  })

  it('validates a valid BacklogGeneratorOutput object', () => {
    const data = {
      phases: mockPhases,
      backlog_md_content: '# BACKLOG.md',
    }
    const result = BacklogGeneratorOutputSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('fails when the assembled prompt exceeds its maximum size', () => {
    const content = 'x'.repeat(MAX_BACKLOG_PROMPT_CHARS)
    expect(() => buildBacklogGeneratorUserPrompt('Acme', '{}', [{ type: 'PRD', path: 'PRD.md', content }]))
      .toThrow('Backlog generation input exceeds')
  })

  it('validates a valid BacklogGeneratorOutput object', () => {
    const data = {
      phases: mockPhases,
      backlog_md_content: '# BACKLOG.md',
    }
    const result = BacklogGeneratorOutputSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('builds user prompt from current document references', () => {
    const prompt = buildBacklogGeneratorUserPrompt('Acme', '{}', [
      { type: 'PRD', path: 'PRD.md', content: 'PRD' },
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: 'ARCH' },
    ])
    expect(prompt).toContain('Project Name: Acme')
    expect(prompt).toContain('PRD Reference (PRD.md):')
    expect(prompt).toContain('ARCHITECTURE Reference (ARCHITECTURE.md):')
    expect(prompt).toContain('Current Planned Document References:')
    expect(prompt).not.toContain('SRS Reference:')
    expect(prompt).toContain('recommended_skills array on every task must be empty: []')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('Engineering Project Manager')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('exact skill names listed in the Available Project Skills catalog')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('relevant_docs must contain only exact file paths')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('not "PRD.md §4 FR-01"')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('Put section/requirement citations in the description or acceptance criteria')
  })

  it('preserves design invariants without locking every visual decision', () => {
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('preserve its hard invariants')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('Allow agents to refine adaptable defaults')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('update the canonical CSS tokens coherently')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('If DESIGN.md is not included, do not invent a reference to it')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).not.toContain('for every visual decision')
  })

  it('includes DESIGN only when it is a current planned reference', () => {
    const prompt = buildBacklogGeneratorUserPrompt('Acme', '{}', [
      { type: 'DESIGN', path: 'DESIGN.md', content: '# DESIGN.md\n\nUse hard shadows and warm paper.' },
    ])
    expect(prompt).toContain('DESIGN Reference (DESIGN.md):')
    expect(prompt).toContain('Use hard shadows and warm paper.')
    expect(prompt).toContain('must reference DESIGN.md when it is included')
  })

  it('does not invent a design document when one is not planned', () => {
    const prompt = buildBacklogGeneratorUserPrompt('Acme', '{}', [])
    expect(prompt).toContain('(No current planned document references are available.)')
    expect(prompt).not.toContain('DESIGN Reference (not planned for this project)')
  })

  it('includes only the resolved skill catalog as recommendation options', () => {
    const prompt = buildBacklogGeneratorUserPrompt('Acme', '{}', [], ['verified-skill'])

    expect(prompt).toContain('Available Project Skills Catalog')
    expect(prompt).toContain('- verified-skill')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('Never invent or hallucinate skill names')
  })

  it('keeps backlog generation instructions stack-neutral and project-grounded', () => {
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).toContain('Choose tools, libraries, data stores, frameworks, test runners, package managers, and commands ONLY when confirmed')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).not.toContain('ORM/Prisma schema')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).not.toContain('request validation (Zod)')
    expect(BACKLOG_GENERATOR_SYSTEM_PROMPT).not.toContain('Passes pnpm typecheck')
  })

  it('uses neutral task applicability labels in the internal fallback catalog', () => {
    expect(internalCatalogFallback.every((skill) =>
      skill.applicable_phases.every((phase) => !/^Phase\\s+\\d+/i.test(phase)),
    )).toBe(true)
  })

  it('rejects references outside the current-context plan or with stale content', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{
        id: 'ctx-current', isCurrent: true, contentJson: '{}',
        artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }],
      }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-old', content: 'old', status: 'READY' }],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' }))
      .rejects.toThrow('Required PRD reference is not ready for the current context')
    expect(dbMocks.tx.artifact.upsert).not.toHaveBeenCalled()
  })

  it('includes current planned artifacts and Agent.md, never stale or unplanned artifacts', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{
        id: 'ctx-current', isCurrent: true, contentJson: '{}',
        artifactPlans: [
          { type: 'PRD', path: 'PRD.md', isRequired: true },
          { type: 'DESIGN', path: 'DESIGN.md', isRequired: true },
          { type: 'BACKLOG', path: 'BACKLOG.md', isRequired: true },
        ],
      }],
      artifacts: [
        { type: 'PRD', path: 'PRD.md', contextId: 'ctx-current', content: '# PRD\n\nCurrent requirements.', status: 'READY' },
        { type: 'DESIGN', path: 'DESIGN.md', contextId: 'ctx-current', content: '# DESIGN\n\nCurrent visual rules.', status: 'MODIFIED' },
        { type: 'AGENT', path: 'Agent.md', contextId: 'ctx-old', content: 'stale agent', status: 'READY' },
        { type: 'SRS', path: 'SRS.md', contextId: 'ctx-current', content: 'unplanned legacy', status: 'READY' },
      ],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValueOnce({ phases: [{ name: 'Phase 1', order: 1, tasks: [{
      id: 'BK-001', title: 'Do work', description: 'Desc', dependencies: [], acceptance_criteria: ['The requested project behavior matches its source requirement.'],
      definition_of_done: 'Implementation behavior is verified against the project requirements.', relevant_docs: ['PRD.md'], recommended_skills: [],
    }] }] })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    await generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })
    const prompt = generateStructured.mock.calls[0]?.[0] as string
    expect(prompt).toContain('Current requirements.')
    expect(prompt).toContain('Current visual rules.')
    expect(prompt).not.toContain('stale agent')
    expect(prompt).not.toContain('unplanned legacy')
    expect(prompt.length).toBeLessThanOrEqual(MAX_BACKLOG_PROMPT_CHARS)
  })

  it('includes an available optional planned document without requiring it', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{
        id: 'ctx-current', isCurrent: true, contentJson: '{}',
        artifactPlans: [
          { type: 'PRD', path: 'PRD.md', isRequired: true },
          { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', isRequired: false },
        ],
      }],
      artifacts: [
        { type: 'PRD', path: 'PRD.md', contextId: 'ctx-current', content: '# PRD\n\nRequirements.', status: 'READY' },
        { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', contextId: 'ctx-current', content: '# Architecture\n\nOptional details.', status: 'READY' },
      ],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValueOnce({ phases: [{ name: 'Phase 1', order: 1, tasks: [{
      id: 'BK-001', title: 'Do work', description: 'Desc', dependencies: [], acceptance_criteria: ['The requested project behavior matches its source requirement.'],
      definition_of_done: 'Implementation behavior is verified against the project requirements.', relevant_docs: ['ARCHITECTURE.md'], recommended_skills: [],
    }] }] })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    await generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })

    expect(generateStructured.mock.calls[0]?.[0]).toContain('Optional details.')
  })

  it('includes current Agent.md only when it is planned and ready for the context', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{
        id: 'ctx-current', isCurrent: true, contentJson: '{}',
        artifactPlans: [{ type: 'AGENT', path: 'Agent.md', isRequired: true }],
      }],
      artifacts: [{ type: 'AGENT', path: 'Agent.md', contextId: 'ctx-current', content: '# Agent\n\nDo not log secrets.', status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValueOnce({ phases: [{ name: 'Phase 1', order: 1, tasks: [{
      id: 'BK-001', title: 'Do work', description: 'Desc', dependencies: [], acceptance_criteria: ['The requested project behavior matches its source requirement.'],
      definition_of_done: 'Implementation behavior is verified against the project requirements.', relevant_docs: ['Agent.md'], recommended_skills: [],
    }] }] })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    await generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })
    expect(generateStructured.mock.calls[0]?.[0]).toContain('Do not log secrets.')
  })

  it('handles over-limit references before marking BACKLOG generating', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-current', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-current', content: `# PRD\n\n## Security\n${'critical '.repeat(MAX_BACKLOG_REFERENCE_CHARS)}`, status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValueOnce({ phases: mockPhases })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })).resolves.toBeDefined()
    expect(generateStructured).toHaveBeenCalledOnce()
    expect(dbMocks.tx.artifact.upsert).toHaveBeenCalledOnce()
  })

  it('accepts documented repository paths present only after the bounded excerpt', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    const fullSource = `# PRD\n\n## Overview\n${'overview '.repeat(1500)}\n\n## Repository\nUse the file "src/server/db.ts" for database access.`
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-current', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-current', content: fullSource, status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValueOnce({ phases: [{ name: 'Phase 1', order: 1, tasks: [{
      id: 'BK-001', title: 'Use the documented persistence module', description: 'Update the confirmed module.', dependencies: [],
      acceptance_criteria: ['The documented persistence module retains required behavior.'],
      definition_of_done: 'Module behavior is verified against the project requirements.', relevant_docs: ['src/server/db.ts'], recommended_skills: [],
    }] }] })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })).resolves.toBeDefined()
    expect(generateStructured).toHaveBeenCalledOnce()
  })

  it('rejects an unsupported tool that appears only after the bounded excerpt', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    const fullSource = `# PRD\n\n## Overview\n${'overview '.repeat(1500)}\n\n## Stack\nDo not use Prisma.`
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-current', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-current', content: fullSource, status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValueOnce({ phases: [{ name: 'Phase 1', order: 1, tasks: [{
      id: 'BK-001', title: 'Persist records with Prisma', description: 'Use Prisma for persistence.', dependencies: [],
      acceptance_criteria: ['Persistence uses the Prisma schema.'],
      definition_of_done: 'Persistence behavior is verified against the project requirements.', relevant_docs: ['PRD.md'], recommended_skills: [],
    }] }] })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('unsupported or conflicting technology/tool "Prisma"')
  })

  it('accepts a supported tool that appears only in a late full-source section', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    const fullSource = `# PRD\n\n## Stack\n${'documented details '.repeat(1200)}\nUse Prisma for persistence.`
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-current', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-current', content: fullSource, status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValueOnce({ phases: [{ name: 'Phase 1', order: 1, tasks: [{
      id: 'BK-001', title: 'Persist records with Prisma', description: 'Use Prisma for persistence.', dependencies: [],
      acceptance_criteria: ['Persistence uses the documented Prisma schema.'],
      definition_of_done: 'Persistence behavior is verified against the documented Prisma constraints.', relevant_docs: ['PRD.md'], recommended_skills: [],
    }] }] })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })).resolves.toBeDefined()
  })

  it('validates a valid BacklogGeneratorOutput object', () => {
    const result = BacklogGeneratorOutputSchema.safeParse({ phases: mockPhases })
    expect(result.success).toBe(true)
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
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-1', content: '# PRD\\n\\nValid source.', status: 'READY' }],
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
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-1', content: '# PRD\\n\\nCurrent source.', status: 'READY' }],
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
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      skillRecommendations: [{ name: 'verified-skill' }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-1', content: '# PRD\\n\\nSource.', status: 'READY' }],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC', model: 'model-1', apiKey: 'test-key',
    })
    const generateStructured = vi.fn().mockResolvedValueOnce({
      phases: [{
        name: 'Phase 1', order: 1, tasks: [{
          id: 'BK-001', title: 'Task', description: 'Desc', dependencies: [],
          acceptance_criteria: ['The requested project behavior matches its source requirement.'], definition_of_done: 'Implementation behavior is verified against the project requirements.', relevant_docs: [],
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

  it('rejects a phase with an empty task list before replacing the existing backlog', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-1', content: '# PRD\\n\\nCurrent source.', status: 'READY' }],
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
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-1', content: '# PRD\\n\\nCurrent source.', status: 'READY' }],
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
    expect(md).toContain('BK-002 — Implement the confirmed record persistence behavior')
  })

  it('repairs an invalid initial draft once and persists the repaired output', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-1', content: '# PRD\n\nCurrent source.', status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'OPENAI', model: 'model-1', apiKey: 'test-key',
    })
    // First call returns missing definition_of_done (the exact bug observed in production)
    const invalidDraft = {
      phases: [{
        name: 'Phase 1', order: 1,
        tasks: [{
          id: 'BK-001', title: 'Task 1', description: 'Desc', dependencies: [],
          acceptance_criteria: ['Criterion 1'], definition_of_done: '', relevant_docs: ['PRD.md'], recommended_skills: [],
        }],
      }],
    }
    const generateStructured = vi.fn()
      .mockResolvedValueOnce(invalidDraft)
      .mockResolvedValueOnce({ phases: mockPhases })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'OPENAI', testConnection: vi.fn(), generateStructured,
    })
    dbMocks.tx.backlogPhase.create.mockImplementation(async ({ data }) => ({ id: 'phase-1', ...data }))
    dbMocks.tx.backlogTask.create.mockImplementation(async ({ data }) => ({ id: 'task-1', ...data }))

    const result = await generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })

    expect(generateStructured).toHaveBeenCalledTimes(2)
    expect(generateStructured.mock.calls[1]?.[0]).toContain('<draft_to_repair>')
    expect(generateStructured.mock.calls[1]?.[0]).toContain('definition_of_done')
    expect(result.phases).toHaveLength(1)
    expect(dbMocks.tx.artifact.upsert).toHaveBeenCalledTimes(1)
  })

  it('preserves previous READY backlog artifact status when replacement fails', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [
        { type: 'PRD', path: 'PRD.md', contextId: 'ctx-1', content: '# PRD\n\nCurrent source.', status: 'READY' },
        { type: 'BACKLOG', path: 'BACKLOG.md', contextId: 'ctx-1', content: '# Previous Backlog\n\nExisting content.', status: 'READY' },
      ],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'OPENAI', model: 'model-1', apiKey: 'test-key',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'OPENAI', testConnection: vi.fn(),
      generateStructured: vi.fn().mockRejectedValueOnce(new Error('Network timeout')),
    })

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow()

    // Artifact status should be restored to READY rather than FAILED
    expect(dbMocks.tx.artifact.update).toHaveBeenCalledWith({
      where: { projectId_type: { projectId: 'p-1', type: 'BACKLOG' } },
      data: { status: 'READY' },
    })
  })

  it('does not attempt draft repair on provider network or auth failure', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'PRD', path: 'PRD.md', isRequired: true }] }],
      artifacts: [{ type: 'PRD', path: 'PRD.md', contextId: 'ctx-1', content: '# PRD\n\nCurrent source.', status: 'READY' }],
      skillRecommendations: [],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'OPENAI', model: 'model-1', apiKey: 'test-key',
    })
    const generateStructured = vi.fn().mockRejectedValueOnce(new Error('fetch failed: ENOTFOUND'))
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'OPENAI', testConnection: vi.fn(), generateStructured,
    })

    await expect(generateProjectBacklog({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow()
    expect(generateStructured).toHaveBeenCalledTimes(1)
  })
})
