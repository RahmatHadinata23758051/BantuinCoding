import { NextRequest, NextResponse } from 'next/server'
import { db } from '@repo/db'
import type { SystemGraphData } from '@repo/types'
import { getSafeApiErrorMessage } from '@/lib/api/errors'
import { parseWorkspaceSystemGraph, repairMissingSystemGraph } from '@/lib/projects/workspace-service'
import { auth } from '@/lib/auth'
import { generateAgentAndRulesArtifacts, regenerateIncompleteAgentArtifacts } from '@/lib/engine/agent-rules-generator'
import { generateCoreArtifacts, regenerateFailedArtifacts } from '@/lib/engine/artifact-generator'
import { requireProjectAction } from '@/lib/projects/project-service'
import { recomputeProjectReadiness } from '@/lib/projects/readiness-service'
import { isValidVisualReferenceId } from '@/lib/visual-references/catalog'

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
    let visualReferenceId: string | undefined = undefined

    // Parse body optionally for single-artifact regeneration e.g. { type: "PRD" }
    try {
      const body = await req.json()
      requestedType = typeof body?.type === 'string' ? body.type.toUpperCase() : undefined
      regenerateFailed = body?.regenerateFailed === true
      if (typeof body?.visualReferenceId === 'string') {
        if (!isValidVisualReferenceId(body.visualReferenceId)) {
          return NextResponse.json({ error: 'Invalid visual reference ID' }, { status: 400 })
        }
        visualReferenceId = body.visualReferenceId
      }
      if (requestedType === 'SRS') {
        return NextResponse.json({ error: 'SRS.md is not generated in the current lean documentation pack. Requirements are consolidated into PRD.md.' }, { status: 400 })
      }
      if (requestedType === 'PRD' || requestedType === 'ARCHITECTURE' || requestedType === 'DESIGN') {
        types = [requestedType]
      } else if (requestedType === 'AGENT_RULES' || requestedType === 'SYSTEM_GRAPH') {
        // Compatibility paths handled by dedicated stages below.
      } else if (requestedType) {
        return NextResponse.json({ error: `Artifact type ${requestedType} is not directly regenerable. Use the corresponding workflow stage.` }, { status: 400 })
      }
    } catch {
      // Body empty or invalid — default to all core documents handled by this route.
    }

    if (requestedType === 'SYSTEM_GRAPH') {
      const systemGraph = await repairMissingSystemGraph({ userId: session.user.id, projectId: id })
      return NextResponse.json({ artifacts: [], readiness: null, systemGraph })
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
      // Retry only incomplete document artifacts; ready/modified files are protected.
      // Execute sequentially to avoid concurrent database writes and state transitions.
      const coreResults = await regenerateFailedArtifacts({
        userId: session.user.id,
        projectId: id,
      })
      const agentResults = await regenerateIncompleteAgentArtifacts({
        userId: session.user.id,
        projectId: id,
      })
      results = [...coreResults, ...agentResults]
    } else {
      results = await generateCoreArtifacts({
        userId: session.user.id,
        projectId: id,
        types,
        visualReferenceId,
      })
    }
    const readiness = await recomputeProjectReadiness(session.user.id, id)
    let systemGraph: SystemGraphData | null = null
    const systemGraphArtifact = await db.artifact.findUnique({
      where: { projectId_type: { projectId: id, type: 'SYSTEM_GRAPH' } },
      select: { content: true, status: true },
    })
    if (systemGraphArtifact?.status === 'READY') {
      systemGraph = parseWorkspaceSystemGraph(systemGraphArtifact.content)
    }

    return NextResponse.json({ artifacts: results, readiness, systemGraph })
  } catch (err) {
    const message = getSafeApiErrorMessage(err, 'Document generation failed. Please retry.')
    const status = message === 'Project not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
