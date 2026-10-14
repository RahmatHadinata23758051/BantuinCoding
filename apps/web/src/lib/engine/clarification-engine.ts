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

const clarificationGenerationInFlight = new Map<string, Promise<ClarificationRoundResult>>()

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
  // In-flight coalescing: if another request is already generating for this
  // project in this process, wait for its result instead of creating duplicate
  // work or throwing from the transaction race.
  const inFlightKey = `${userId}:${projectId}`
  const existingPromise = clarificationGenerationInFlight.get(inFlightKey)
  if (existingPromise) {
    return existingPromise
  }

  const promise = (async () => {
    try {
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

      // Max 3 rounds of clarification.
      // Under NAT-38: Skip synthetic assumption confirmation question.
      // Once clarification questions are answered up to the round limit,
      // proceed directly to canonical context generation without creating
      // synthetic confirmation questions.
      if (currentRound > 3) {
        return { questions: [], is_context_sufficient: true }
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
        project.language,
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
            throw new Error('Clarification round limit reached. Proceed to context generation.')
          }

          await tx.clarificationQuestion.createMany({
            data: result.questions.map((q) => ({
              projectId,
              round: transactionRound,
              question: q.question,
              impact: q.impact,
              options: q.suggested_options && q.suggested_options.length > 0 ? JSON.stringify(q.suggested_options) : null,
              status: 'PENDING',
            })),
          })
        }, { isolationLevel: 'Serializable' })
      }

      return result
    } finally {
      // Intentionally empty: errors propagate to outer try/finally for in-flight map cleanup
    }
  })()

  clarificationGenerationInFlight.set(inFlightKey, promise)
  try {
    return await promise
  } finally {
    clarificationGenerationInFlight.delete(inFlightKey)
  }
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

  const existingQuestions = await db.clarificationQuestion.findMany({
    where: {
      projectId,
      id: { in: [...uniqueQuestionIds] },
    },
    select: { id: true, status: true },
  })
  if (existingQuestions.length !== answers.length) {
    throw new Error('One or more clarification questions are invalid or already answered.')
  }

  // Idempotent recovery: if all submitted questions are already answered
  // (e.g. from an immediate client retry, duplicate click, or network re-post),
  // return success rather than throwing a false 400 error.
  const allAlreadyAnswered = existingQuestions.every((q) => q.status === 'ANSWERED')
  if (allAlreadyAnswered) {
    const remainingPending = await db.clarificationQuestion.count({
      where: { projectId, status: 'PENDING' },
    })
    return {
      allAnswered: remainingPending === 0,
      remainingPending,
    }
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
        // Allow idempotent concurrency if another transaction already marked it ANSWERED
        const current = await tx.clarificationQuestion.findFirst({
          where: { id: item.questionId, projectId },
          select: { status: true },
        })
        if (current?.status !== 'ANSWERED') {
          throw new Error('One or more clarification questions are invalid or already answered.')
        }
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
