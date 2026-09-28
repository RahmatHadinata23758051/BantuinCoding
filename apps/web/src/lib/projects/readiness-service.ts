import { db } from '@repo/db'
import type { ProjectStatus } from '@repo/types'
import { updateProject } from '@/lib/projects/project-service'

const USABLE_ARTIFACT_STATUSES = new Set(['READY', 'MODIFIED'])

export interface ProjectReadiness {
  isReady: boolean
  requiredTypes: string[]
  missingTypes: string[]
  blockingTypes: string[]
}

export async function getProjectReadiness(
  userId: string,
  projectId: string,
): Promise<ProjectReadiness> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
        include: {
          artifactPlans: { where: { isRequired: true } },
        },
      },
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')

  const currentContext = project.contexts[0]
  if (!currentContext) {
    return { isReady: false, requiredTypes: [], missingTypes: [], blockingTypes: [] }
  }

  const requiredTypes = [...new Set(currentContext.artifactPlans.map((item) => item.type))].sort()
  const artifactsByType = new Map(project.artifacts.map((artifact) => [artifact.type, artifact]))
  const missingTypes = requiredTypes.filter((type) => !artifactsByType.has(type))
  const blockingTypes = requiredTypes.filter((type) => {
    const artifact = artifactsByType.get(type)
    return Boolean(
      artifact &&
        (artifact.contextId !== currentContext.id || !USABLE_ARTIFACT_STATUSES.has(artifact.status)),
    )
  })

  return {
    isReady:
      requiredTypes.length > 0 && missingTypes.length === 0 && blockingTypes.length === 0,
    requiredTypes,
    missingTypes,
    blockingTypes,
  }
}

export async function recomputeProjectReadiness(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    select: { status: true },
  })
  if (!project) throw new Error('Project not found')

  const readiness = await getProjectReadiness(userId, projectId)
  const currentStatus = project.status as ProjectStatus

  if (readiness.isReady && currentStatus === 'GENERATING') {
    await updateProject(userId, projectId, { status: 'READY' })
  }

  return readiness
}
