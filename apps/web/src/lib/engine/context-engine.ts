import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  CONTEXT_NORMALIZER_SYSTEM_PROMPT,
  CanonicalContextSchema,
  buildContextNormalizerUserPrompt,
  type CanonicalContextOutput,
} from '@/lib/prompts/context-normalizer'
import { updateProject } from '@/lib/projects/project-service'

export interface GenerateContextOptions {
  userId: string
  projectId: string
  analysisJson?: string
}

/**
 * Generate and save a versioned Canonical Project Context snapshot.
 * Preserves confirmed decisions from previous versions (cannot be overwritten).
 * Updates project status to CONTEXT_READY.
 */
export async function generateCanonicalContext({
  userId,
  projectId,
  analysisJson = '{}',
}: GenerateContextOptions): Promise<{
  context: CanonicalContextOutput
  version: number
}> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      clarificationQuestions: {
        where: { status: 'ANSWERED' },
      },
      contexts: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  })

  if (!project) throw new Error('Project not found')

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your API key.')
  }

  // Format Q&A
  const qaFormatted = JSON.stringify(
    project.clarificationQuestions.map((q) => ({
      question: q.question,
      answer: q.answer,
    })),
  )

  const provider = createProvider(providerConfig)
  const userPrompt = buildContextNormalizerUserPrompt(
    project.name,
    project.rawIdea,
    project.classification,
    project.targetAgent,
    analysisJson,
    qaFormatted,
  )

  const newContext = await provider.generateStructured(
    userPrompt,
    CanonicalContextSchema,
    {
      system: CONTEXT_NORMALIZER_SYSTEM_PROMPT,
      maxTokens: 4096,
      temperature: 0.2,
    },
  )

  // Enforce confirmed decision immutability if a previous context exists
  const previousContextRecord = project.contexts[0]
  if (previousContextRecord) {
    try {
      const prev = JSON.parse(
        previousContextRecord.contentJson,
      ) as CanonicalContextOutput

      // Merge confirmed decisions: any decision confirmed previously MUST stay confirmed
      const prevConfirmed = new Set(prev.confirmed_decisions)
      for (const d of prevConfirmed) {
        if (!newContext.confirmed_decisions.includes(d)) {
          newContext.confirmed_decisions.push(d)
        }
      }
    } catch {
      // ignore parse error of previous context
    }
  }

  // Calculate next version
  const nextVersion = (previousContextRecord?.version ?? 0) + 1

  // Mark all old versions as not current
  await db.projectContext.updateMany({
    where: { projectId },
    data: { isCurrent: false },
  })

  // Save new version
  await db.projectContext.create({
    data: {
      projectId,
      version: nextVersion,
      contentJson: JSON.stringify(newContext),
      isCurrent: true,
    },
  })

  // Transition project status to CONTEXT_READY
  await updateProject(userId, projectId, { status: 'CONTEXT_READY' })

  return { context: newContext, version: nextVersion }
}

/**
 * Get the current Canonical Project Context snapshot.
 */
export async function getCurrentContext(userId: string, projectId: string) {
  const record = await db.projectContext.findFirst({
    where: { projectId, isCurrent: true, project: { userId } },
  })
  if (!record) return null

  return {
    version: record.version,
    content: JSON.parse(record.contentJson) as CanonicalContextOutput,
    createdAt: record.createdAt,
  }
}
