import { db } from '@repo/db'
import { getProviderConfig, restoreProviderSession } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  PROJECT_CLASSIFIER_SYSTEM_PROMPT,
  ProjectClassifierSchema,
  ProjectClassificationSchema,
  buildProjectClassifierUserPrompt,
  type ProjectClassification,
} from '@/lib/prompts/project-classifier'

export type SafeClassificationErrorCode =
  | 'NO_ACTIVE_PROVIDER'
  | 'CLASSIFICATION_FAILED'
  | 'PROJECT_NOT_FOUND'

export interface ClassifyProjectOptions {
  userId: string
  projectId: string
}

export interface ClassifyProjectResult {
  status: 'READY' | 'FAILED' | 'PENDING'
  classification: ProjectClassification | string
  error?: SafeClassificationErrorCode | null
}

/**
 * Classify a project's type using BYOK provider session asynchronously or on retry.
 * - Scoped strictly to owner { id: projectId, userId }.
 * - Does not alter project workflow state machine (status: DRAFT, etc.).
 * - Safe error codes only; no raw secrets or provider error stacks.
 * - Uses attempt token sequencing to prevent stale completion overwriting newer retry.
 *
 * ponytail: in-memory attempt token sequencing without distributed lock; upgrade to BullMQ/temporal if worker fleet scales.
 */
export async function classifyProject({
  userId,
  projectId,
}: ClassifyProjectOptions): Promise<ClassifyProjectResult> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    select: {
      id: true,
      name: true,
      rawIdea: true,
      classification: true,
      classificationAttempt: true,
      language: true,
    },
  })

  if (!project) {
    return {
      status: 'FAILED',
      classification: 'OTHER',
      error: 'PROJECT_NOT_FOUND',
    }
  }

  // Claim a unique attempt with compare-and-swap so concurrent retries cannot
  // share a token and an older completion cannot overwrite a newer attempt.
  let currentAttempt = project.classificationAttempt
  let nextAttempt: number

  while (true) {
    const claim = await db.project.updateMany({
      where: { id: projectId, userId, classificationAttempt: currentAttempt },
      data: {
        classificationStatus: 'PENDING',
        classificationAttempt: { increment: 1 },
        classificationError: null,
      },
    })

    if (claim.count === 1) {
      nextAttempt = currentAttempt + 1
      break
    }

    const latest = await db.project.findFirst({
      where: { id: projectId, userId },
      select: { classificationAttempt: true },
    })
    if (!latest) {
      return { status: 'FAILED', classification: 'OTHER', error: 'PROJECT_NOT_FOUND' }
    }
    currentAttempt = latest.classificationAttempt
  }

  // Check BYOK session or restore from vault
  const providerConfig =
    getProviderConfig(userId) ?? (await restoreProviderSession(userId))

  if (!providerConfig) {
    await db.project.updateMany({
      where: {
        id: projectId,
        userId,
        classificationAttempt: nextAttempt,
      },
      data: {
        classificationStatus: 'FAILED',
        classificationError: 'NO_ACTIVE_PROVIDER',
      },
    })

    return {
      status: 'FAILED',
      classification: project.classification,
      error: 'NO_ACTIVE_PROVIDER',
    }
  }

  try {
    const provider = createProvider(providerConfig)
    const prompt = buildProjectClassifierUserPrompt(
      project.name,
      project.rawIdea,
      project.language,
    )

    const result = await provider.generateStructured(
      prompt,
      ProjectClassifierSchema,
      {
        system: PROJECT_CLASSIFIER_SYSTEM_PROMPT,
        maxTokens: 256,
        temperature: 0.1,
      },
    )

    const parsedEnum = ProjectClassificationSchema.safeParse(result.classification)
    const validClassification: ProjectClassification = parsedEnum.success
      ? parsedEnum.data
      : 'OTHER'

    // Conditional update: only persist if this attempt is still the latest
    await db.project.updateMany({
      where: {
        id: projectId,
        userId,
        classificationAttempt: nextAttempt,
      },
      data: {
        classification: validClassification,
        classificationStatus: 'READY',
        classificationError: null,
      },
    })

    return {
      status: 'READY',
      classification: validClassification,
    }
  } catch {
    await db.project.updateMany({
      where: {
        id: projectId,
        userId,
        classificationAttempt: nextAttempt,
      },
      data: {
        classificationStatus: 'FAILED',
        classificationError: 'CLASSIFICATION_FAILED',
      },
    })

    return {
      status: 'FAILED',
      classification: project.classification,
      error: 'CLASSIFICATION_FAILED',
    }
  }
}
