import { describe, expect, it } from 'vitest'
import type { GeneratedBacklogPhase } from '@/lib/prompts/backlog-generator'
import { validateBacklogQuality } from './backlog-validator'

const phase = (task: Partial<GeneratedBacklogPhase['tasks'][number]> = {}): GeneratedBacklogPhase[] => [{
  name: 'Phase 1',
  order: 1,
  tasks: [{
    id: 'BK-001',
    title: 'Implement project behavior',
    description: 'Implement the confirmed feature behavior.',
    dependencies: [],
    acceptance_criteria: ['The user can complete the defined workflow.'],
    definition_of_done: 'Behavior is verified against the project requirements.',
    relevant_docs: ['PRD.md'],
    recommended_skills: [],
    ...task,
  }],
}]

const context = JSON.stringify({
  stack_preferences: {
    frontend: { value: 'Plain JavaScript', provenance: 'confirmed' },
    backend: { value: 'Node.js', provenance: 'confirmed' },
    database: { value: 'SQLite without Prisma', provenance: 'confirmed' },
  },
  technical_constraints: [{ value: 'Use only the standard library; no external packages.', provenance: 'confirmed' }],
})

const plainJavaScriptOptions = {
  plannedDocumentPaths: ['PRD.md', 'Agent.md', 'BACKLOG.md'],
  sourceTexts: ['Confirmed feature requirements.'],
  confirmedContextJson: context,
}

describe('validateBacklogQuality', () => {
  it('allows plain JavaScript, SQLite, and standard-library tasks without invented tooling', () => {
    const errors = validateBacklogQuality(phase({
      title: 'Persist records with SQLite',
      description: 'Use Node.js and its standard library without Prisma or TypeScript.',
      acceptance_criteria: ['Records persist in the confirmed SQLite database and survive a process restart.'],
      definition_of_done: 'The persistence behavior is verified using the documented Node.js runtime.',
    }), plainJavaScriptOptions)

    expect(errors).toEqual([])
  })

  it('allows only documented stack and test tooling', () => {
    const typescriptContext = JSON.stringify({
      stack_preferences: {
        frontend: { value: 'TypeScript', provenance: 'confirmed' },
        database: { value: 'PostgreSQL + Prisma', provenance: 'confirmed' },
      },
      technical_constraints: [{ value: 'Use Vitest for unit tests.', provenance: 'confirmed' }],
    })
    const errors = validateBacklogQuality(phase({
      title: 'Create the Prisma data model',
      description: 'Implement typed records and database access using TypeScript and Prisma.',
      acceptance_criteria: ['The PostgreSQL schema and migrations match the documented entities.'],
      definition_of_done: 'Vitest verifies model constraints and persistence behavior.',
    }), {
      plannedDocumentPaths: ['PRD.md', 'ARCHITECTURE.md', 'BACKLOG.md'],
      sourceTexts: ['Architecture: Prisma; verify with Vitest.'],
      confirmedContextJson: typescriptContext,
    })

    expect(errors).toEqual([])
  })

  it('accepts an affirmative source mention alongside a negated mention', () => {
    const errors = validateBacklogQuality(phase({
      title: 'Persist records with Prisma',
      description: 'Use Prisma for persistence.',
      acceptance_criteria: ['The confirmed Prisma database layer meets the requirements.'],
    }), {
      plannedDocumentPaths: ['PRD.md'],
      sourceTexts: ['Do not use Prisma for new projects. The existing system uses Prisma for persistence.'],
      confirmedContextJson: JSON.stringify({
        stack_preferences: { database: { value: 'PostgreSQL + Prisma', provenance: 'confirmed' } },
      }),
    })

    expect(errors).toEqual([])
  })

  it('rejects unsupported tooling, unknown document references, and filler criteria', () => {
    const errors = validateBacklogQuality(phase({
      title: 'Build with Prisma and Zod',
      description: 'Install the unspecified tooling using pnpm.',
      acceptance_criteria: ['AC'],
      definition_of_done: 'Verified and tested',
      relevant_docs: ['SRS.md'],
    }), plainJavaScriptOptions)

    expect(errors).toContain('BK-001 uses unsupported or conflicting technology/tool "Prisma".')
    expect(errors).toContain('BK-001 uses unsupported or conflicting technology/tool "Zod".')
    expect(errors).toContain('BK-001 uses unsupported or conflicting technology/tool "pnpm".')
    expect(errors).toContain('BK-001 contains an empty or placeholder acceptance criterion.')
    expect(errors).toContain('BK-001 needs a specific, verifiable definition of done.')
    expect(errors).toContain('BK-001 references unplanned or undocumented document path "SRS.md".')
  })

  it('accepts planned file paths with section citations and quoted paths', () => {
    const optionsWithArch = {
      ...plainJavaScriptOptions,
      plannedDocumentPaths: ['PRD.md', 'Agent.md', 'ARCHITECTURE.md', 'BACKLOG.md'],
    }
    for (const doc of ['Agent.md §2, §3, §6', 'ARCHITECTURE.md §1–§3', 'PRD.md §4 FR-01', '`PRD.md`']) {
      const errors = validateBacklogQuality(phase({ relevant_docs: [doc] }), optionsWithArch)
      expect(errors, doc).toEqual([])
    }
  })

  it('permits a repository path explicitly quoted in supplied documentation', () => {
    const errors = validateBacklogQuality(phase({ relevant_docs: ['src/server.js'] }), {
      ...plainJavaScriptOptions,
      sourceTexts: ['Existing application entrypoint: `src/server.js`.'],
    })

    expect(errors).toEqual([])
  })

  it('does not treat an unrelated suffix as a section citation', () => {
    const errors = validateBacklogQuality(phase({ relevant_docs: ['PRD.md.backup'] }), plainJavaScriptOptions)

    expect(errors).toContain('BK-001 references unplanned or undocumented document path "PRD.md.backup".')
  })

  it('rejects an unplanned markdown document even when it includes a section citation', () => {
    const errors = validateBacklogQuality(phase({ relevant_docs: ['SRS.md §4 FR-01'] }), plainJavaScriptOptions)

    expect(errors).toContain('BK-001 references unplanned or undocumented document path "SRS.md §4 FR-01".')
  })
})
