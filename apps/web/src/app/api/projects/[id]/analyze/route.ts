import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { analyzeProjectRequirements } from '@/lib/engine/requirement-analyzer'

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
    const analysis = await analyzeProjectRequirements({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json({ analysis })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    const status = message.includes('not found')
      ? 404
      : message.includes('No active AI provider')
        ? 400
        : 500

    return NextResponse.json({ error: message }, { status })
  }
}
