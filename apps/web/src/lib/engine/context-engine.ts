import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  CONTEXT_NORMALIZER_SYSTEM_PROMPT,
  CanonicalContextSchema,
  buildContextNormalizerUserPrompt,
  type CanonicalContextOutput,
} from '@/lib/prompts/context-normalizer'
import type { ContextProvenance } from '@repo/types'
import { getCurrentRequirementAnalysis } from '@/lib/engine/analysis-store'
import { updateProject } from '@/lib/projects/project-service'
import {
  ASSUMPTION_CONFIRMATION_ACCEPTED,
  ASSUMPTION_CONFIRMATION_QUESTION,
} from '@/lib/engine/clarification-engine'

export interface GenerateContextOptions {
  userId: string
  projectId: string
}

type ProvenanceItem = { value: string; provenance: ContextProvenance }

const PROVENANCE_ARRAY_FIELDS = [
  'target_users',
  'goals',
  'non_goals',
  'technical_constraints',
  'security_requirements',
  'integrations',
  'confirmed_decisions',
  'open_questions',
  'assumptions',
] as const

function preserveConfirmedItems(
  previous: ProvenanceItem[],
  next: ProvenanceItem[],
): ProvenanceItem[] {
  const merged = [...next]
  for (const previousItem of previous) {
    if (previousItem.provenance !== 'confirmed') continue

    const index = merged.findIndex((item) => item.value === previousItem.value)
    if (index === -1) merged.push(previousItem)
    else merged[index] = previousItem
  }
  return merged
}

function preserveConfirmedContext(
  previous: CanonicalContextOutput,
  next: CanonicalContextOutput,
): CanonicalContextOutput {
  for (const field of PROVENANCE_ARRAY_FIELDS) {
    next[field] = preserveConfirmedItems(previous[field], next[field])
  }

  for (const key of Object.keys(previous.stack_preferences) as Array<keyof CanonicalContextOutput['stack_preferences']>) {
    if (previous.stack_preferences[key].provenance === 'confirmed') {
      next.stack_preferences[key] = previous.stack_preferences[key]
    }
  }

  if (previous.design_direction.provenance === 'confirmed') {
    next.design_direction = previous.design_direction
  }
  if (previous.deployment_target.provenance === 'confirmed') {
    next.deployment_target = previous.deployment_target
  }

  const previousFunctional = new Map(
    previous.functional_requirements
      .filter((item) => item.provenance === 'confirmed')
      .map((item) => [item.id, item]),
  )
  next.functional_requirements = [
    ...next.functional_requirements.filter((item) => !previousFunctional.has(item.id)),
    ...previousFunctional.values(),
  ]

  const previousNonFunctional = previous.non_functional_requirements.filter(
    (item) => item.provenance === 'confirmed',
  )
  for (const item of previousNonFunctional) {
    const index = next.non_functional_requirements.findIndex(
      (candidate) => candidate.category === item.category && candidate.requirement === item.requirement,
    )
    if (index === -1) next.non_functional_requirements.push(item)
    else next.non_functional_requirements[index] = item
  }

  return next
}

/**
 * Generate and save a versioned Canonical Project Context snapshot.
 * Preserves confirmed decisions from previous versions (cannot be overwritten).
 * Updates project status to CONTEXT_READY.
 */
export async function generateCanonicalContext({
  userId,
  projectId,
}: GenerateContextOptions): Promise<{
  context: CanonicalContextOutput
  version: number
}> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      clarificationQuestions: true,
      contexts: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  })

  if (!project) throw new Error('Project not found')

  const pendingQuestions = project.clarificationQuestions.filter(
    (question) => question.status === 'PENDING',
  )
  if (pendingQuestions.length > 0) {
    throw new Error('Answer pending clarification questions before generating context.')
  }

  const maxRoundReached = project.clarificationQuestions.some(
    (question) => question.round > 3,
  )
  if (maxRoundReached) {
    const acceptedAssumptionPath = project.clarificationQuestions.some(
      (question) =>
        question.round > 3 &&
        question.question === ASSUMPTION_CONFIRMATION_QUESTION &&
        question.status === 'ANSWERED' &&
        question.answer === ASSUMPTION_CONFIRMATION_ACCEPTED,
    )
    if (!acceptedAssumptionPath) {
      throw new Error('Confirm unresolved items as explicit assumptions before generating context.')
    }
  }

  const currentAnalysis = await getCurrentRequirementAnalysis(projectId)
  if (!currentAnalysis) {
    throw new Error('Requirement analysis is required before generating context.')
  }

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your API key.')
  }

  // Format answered Q&A only. Pending/skipped records are not confirmed input.
  const qaFormatted = JSON.stringify(
    project.clarificationQuestions
      .filter((question) => question.status === 'ANSWERED')
      .map((question) => ({
        question: question.question,
        answer: question.answer,
      })),
  )

  const provider = createProvider(providerConfig)
  const userPrompt = buildContextNormalizerUserPrompt(
    project.name,
    project.rawIdea,
    project.classification,
    project.targetAgent,
    JSON.stringify(currentAnalysis.analysis),
    qaFormatted,
  )

  const generatedContext = await provider.generateStructured(
    userPrompt,
    CanonicalContextSchema,
    {
      system: CONTEXT_NORMALIZER_SYSTEM_PROMPT,
      maxTokens: 4096,
      temperature: 0.2,
    },
  )
  // Validate again at the engine boundary in case an adapter implementation
  // violates the generateStructured contract.
  const newContext = CanonicalContextSchema.parse(generatedContext)

  // Enforce confirmed high-impact decision immutability if a previous context exists.
  const previousContextRecord = project.contexts[0]
  if (previousContextRecord) {
    try {
      const previousContext = CanonicalContextSchema.parse(
        JSON.parse(previousContextRecord.contentJson),
      )
      preserveConfirmedContext(previousContext, newContext)
    } catch {
      // Ignore invalid legacy snapshots rather than corrupting the new validated context.
    }
  }

  let createdVersion = 0
  const maxWriteAttempts = 3

  for (let attempt = 1; attempt <= maxWriteAttempts; attempt++) {
    try {
      createdVersion = await db.$transaction(async (tx) => {
        const latest = await tx.projectContext.findFirst({
          where: { projectId },
          orderBy: { version: 'desc' },
          select: { version: true },
        })
        const nextVersion = (latest?.version ?? 0) + 1

        await tx.projectContext.updateMany({
          where: { projectId, isCurrent: true },
          data: { isCurrent: false },
        })

        const createdContext = await tx.projectContext.create({
          data: {
            projectId,
            version: nextVersion,
            contentJson: JSON.stringify(newContext),
            isCurrent: true,
          },
        })

        await tx.artifact.updateMany({
          where: {
            projectId,
            contextId: { not: createdContext.id },
            status: { in: ['READY', 'MODIFIED'] },
          },
          data: { status: 'OUTDATED' },
        })

        return nextVersion
      }, { isolationLevel: 'Serializable' })
      break
    } catch (error) {
      const isWriteConflict =
        typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034'
      if (!isWriteConflict || attempt === maxWriteAttempts) throw error
    }
  }

  // Transition project status only after the snapshot transaction succeeds.
  await updateProject(userId, projectId, { status: 'CONTEXT_READY' })

  return { context: newContext, version: createdVersion }
}

/**
 * Get the current Canonical Project Context snapshot.
 */
export async function getCurrentContext(userId: string, projectId: string) {
  const record = await db.projectContext.findFirst({
    where: { projectId, isCurrent: true, project: { userId } },
  })
  if (!record) return null

  try {
    return {
      version: record.version,
      content: CanonicalContextSchema.parse(JSON.parse(record.contentJson)),
      createdAt: record.createdAt,
    }
  } catch {
    throw new Error('Persisted canonical context is invalid.')
  }
}
