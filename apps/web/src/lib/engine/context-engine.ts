import { db } from '@repo/db'
import { z } from 'zod'
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
  ASSUMPTION_CONFIRMATION_QUESTION,
  isAssumptionConfirmationAccepted,
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
 * Normalize and repair raw context output from smaller/cheaper AI models
 * that may produce non-strict variants of the schema. Defaults empty/missing
 * arrays, coerces object items to ContextItemWithProvenance shape, and fills
 * required string fields when the model emitted them as descriptive prose.
 */
function normalizeContextOutput(
  raw: unknown,
): import('@/lib/prompts/context-normalizer').CanonicalContextOutput {
  type Provenance = 'confirmed' | 'assumed' | 'unknown'
  type Item = { value: string; provenance: Provenance }
  const emptyItem: Item = { value: 'Not specified', provenance: 'unknown' }

  const record = (val: unknown): Record<string, unknown> =>
    (val && typeof val === 'object' ? val : {}) as Record<string, unknown>

  const asStr = (val: unknown, fallback = ''): string =>
    typeof val === 'string' ? val : (val !== null && val !== undefined ? String(val) : fallback)

  const asProv = (val: unknown): Provenance => {
    const v = typeof val === 'string' ? val.toLowerCase() : ''
    return v === 'confirmed' || v === 'assumed' || v === 'unknown' ? (v as Provenance) : 'assumed'
  }

  const ensureItem = (item: unknown): Item => {
    if (typeof item === 'string') return { value: item, provenance: 'assumed' }
    const obj = record(item)
    if (typeof obj.value === 'string') return { value: obj.value, provenance: asProv(obj.provenance) }
    for (const key of ['name', 'title', 'description', 'requirement'] as const) {
      if (typeof obj[key] === 'string') {
        return { value: obj[key] as string, provenance: asProv(obj.provenance) }
      }
    }
    return emptyItem
  }

  const ensureArray = (val: unknown): unknown[] =>
    Array.isArray(val) ? val : val === undefined || val === null ? [] : [val]

  const ensureItemArray = (val: unknown): Item[] => ensureArray(val).map(ensureItem)

  const r = record(raw)
  const sp = record(r.stack_preferences)

  return {
    project_name: asStr(r.project_name || r.name, 'Untitled project'),
    summary: asStr(r.summary || r.description, 'Project context summary not provided.'),
    target_users: ensureItemArray(r.target_users ?? r.target_audience),
    goals: ensureItemArray(r.goals ?? r.features),
    non_goals: ensureItemArray(r.non_goals),
    functional_requirements: ensureArray(r.functional_requirements).map(
      (req, idx): {
        id: string
        title: string
        description: string
        provenance: Provenance
      } => {
        if (typeof req === 'string') {
          return {
            id: `FR-${String(idx + 1).padStart(3, '0')}`,
            title: req,
            description: req,
            provenance: 'assumed',
          }
        }
        const obj = record(req)
        return {
          id: asStr(obj.id ?? obj.key, `FR-${String(idx + 1).padStart(3, '0')}`),
          title: asStr(obj.title ?? obj.name, 'Untitled requirement'),
          description: asStr(obj.description ?? obj.summary ?? obj.name, 'No description provided.'),
          provenance: asProv(obj.provenance),
        }
      },
    ),
    non_functional_requirements: ensureArray(r.non_functional_requirements).map(
      (req): { category: string; requirement: string; provenance: Provenance } => {
        if (typeof req === 'string') {
          return { category: 'Quality', requirement: req, provenance: 'assumed' }
        }
        const obj = record(req)
        return {
          category: asStr(obj.category, 'Quality'),
          requirement: asStr(obj.requirement ?? obj.description, 'Not specified'),
          provenance: asProv(obj.provenance),
        }
      },
    ),
    core_entities: ensureArray(r.core_entities ?? r.entities).map((ent) => {
      if (typeof ent === 'string') return { name: ent, fields: [], relationships: [] }
      const obj = record(ent)
      return {
        name: asStr(obj.name, 'Entity'),
        fields: ensureArray(obj.fields ?? obj.properties).map((f) =>
          typeof f === 'string' ? f : asStr(record(f).name ?? record(f).value, 'field'),
        ),
        relationships: ensureArray(obj.relationships).map((rel) =>
          typeof rel === 'string' ? rel : asStr(record(rel).value),
        ),
      }
    }),
    technical_constraints: ensureItemArray(r.technical_constraints ?? r.constraints),
    stack_preferences: {
      frontend: ensureItem(sp.frontend ?? r.stack),
      backend: ensureItem(sp.backend),
      database: ensureItem(sp.database),
      styling: ensureItem(sp.styling),
    },
    design_direction: ensureItem(r.design_direction ?? r.design_guidelines),
    security_requirements: ensureItemArray(r.security_requirements),
    integrations: ensureItemArray(r.integrations),
    deployment_target: ensureItem(r.deployment_target ?? r.platform),
    agent_target: asStr(r.agent_target ?? r.target_agent, 'CLAUDE_CODE'),
    confirmed_decisions: ensureItemArray(r.confirmed_decisions),
    open_questions: ensureItemArray(r.open_questions ?? r.clarifications),
    assumptions: ensureItemArray(r.assumptions),
  }
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
        isAssumptionConfirmationAccepted(question.answer),
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
    project.language,
  )

  // Use z.unknown() to accept ANY valid JSON from the model (including extra fields
  // or slightly different field names from smaller/cheaper models).
  // Then normalizeContextOutput reshapes and repairs the JSON to fit CanonicalContextSchema.
  // Increased maxTokens to 16384 to prevent truncation on large contexts.
  const rawContext = await provider.generateStructured(
    userPrompt,
    z.unknown(),
    {
      system: CONTEXT_NORMALIZER_SYSTEM_PROMPT,
      maxTokens: 16384,
      temperature: 0.2,
    },
  )
  // Normalize and repair any model output format into canonical shape
  let newContext = normalizeContextOutput(rawContext)
  // Final strict validation to ensure we strictly adhere to the contract
  newContext = CanonicalContextSchema.parse(newContext)

  let createdVersion = 0
  const maxWriteAttempts = 3

  for (let attempt = 1; attempt <= maxWriteAttempts; attempt++) {
    try {
      // Clone the base context for this attempt to avoid accumulating stale
      // merge data across retries.
      const contextForAttempt = JSON.parse(JSON.stringify(newContext))

      createdVersion = await db.$transaction(async (tx) => {
        // Re-read the latest current context snapshot inside the transaction
        // to preserve confirmed decisions from the newest committed version.
        const latestContextRecord = await tx.projectContext.findFirst({
          where: { projectId, isCurrent: true },
          orderBy: { version: 'desc' },
        })
        if (latestContextRecord) {
          try {
            const latestContext = CanonicalContextSchema.parse(
              JSON.parse(latestContextRecord.contentJson),
            )
            preserveConfirmedContext(latestContext, contextForAttempt)
          } catch {
            // Ignore invalid legacy snapshots rather than corrupting the new validated context.
          }
        }

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
            contentJson: JSON.stringify(contextForAttempt),
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

      // Update newContext with the preserved context from the successful attempt
      // for the return value
      if (attempt === 1) {
        // On first attempt, we need to capture the preserved context
        // Re-fetch to get the final version
        const finalContextRecord = await db.projectContext.findFirst({
          where: { projectId, isCurrent: true },
          orderBy: { version: 'desc' },
        })
        if (finalContextRecord) {
          newContext = CanonicalContextSchema.parse(JSON.parse(finalContextRecord.contentJson))
        }
      }
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
