import { db } from '@repo/db'
import { z } from 'zod'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import { BacklogGenerationError, getSafeApiErrorMessage } from '@/lib/api/errors'
import {
  BACKLOG_GENERATOR_SYSTEM_PROMPT,
  BacklogGeneratorOutputSchema,
  buildBacklogGeneratorUserPrompt,
  buildBacklogRepairPrompt,
  type BacklogDocumentReference,
  type BacklogGeneratorOutput,
  type GeneratedBacklogPhase,
  summarizeBacklogReference,
} from '@/lib/prompts/backlog-generator'
import { validateBacklogDependencies, validateBacklogQuality } from '@/lib/engine/backlog-validator'

/**
 * Renders BACKLOG.md from structured phases. The server owns Markdown rendering
 * so the model never has to duplicate the task graph as Markdown.
 */
export function generateBacklogMdContent(
  projectName: string,
  phases: GeneratedBacklogPhase[],
): string {
  const phasesMd = phases
    .map((phase) => {
      const tasksMd = phase.tasks
        .map(
          (t) => `### ${t.id} — ${t.title}
**Dependencies:** ${t.dependencies.length ? t.dependencies.join(', ') : 'None'}
**Description:** ${t.description}

**Acceptance Criteria:**
- ${t.acceptance_criteria.join('\n- ')}

**Definition of Done:** ${t.definition_of_done}
**Relevant Docs:** ${t.relevant_docs.join(', ')}
**Skills:** ${t.recommended_skills.join(', ')}`,
        )
        .join('\n\n---\n\n')

      return `## ${phase.name}
${phase.description ? `*${phase.description}*\n\n` : ''}${tasksMd}`
    })
    .join('\n\n---\n\n')

  return `# BACKLOG.md — ${projectName}

> Phased, dependency-aware backlog for coding agents.

---

${phasesMd}
`
}

export interface GenerateBacklogOptions {
  userId: string
  projectId: string
}

function normalizeBacklogOutput(raw: unknown): BacklogGeneratorOutput {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const phases = Array.isArray(value.phases) ? value.phases : []
  if (phases.length === 0) {
    throw new Error('Provider returned no backlog phases. Please regenerate.')
  }

  return {
    phases: phases.map((phase, phaseIndex) => {
      const p = phase && typeof phase === 'object' ? (phase as Record<string, unknown>) : {}
      const tasks = Array.isArray(p.tasks) ? p.tasks : []
      return {
        name: typeof p.name === 'string' ? p.name : `Phase ${phaseIndex + 1}`,
        order: typeof p.order === 'number' ? p.order : phaseIndex + 1,
        description: typeof p.description === 'string' ? p.description : undefined,
        tasks: tasks.map((task, taskIndex) => {
          const t = task && typeof task === 'object' ? (task as Record<string, unknown>) : {}
          const asStrings = (input: unknown): string[] =>
            Array.isArray(input) ? input.map(String) : []
          const dod = t.definition_of_done ?? t.definitionOfDone
          const ac = t.acceptance_criteria ?? t.acceptanceCriteria
          const docs = t.relevant_docs ?? t.relevantDocs
          const skills = t.recommended_skills ?? t.recommendedSkills
          return {
            id: typeof t.id === 'string' ? t.id : `BK-${String(taskIndex + 1).padStart(3, '0')}`,
            title: typeof t.title === 'string' ? t.title : '',
            description: typeof t.description === 'string' ? t.description : '',
            dependencies: asStrings(t.dependencies),
            acceptance_criteria: asStrings(ac),
            definition_of_done: typeof dod === 'string' ? dod : '',
            relevant_docs: asStrings(docs),
            recommended_skills: asStrings(skills),
          }
        }),
      }
    }),
  }
}

/**
 * Generates BACKLOG.md and persists BacklogPhase & BacklogTask records in DB.
 */
export async function generateProjectBacklog({
  userId,
  projectId,
}: GenerateBacklogOptions): Promise<BacklogGeneratorOutput> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
        include: { artifactPlans: { select: { type: true, path: true, isRequired: true } } },
      },
      skillRecommendations: { select: { name: true } },
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')

  const currentContextRecord = project.contexts[0]
  if (!currentContextRecord) {
    throw new Error('No Canonical Project Context found. Generate context first.')
  }

  const plans = currentContextRecord.artifactPlans ?? []

  const references: BacklogDocumentReference[] = []
  for (const plan of plans) {
    if (plan.type === 'BACKLOG') continue
    const artifact = project.artifacts.find((item) => item.type === plan.type)
    const isCurrentAndReady = artifact
      && artifact.contextId === currentContextRecord.id
      && ['READY', 'MODIFIED'].includes(artifact.status)
      && artifact.content.trim()
    if (!isCurrentAndReady) {
      if (plan.isRequired) {
        throw new Error(`Required ${plan.type} reference is not ready for the current context. Generate or repair it, then retry backlog generation.`)
      }
      continue
    }
    references.push({ type: plan.type, path: plan.path, content: artifact.content })
  }
  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  const provider = createProvider(providerConfig)
  const plannedDocumentPaths = references.map((reference) => reference.path)

  const boundedReferences = references.map((reference) => ({
    ...reference,
    content: summarizeBacklogReference(reference.content),
  }))
  const userPrompt = buildBacklogGeneratorUserPrompt(
    project.name,
    currentContextRecord.contentJson,
    boundedReferences,
    (project.skillRecommendations ?? []).map((skill) => skill.name),
  )

  const previousBacklog = project.artifacts.find((artifact) => artifact.type === 'BACKLOG')
  const failureStatus = previousBacklog?.content.trim()
    && ['READY', 'MODIFIED', 'OUTDATED'].includes(previousBacklog.status)
    ? previousBacklog.status
    : 'FAILED'

  // Keep the previous content/context until the replacement transaction commits.
  await db.artifact.upsert({
    where: { projectId_type: { projectId, type: 'BACKLOG' } },
    update: { status: 'GENERATING' },
    create: {
      projectId,
      contextId: currentContextRecord.id,
      type: 'BACKLOG',
      path: 'BACKLOG.md',
      content: '',
      status: 'GENERATING',
    },
  })

  const generateDraft = async (prompt: string): Promise<unknown> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        provider.generateStructured(prompt, z.unknown(), {
          system: BACKLOG_GENERATOR_SYSTEM_PROMPT,
          maxTokens: 32000,
          temperature: 0.2,
        }),
        new Promise<never>((_, reject) => {
          // Match the OpenAI-compatible transport deadline instead of failing at 120s.
          timer = setTimeout(() => reject(new BacklogGenerationError(
            'Backlog generation timed out after 180 seconds. Retry or choose a faster model.', 504,
          )), 180_000)
        }),
      ])
    } catch (error) {
      if (error instanceof BacklogGenerationError) throw error
      const timedOut = error instanceof Error && /timeout|timed out/i.test(error.message)
      const fallback = 'The provider could not generate the backlog. Please retry or choose another model.'
      const message = getSafeApiErrorMessage(error, fallback)
      // Some legacy mappings echo internal errors; never forward a provider payload.
      throw new BacklogGenerationError(
        error instanceof Error && message === error.message ? fallback : message,
        timedOut ? 504 : 502,
      )
    } finally {
      clearTimeout(timer)
    }
  }
  const allowedSkills = new Set((project.skillRecommendations ?? []).map((skill) => skill.name))
  const validateDraft = (raw: unknown): BacklogGeneratorOutput => {
    const output = BacklogGeneratorOutputSchema.parse(normalizeBacklogOutput(raw))
    for (const phase of output.phases) {
      for (const task of phase.tasks) {
        task.recommended_skills = task.recommended_skills.filter((skill) => allowedSkills.has(skill))
      }
    }
    const errors = [
      ...validateBacklogQuality(output.phases, {
        plannedDocumentPaths,
        sourceTexts: references.map(({ content }) => content),
        confirmedContextJson: currentContextRecord.contentJson,
      }),
      ...validateBacklogDependencies(output.phases).errors,
    ]
    if (errors.length) throw new Error(errors.join('\n'))
    return output
  }

  let backlogOutput: BacklogGeneratorOutput
  try {
    const rawOutput = await generateDraft(userPrompt)
    try {
      backlogOutput = validateDraft(rawOutput)
    } catch (initialError) {
      const issues = initialError instanceof z.ZodError
        ? initialError.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        : [initialError instanceof Error ? initialError.message : 'Invalid backlog task graph']
      const repairPrompt = buildBacklogRepairPrompt(userPrompt, JSON.stringify(rawOutput) ?? 'null', issues)
      // A failed repair request keeps its upstream/timeout classification.
      const repairedOutput = await generateDraft(repairPrompt)
      try {
        backlogOutput = validateDraft(repairedOutput)
      } catch {
        throw new BacklogGenerationError(
          'Provider response could not be validated after a repair attempt. Retry or choose a more capable model.', 502,
        )
      }
    }
  } catch (error) {
    await db.artifact.update({
      where: { projectId_type: { projectId, type: 'BACKLOG' } },
      data: { status: failureStatus },
    })
    throw error
  }
  const validation = validateBacklogDependencies(backlogOutput.phases)

  try {
    await db.$transaction(async (tx) => {
      // Cascades remove the old tasks and dependencies with their phases. All
      // replacement records and the artifact are committed together.
      await tx.backlogPhase.deleteMany({ where: { projectId } })

      const createdTasksMap = new Map<string, string>()
      for (const phase of backlogOutput.phases) {
        const dbPhase = await tx.backlogPhase.create({
          data: {
            projectId,
            order: phase.order,
            name: phase.name,
            description: phase.description,
          },
        })

        for (const task of phase.tasks) {
          const initialStatus = validation.taskStatusMap[task.id] || 'PENDING'
          const dbTask = await tx.backlogTask.create({
            data: {
              projectId,
              phaseId: dbPhase.id,
              taskKey: task.id,
              title: task.title,
              description: task.description,
              acceptanceCriteria: JSON.stringify(task.acceptance_criteria),
              definitionOfDone: task.definition_of_done,
              relevantDocs: JSON.stringify(task.relevant_docs),
              recommendedSkills: JSON.stringify(task.recommended_skills),
              status: initialStatus,
            },
          })
          createdTasksMap.set(task.id, dbTask.id)
        }
      }

      for (const phase of backlogOutput.phases) {
        for (const task of phase.tasks) {
          const dbTaskId = createdTasksMap.get(task.id)
          if (!dbTaskId) continue
          for (const depKey of task.dependencies) {
            const depDbTaskId = createdTasksMap.get(depKey)
            if (!depDbTaskId) continue
            await tx.backlogDependency.create({
              data: { taskId: dbTaskId, dependsOnTaskId: depDbTaskId },
            })
          }
        }
      }

      await tx.artifact.update({
        where: { projectId_type: { projectId, type: 'BACKLOG' } },
        data: {
          content: generateBacklogMdContent(project.name, backlogOutput.phases),
          status: 'READY',
          contextId: currentContextRecord.id,
          provider: providerConfig.provider,
          model: providerConfig.model,
        },
      })
    })
  } catch {
    await db.artifact.update({
      where: { projectId_type: { projectId, type: 'BACKLOG' } },
      data: { status: failureStatus },
    })
    throw new BacklogGenerationError('Backlog replacement failed. The previous backlog was preserved.', 500)
  }

  return backlogOutput
}
