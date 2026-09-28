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
    if (
      art.contextId !== currentContext.id &&
      (art.status === 'READY' || art.status === 'MODIFIED')
    ) {
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
      return { label: 'Generated (Ready)', colorClass: 'border-[var(--ink)] bg-[var(--mint-dim)] text-[var(--ink)]' }
    case 'MODIFIED':
      return { label: 'User Modified', colorClass: 'border-[var(--ink)] bg-[var(--cobalt-dim)] text-[var(--ink)]' }
    case 'OUTDATED':
      return { label: 'Outdated (Context Changed)', colorClass: 'border-[var(--ink)] bg-[var(--electric-yellow-dim)] text-[var(--ink)]' }
    case 'FAILED':
      return { label: 'Generation Failed', colorClass: 'border-[var(--ink)] bg-[var(--action-red-dim)] text-[var(--ink)]' }
    case 'GENERATING':
      return { label: 'Generating...', colorClass: 'border-[var(--ink)] bg-[var(--cobalt-dim)] text-[var(--ink)] animate-pulse-dot' }
    default:
      return { label: 'Not Generated', colorClass: 'border-[var(--ink)] bg-[var(--paper)] text-[var(--paper-muted)]' }
  }
}
