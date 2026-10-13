import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { classifyProject } from '@/lib/projects/classifier-service'

// ============================================================
// POST /api/projects/[id]/classify — Trigger/retry project classification
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

  const result = await classifyProject({
    userId: session.user.id,
    projectId: id,
  })

  if (result.error === 'PROJECT_NOT_FOUND') {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(result)
}
