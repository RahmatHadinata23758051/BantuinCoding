export const GENERATION_STAGES = [
  {
    id: 'planner',
    labelKey: 'generationStagePlanner',
    descriptionKey: 'generationStagePlannerDesc',
  },
  {
    id: 'documents',
    labelKey: 'generationStageDocuments',
    descriptionKey: 'generationStageDocumentsDesc',
  },
  {
    id: 'agentRules',
    labelKey: 'generationStageAgentRules',
    descriptionKey: 'generationStageAgentRulesDesc',
  },
  {
    id: 'skills',
    labelKey: 'generationStageSkills',
    descriptionKey: 'generationStageSkillsDesc',
  },
  {
    id: 'backlog',
    labelKey: 'generationStageBacklog',
    descriptionKey: 'generationStageBacklogDesc',
  },
  {
    id: 'validation',
    labelKey: 'generationStageValidation',
    descriptionKey: 'generationStageValidationDesc',
  },
] as const

export const GENERATION_STAGE_STATUS_KEYS = [
  'queued',
  'running',
  'complete',
  'failed',
  'skipped',
] as const

export type GenerationStageId = (typeof GENERATION_STAGES)[number]['id']
export type GenerationStageStatus =
  | 'queued'
  | 'running'
  | 'complete'
  | 'failed'
  | 'skipped'

export interface GenerationStageState {
  status: GenerationStageStatus
  error?: string
}

export type GenerationStageStates = Record<GenerationStageId, GenerationStageState>

export interface GenerationState {
  stages: GenerationStageStates
  activeStage: GenerationStageId | null
  isRunning: boolean
}

export interface PersistedGenerationArtifact {
  type: string
  status: string
}

const COMPLETE_ARTIFACT_STATUSES = new Set(['READY', 'MODIFIED'])
const FAILED_ARTIFACT_STATUSES = new Set(['FAILED', 'OUTDATED'])
const RUNNING_ARTIFACT_STATUSES = new Set(['GENERATING'])

export function createQueuedGenerationState(): GenerationState {
  return {
    stages: Object.fromEntries(
      GENERATION_STAGES.map(({ id }) => [id, { status: 'queued' }]),
    ) as GenerationStageStates,
    activeStage: null,
    isRunning: false,
  }
}

export function createPersistedGenerationState({
  projectStatus,
  artifacts,
  requiredArtifactTypes,
  hasSkills = false,
  hasBacklog = false,
}: {
  projectStatus: string
  artifacts: PersistedGenerationArtifact[]
  requiredArtifactTypes?: string[]
  hasSkills?: boolean
  hasBacklog?: boolean
}): GenerationState {
  const state = createQueuedGenerationState()
  const artifactByType = new Map(artifacts.map((artifact) => [artifact.type, artifact]))
  const coreTypes = ['PRD', 'SRS', 'DESIGN', 'ARCHITECTURE']
  const requiredCoreTypes = (requiredArtifactTypes ?? coreTypes).filter((type) => coreTypes.includes(type))
  const coreArtifacts = requiredCoreTypes.map((type) => artifactByType.get(type))
  const hasCoreFailure = coreArtifacts.some(
    (artifact) => artifact && FAILED_ARTIFACT_STATUSES.has(artifact.status),
  )
  const hasCoreRunning = coreArtifacts.some(
    (artifact) => artifact && RUNNING_ARTIFACT_STATUSES.has(artifact.status),
  )
  const hasCoreCompletion =
    requiredCoreTypes.length > 0 &&
    coreArtifacts.every(
      (artifact) => artifact && COMPLETE_ARTIFACT_STATUSES.has(artifact.status),
    )
  const agent = artifactByType.get('AGENT')
  const hasAgentCompletion = agent ? COMPLETE_ARTIFACT_STATUSES.has(agent.status) : false
  const hasAgentFailure = agent ? FAILED_ARTIFACT_STATUSES.has(agent.status) : false
  const backlog = artifactByType.get('BACKLOG')
  const hasBacklogFailure = backlog ? FAILED_ARTIFACT_STATUSES.has(backlog.status) : false
  const hasBacklogRunning = backlog ? RUNNING_ARTIFACT_STATUSES.has(backlog.status) : false
  const hasFailedProject = projectStatus === 'GENERATION_FAILED'

  state.stages.planner.status = artifacts.length > 0 ? 'complete' : 'queued'
  state.stages.documents.status = hasCoreFailure || (hasFailedProject && !hasCoreCompletion)
    ? 'failed'
    : hasCoreRunning
      ? 'running'
      : hasCoreCompletion
        ? 'complete'
        : 'queued'
  if (hasCoreRunning) state.activeStage = 'documents'

  const agentRunning = agent ? RUNNING_ARTIFACT_STATUSES.has(agent.status) : false
  if (agentRunning) {
    state.stages.agentRules.status = 'running'
    state.activeStage = 'agentRules'
  }
  if (!agentRunning) {
    state.stages.agentRules.status = hasAgentFailure
      ? 'failed'
      : hasAgentCompletion
        ? 'complete'
        : 'queued'
  }
  state.stages.skills.status = hasSkills ? 'complete' : 'queued'
  state.stages.backlog.status = hasBacklogFailure
    ? 'failed'
    : hasBacklogRunning
      ? 'running'
      : hasBacklog
        ? 'complete'
        : 'queued'
  if (hasBacklogRunning) state.activeStage = 'backlog'

  if (projectStatus === 'READY' || projectStatus === 'EXPORTABLE') {
    state.stages.validation.status = 'complete'
  }

  state.isRunning = state.activeStage !== null
  return state
}

export function getGenerationStageLabelKey(stage: GenerationStageId) {
  return GENERATION_STAGES.find(({ id }) => id === stage)?.labelKey ?? 'generationStageDocuments'
}

export function getGenerationStageDescriptionKey(stage: GenerationStageId) {
  return GENERATION_STAGES.find(({ id }) => id === stage)?.descriptionKey ?? 'generationStageDocumentsDesc'
}

export function getGenerationStageStatusKey(status: GenerationStageStatus) {
  return `generationStatus${status.charAt(0).toUpperCase()}${status.slice(1)}` as const
}

export function getGenerationStageIconState(status: GenerationStageStatus) {
  return status
}
export function markGenerationStageRunning(
  state: GenerationState,
  stage: GenerationStageId,
): GenerationState {
  return {
    stages: {
      ...state.stages,
      [stage]: { status: 'running' },
    },
    activeStage: stage,
    isRunning: true,
  }
}

export function markGenerationStageSkipped(
  state: GenerationState,
  stage: GenerationStageId,
): GenerationState {
  return {
    stages: {
      ...state.stages,
      [stage]: { status: 'skipped' },
    },
    activeStage: null,
    isRunning: false,
  }
}

export function markGenerationStageComplete(
  state: GenerationState,
  stage: GenerationStageId,
): GenerationState {
  const stages = {
    ...state.stages,
    [stage]: { status: 'complete' },
  }
  const nextStage = GENERATION_STAGES[GENERATION_STAGES.findIndex(({ id }) => id === stage) + 1]?.id ?? null

  return {
    stages,
    activeStage: nextStage,
    isRunning: nextStage !== null,
  }
}

export function markGenerationStageFailed(
  state: GenerationState,
  stage: GenerationStageId,
  error: string,
): GenerationState {
  const stageIndex = GENERATION_STAGES.findIndex(({ id }) => id === stage)
  const stages = { ...state.stages, [stage]: { status: 'failed', error } }

  for (const { id } of GENERATION_STAGES.slice(stageIndex + 1)) {
    if (stages[id].status !== 'complete') stages[id] = { status: 'skipped' }
  }

  return {
    stages,
    activeStage: stage,
    isRunning: false,
  }
}

export function getRetryableGenerationStages(state: GenerationState): GenerationStageId[] {
  const firstAttentionIndex = GENERATION_STAGES.findIndex(({ id }) => {
    const status = state.stages[id].status
    return status === 'failed' || status === 'skipped' || status === 'queued'
  })

  if (firstAttentionIndex < 0) return []

  return GENERATION_STAGES.slice(firstAttentionIndex).map(({ id }) => id)
}

export function resetGenerationForRetry(state: GenerationState): GenerationState {
  const retryable = new Set(getRetryableGenerationStages(state))

  return {
    stages: Object.fromEntries(
      GENERATION_STAGES.map(({ id }) => [
        id,
        retryable.has(id) ? { status: 'queued' } : state.stages[id],
      ]),
    ) as GenerationStageStates,
    activeStage: null,
    isRunning: false,
  }
}

export function isGenerationComplete(state: GenerationState): boolean {
  return GENERATION_STAGES.every(({ id }) => state.stages[id].status === 'complete')
}

/** Returns the percentage of milestones that are actually complete. */
export function getGenerationProgressPercentage(state: GenerationState): number {
  const completed = GENERATION_STAGES.filter(({ id }) => state.stages[id].status === 'complete').length
  return Math.round((completed / GENERATION_STAGES.length) * 100)
}

/** Returns 100 only when the requested stage is complete. */
export function getGenerationStagePercentage(
  state: GenerationState,
  stage: GenerationStageId,
): number {
  return state.stages[stage].status === 'complete' ? 100 : 0
}

/** Returns per-stage percentages in canonical stage order. */
export function getGenerationStagePercentages(
  state: GenerationState,
): Record<GenerationStageId, number> {
  return Object.fromEntries(
    GENERATION_STAGES.map(({ id }) => [id, getGenerationStagePercentage(state, id)]),
  ) as Record<GenerationStageId, number>
}

