import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  classifyProject: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/projects/classifier-service', () => ({
  classifyProject: mocks.classifyProject,
}))

import { POST } from './route'

const params = { params: Promise.resolve({ id: 'project-1' }) }
const postRequest = () =>
  new NextRequest('http://localhost/api/projects/project-1/classify', {
    method: 'POST',
  })

describe('POST /api/projects/[id]/classify route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('rejects unauthenticated requests with 401', async () => {
    mocks.auth.mockResolvedValue(null)
    const response = await POST(postRequest(), params)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(mocks.classifyProject).not.toHaveBeenCalled()
  })

  it('returns 404 when project is not found or not owned by user', async () => {
    mocks.classifyProject.mockResolvedValueOnce({
      status: 'FAILED',
      classification: 'OTHER',
      error: 'PROJECT_NOT_FOUND',
    })

    const response = await POST(postRequest(), params)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Project not found' })
    expect(mocks.classifyProject).toHaveBeenCalledWith({
      userId: 'user-1',
      projectId: 'project-1',
    })
  })

  it('returns classification result on success', async () => {
    mocks.classifyProject.mockResolvedValueOnce({
      status: 'READY',
      classification: 'SAAS',
    })

    const response = await POST(postRequest(), params)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: 'READY',
      classification: 'SAAS',
    })
  })

  it('returns safe error code without exposing secrets when classification fails', async () => {
    mocks.classifyProject.mockResolvedValueOnce({
      status: 'FAILED',
      classification: 'OTHER',
      error: 'NO_ACTIVE_PROVIDER',
    })

    const response = await POST(postRequest(), params)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: 'FAILED',
      classification: 'OTHER',
      error: 'NO_ACTIVE_PROVIDER',
    })
  })
})
