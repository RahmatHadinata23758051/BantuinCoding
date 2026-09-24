import { db } from '@repo/db'
import type { ArtifactStatus } from '@repo/types'

export interface SaveArtifactOptions {
  userId: string
  projectId: string
  artifactType: string
  content: string
}

/**
 * Saves edited artifact content and sets status to MODIFIED.
 */
export async function saveArtifactContent({
  userId,
  projectId,
  artifactType,
  content,
}: SaveArtifactOptions) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  })

  if (!project) throw new Error('Project not found')

  const artifact = await db.artifact.findUnique({
    where: { projectId_type: { projectId, type: artifactType } },
  })

  if (!artifact) throw new Error('Artifact not found')

  const updated = await db.artifact.update({
    where: { id: artifact.id },
    data: {
      content,
      status: 'MODIFIED',
      version: artifact.version + 1,
    },
  })

  return updated
}

/**
 * Checks all artifacts for a project and marks them OUTDATED if the current
 * ProjectContext version is higher than the artifact's generated contextId version.
 */
export async function markOutdatedArtifacts(projectId: string): Promise<number> {
  const currentContext = await db.projectContext.findFirst({
    where: { projectId, isCurrent: true },
  })

  if (!currentContext) return 0

  const artifacts = await db.artifact.findMany({
    where: { projectId },
  })

  let outdatedCount = 0

  for (const art of artifacts) {
    if (art.contextId !== currentContext.id && art.status === 'READY') {
      await db.artifact.update({
        where: { id: art.id },
        data: { status: 'OUTDATED' },
      })
      outdatedCount++
    }
  }

  return outdatedCount
}

/**
 * Helper to get badge visual style for artifact status badge in UI workspace.
 */
export function getArtifactStatusBadgeStyle(status: ArtifactStatus | string): {
  label: string
  colorClass: string
} {
  switch (status) {
    case 'READY':
      return { label: 'Generated (Ready)', colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    case 'MODIFIED':
      return { label: 'User Modified', colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    case 'OUTDATED':
      return { label: 'Outdated (Context Changed)', colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    case 'FAILED':
      return { label: 'Generation Failed', colorClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    case 'GENERATING':
      return { label: 'Generating...', colorClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse' }
    default:
      return { label: 'Not Generated', colorClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
  }
}
