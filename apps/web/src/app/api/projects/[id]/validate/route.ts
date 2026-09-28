import { NextRequest, NextResponse } from 'next/server'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { auth } from '@/lib/auth'
import { auditProjectConsistency } from '@/lib/engine/consistency-validator'
import { requireProjectAction, updateProject } from '@/lib/projects/project-service'
import { getProjectReadiness } from '@/lib/projects/readiness-service'

// ============================================================
// POST /api/projects/[id]/validate — Audit cross-document consistency
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
    await requireProjectAction(session.user.id, id, 'VALIDATE')
    const readiness = await getProjectReadiness(session.user.id, id)
    if (!readiness.isReady) {
      return NextResponse.json(
        { error: 'Project documents are not ready for validation.' },
        { status: 400 },
      )
    }

    const report = await auditProjectConsistency({
      userId: session.user.id,
      projectId: id,
    })
    if (report.isConsistent) {
      await updateProject(session.user.id, id, { status: 'EXPORTABLE' })
    }

    return NextResponse.json({ report, readiness })
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Consistency audit failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
