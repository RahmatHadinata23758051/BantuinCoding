import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createProject: vi.fn(),
  getUserProjects: vi.fn(),
  classifyProject: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/projects/project-service', () => ({
  createProject: mocks.createProject,
  getUserProjects: mocks.getUserProjects,
  CreateProjectSchema: {
    safeParse: (data: unknown) => {
      const obj = data as Record<string, unknown>
      if (!obj || typeof obj.name !== 'string' || obj.name.length < 2) {
        return { success: false, error: { issues: [{ message: 'Invalid name' }] } }
      }
      if (typeof obj.rawIdea !== 'string' || obj.rawIdea.length < 10) {
        return { success: false, error: { issues: [{ message: 'Idea text must be at least 10 characters' }] } }
      }
      return {
        success: true,
        data: {
          name: obj.name,
          rawIdea: obj.rawIdea,
          targetAgent: obj.targetAgent ?? 'OTHER',
          language: obj.language ?? 'id',
        },
      }
    },
  },
}))

const afterPromises: Promise<unknown>[] = []

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: vi.fn((fn: () => Promise<unknown> | unknown) => {
      afterPromises.push(Promise.resolve(fn()))
    }),
  }
})

vi.mock('@/lib/projects/classifier-service', () => ({
  classifyProject: mocks.classifyProject,
}))

import { GET, POST } from './route'

const createRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/projects', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })

describe('POST /api/projects route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    afterPromises.length = 0
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('rejects unauthenticated request with 401', async () => {
    mocks.auth.mockResolvedValue(null)
    const response = await POST(createRequest({ name: 'Valid Project', rawIdea: 'Valid idea text long enough' }))
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(mocks.createProject).not.toHaveBeenCalled()
  })

  it('rejects invalid JSON body with 400', async () => {
    const req = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      body: 'invalid-json',
      headers: { 'content-type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid JSON body' })
  })

  it('rejects input failing schema validation with 400', async () => {
    const response = await POST(createRequest({ name: 'A', rawIdea: 'Short' }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid name' })
    expect(mocks.createProject).not.toHaveBeenCalled()
  })

  it('creates project and schedules background classification', async () => {
    mocks.createProject.mockResolvedValueOnce({
      id: 'proj-new-1',
      name: 'Telegram Bot',
      rawIdea: 'A Telegram bot for tracking expenses',
      classification: 'OTHER',
      classificationStatus: 'PENDING',
      status: 'DRAFT',
    })

    const response = await POST(
      createRequest({
        name: 'Telegram Bot',
        rawIdea: 'A Telegram bot for tracking expenses',
      }),
    )

    await Promise.all(afterPromises)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      project: expect.objectContaining({
        id: 'proj-new-1',
        name: 'Telegram Bot',
        classification: 'OTHER',
        classificationStatus: 'PENDING',
      }),
    })

    expect(mocks.createProject).toHaveBeenCalledWith('user-1', {
      name: 'Telegram Bot',
      rawIdea: 'A Telegram bot for tracking expenses',
      targetAgent: 'OTHER',
      language: 'id',
    })

    expect(mocks.classifyProject).toHaveBeenCalledWith({
      userId: 'user-1',
      projectId: 'proj-new-1',
    })
  })

  it('GET /api/projects lists user projects', async () => {
    mocks.getUserProjects.mockResolvedValueOnce([
      { id: 'proj-1', name: 'Project 1' },
    ])

    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      projects: [{ id: 'proj-1', name: 'Project 1' }],
    })
    expect(mocks.getUserProjects).toHaveBeenCalledWith('user-1')
  })
})
