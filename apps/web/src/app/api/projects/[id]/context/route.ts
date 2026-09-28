import { NextRequest, NextResponse } from 'next/server'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { auth } from '@/lib/auth'
import {
  generateCanonicalContext,
  getCurrentContext,
} from '@/lib/engine/context-engine'
import { requireProjectAction } from '@/lib/projects/project-service'

// ============================================================
// GET /api/projects/[id]/context — Fetch current context
// ============================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const contextData = await getCurrentContext(session.user.id, id)
  if (!contextData) {
    return NextResponse.json(
      { error: 'No canonical context generated yet' },
      { status: 404 },
    )
  }

  return NextResponse.json(contextData)
}

// ============================================================
// POST /api/projects/[id]/context — Generate canonical context
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
    await requireProjectAction(session.user.id, id, 'CONTEXT')
    const result = await generateCanonicalContext({
      userId: session.user.id,
      projectId: id,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Canonical context generation failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
