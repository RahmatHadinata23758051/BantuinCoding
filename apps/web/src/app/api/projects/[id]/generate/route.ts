import { NextRequest, NextResponse } from 'next/server'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { auth } from '@/lib/auth'
import { generateAgentAndRulesArtifacts } from '@/lib/engine/agent-rules-generator'
import { generateCoreArtifacts } from '@/lib/engine/artifact-generator'
import { requireProjectAction } from '@/lib/projects/project-service'
import { recomputeProjectReadiness } from '@/lib/projects/readiness-service'

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
    await requireProjectAction(session.user.id, id, 'GENERATE')
    let requestedType: string | undefined
    let types: ('PRD' | 'SRS' | 'ARCHITECTURE')[] | undefined = undefined

    // Parse body optionally for single-artifact regeneration e.g. { type: "PRD" }
    try {
      const body = await req.json()
      requestedType = typeof body?.type === 'string' ? body.type.toUpperCase() : undefined
      if (requestedType && ['PRD', 'SRS', 'ARCHITECTURE'].includes(requestedType)) {
        types = [requestedType as 'PRD' | 'SRS' | 'ARCHITECTURE']
      }
    } catch {
      // Body empty or invalid — default to all core documents handled by this route.
    }

    const results = requestedType && ['AGENT', 'RULES'].includes(requestedType)
      ? (await generateAgentAndRulesArtifacts({
          userId: session.user.id,
          projectId: id,
        })).filter((artifact) => artifact.type === requestedType)
      : await generateCoreArtifacts({
          userId: session.user.id,
          projectId: id,
          types,
        })
    const readiness = await recomputeProjectReadiness(session.user.id, id)

    return NextResponse.json({ artifacts: results, readiness })
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Document generation failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
