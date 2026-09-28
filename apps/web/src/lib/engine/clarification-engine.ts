import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  CLARIFICATION_GENERATOR_SYSTEM_PROMPT,
  ClarificationRoundSchema,
  buildClarificationUserPrompt,
  type ClarificationRoundResult,
} from '@/lib/prompts/clarification-generator'
import { getCurrentRequirementAnalysis } from '@/lib/engine/analysis-store'
import { updateProject } from '@/lib/projects/project-service'

export const ASSUMPTION_CONFIRMATION_QUESTION =
  'Confirm that unresolved items may proceed as explicit assumptions?'
export const ASSUMPTION_CONFIRMATION_ACCEPTED = 'Proceed with explicit assumptions'

export interface GenerateClarificationsOptions {
  userId: string
  projectId: string
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
}: GenerateClarificationsOptions): Promise<ClarificationRoundResult> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: { clarificationQuestions: true },
  })
  if (!project) throw new Error('Project not found')

  // Calculate current round only after all prior questions are answered.
  const existingQuestions = project.clarificationQuestions
  const pendingQuestions = existingQuestions.filter((q) => q.status === 'PENDING')
  if (pendingQuestions.length > 0) {
    throw new Error('Answer pending clarification questions before generating a new round.')
  }

  const currentAnalysis = await getCurrentRequirementAnalysis(projectId)
  if (!currentAnalysis) {
    throw new Error('Requirement analysis is required before generating clarifications.')
  }

  const currentRound =
    existingQuestions.length > 0
      ? Math.max(...existingQuestions.map((q) => q.round)) + 1
      : 1

  // Max 3 rounds of clarification. Reaching the limit is not the same as
  // sufficient context: the user must explicitly confirm unresolved assumptions
  // before context generation may continue.
  if (currentRound > 3) {
    const assumptionQuestion = {
      question: ASSUMPTION_CONFIRMATION_QUESTION,
      impact: 'Unresolved high-impact decisions will remain marked as assumptions or unknowns in the canonical context.',
      suggested_options: [ASSUMPTION_CONFIRMATION_ACCEPTED, 'Do not proceed'],
    }

    await db.$transaction(async (tx) => {
      const pendingCount = await tx.clarificationQuestion.count({
        where: { projectId, status: 'PENDING' },
      })
      if (pendingCount > 0) {
        throw new Error('Answer pending clarification questions before generating a new round.')
      }
      await tx.clarificationQuestion.createMany({
        data: [{
          projectId,
          round: currentRound,
          question: assumptionQuestion.question,
          impact: assumptionQuestion.impact,
          status: 'PENDING',
        }],
      })
    }, { isolationLevel: 'Serializable' })

    return { questions: [assumptionQuestion], is_context_sufficient: false }
  }

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found.')
  }

  // Format previous Q&A for prompt
  const answeredPrevious = existingQuestions
    .filter((q) => q.status === 'ANSWERED')
    .map((q) => ({ question: q.question, answer: q.answer }))

  const provider = createProvider(providerConfig)
  const userPrompt = buildClarificationUserPrompt(
    project.name,
    project.rawIdea,
    JSON.stringify(currentAnalysis.analysis),
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

  // Persist a round atomically. The in-transaction guards make competing
  // requests deterministic: only one request may create the next round.
  if (!result.is_context_sufficient && result.questions.length > 0) {
    await db.$transaction(async (tx) => {
      const pendingCount = await tx.clarificationQuestion.count({
        where: { projectId, status: 'PENDING' },
      })
      if (pendingCount > 0) {
        throw new Error('Answer pending clarification questions before generating a new round.')
      }

      const latest = await tx.clarificationQuestion.findFirst({
        where: { projectId },
        orderBy: { round: 'desc' },
        select: { round: true },
      })
      const transactionRound = (latest?.round ?? 0) + 1
      if (transactionRound > 3) {
        throw new Error(
          'Clarification round limit reached. Confirm unresolved items as explicit assumptions before generating context.',
        )
      }

      await tx.clarificationQuestion.createMany({
        data: result.questions.map((q) => ({
          projectId,
          round: transactionRound,
          question: q.question,
          impact: q.impact,
          status: 'PENDING',
        })),
      })
    }, { isolationLevel: 'Serializable' })
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

  const uniqueQuestionIds = new Set(answers.map((item) => item.questionId))
  if (uniqueQuestionIds.size !== answers.length) {
    throw new Error('Duplicate clarification question IDs are not allowed.')
  }

  const pendingQuestions = await db.clarificationQuestion.findMany({
    where: {
      projectId,
      id: { in: [...uniqueQuestionIds] },
      status: 'PENDING',
    },
    select: { id: true },
  })
  if (pendingQuestions.length !== answers.length) {
    throw new Error('One or more clarification questions are invalid or already answered.')
  }

  return db.$transaction(async (tx) => {
    for (const item of answers) {
      const updated = await tx.clarificationQuestion.updateMany({
        where: {
          id: item.questionId,
          projectId,
          status: 'PENDING',
        },
        data: {
          answer: item.answer,
          status: 'ANSWERED',
        },
      })
      if (updated.count !== 1) {
        throw new Error('One or more clarification questions are invalid or already answered.')
      }
    }

    const remainingPending = await tx.clarificationQuestion.count({
      where: { projectId, status: 'PENDING' },
    })

    return {
      allAnswered: remainingPending === 0,
      remainingPending,
    }
  }, { isolationLevel: 'Serializable' })
}
