import { db } from '@repo/db'

export async function getProjectWorkspaceData(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
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

  return {
    id: project.id,
    name: project.name,
    description: project.rawIdea,
    classification: project.classification,
    targetAgent: project.targetAgent,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    context: contextData,
    contextVersion: currentContextRecord?.version ?? 0,
    clarifications: project.clarificationQuestions.map((question) => ({
      id: question.id,
      round: question.round,
      question: question.question,
      impact: question.impact,
      answer: question.answer,
      status: question.status,
    })),
    artifacts: project.artifacts.map((a) => ({
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
