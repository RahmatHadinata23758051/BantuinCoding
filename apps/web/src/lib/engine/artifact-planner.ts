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
import { updateProject } from '@/lib/projects/project-service'

export interface PlanArtifactsOptions {
  userId: string
  projectId: string
}

const UI_PRODUCT_CLASSIFICATIONS = new Set<ProjectClassification>([
  'STATIC_SITE',
  'LANDING_PAGE',
  'CRUD_APP',
  'DASHBOARD',
  'SAAS',
  'MOBILE_APP',
  'AI_APP',
  'IOT_DASHBOARD',
  'FULLSTACK_COMPLEX',
])

function hasConfirmedContextValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (!value || typeof value !== 'object') return false

  const contextValue = value as { value?: unknown; provenance?: unknown }
  return (
    typeof contextValue.value === 'string' &&
    contextValue.value.trim().length > 0 &&
    contextValue.provenance !== 'unknown'
  )
}

export function requiresDesignArtifact(
  classification: ProjectClassification,
  contextJson?: string,
): boolean {
  if (UI_PRODUCT_CLASSIFICATIONS.has(classification)) return true
  if (!contextJson) return false

  try {
    const context = JSON.parse(contextJson) as {
      design_direction?: unknown
      stack_preferences?: { styling?: unknown }
    }

    return (
      hasConfirmedContextValue(context.design_direction) ||
      hasConfirmedContextValue(context.stack_preferences?.styling)
    )
  } catch {
    return false
  }
}

export function ensureDesignArtifact(
  plan: ArtifactPlanOutput,
  contextJson?: string,
): ArtifactPlanOutput {
  if (!requiresDesignArtifact(plan.classification, contextJson)) return plan

  const designArtifact = plan.artifacts.find((artifact) => artifact.type === 'DESIGN')
  if (designArtifact) {
    return {
      ...plan,
      artifacts: plan.artifacts.map((artifact) =>
        artifact.type === 'DESIGN'
          ? {
              ...artifact,
              path: 'DESIGN.md',
              reason: artifact.reason || 'Locked visual contract and UI system',
              isRequired: true,
            }
          : artifact,
      ),
    }
  }

  const architectureIndex = plan.artifacts.findIndex(
    (artifact) => artifact.type === 'ARCHITECTURE',
  )
  const insertAt = architectureIndex >= 0 ? architectureIndex : plan.artifacts.length
  const artifacts = [...plan.artifacts]
  artifacts.splice(insertAt, 0, {
    type: 'DESIGN',
    path: 'DESIGN.md',
    reason: 'Locked visual contract and UI system',
    isRequired: true,
  })

  return { ...plan, artifacts }
}

/**
 * Deterministic baseline artifact plan used when AI planning is unavailable.
 */
export function getDefaultArtifactPlan(
  classification: ProjectClassification,
  contextJson?: string,
): ArtifactPlanOutput {
  const isMinimal =
    classification === 'STATIC_SITE' || classification === 'LANDING_PAGE'

  const needsDesign = requiresDesignArtifact(classification, contextJson)

  const mandatory = [
    { type: 'PRD' as const, path: 'PRD.md', reason: 'Product requirements', isRequired: true },
    { type: 'SRS' as const, path: 'SRS.md', reason: 'Software specification', isRequired: true },
    ...(needsDesign
      ? [{ type: 'DESIGN' as const, path: 'DESIGN.md', reason: 'Locked visual contract and UI system', isRequired: true }]
      : []),
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
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  const provider = createProvider(providerConfig)
  const userPrompt = buildArtifactPlannerUserPrompt(
    project.name,
    project.classification as ProjectClassification,
    currentContextRecord.contentJson,
  )
  let plan: ArtifactPlanOutput
  try {
    const rawPlan = await provider.generateStructured(
      userPrompt,
      ArtifactPlanSchema,
      {
        system: ARTIFACT_PLANNER_SYSTEM_PROMPT,
        maxTokens: 2048,
        temperature: 0.2,
      },
    )
    plan = ensureDesignArtifact(rawPlan, currentContextRecord.contentJson)
  } catch {
    // If AI fails (e.g. invalid enum values, schema validation error),
    // use the deterministic baseline plan for this classification!
    plan = getDefaultArtifactPlan(
      project.classification as ProjectClassification,
      currentContextRecord.contentJson,
    )
  }

  // Persist the authoritative artifact plan for the current context and
  // create placeholder Artifact rows for workspace visibility. Readiness is
  // derived from artifactPlanItem records, not from already-created artifacts.
  await db.$transaction(async (tx) => {
    await tx.artifactPlanItem.deleteMany({
      where: { projectId, contextId: currentContextRecord.id },
    })

    for (const item of plan.artifacts) {
      await tx.artifactPlanItem.create({
        data: {
          projectId,
          contextId: currentContextRecord.id,
          type: item.type,
          path: item.path,
          isRequired: item.isRequired,
          reason: item.reason,
        },
      })

      await tx.artifact.upsert({
        where: {
          projectId_type: { projectId, type: item.type },
        },
        update: {
          path: item.path,
          isRequired: item.isRequired,
          planReason: item.reason,
        },
        create: {
          projectId,
          contextId: currentContextRecord.id,
          type: item.type,
          path: item.path,
          content: '',
          status: 'NOT_GENERATED',
          isRequired: item.isRequired,
          planReason: item.reason,
        },
      })
    }
  })

  if (project.status === 'READY' || project.status === 'EXPORTABLE') {
    await updateProject(userId, projectId, { status: 'GENERATING' })
  }

  return plan
}
