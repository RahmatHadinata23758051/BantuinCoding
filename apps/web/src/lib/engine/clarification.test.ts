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
      updateMany: vi.fn(),
      count: vi.fn(),
    },
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
        { question: 'Q1 text here?', impact: 'Impact 1' },
        { question: 'Q2 text here?', impact: 'Impact 2' },
        { question: 'Q3 text here?', impact: 'Impact 3' },
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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      generateClarificationRound({
        userId: 'u-1',
        projectId: 'p-invalid',
        analysis: {
          known_facts: [],
          missing_information: [],
          ambiguities: [],
          important_decisions: [],
          optional_decisions: [],
          risk_flags: [],
        },
      }),
    ).rejects.toThrow('Project not found')
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
      analysis: {
        known_facts: [],
        missing_information: [],
        ambiguities: [],
        important_decisions: [],
        optional_decisions: [],
        risk_flags: [],
      },
    })

    expect(updateProject).toHaveBeenCalledWith('u-1', 'p-1', { status: 'CLARIFYING' })
    expect(db.clarificationQuestion.createMany).toHaveBeenCalled()
    expect(result.questions).toHaveLength(1)
  })

  it('transitions to CONTEXT_READY if is_context_sufficient is true', async () => {
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

    await generateClarificationRound({
      userId: 'u-1',
      projectId: 'p-1',
      analysis: {
        known_facts: [],
        missing_information: [],
        ambiguities: [],
        important_decisions: [],
        optional_decisions: [],
        risk_flags: [],
      },
    })

    expect(updateProject).toHaveBeenCalledWith('u-1', 'p-1', { status: 'CONTEXT_READY' })
  })
})

describe('Clarification Engine — submitClarificationAnswers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(db.clarificationQuestion.count).mockResolvedValueOnce(0)

    const result = await submitClarificationAnswers({
      userId: 'u-1',
      projectId: 'p-1',
      answers: [{ questionId: 'q-1', answer: 'PostgreSQL' }],
    })

    expect(db.clarificationQuestion.updateMany).toHaveBeenCalledWith({
      where: { id: 'q-1', projectId: 'p-1' },
      data: { answer: 'PostgreSQL', status: 'ANSWERED' },
    })
    expect(result.allAnswered).toBe(true)
  })
})
