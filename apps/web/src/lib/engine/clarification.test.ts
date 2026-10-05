import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ClarificationRoundSchema,
  ClarificationQuestionSchema,
  buildClarificationUserPrompt,
} from '@/lib/prompts/clarification-generator'
import {
  generateClarificationRound,
  submitClarificationAnswers,
} from '@/lib/engine/clarification-engine'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    clarificationQuestion: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(async function (callbackOrOperations) {
      if (typeof callbackOrOperations === 'function') {
        const { db } = await import('@repo/db')
        return callbackOrOperations({ clarificationQuestion: db.clarificationQuestion })
      }
      return Promise.all(callbackOrOperations)
    }),
  },
}))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

vi.mock('@/lib/projects/project-service', () => ({
  updateProject: vi.fn(),
}))

vi.mock('@/lib/engine/analysis-store', () => ({
  getCurrentRequirementAnalysis: vi.fn(),
}))

describe('Clarification Generator Schemas', () => {
  it('validates a correct question object', () => {
    const q = {
      question: 'Which auth provider do you want to use?',
      impact: 'Determines whether we set up OAuth, NextAuth, or Supabase Auth',
      suggested_options: ['NextAuth (Auth.js)', 'Supabase Auth', 'Clerk'],
    }
    const result = ClarificationQuestionSchema.safeParse(q)
    expect(result.success).toBe(true)
  })

  it('validates a round with 3-7 questions', () => {
    const round = {
      questions: [
        { question: 'Q1 text here?', impact: 'Impact 1', suggested_options: ['A', 'B'] },
        { question: 'Q2 text here?', impact: 'Impact 2', suggested_options: ['A', 'B'] },
        { question: 'Q3 text here?', impact: 'Impact 3', suggested_options: ['A', 'B'] },
      ],
      is_context_sufficient: false,
    }
    const result = ClarificationRoundSchema.safeParse(round)
    expect(result.success).toBe(true)
  })

  it('rejects round with 0 questions', () => {
    const round = {
      questions: [],
      is_context_sufficient: false,
    }
    const result = ClarificationRoundSchema.safeParse(round)
    expect(result.success).toBe(false)
  })
})

describe('Clarification Prompt Builder', () => {
  it('builds prompt with project details and round number', () => {
    const prompt = buildClarificationUserPrompt(
      'Acme SaaS',
      'Raw idea text',
      '{"known_facts":[]}',
      '[]',
      1,
    )
    expect(prompt).toContain('Project: Acme SaaS')
    expect(prompt).toContain('Round: 1')
    expect(prompt).toContain('DO NOT REPEAT')
  })
})

describe('Clarification Engine — generateClarificationRound', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { getCurrentRequirementAnalysis } = await import('@/lib/engine/analysis-store')
    vi.mocked(getCurrentRequirementAnalysis).mockResolvedValue({
      id: 'analysis-1',
      version: 1,
      analysis: {
        known_facts: [],
        missing_information: [],
        ambiguities: [],
        important_decisions: [],
        optional_decisions: [],
        risk_flags: [],
      },
      createdAt: new Date(),
    })
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      generateClarificationRound({
        userId: 'u-1',
        projectId: 'p-invalid',
      }),
    ).rejects.toThrow('Project not found')
  })

  it('rejects a new round while prior questions are still pending', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      rawIdea: 'Test idea description text',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'CLARIFYING',
      language: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      clarificationQuestions: [
        {
          id: 'q-1',
          projectId: 'p-1',
          round: 1,
          question: 'Which database should be used?',
          answer: null,
          impact: 'Determines the persistence architecture',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    } as never)

    await expect(
      generateClarificationRound({
        userId: 'u-1',
        projectId: 'p-1',
      }),
    ).rejects.toThrow('Answer pending clarification questions before generating a new round.')

    expect(getProviderConfig).not.toHaveBeenCalled()
    expect(createProvider).not.toHaveBeenCalled()
    expect(db.clarificationQuestion.createMany).not.toHaveBeenCalled()
  })

  it('requires explicit assumption confirmation after the round limit', async () => {
    const { db } = await import('@repo/db')
    const { createProvider } = await import('@/lib/ai/provider')
    const { updateProject } = await import('@/lib/projects/project-service')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test', rawIdea: 'Idea',
      clarificationQuestions: [1, 2, 3].map((round) => ({
        id: `q-${round}`, round, status: 'ANSWERED', question: `Q${round}`, answer: 'A',
      })),
    } as never)

    vi.mocked(db.clarificationQuestion.count).mockResolvedValueOnce(0)
    const result = await generateClarificationRound({ userId: 'u-1', projectId: 'p-1' })

    expect(result.is_context_sufficient).toBe(false)
    expect(result.questions[0]?.question).toContain('explicit assumptions')
    expect(createProvider).not.toHaveBeenCalled()
    expect(db.clarificationQuestion.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ projectId: 'p-1', round: 4, status: 'PENDING' })],
    })
    expect(updateProject).not.toHaveBeenCalledWith('u-1', 'p-1', { status: 'CONTEXT_READY' })
  })

  it('transitions project status to CLARIFYING and saves questions', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    const { updateProject } = await import('@/lib/projects/project-service')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      rawIdea: 'Test idea description text',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'ANALYZING',
      language: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      clarificationQuestions: [],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const mockGenerate = vi.fn().mockResolvedValueOnce({
      questions: [
        { question: 'What database do you prefer?', impact: 'Sets up Prisma schema' },
      ],
      is_context_sufficient: false,
    })

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: mockGenerate,
    })

    const result = await generateClarificationRound({
      userId: 'u-1',
      projectId: 'p-1',
    })

    expect(updateProject).toHaveBeenCalledWith('u-1', 'p-1', { status: 'CLARIFYING' })
    expect(db.clarificationQuestion.createMany).toHaveBeenCalled()
    expect(mockGenerate.mock.calls[0]?.[0]).toContain('"known_facts":[]')
    expect(result.questions).toHaveLength(1)
  })

  it('does not mark context ready until the context snapshot is persisted', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    const { updateProject } = await import('@/lib/projects/project-service')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      rawIdea: 'Detailed raw idea description',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'CLARIFYING',
      language: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
      clarificationQuestions: [],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValueOnce({
        questions: [{ question: 'Final check question?', impact: 'Finalizing' }],
        is_context_sufficient: true,
      }),
    })

    const result = await generateClarificationRound({
      userId: 'u-1',
      projectId: 'p-1',
    })

    expect(result.is_context_sufficient).toBe(true)
    expect(updateProject).toHaveBeenCalledWith('u-1', 'p-1', { status: 'CLARIFYING' })
    expect(updateProject).not.toHaveBeenCalledWith('u-1', 'p-1', { status: 'CONTEXT_READY' })
  })
})

describe('Clarification Engine — submitClarificationAnswers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects duplicated answer question IDs before updating', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1' } as never)

    await expect(submitClarificationAnswers({
      userId: 'u-1', projectId: 'p-1',
      answers: [
        { questionId: 'q-1', answer: 'A' },
        { questionId: 'q-1', answer: 'B' },
      ],
    })).rejects.toThrow('Duplicate clarification question IDs are not allowed.')
    expect(db.clarificationQuestion.updateMany).not.toHaveBeenCalled()
  })

  it('rejects already answered or cross-project question IDs', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1' } as never)
    vi.mocked(db.clarificationQuestion.findMany).mockResolvedValueOnce([] as never)

    await expect(submitClarificationAnswers({
      userId: 'u-1', projectId: 'p-1',
      answers: [{ questionId: 'q-other', answer: 'A' }],
    })).rejects.toThrow('One or more clarification questions are invalid or already answered.')
    expect(db.clarificationQuestion.updateMany).not.toHaveBeenCalled()
  })

  it('updates answers and returns allAnswered status', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      rawIdea: 'Test idea text',
      classification: 'SAAS',
      targetAgent: 'CLAUDE_CODE',
      status: 'CLARIFYING',
      language: 'id',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(db.clarificationQuestion.findMany).mockResolvedValueOnce([{ id: 'q-1' }] as never)
    vi.mocked(db.clarificationQuestion.updateMany).mockResolvedValueOnce({ count: 1 })
    vi.mocked(db.clarificationQuestion.count).mockResolvedValueOnce(0)

    const result = await submitClarificationAnswers({
      userId: 'u-1',
      projectId: 'p-1',
      answers: [{ questionId: 'q-1', answer: 'PostgreSQL' }],
    })

    expect(db.clarificationQuestion.updateMany).toHaveBeenCalledWith({
      where: { id: 'q-1', projectId: 'p-1', status: 'PENDING' },
      data: { answer: 'PostgreSQL', status: 'ANSWERED' },
    })
    expect(result.allAnswered).toBe(true)
  })
})
