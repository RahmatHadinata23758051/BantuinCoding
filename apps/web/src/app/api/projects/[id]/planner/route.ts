import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { planProjectArtifacts } from '@/lib/engine/artifact-planner'

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
    const plan = await planProjectArtifacts({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json({ plan })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Planning failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
