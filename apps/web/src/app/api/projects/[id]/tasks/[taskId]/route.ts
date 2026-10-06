import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@repo/db'
import { z } from 'zod'

// ============================================================
// PATCH /api/projects/[id]/tasks/[taskId] — Update task status
// ============================================================

const UpdateTaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE']),
  taskKey: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, taskId } = await params

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = UpdateTaskStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid status' },
      { status: 400 },
    )
  }

  const newStatus = parsed.data.status
  const requestedTaskKey = parsed.data.taskKey

  // Find the target task by ID, taskKey in param, or taskKey in body
  const orConditions: Array<{ id: string } | { taskKey: string }> = [
    { id: taskId },
    { taskKey: taskId },
  ]
  if (requestedTaskKey) {
    orConditions.push({ taskKey: requestedTaskKey })
  }

  const targetTask = await db.backlogTask.findFirst({
    where: {
      projectId,
      OR: orConditions,
    },
    include: {
      dependsOn: {
        include: {
          dependsOn: { select: { id: true, taskKey: true, status: true } },
        },
      },
      dependedBy: {
        include: {
          task: {
            include: {
              dependsOn: {
                include: {
                  dependsOn: { select: { id: true, status: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!targetTask) {
    return NextResponse.json({ error: 'Task not found in this project' }, { status: 404 })
  }

  const previousStatus = targetTask.status

  const updatedTask = await db.backlogTask.update({
    where: { id: targetTask.id },
    data: { status: newStatus },
  })

  // Automatic dependency recalculation
  const affectedTasks: Array<{ id: string; taskKey: string; status: string }> = []

  if (newStatus === 'DONE') {
    // Check if any dependent tasks can now be promoted from PENDING to READY
    for (const dep of targetTask.dependedBy) {
      const depTask = dep.task
      if (depTask.status === 'PENDING') {
        // Check if all prerequisites are now DONE
        const allPrereqsDone = depTask.dependsOn.every(
          (d) => d.dependsOnTaskId === targetTask.id || d.dependsOn.status === 'DONE',
        )

        if (allPrereqsDone) {
          const promoted = await db.backlogTask.update({
            where: { id: depTask.id },
            data: { status: 'READY' },
            select: { id: true, taskKey: true, status: true },
          })
          affectedTasks.push(promoted)
        }
      }
    }
  } else if (previousStatus === 'DONE') {
    // Task was demoted from DONE: check if any dependent tasks should be moved back to PENDING
    for (const dep of targetTask.dependedBy) {
      const depTask = dep.task
      if (depTask.status === 'READY') {
        const demoted = await db.backlogTask.update({
          where: { id: depTask.id },
          data: { status: 'PENDING' },
          select: { id: true, taskKey: true, status: true },
        })
        affectedTasks.push(demoted)
      }
    }
  }

  return NextResponse.json({
    task: {
      id: updatedTask.id,
      taskKey: updatedTask.taskKey,
      title: updatedTask.title,
      status: updatedTask.status,
      updatedAt: updatedTask.updatedAt,
    },
    affectedTasks,
  })
}
