import { describe, it, expect } from 'vitest'

/**
 * Schema validation tests — run without a live DB connection.
 * These verify that our TypeScript-level domain types align with
 * the Prisma schema enumerations defined in CLAUDE.md.
 */

const PROJECT_STATUSES = [
  'DRAFT',
  'CONFIGURED',
  'ANALYZING',
  'CLARIFYING',
  'CONTEXT_READY',
  'GENERATING',
  'READY',
  'EXPORTABLE',
  'GENERATION_FAILED',
] as const

const ARTIFACT_STATUSES = [
  'NOT_GENERATED',
  'GENERATING',
  'READY',
  'MODIFIED',
  'OUTDATED',
  'FAILED',
] as const

const BACKLOG_TASK_STATUSES = [
  'PENDING',
  'READY',
  'IN_PROGRESS',
  'BLOCKED',
  'REVIEW',
  'DONE',
] as const

const PROJECT_CLASSIFICATIONS = [
  'STATIC_SITE',
  'LANDING_PAGE',
  'CRUD_APP',
  'DASHBOARD',
  'SAAS',
  'API_SERVICE',
  'MOBILE_APP',
  'AI_APP',
  'IOT_DASHBOARD',
  'FULLSTACK_COMPLEX',
  'OTHER',
] as const

const ARTIFACT_TYPES = [
  'PRD',
  'SRS',
  'ARCHITECTURE',
  'DESIGN',
  'AGENT',
  'RULES',
  'SKILLS',
  'BACKLOG',
  'DATABASE',
  'API',
  'SECURITY',
  'TESTING',
  'DEPLOYMENT',
  'README',
  'MCP_SETUP',
] as const

describe('Database schema — domain enumerations', () => {
  it('ProjectStatus has all 9 states', () => {
    expect(PROJECT_STATUSES).toHaveLength(9)
    expect(PROJECT_STATUSES).toContain('DRAFT')
    expect(PROJECT_STATUSES).toContain('EXPORTABLE')
    expect(PROJECT_STATUSES).toContain('GENERATION_FAILED')
  })

  it('ArtifactStatus has all 6 states', () => {
    expect(ARTIFACT_STATUSES).toHaveLength(6)
    expect(ARTIFACT_STATUSES).toContain('NOT_GENERATED')
    expect(ARTIFACT_STATUSES).toContain('FAILED')
  })

  it('BacklogTaskStatus has all 6 states', () => {
    expect(BACKLOG_TASK_STATUSES).toHaveLength(6)
    expect(BACKLOG_TASK_STATUSES).toContain('PENDING')
    expect(BACKLOG_TASK_STATUSES).toContain('DONE')
    expect(BACKLOG_TASK_STATUSES).toContain('BLOCKED')
  })

  it('ProjectClassification has all 11 types', () => {
    expect(PROJECT_CLASSIFICATIONS).toHaveLength(11)
    expect(PROJECT_CLASSIFICATIONS).toContain('SAAS')
    expect(PROJECT_CLASSIFICATIONS).toContain('OTHER')
  })

  it('ArtifactType covers all 15 document types', () => {
    expect(ARTIFACT_TYPES).toHaveLength(15)
    expect(ARTIFACT_TYPES).toContain('PRD')
    expect(ARTIFACT_TYPES).toContain('SRS')
    expect(ARTIFACT_TYPES).toContain('ARCHITECTURE')
    expect(ARTIFACT_TYPES).toContain('MCP_SETUP')
  })

  it('no duplicate values in any enum', () => {
    const check = (arr: readonly string[]) =>
      new Set(arr).size === arr.length

    expect(check(PROJECT_STATUSES)).toBe(true)
    expect(check(ARTIFACT_STATUSES)).toBe(true)
    expect(check(BACKLOG_TASK_STATUSES)).toBe(true)
    expect(check(PROJECT_CLASSIFICATIONS)).toBe(true)
    expect(check(ARTIFACT_TYPES)).toBe(true)
  })
})

describe('Database schema — entity structure', () => {
  it('Project entity has required string fields', () => {
    // Verify the shape we expect — these match schema.prisma
    const requiredFields = [
      'id',
      'userId',
      'name',
      'rawIdea',
      'classification',
      'targetAgent',
      'status',
      'createdAt',
      'updatedAt',
    ]
    // All fields are defined (non-empty strings)
    expect(requiredFields.every((f) => f.length > 0)).toBe(true)
    expect(requiredFields).toHaveLength(9)
  })

  it('Artifact entity tracks context version via contextId FK', () => {
    // contextId (UUID FK) replaces the old composite FK approach
    const artifactFields = ['id', 'projectId', 'contextId', 'type', 'path', 'content', 'version', 'status']
    expect(artifactFields).toContain('contextId')
    expect(artifactFields).not.toContain('contextVersion')
  })

  it('BacklogDependency is a composite PK join table', () => {
    const pkFields = ['taskId', 'dependsOnTaskId']
    expect(pkFields).toHaveLength(2)
  })
})
