import { NextRequest, NextResponse } from 'next/server'
import { db } from '@repo/db'
import { BacklogGenerationError, getSafeApiErrorMessage } from '@/lib/api/errors'
import { auth } from '@/lib/auth'
import { generateProjectBacklog } from '@/lib/engine/backlog-generator'
import { requireProjectAction } from '@/lib/projects/project-service'
import { recomputeProjectReadiness } from '@/lib/projects/readiness-service'

// ============================================================
// POST /api/projects/[id]/backlog — Generate project backlog & BACKLOG.md
// ============================================================

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await requireProjectAction(session.user.id, id, 'GENERATE')
    const backlog = await generateProjectBacklog({
      userId: session.user.id,
      projectId: id,
    })
    const readiness = await recomputeProjectReadiness(session.user.id, id)
    const artifact = await db.artifact.findUnique({
      where: { projectId_type: { projectId: id, type: 'BACKLOG' } },
      select: {
        id: true,
        type: true,
        path: true,
        status: true,
        content: true,
        updatedAt: true,
      },
    })

    const dbPhases = await db.backlogPhase.findMany({
      where: { projectId: id },
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          orderBy: { taskKey: 'asc' },
          include: {
            dependsOn: true,
          },
        },
      },
    }).catch(() => [])

    const formattedPhases = dbPhases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      order: phase.order,
      description: phase.description,
      tasks: phase.tasks.map((task) => {
        let acceptanceCriteria: string[] = []
        let relevantDocs: string[] = []
        let recommendedSkills: string[] = []

        try {
          acceptanceCriteria = JSON.parse(task.acceptanceCriteria)
        } catch {}
        try {
          relevantDocs = JSON.parse(task.relevantDocs || '[]')
        } catch {}
        try {
          recommendedSkills = JSON.parse(task.recommendedSkills || '[]')
        } catch {}

        return {
          id: task.id,
          taskKey: task.taskKey,
          title: task.title,
          description: task.description,
          status: task.status,
          acceptanceCriteria,
          definitionOfDone: task.definitionOfDone,
          relevantDocs,
          recommendedSkills,
          dependencies: task.dependsOn.map((d) => d.dependsOnTaskId),
        }
      }),
    }))

    return NextResponse.json({
      backlog: {
        ...backlog,
        backlog_md_content: artifact?.content ?? '',
      },
      readiness,
      artifact,
      phases: formattedPhases,
    })
  } catch (err) {
    const message = err instanceof BacklogGenerationError
      ? err.message
      : getSafeApiErrorMessage(err, 'Backlog generation failed. Please retry.')
    const status = err instanceof BacklogGenerationError ? err.status
      : message === 'Project not found' ? 404
        : /current state|provider session|Canonical context|reference is not ready/i.test(message) ? 409
          : /input exceeds|reference.*limit/i.test(message) ? 400 : 500
    // Never log provider errors: they can contain credentials and raw generated text.
    console.error('Backlog generation failed', { status })
    return NextResponse.json({ error: message }, { status })
  }
}
