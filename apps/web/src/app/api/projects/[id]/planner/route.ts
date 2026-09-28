import { NextRequest, NextResponse } from 'next/server'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { auth } from '@/lib/auth'
import { planProjectArtifacts } from '@/lib/engine/artifact-planner'
import { requireProjectAction } from '@/lib/projects/project-service'

// ============================================================
// POST /api/projects/[id]/planner — Generate artifact plan
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
    await requireProjectAction(session.user.id, id, 'PLAN')
    const plan = await planProjectArtifacts({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json({ plan })
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Artifact planning failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
