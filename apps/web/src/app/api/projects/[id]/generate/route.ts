import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateCoreArtifacts } from '@/lib/engine/artifact-generator'

// ============================================================
// POST /api/projects/[id]/generate — Generate core artifacts (PRD, SRS, Architecture)
// Single-artifact regeneration is supported via optional `type` body param.
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

  try {
    let types: ('PRD' | 'SRS' | 'ARCHITECTURE')[] | undefined = undefined

    // Parse body optionally for single-artifact regeneration e.g. { type: "PRD" }
    try {
      const body = await req.json()
      if (body?.type && ['PRD', 'SRS', 'ARCHITECTURE'].includes(body.type)) {
        types = [body.type as 'PRD' | 'SRS' | 'ARCHITECTURE']
      }
    } catch {
      // Body empty or invalid — default to all 3 core artifacts
    }

    const results = await generateCoreArtifacts({
      userId: session.user.id,
      projectId: id,
      types,
    })

    return NextResponse.json({ artifacts: results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Artifact generation failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
