import { describe, it, expect, vi, beforeEach } from 'vitest'
import { classifyProject } from '@/lib/projects/classifier-service'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
  },
}))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
  restoreProviderSession: vi.fn(async () => null),
}))

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

describe('Project Classifier Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns PROJECT_NOT_FOUND if project does not exist for the user', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    const result = await classifyProject({
      userId: 'user-1',
      projectId: 'project-missing',
    })

    expect(result).toEqual({
      status: 'FAILED',
      classification: 'OTHER',
      error: 'PROJECT_NOT_FOUND',
    })
    expect(db.project.updateMany).not.toHaveBeenCalled()
  })

  it('marks FAILED with NO_ACTIVE_PROVIDER if user has no configured key', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig, restoreProviderSession } = await import(
      '@/lib/byok/session-store'
    )

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'proj-1',
      name: 'Telegram Bot',
      rawIdea: 'A Telegram bot to track daily expenses.',
      classification: 'OTHER',
      classificationAttempt: 0,
      language: 'id',
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)
    vi.mocked(restoreProviderSession).mockResolvedValueOnce(null)

    const result = await classifyProject({
      userId: 'user-1',
      projectId: 'proj-1',
    })

    expect(result).toEqual({
      status: 'FAILED',
      classification: 'OTHER',
      error: 'NO_ACTIVE_PROVIDER',
    })

    expect(db.project.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'proj-1',
        userId: 'user-1',
        classificationAttempt: 1,
      },
      data: {
        classificationStatus: 'FAILED',
        classificationError: 'NO_ACTIVE_PROVIDER',
      },
    })
  })

  it('successfully classifies project into supported archetype', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'proj-1',
      name: 'Invoice Dashboard',
      rawIdea: 'Analytics portal with real-time metrics and charts.',
      classification: 'OTHER',
      classificationAttempt: 2,
      language: 'en',
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-3-7-sonnet',
      apiKey: 'sk-test',
    })

    const mockGenerate = vi.fn().mockResolvedValueOnce({
      classification: 'DASHBOARD',
      confidence: 'high',
      reasoning: 'Analytics portal with charts',
    })

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: mockGenerate,
    })

    const result = await classifyProject({
      userId: 'user-1',
      projectId: 'proj-1',
    })

    expect(result).toEqual({
      status: 'READY',
      classification: 'DASHBOARD',
    })

    expect(db.project.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'proj-1',
        userId: 'user-1',
        classificationAttempt: 3,
      },
      data: {
        classification: 'DASHBOARD',
        classificationStatus: 'READY',
        classificationError: null,
      },
    })
  })

  it('handles provider error safely without throwing or changing project workflow status', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'proj-1',
      name: 'Broken Idea',
      rawIdea: 'Valid length text here for idea',
      classification: 'OTHER',
      classificationAttempt: 0,
      language: 'id',
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'OPENAI',
      model: 'gpt-4o',
      apiKey: 'sk-secret-key-must-not-leak',
    })

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'OPENAI',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockRejectedValue(new Error('Rate limit exceeded: sk-secret-key-must-not-leak')),
    })

    const result = await classifyProject({
      userId: 'user-1',
      projectId: 'proj-1',
    })

    expect(result).toEqual({
      status: 'FAILED',
      classification: 'OTHER',
      error: 'CLASSIFICATION_FAILED',
    })

    // Confirms error stored in database is safe code, not raw error message or secret
    expect(db.project.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'proj-1',
        userId: 'user-1',
        classificationAttempt: 1,
      },
      data: {
        classificationStatus: 'FAILED',
        classificationError: 'CLASSIFICATION_FAILED',
      },
    })
  })

  it('safely handles non-standard model responses by falling back to OTHER', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'proj-1',
      name: 'Unusual Tool',
      rawIdea: 'A browser plugin and cli for monitoring web sockets.',
      classification: 'OTHER',
      classificationAttempt: 1,
      language: 'en',
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-3-7-sonnet',
      apiKey: 'sk-test',
    })

    // Suppose model generated a string that is not in the supported enum
    const mockGenerate = vi.fn().mockResolvedValueOnce({
      classification: 'UNKNOWN_CUSTOM_TYPE' as never,
    })

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: mockGenerate,
    })

    const result = await classifyProject({
      userId: 'user-1',
      projectId: 'proj-1',
    })

    expect(result).toEqual({
      status: 'READY',
      classification: 'OTHER',
    })

    expect(db.project.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'proj-1',
        userId: 'user-1',
        classificationAttempt: 2,
      },
      data: {
        classification: 'OTHER',
        classificationStatus: 'READY',
        classificationError: null,
      },
    })
  })
})
