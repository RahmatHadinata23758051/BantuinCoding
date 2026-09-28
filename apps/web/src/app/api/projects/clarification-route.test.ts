import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  projectFindFirst: vi.fn(),
  questionFindMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@repo/db', () => ({
  db: {
    project: { findFirst: mocks.projectFindFirst },
    clarificationQuestion: { findMany: mocks.questionFindMany },
  },
}))
vi.mock('@/lib/projects/project-service', () => ({ requireProjectAction: vi.fn() }))
vi.mock('@/lib/engine/clarification-engine', () => ({
  generateClarificationRound: vi.fn(),
  submitClarificationAnswers: vi.fn(),
}))

import { GET } from './[id]/clarifications/route'

const params = { params: Promise.resolve({ id: 'project-1' }) }

describe('clarification GET ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'owner-1' } })
  })

  it('returns only questions scoped to the authenticated owner project', async () => {
    mocks.projectFindFirst.mockResolvedValue({ id: 'project-1' })
    mocks.questionFindMany.mockResolvedValue([{ id: 'question-1', projectId: 'project-1' }])

    const response = await GET(
      new NextRequest('http://localhost/api/projects/project-1/clarifications'),
      params,
    )

    expect(response.status).toBe(200)
    expect(mocks.projectFindFirst).toHaveBeenCalledWith({
      where: { id: 'project-1', userId: 'owner-1' },
      select: { id: true },
    })
    expect(mocks.questionFindMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
    })
  })

  it('hides a cross-user project and does not query its questions', async () => {
    mocks.projectFindFirst.mockResolvedValue(null)

    const response = await GET(
      new NextRequest('http://localhost/api/projects/project-1/clarifications'),
      params,
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Project not found' })
    expect(mocks.questionFindMany).not.toHaveBeenCalled()
  })
})
