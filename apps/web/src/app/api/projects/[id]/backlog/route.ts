import { NextRequest, NextResponse } from 'next/server'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
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

    return NextResponse.json({ backlog, readiness })
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Backlog generation failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
