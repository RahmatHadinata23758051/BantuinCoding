import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { saveArtifactContent } from '@/lib/artifacts/artifact-service'

// ============================================================
// PATCH /api/projects/[id]/artifacts/[type] — Save edited artifact content
// ============================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; type: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, type } = await params

  try {
    const { content } = await req.json()
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 })
    }

    const artifact = await saveArtifactContent({
      userId: session.user.id,
      projectId: id,
      artifactType: type.toUpperCase(),
      content,
    })

    return NextResponse.json({ artifact })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
