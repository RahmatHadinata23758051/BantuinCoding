import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveProjectSkills } from '@/lib/engine/skill-resolver'

// ============================================================
// POST /api/projects/[id]/skills — Resolve project skills & SKILLS.md
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
    const result = await resolveProjectSkills({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json({ result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Skill resolution failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
