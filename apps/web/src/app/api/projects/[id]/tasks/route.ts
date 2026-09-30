import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@repo/db'

// ============================================================
// GET /api/projects/[id]/tasks — List all phases and tasks for a project
// ============================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true, targetAgent: true, status: true },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const phases = await db.backlogPhase.findMany({
    where: { projectId: id },
    orderBy: { order: 'asc' },
    include: {
      tasks: {
        orderBy: { taskKey: 'asc' },
        include: {
          dependsOn: {
            include: {
              dependsOn: {
                select: { id: true, taskKey: true, title: true, status: true },
              },
            },
          },
          dependedBy: {
            include: {
              task: {
                select: { id: true, taskKey: true, title: true, status: true },
              },
            },
          },
        },
      },
    },
  })

  const formattedPhases = phases.map((phase) => ({
    id: phase.id,
    order: phase.order,
    name: phase.name,
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
        dependencies: task.dependsOn.map((d) => d.dependsOn.id),
        dependencyKeys: task.dependsOn.map((d) => d.dependsOn.taskKey),
        blockedBy: task.dependsOn
          .filter((d) => d.dependsOn.status !== 'DONE')
          .map((d) => d.dependsOn.taskKey),
        dependents: task.dependedBy.map((d) => d.task.taskKey),
      }
    }),
  }))

  const allTasks = formattedPhases.flatMap((p) => p.tasks)
  const taskCounts = {
    total: allTasks.length,
    pending: allTasks.filter((t) => t.status === 'PENDING').length,
    ready: allTasks.filter((t) => t.status === 'READY').length,
    in_progress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    review: allTasks.filter((t) => t.status === 'REVIEW').length,
    done: allTasks.filter((t) => t.status === 'DONE').length,
  }

  return NextResponse.json({
    project,
    phases: formattedPhases,
    taskCounts,
  })
}
