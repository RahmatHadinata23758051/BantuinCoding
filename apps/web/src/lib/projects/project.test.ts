import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  canTransition,
  CreateProjectSchema,
  UpdateProjectSchema,
} from '@/lib/projects/project-service'
import type { ProjectStatus } from '@repo/types'

// ============================================================
// Mock DB for project operations
// ============================================================

vi.mock('@/lib/byok/session-store', () => ({
  hasProviderSession: vi.fn(() => true),
}))

vi.mock('@repo/db', () => ({
  db: {
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('Project State Machine — allowed transitions', () => {
  it('DRAFT can transition to CONFIGURED', () => {
    expect(canTransition('DRAFT', 'CONFIGURED')).toBe(true)
  })

  it('DRAFT CANNOT transition to READY or EXPORTABLE directly', () => {
    expect(canTransition('DRAFT', 'READY')).toBe(false)
    expect(canTransition('DRAFT', 'EXPORTABLE')).toBe(false)
  })

  it('CONFIGURED can transition to ANALYZING or back to DRAFT', () => {
    expect(canTransition('CONFIGURED', 'ANALYZING')).toBe(true)
    expect(canTransition('CONFIGURED', 'DRAFT')).toBe(true)
  })

  it('ANALYZING can transition to CLARIFYING or CONTEXT_READY', () => {
    expect(canTransition('ANALYZING', 'CLARIFYING')).toBe(true)
    expect(canTransition('ANALYZING', 'CONTEXT_READY')).toBe(true)
    expect(canTransition('ANALYZING', 'GENERATION_FAILED')).toBe(true)
  })

  it('CLARIFYING can transition to CONTEXT_READY', () => {
    expect(canTransition('CLARIFYING', 'CONTEXT_READY')).toBe(true)
  })

  it('CONTEXT_READY can transition to GENERATING', () => {
    expect(canTransition('CONTEXT_READY', 'GENERATING')).toBe(true)
  })

  it('GENERATING can transition to READY or GENERATION_FAILED', () => {
    expect(canTransition('GENERATING', 'READY')).toBe(true)
    expect(canTransition('GENERATING', 'GENERATION_FAILED')).toBe(true)
  })

  it('READY can transition to EXPORTABLE', () => {
    expect(canTransition('READY', 'EXPORTABLE')).toBe(true)
  })

  it('GENERATION_FAILED can recover to CONFIGURED or ANALYZING', () => {
    expect(canTransition('GENERATION_FAILED', 'CONFIGURED')).toBe(true)
    expect(canTransition('GENERATION_FAILED', 'ANALYZING')).toBe(true)
  })
})

describe('CreateProjectSchema', () => {
  it('accepts valid project input', () => {
    const input = {
      name: 'Acme SaaS',
      rawIdea: 'A complete multi-tenant SaaS application for issue tracking with AI.',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
    }
    const result = CreateProjectSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects short name (<2 chars)', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'A',
      rawIdea: 'Valid idea text over 10 chars long',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short rawIdea (<10 chars)', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Valid Name',
      rawIdea: 'Short',
    })
    expect(result.success).toBe(false)
  })

  it('defaults classification to OTHER if omitted', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Valid Name',
      rawIdea: 'Valid raw idea description over 10 characters',
    })
    expect(result.success).toBe(true)
    expect(result.data?.classification).toBe('OTHER')
  })

  it('defaults targetAgent to CLAUDE_CODE if omitted', () => {
    const result = CreateProjectSchema.safeParse({
      name: 'Valid Name',
      rawIdea: 'Valid raw idea description over 10 characters',
    })
    expect(result.success).toBe(true)
    expect(result.data?.targetAgent).toBe('CLAUDE_CODE')
  })
})

describe('UpdateProjectSchema', () => {
  it('allows partial updates', () => {
    const result = UpdateProjectSchema.safeParse({ name: 'New Name Only' })
    expect(result.success).toBe(true)
  })

  it('strips status updates from the public update contract', () => {
    const statuses: ProjectStatus[] = [
      'DRAFT',
      'CONFIGURED',
      'ANALYZING',
      'CLARIFYING',
      'CONTEXT_READY',
      'GENERATING',
      'READY',
      'EXPORTABLE',
      'GENERATION_FAILED',
    ]
    for (const status of statuses) {
      const result = UpdateProjectSchema.safeParse({ status })
      expect(result.success).toBe(true)
      expect(result.data).not.toHaveProperty('status')
    }
  })

  it('strips unknown fields from public project updates', () => {
    const result = UpdateProjectSchema.safeParse({ status: 'INVALID_STATUS' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({})
  })
})

describe('Project CRUD logic — db interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createProject sets initial status to DRAFT', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.create).mockResolvedValueOnce({
      id: 'proj-1',
      userId: 'user-1',
      name: 'Test Project',
      rawIdea: 'Valid description text long enough',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { createProject } = await import('@/lib/projects/project-service')
    const result = await createProject('user-1', {
      name: 'Test Project',
      rawIdea: 'Valid description text long enough',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
    })

    expect(result.status).toBe('DRAFT')
    expect(db.project.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        name: 'Test Project',
        rawIdea: 'Valid description text long enough',
        classification: 'SAAS',
        targetAgent: 'CLAUDE_CODE',
        status: 'DRAFT',
      },
    })
  })

  it('rejects workflow actions from invalid project states', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'proj-1',
      status: 'DRAFT',
    } as never)

    const { requireProjectAction } = await import('@/lib/projects/project-service')
    await expect(
      requireProjectAction('user-1', 'proj-1', 'EXPORT'),
    ).rejects.toThrow('Project state DRAFT does not allow export')
  })

  it('allows workflow actions from explicitly permitted states', async () => {
    const { db } = await import('@repo/db')
    const { hasProviderSession } = await import('@/lib/byok/session-store')
    vi.mocked(hasProviderSession).mockReturnValueOnce(true)
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'proj-1',
      status: 'CONTEXT_READY',
    } as never)

    const { requireProjectAction } = await import('@/lib/projects/project-service')
    await expect(
      requireProjectAction('user-1', 'proj-1', 'GENERATE'),
    ).resolves.toMatchObject({ id: 'proj-1', status: 'CONTEXT_READY' })
  })

  it('blocks AI-backed actions when the provider session is missing or expired', async () => {
    const { db } = await import('@repo/db')
    const { hasProviderSession } = await import('@/lib/byok/session-store')
    vi.mocked(hasProviderSession).mockReturnValueOnce(false)
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'proj-1',
      status: 'CONTEXT_READY',
    } as never)

    const { requireProjectAction } = await import('@/lib/projects/project-service')
    await expect(
      requireProjectAction('user-1', 'proj-1', 'GENERATE'),
    ).rejects.toThrow('No active AI provider session found')
  })

  it('updateProject throws on illegal status transition', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'proj-1',
      userId: 'user-1',
      name: 'Test Project',
      rawIdea: 'Valid idea text',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { updateProject } = await import('@/lib/projects/project-service')
    await expect(
      updateProject('user-1', 'proj-1', { status: 'READY' }),
    ).rejects.toThrow('Invalid status transition from DRAFT to READY')
  })
})
