import { db } from '@repo/db'
import type { SystemGraphData } from '@repo/types'
import { parseMermaidSystemGraph } from '@/lib/prompts/architecture-generator'

function normalizeGraphText(value: string) {
  return value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/\r\n?/g, '\n').trim()
}

function normalizeGraph(graph: SystemGraphData): SystemGraphData {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      label: normalizeGraphText(node.label),
      description: normalizeGraphText(node.description),
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      ...(edge.label === undefined ? {} : { label: normalizeGraphText(edge.label) }),
    })),
  }
}

export function parseWorkspaceSystemGraph(content: string): SystemGraphData | null {
  try {
    const parsed = JSON.parse(content) as SystemGraphData
    if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0 && Array.isArray(parsed.edges)) {
      const nodeIds = new Set(parsed.nodes.map((node) => node.id))
      return normalizeGraph({
        nodes: parsed.nodes,
        edges: parsed.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)),
      })
    }
  } catch {}
  const parsed = parseMermaidSystemGraph(content)
  return parsed ? normalizeGraph(parsed) : null
}

export async function repairMissingSystemGraph({ userId, projectId }: { userId: string; projectId: string }) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: { where: { isCurrent: true }, take: 1 },
      artifacts: { where: { type: { in: ['SYSTEM_GRAPH', 'ARCHITECTURE'] } } },
    },
  })

  if (!project) throw new Error('Project not found')
  const currentContext = project.contexts[0]
  if (!currentContext) throw new Error('No Canonical Project Context found.')

  const existing = project.artifacts.find(
    (artifact) => artifact.type === 'SYSTEM_GRAPH' && artifact.status === 'READY' && artifact.contextId === currentContext.id,
  )
  const existingGraph = existing ? parseWorkspaceSystemGraph(existing.content) : null
  if (existingGraph) return existingGraph

  const architecture = project.artifacts.find(
    (artifact) => artifact.type === 'ARCHITECTURE' &&
      (artifact.status === 'READY' || artifact.status === 'MODIFIED') &&
      artifact.contextId === currentContext.id,
  )
  if (!architecture) throw new Error('Architecture document must be ready before building the system map.')

  const graph = parseMermaidSystemGraph(architecture.content)
  if (!graph) throw new Error('Architecture document does not contain a supported system map.')

  await db.artifact.upsert({
    where: { projectId_type: { projectId, type: 'SYSTEM_GRAPH' } },
    update: { content: JSON.stringify(graph), status: 'READY', contextId: currentContext.id },
    create: {
      projectId,
      contextId: currentContext.id,
      type: 'SYSTEM_GRAPH',
      path: '.system-graph.json',
      content: JSON.stringify(graph),
      status: 'READY',
    },
  })
  return graph
}

export async function getProjectWorkspaceData(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
        include: {
          artifactPlans: { where: { isRequired: true }, select: { type: true } },
        },
      },
      artifacts: true,
      clarificationQuestions: {
        orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
      },
      skillRecommendations: true,
      backlogPhases: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            include: {
              dependsOn: true,
            },
          },
        },
      },
    },
  })

  if (!project) return null

  const currentContextRecord = project.contexts[0]
  const contextData = currentContextRecord
    ? JSON.parse(currentContextRecord.contentJson)
    : null
  const systemGraphArtifact = project.artifacts.find(
    (artifact) =>
      artifact.type === 'SYSTEM_GRAPH' &&
      artifact.status === 'READY' &&
      artifact.contextId === currentContextRecord?.id,
  )
  let systemGraph = systemGraphArtifact
    ? parseWorkspaceSystemGraph(systemGraphArtifact.content)
    : null

  if (!systemGraph && currentContextRecord) {
    const architectureArtifact = project.artifacts.find(
      (artifact) =>
        artifact.type === 'ARCHITECTURE' &&
        (artifact.status === 'READY' || artifact.status === 'MODIFIED') &&
        artifact.contextId === currentContextRecord.id,
    )
    if (architectureArtifact?.content) {
      const derived = parseMermaidSystemGraph(architectureArtifact.content)
      if (derived) {
        systemGraph = derived
        try {
          await db.artifact.upsert({
            where: { projectId_type: { projectId, type: 'SYSTEM_GRAPH' } },
            update: {
              content: JSON.stringify(derived),
              status: 'READY',
              contextId: currentContextRecord.id,
            },
            create: {
              projectId,
              contextId: currentContextRecord.id,
              type: 'SYSTEM_GRAPH',
              path: '.system-graph.json',
              content: JSON.stringify(derived),
              status: 'READY',
            },
          })
        } catch {
          // Non-blocking auto-repair persistence
        }
      }
    }
  }


  return {
    id: project.id,
    name: project.name,
    description: project.rawIdea,
    classification: project.classification,
    classificationStatus: project.classificationStatus,
    classificationError: project.classificationError,
    targetAgent: project.targetAgent,
    language: project.language,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    context: contextData,
    contextVersion: currentContextRecord?.version ?? 0,
    systemGraph,
    requiredArtifactTypes: currentContextRecord?.artifactPlans.map((item) => item.type) ?? [],
    clarifications: project.clarificationQuestions.map((question) => {
      let optionsList: string[] = []
      try {
        if (question.options) {
          optionsList = JSON.parse(question.options)
        }
      } catch {}

      return {
        id: question.id,
        round: question.round,
        question: question.question,
        impact: question.impact,
        options: optionsList,
        answer: question.answer,
        status: question.status,
      }
    }),
    artifacts: project.artifacts
      .filter((a) => a.type !== 'SYSTEM_GRAPH')
      .map((a) => ({
        id: a.id,
        type: a.type,
        path: a.path,
        content: a.content,
        status: a.status,
        updatedAt: a.updatedAt.toISOString(),
      })),
    skills: project.skillRecommendations.map((s) => ({
      id: s.id,
      name: s.name,
      source: s.source,
      purpose: s.purpose,
      trigger: s.trigger,
      metadata: s.metadata ? JSON.parse(s.metadata) : null,
    })),
    phases: project.backlogPhases.map((p) => ({
      id: p.id,
      name: p.name,
      order: p.order,
      description: p.description,
      tasks: p.tasks.map((t) => ({
        id: t.id,
        taskKey: t.taskKey,
        title: t.title,
        description: t.description,
        status: t.status,
        acceptanceCriteria: JSON.parse(t.acceptanceCriteria),
        definitionOfDone: t.definitionOfDone,
        relevantDocs: t.relevantDocs ? JSON.parse(t.relevantDocs) : [],
        recommendedSkills: t.recommendedSkills ? JSON.parse(t.recommendedSkills) : [],
        dependencies: t.dependsOn.map((d) => d.dependsOnTaskId),
      })),
    })),
  }
}
