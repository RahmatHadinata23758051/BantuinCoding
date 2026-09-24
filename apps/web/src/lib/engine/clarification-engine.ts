import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  CLARIFICATION_GENERATOR_SYSTEM_PROMPT,
  ClarificationRoundSchema,
  buildClarificationUserPrompt,
  type ClarificationRoundResult,
} from '@/lib/prompts/clarification-generator'
import { updateProject } from '@/lib/projects/project-service'
import type { RequirementAnalysisResult } from '@/lib/prompts/requirement-analyzer'

export interface GenerateClarificationsOptions {
  userId: string
  projectId: string
  analysis: RequirementAnalysisResult
}

export interface AnswerClarificationsOptions {
  userId: string
  projectId: string
  answers: Array<{
    questionId: string
    answer: string
  }>
}

/**
 * Generate next round of clarification questions using BYOK provider.
 * Updates project status to CLARIFYING.
 */
export async function generateClarificationRound({
  userId,
  projectId,
  analysis,
}: GenerateClarificationsOptions): Promise<ClarificationRoundResult> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: { clarificationQuestions: true },
  })
  if (!project) throw new Error('Project not found')

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found.')
  }

  // Calculate current round
  const existingQuestions = project.clarificationQuestions
  const currentRound =
    existingQuestions.length > 0
      ? Math.max(...existingQuestions.map((q) => q.round)) + 1
      : 1

  // Max 3 rounds of clarification
  if (currentRound > 3) {
    await updateProject(userId, projectId, { status: 'CONTEXT_READY' })
    return { questions: [], is_context_sufficient: true }
  }

  // Format previous Q&A for prompt
  const answeredPrevious = existingQuestions
    .filter((q) => q.status === 'ANSWERED')
    .map((q) => ({ question: q.question, answer: q.answer }))

  const provider = createProvider(providerConfig)
  const userPrompt = buildClarificationUserPrompt(
    project.name,
    project.rawIdea,
    JSON.stringify(analysis),
    JSON.stringify(answeredPrevious),
    currentRound,
  )

  // Transition status to CLARIFYING
  await updateProject(userId, projectId, { status: 'CLARIFYING' })

  const result = await provider.generateStructured(
    userPrompt,
    ClarificationRoundSchema,
    {
      system: CLARIFICATION_GENERATOR_SYSTEM_PROMPT,
      maxTokens: 4096,
      temperature: 0.3,
    },
  )

  // Persist generated questions in DB
  if (result.questions.length > 0) {
    await db.clarificationQuestion.createMany({
      data: result.questions.map((q) => ({
        projectId,
        round: currentRound,
        question: q.question,
        impact: q.impact,
        status: 'PENDING',
      })),
    })
  }

  if (result.is_context_sufficient || result.questions.length === 0) {
    await updateProject(userId, projectId, { status: 'CONTEXT_READY' })
  }

  return result
}

/**
 * Submit answers for pending clarification questions.
 */
export async function submitClarificationAnswers({
  userId,
  projectId,
  answers,
}: AnswerClarificationsOptions) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  })
  if (!project) throw new Error('Project not found')

  // Update each answered question
  for (const item of answers) {
    await db.clarificationQuestion.updateMany({
      where: { id: item.questionId, projectId },
      data: {
        answer: item.answer,
        status: 'ANSWERED',
      },
    })
  }

  // Check if all questions are answered
  const remainingPending = await db.clarificationQuestion.count({
    where: { projectId, status: 'PENDING' },
  })

  return {
    allAnswered: remainingPending === 0,
    remainingPending,
  }
}
