import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { auditProjectConsistency } from '@/lib/engine/consistency-validator'

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
    const report = await auditProjectConsistency({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json({ report })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Consistency audit failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
