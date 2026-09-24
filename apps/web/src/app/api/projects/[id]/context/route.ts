import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  generateCanonicalContext,
  getCurrentContext,
} from '@/lib/engine/context-engine'

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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let analysisJson = '{}'
  try {
    const body = (await req.json()) as { analysisJson?: string }
    if (body.analysisJson) analysisJson = body.analysisJson
  } catch {
    // optional body
  }

  try {
    const result = await generateCanonicalContext({
      userId: session.user.id,
      projectId: id,
      analysisJson,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Context generation failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
