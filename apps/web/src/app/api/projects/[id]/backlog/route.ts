import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateProjectBacklog } from '@/lib/engine/backlog-generator'

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
    const backlog = await generateProjectBacklog({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json({ backlog })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Backlog generation failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
