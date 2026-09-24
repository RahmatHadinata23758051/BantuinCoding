import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  ARTIFACT_PLANNER_SYSTEM_PROMPT,
  ArtifactPlanSchema,
  buildArtifactPlannerUserPrompt,
  type ArtifactPlanOutput,
} from '@/lib/prompts/artifact-planner'
import type { ProjectClassification } from '@repo/types'

export interface PlanArtifactsOptions {
  userId: string
  projectId: string
}

/**
 * Fallback baseline artifact plan when AI call is not used or fails.
 * Guarantees the mandatory 7 core documents per SRS.
 */
export function getDefaultArtifactPlan(
  classification: ProjectClassification,
): ArtifactPlanOutput {
  const isMinimal =
    classification === 'STATIC_SITE' || classification === 'LANDING_PAGE'

  const mandatory = [
    { type: 'PRD' as const, path: 'PRD.md', reason: 'Product requirements', isRequired: true },
    { type: 'SRS' as const, path: 'SRS.md', reason: 'Software specification', isRequired: true },
    { type: 'ARCHITECTURE' as const, path: 'ARCHITECTURE.md', reason: 'System architecture', isRequired: true },
    { type: 'AGENT' as const, path: 'Agent.md', reason: 'Coding agent contract', isRequired: true },
    { type: 'RULES' as const, path: 'RULES.md', reason: 'Coding standards', isRequired: true },
    { type: 'SKILLS' as const, path: 'SKILLS.md', reason: 'Recommended agent skills', isRequired: true },
    { type: 'BACKLOG' as const, path: 'BACKLOG.md', reason: 'Phased backlog tasks', isRequired: true },
  ]

  if (isMinimal) {
    return {
      classification,
      artifacts: mandatory,
      rationale: `Minimal documentation pack for ${classification}`,
    }
  }

  // Extended pack for apps/SaaS/complex
  return {
    classification,
    artifacts: [
      ...mandatory,
      { type: 'DATABASE' as const, path: 'docs/DATABASE.md', reason: 'Database schema & migrations', isRequired: false },
      { type: 'API' as const, path: 'docs/API.md', reason: 'API surface specification', isRequired: false },
      { type: 'SECURITY' as const, path: 'docs/SECURITY.md', reason: 'Security rules & secrets handling', isRequired: false },
      { type: 'TESTING' as const, path: 'docs/TESTING.md', reason: 'Testing strategy & quality gates', isRequired: false },
      { type: 'README' as const, path: 'README.md', reason: 'Project overview', isRequired: false },
    ],
    rationale: `Standard full-stack documentation pack for ${classification}`,
  }
}

/**
 * Plan artifacts for a project using AI provider or fallback.
 * Saves planned empty Artifact records in DB ready for generation.
 */
export async function planProjectArtifacts({
  userId,
  projectId,
}: PlanArtifactsOptions): Promise<ArtifactPlanOutput> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  })

  if (!project) throw new Error('Project not found')

  const currentContextRecord = project.contexts[0]
  if (!currentContextRecord) {
    throw new Error('No Canonical Project Context found. Generate context first.')
  }

  const providerConfig = getProviderConfig(userId)
  let plan: ArtifactPlanOutput

  if (providerConfig) {
    const provider = createProvider(providerConfig)
    const userPrompt = buildArtifactPlannerUserPrompt(
      project.name,
      project.classification as ProjectClassification,
      currentContextRecord.contentJson,
    )

    try {
      plan = await provider.generateStructured(
        userPrompt,
        ArtifactPlanSchema,
        {
          system: ARTIFACT_PLANNER_SYSTEM_PROMPT,
          maxTokens: 2048,
          temperature: 0.2,
        },
      )
    } catch {
      // Fall back to rule-based default plan on AI failure
      plan = getDefaultArtifactPlan(project.classification as ProjectClassification)
    }
  } else {
    plan = getDefaultArtifactPlan(project.classification as ProjectClassification)
  }

  // Create initial empty Artifact records in DB for each planned artifact
  for (const item of plan.artifacts) {
    await db.artifact.upsert({
      where: {
        projectId_type: { projectId, type: item.type },
      },
      update: {
        path: item.path,
        contextId: currentContextRecord.id,
      },
      create: {
        projectId,
        contextId: currentContextRecord.id,
        type: item.type,
        path: item.path,
        content: '',
        status: 'NOT_GENERATED',
      },
    })
  }

  return plan
}
