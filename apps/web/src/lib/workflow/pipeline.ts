export const PIPELINE_STAGES = [
  {
    key: 'idea',
    tab: 'overview',
    labelKey: 'idea',
    detailKey: 'ideaDetail',
  },
  {
    key: 'clarify',
    tab: 'context',
    labelKey: 'clarify',
    detailKey: 'clarifyDetail',
  },
  {
    key: 'context',
    tab: 'context',
    labelKey: 'context',
    detailKey: 'contextDetail',
  },
  {
    key: 'generate',
    tab: 'documents',
    labelKey: 'generate',
    detailKey: 'generateDetail',
  },
  {
    key: 'review',
    tab: 'documents',
    labelKey: 'review',
    detailKey: 'reviewDetail',
  },
  {
    key: 'export',
    tab: 'export',
    labelKey: 'export',
    detailKey: 'exportDetail',
  },
] as const

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number]['key']
export type PipelineStageState = 'complete' | 'current' | 'blocked' | 'upcoming' | 'error' | 'loading'

export interface PipelineArtifactState {
  status: string
}

export interface PipelineInput {
  projectStatus: string
  hasContext: boolean
  pendingClarifications?: number
  artifacts?: PipelineArtifactState[]
  hasExported?: boolean
  canExport?: boolean
}

export interface ResolvedPipelineStage {
  key: PipelineStageKey
  tab: (typeof PIPELINE_STAGES)[number]['tab']
  labelKey: (typeof PIPELINE_STAGES)[number]['labelKey']
  detailKey: (typeof PIPELINE_STAGES)[number]['detailKey']
  state: PipelineStageState
  isActionable: boolean
}

export interface ResolvedPipeline {
  stages: ResolvedPipelineStage[]
  currentIndex: number
  current: ResolvedPipelineStage
  nextAction: PipelineStageKey
}

const READY_ARTIFACT_STATUSES = new Set(['READY', 'MODIFIED'])
const ATTENTION_ARTIFACT_STATUSES = new Set(['FAILED', 'OUTDATED', 'GENERATING', 'NOT_GENERATED'])

function stageState(
  stage: PipelineStageKey,
  currentIndex: number,
  index: number,
  input: PipelineInput,
): PipelineStageState {
  if (stage === 'generate' && input.projectStatus === 'GENERATION_FAILED') return 'error'
  if (stage === 'generate' && input.projectStatus === 'GENERATING') return 'loading'
  if (index < currentIndex) return 'complete'
  if (index === currentIndex) return 'current'
  if (stage === 'clarify' && !input.hasContext && input.projectStatus === 'DRAFT') return 'blocked'
  if (stage === 'context' && !input.hasContext) return 'blocked'
  if (stage === 'generate' && !input.hasContext) return 'blocked'
  if (stage === 'review' && !input.hasContext) return 'blocked'
  if (stage === 'export' && !input.canExport) return 'blocked'
  return 'upcoming'
}

export function resolvePipeline(input: PipelineInput): ResolvedPipeline {
  const artifacts = input.artifacts ?? []
  const readyArtifacts = artifacts.filter((artifact) => READY_ARTIFACT_STATUSES.has(artifact.status))
  const attentionArtifacts = artifacts.filter((artifact) => ATTENTION_ARTIFACT_STATUSES.has(artifact.status))
  const pendingClarifications = input.pendingClarifications ?? 0

  let currentIndex = 0

  if (input.hasExported || input.projectStatus === 'EXPORTABLE') {
    currentIndex = 5
  } else if (input.projectStatus === 'GENERATION_FAILED') {
    currentIndex = 3
  } else if (input.projectStatus === 'GENERATING') {
    currentIndex = 3
  } else if (input.projectStatus === 'ANALYZING' || input.projectStatus === 'CLARIFYING' || pendingClarifications > 0) {
    currentIndex = 1
  } else if (!input.hasContext) {
    currentIndex = 0
  } else if (readyArtifacts.length === 0) {
    currentIndex = 3
  } else if (attentionArtifacts.length > 0) {
    currentIndex = 3
  } else if (input.canExport) {
    currentIndex = 4
  } else {
    currentIndex = 4
  }

  const stages = PIPELINE_STAGES.map((stage, index) => {
    const state = stageState(stage.key, currentIndex, index, input)
    return {
      ...stage,
      state,
      isActionable: state === 'current' || state === 'error' || state === 'complete',
    }
  })

  const nextAction =
    input.projectStatus === 'GENERATION_FAILED'
      ? 'generate'
      : pendingClarifications > 0
        ? 'clarify'
        : !input.hasContext
          ? 'idea'
          : readyArtifacts.length === 0 || attentionArtifacts.length > 0
            ? 'generate'
            : input.canExport && !input.hasExported
              ? 'export'
              : 'review'

  return {
    stages,
    currentIndex,
    current: stages[currentIndex],
    nextAction,
  }
}

export function pipelineFromCurrent(current: PipelineStageKey): ResolvedPipeline {
  const currentIndex = PIPELINE_STAGES.findIndex((stage) => stage.key === current)
  const safeIndex = currentIndex < 0 ? 0 : currentIndex
  const stages: ResolvedPipelineStage[] = PIPELINE_STAGES.map((stage, index) => ({
    ...stage,
    state: (index < safeIndex ? 'complete' : index === safeIndex ? 'current' : 'upcoming') as PipelineStageState,
    isActionable: index <= safeIndex,
  }))

  return {
    stages,
    currentIndex: safeIndex,
    current: stages[safeIndex],
    nextAction: current,
  }
}
