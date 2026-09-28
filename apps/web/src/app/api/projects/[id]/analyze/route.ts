import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { analyzeProjectRequirements } from '@/lib/engine/requirement-analyzer'
import { requireProjectAction } from '@/lib/projects/project-service'

// ============================================================
// POST /api/projects/[id]/analyze — Trigger requirement analysis
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
    await requireProjectAction(session.user.id, id, 'ANALYZE')
    const analysis = await analyzeProjectRequirements({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json({ analysis })
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Requirement analysis failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400

    return NextResponse.json({ error: message }, { status })
  }
}
