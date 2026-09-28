import { NextRequest, NextResponse } from 'next/server'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { auth } from '@/lib/auth'
import { saveArtifactContent } from '@/lib/artifacts/artifact-service'
import { recomputeProjectReadiness } from '@/lib/projects/readiness-service'

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
    const readiness = await recomputeProjectReadiness(session.user.id, id)

    return NextResponse.json({ artifact, readiness })
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Document save failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
