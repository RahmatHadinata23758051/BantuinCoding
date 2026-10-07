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
 * Uses tier-based document selection based on project classification.
 */
export function getDefaultArtifactPlan(
  classification: ProjectClassification,
  contextJson?: string,
): ArtifactPlanOutput {
  const needsDesign = requiresDesignArtifact(classification, contextJson)

  // Tier 1: Simple (STATIC_SITE, LANDING_PAGE)
  if (classification === 'STATIC_SITE' || classification === 'LANDING_PAGE') {
    const artifacts = [
      { type: 'PRD' as const, path: 'PRD.md', reason: 'Product requirements & functional specs', isRequired: true },
      ...(needsDesign
        ? [{ type: 'DESIGN' as const, path: 'DESIGN.md', reason: 'Locked visual contract and UI system', isRequired: true }]
        : []),
      { type: 'BACKLOG' as const, path: 'BACKLOG.md', reason: 'Phased backlog tasks', isRequired: true },
      { type: 'AGENT' as const, path: 'Agent.md', reason: 'Coding agent contract (incl. rules & skills)', isRequired: true },
    ]
    return {
      classification,
      artifacts,
      rationale: `Minimal documentation pack for ${classification}`,
    }
  }

  // Tier 3: Complex (SAAS, FULLSTACK_COMPLEX, AI_APP, IOT_DASHBOARD)
  const isComplex =
    classification === 'SAAS' ||
    classification === 'FULLSTACK_COMPLEX' ||
    classification === 'AI_APP' ||
    classification === 'IOT_DASHBOARD'
  if (isComplex) {
    const artifacts = [
      { type: 'PRD' as const, path: 'PRD.md', reason: 'Product requirements', isRequired: true },
      { type: 'ARCHITECTURE' as const, path: 'ARCHITECTURE.md', reason: 'System architecture', isRequired: true },
      ...(needsDesign
        ? [{ type: 'DESIGN' as const, path: 'DESIGN.md', reason: 'Locked visual contract and UI system', isRequired: true }]
        : []),
      { type: 'AGENT' as const, path: 'Agent.md', reason: 'Coding agent contract (incl. rules & skills)', isRequired: true },
      { type: 'BACKLOG' as const, path: 'BACKLOG.md', reason: 'Phased backlog tasks', isRequired: true },
    ]
    return {
      classification,
      artifacts,
      rationale: `Full-stack documentation pack for ${classification}`,
    }
  }

  // Tier 2: Standard (CRUD_APP, DASHBOARD, MOBILE_APP, etc.)
  const artifacts = [
    { type: 'PRD' as const, path: 'PRD.md', reason: 'Product requirements & functional specs', isRequired: true },
    { type: 'ARCHITECTURE' as const, path: 'ARCHITECTURE.md', reason: 'System architecture', isRequired: true },
    ...(needsDesign
      ? [{ type: 'DESIGN' as const, path: 'DESIGN.md', reason: 'Locked visual contract and UI system', isRequired: true }]
      : []),
    { type: 'AGENT' as const, path: 'Agent.md', reason: 'Coding agent contract (incl. rules & skills)', isRequired: true },
    { type: 'BACKLOG' as const, path: 'BACKLOG.md', reason: 'Phased backlog tasks', isRequired: true },
  ]
  return {
    classification,
    artifacts,
    rationale: `Standard documentation pack for ${classification}`,
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

    // A new plan invalidates every previous artifact snapshot. Planned rows are
    // recreated as empty pending documents below; removed rows stay OUTDATED so
    // they cannot be mistaken for part of the current pack.
    await tx.artifact.updateMany({
      where: { projectId },
      data: { status: 'OUTDATED', content: '' },
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
          // A project has one artifact row per type. Re-planning moves the
          // row to the current context and clears the previous document.
          contextId: currentContextRecord.id,
          path: item.path,
          content: '',
          status: 'NOT_GENERATED',
          isRequired: item.isRequired,
          planReason: item.reason,
          provider: null,
          model: null,
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
