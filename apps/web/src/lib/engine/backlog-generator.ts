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
 */
export const defaultFallbackPhases: GeneratedBacklogPhase[] = [
  {
    name: 'Phase 1 — Project Foundation',
    order: 1,
    description: 'Setup core entities, architecture, and database migrations.',
    tasks: [
      {
        id: 'BK-001',
        title: 'Initialize project structure',
        description: 'Set up application foundation, linters, and strict TypeScript.',
        dependencies: [],
        acceptance_criteria: ['App builds successfully', 'TypeScript strict passes'],
        definition_of_done: 'Repo initialized with clean build pipeline',
        relevant_docs: ['SRS.md §9'],
        recommended_skills: ['typescript-backend'],
      },
      {
        id: 'BK-002',
        title: 'Setup database models',
        description: 'Define Prisma database schema and migrations.',
        dependencies: ['BK-001'],
        acceptance_criteria: ['Migration runs clean', 'DB seed functions'],
        definition_of_done: 'Database schema deployed',
        relevant_docs: ['SRS.md §10'],
        recommended_skills: ['typescript-backend'],
      },
    ],
  },
  {
    name: 'Phase 2 — Core Features',
    order: 2,
    description: 'Build main application features.',
    tasks: [
      {
        id: 'BK-003',
        title: 'Implement core business logic',
        description: 'Implement domain engines and services.',
        dependencies: ['BK-002'],
        acceptance_criteria: ['Unit tests pass', 'API endpoints respond'],
        definition_of_done: 'Business logic verified',
        relevant_docs: ['PRD.md §5'],
        recommended_skills: ['typescript-backend'],
      },
    ],
  },
]

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

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  const provider = createProvider(providerConfig)
  const userPrompt = buildBacklogGeneratorUserPrompt(
    project.name,
    currentContextRecord.contentJson,
    prdArtifact,
    srsArtifact,
    archArtifact,
  )
  let backlogOutput: BacklogGeneratorOutput = await provider.generateStructured(
    userPrompt,
    BacklogGeneratorOutputSchema,
    {
      system: BACKLOG_GENERATOR_SYSTEM_PROMPT,
      maxTokens: 4096,
      temperature: 0.2,
    },
  )

  // Validate dependency references and circular dependencies
  const validation = validateBacklogDependencies(backlogOutput.phases)
  if (!validation.isValid) {
    // If AI generated invalid dependencies, fall back to safe baseline phases
    backlogOutput = {
      phases: defaultFallbackPhases,
      backlog_md_content: generateBacklogMdContent(project.name, defaultFallbackPhases),
    }
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

      await tx.artifact.upsert({
        where: { projectId_type: { projectId, type: 'BACKLOG' } },
        update: {
          content: backlogOutput.backlog_md_content,
          status: 'READY',
          contextId: currentContextRecord.id,
          provider: providerConfig.provider,
          model: providerConfig.model,
        },
        create: {
          projectId,
          contextId: currentContextRecord.id,
          type: 'BACKLOG',
          path: 'BACKLOG.md',
          content: backlogOutput.backlog_md_content,
          status: 'READY',
          provider: providerConfig.provider,
          model: providerConfig.model,
        },
      })
    })
  } catch {
    throw new Error('Backlog replacement failed. The previous backlog was preserved.')
  }

  return backlogOutput
}
