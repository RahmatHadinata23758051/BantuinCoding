import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  BACKLOG_GENERATOR_SYSTEM_PROMPT,
  BacklogGeneratorOutputSchema,
  buildBacklogGeneratorUserPrompt,
  type BacklogGeneratorOutput,
  type GeneratedBacklogPhase,
} from '@/lib/prompts/backlog-generator'
import { validateBacklogDependencies } from '@/lib/engine/backlog-validator'

/**
 * Baseline rule-based fallback backlog when AI call is disabled or fails.
 * Contains comprehensive 14+ tasks across 5 phases broken down by workstream.
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
      },
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')

  const currentContextRecord = project.contexts[0]
  if (!currentContextRecord) {
    throw new Error('No Canonical Project Context found. Generate context first.')
  }

  const prdArtifact = project.artifacts.find((a) => a.type === 'PRD')?.content || ''
  const srsArtifact = project.artifacts.find((a) => a.type === 'SRS')?.content || ''
  const archArtifact = project.artifacts.find((a) => a.type === 'ARCHITECTURE')?.content || ''
  const designArtifact = project.artifacts.find((a) => a.type === 'DESIGN')?.content || ''

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  const provider = createProvider(providerConfig)

  // Set artifact to GENERATING before provider call
  await db.artifact.upsert({
    where: { projectId_type: { projectId, type: 'BACKLOG' } },
    update: { status: 'GENERATING', contextId: currentContextRecord.id },
    create: {
      projectId,
      contextId: currentContextRecord.id,
      type: 'BACKLOG',
      path: 'BACKLOG.md',
      content: '',
      status: 'GENERATING',
    },
  })

  const summarizeReference = (content: string) => content.slice(0, 2500)
  const userPrompt = buildBacklogGeneratorUserPrompt(
    project.name,
    currentContextRecord.contentJson,
    summarizeReference(prdArtifact),
    summarizeReference(srsArtifact),
    summarizeReference(archArtifact),
    summarizeReference(designArtifact),
  )
  let backlogOutput: BacklogGeneratorOutput
  try {
    backlogOutput = await Promise.race([
      provider.generateStructured(
        userPrompt,
        BacklogGeneratorOutputSchema,
        {
          system: BACKLOG_GENERATOR_SYSTEM_PROMPT,
          maxTokens: 32000,
          temperature: 0.2,
        },
      ),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Backlog generation timed out after 120 seconds. Please regenerate.')), 120_000)
      }),
    ])
  } catch (error) {
    await db.artifact.update({
      where: { projectId_type: { projectId, type: 'BACKLOG' } },
      data: { status: 'FAILED' },
    })
    throw error
  }

  // Validate dependency references and circular dependencies
  const validation = validateBacklogDependencies(backlogOutput.phases)
  if (!validation.isValid) {
    throw new Error('AI generated invalid dependencies or circular references. Please regenerate.')
  }

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
      data: { status: 'FAILED' },
    })
    throw new Error('Backlog replacement failed. The previous backlog was preserved.')
  }

  return backlogOutput
}
