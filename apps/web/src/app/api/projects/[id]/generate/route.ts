import { NextRequest, NextResponse } from 'next/server'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { auth } from '@/lib/auth'
import { generateAgentAndRulesArtifacts } from '@/lib/engine/agent-rules-generator'
import { generateCoreArtifacts, regenerateFailedArtifacts } from '@/lib/engine/artifact-generator'
import { requireProjectAction } from '@/lib/projects/project-service'
import { recomputeProjectReadiness } from '@/lib/projects/readiness-service'

// ============================================================
// POST /api/projects/[id]/generate — Generate planned core artifacts or Agent.md.
// Single-artifact regeneration is supported via optional `type` body param.
// `type: "AGENT_RULES"` is retained as a client compatibility alias for Agent.md.
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
    let types: ('PRD' | 'ARCHITECTURE' | 'DESIGN')[] | undefined = undefined
    let regenerateFailed: boolean = false

    // Parse body optionally for single-artifact regeneration e.g. { type: "PRD" }
    try {
      const body = await req.json()
      requestedType = typeof body?.type === 'string' ? body.type.toUpperCase() : undefined
      regenerateFailed = body?.regenerateFailed === true
      if (requestedType && ['PRD', 'ARCHITECTURE', 'DESIGN'].includes(requestedType)) {
        types = [requestedType as 'PRD' | 'ARCHITECTURE' | 'DESIGN']
      }
    } catch {
      // Body empty or invalid — default to all core documents handled by this route.
    }

    let results: Awaited<ReturnType<typeof generateCoreArtifacts>>
    if (requestedType === 'AGENT_RULES') {
      // Orchestration request: produce both Agent.md and RULES.md in a single
      // provider round trip and return them as-is, without filtering.
      results = await generateAgentAndRulesArtifacts({
        userId: session.user.id,
        projectId: id,
      })
    } else if (requestedType && ['AGENT', 'RULES'].includes(requestedType)) {
      results = (await generateAgentAndRulesArtifacts({
        userId: session.user.id,
        projectId: id,
      })).filter((artifact) => artifact.type === requestedType)
    } else if (regenerateFailed) {
      // Regenerate only failed artifacts
      results = await regenerateFailedArtifacts({
        userId: session.user.id,
        projectId: id,
      })
    } else {
      results = await generateCoreArtifacts({
        userId: session.user.id,
        projectId: id,
        types,
      })
    }
    const readiness = await recomputeProjectReadiness(session.user.id, id)

    return NextResponse.json({ artifacts: results, readiness })
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Document generation failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
