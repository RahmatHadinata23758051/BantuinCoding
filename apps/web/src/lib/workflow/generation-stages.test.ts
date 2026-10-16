import { describe, expect, it } from 'vitest'

import {
  GENERATION_STAGES,
  createPersistedGenerationState,
  createQueuedGenerationState,
  getGenerationProgressPercentage,
  getGenerationStagePercentage,
  getGenerationStagePercentages,
  getRetryableGenerationStages,
  isGenerationComplete,
  markGenerationStageComplete,
  markGenerationStageFailed,
  markGenerationStageRunning,
  resetGenerationForRetry,
  reconcileGenerationStateAfterArtifactUpdate,
} from './generation-stages'

describe('generation stages', () => {
  it('keeps a stable bounded stage order', () => {
    expect(GENERATION_STAGES.map((stage) => stage.id)).toEqual([
      'planner',
      'documents',
      'agentRules',
      'skills',
      'backlog',
      'validation',
    ])
  })

  it('starts with every stage queued and zero progress', () => {
    const state = createQueuedGenerationState()

    expect(Object.values(state.stages).every((stage) => stage.status === 'queued')).toBe(true)
    expect(state.activeStage).toBeNull()
    expect(state.isRunning).toBe(false)
    expect(getGenerationProgressPercentage(state)).toBe(0)
    expect(getGenerationStagePercentage(state, 'planner')).toBe(0)
    expect(getGenerationStagePercentages(state).validation).toBe(0)
  })

  it('advances progress only after stages complete', () => {
    let state = createQueuedGenerationState()

    for (const [index, stage] of GENERATION_STAGES.entries()) {
      state = markGenerationStageComplete(state, stage.id)
      expect(getGenerationProgressPercentage(state)).toBe(Math.round(((index + 1) / GENERATION_STAGES.length) * 100))
      expect(getGenerationStagePercentage(state, stage.id)).toBe(100)
    }

    expect(getGenerationProgressPercentage(state)).toBe(100)
  })

  it('does not count failed or running stages as complete', () => {
    let state = createQueuedGenerationState()
    state = markGenerationStageComplete(state, 'planner')
    state = markGenerationStageRunning(state, 'documents')
    state = markGenerationStageFailed(state, 'documents', 'failed')

    expect(getGenerationProgressPercentage(state)).toBe(Math.round(100 / GENERATION_STAGES.length))
    expect(getGenerationStagePercentage(state, 'documents')).toBe(0)
  })

  it('preserves completed progress when retrying', () => {
    let state = createQueuedGenerationState()
    state = markGenerationStageComplete(state, 'planner')
    state = markGenerationStageFailed(state, 'documents', 'failed')

    expect(getGenerationProgressPercentage(resetGenerationForRetry(state))).toBe(Math.round(100 / GENERATION_STAGES.length))
  })

  it('does not count a planned artifact as generated progress', () => {
    const state = createPersistedGenerationState({
      projectStatus: 'GENERATING',
      artifacts: [{ type: 'PRD', status: 'READY' }],
    })

    expect(getGenerationProgressPercentage(state)).toBe(Math.round(100 / GENERATION_STAGES.length))
  })

  it('moves a stage through running to complete without inferring later success', () => {
    const running = markGenerationStageRunning(createQueuedGenerationState(), 'planner')
    const complete = markGenerationStageComplete(running, 'planner')

    expect(running.stages.planner.status).toBe('running')
    expect(complete.stages.planner.status).toBe('complete')
    expect(complete.stages.documents.status).toBe('queued')
    expect(complete.activeStage).toBe('documents')
  })

  it('stops after completing the final validation stage', () => {
    const running = markGenerationStageRunning(createQueuedGenerationState(), 'validation')
    const complete = markGenerationStageComplete(running, 'validation')

    expect(complete.stages.validation.status).toBe('complete')
    expect(complete.activeStage).toBeNull()
    expect(complete.isRunning).toBe(false)
  })

  it('does not reconcile a failed document artifact as complete', () => {
    const state = markGenerationStageRunning(createQueuedGenerationState(), 'documents')
    const reconciled = reconcileGenerationStateAfterArtifactUpdate({
      state,
      artifacts: [
        { type: 'PRD', status: 'READY' },
        { type: 'ARCHITECTURE', status: 'OUTDATED' },
      ],
      updatedType: 'ARCHITECTURE',
      projectStatus: 'GENERATION_FAILED',
      requiredArtifactTypes: ['PRD', 'ARCHITECTURE'],
    })

    expect(reconciled.stages.documents.status).toBe('failed')
    expect(reconciled.activeStage).toBe('documents')
    expect(reconciled.isRunning).toBe(false)
  })

  it('preserves completed stages and skips downstream work after failure', () => {
    let state = createQueuedGenerationState()
    state = markGenerationStageComplete(state, 'planner')
    state = markGenerationStageRunning(state, 'documents')
    state = markGenerationStageFailed(state, 'documents', 'Document request failed')

    expect(state.stages.planner.status).toBe('complete')
    expect(state.stages.documents).toEqual({ status: 'failed', error: 'Document request failed' })
    expect(state.stages.agentRules.status).toBe('skipped')
    expect(state.stages.backlog.status).toBe('skipped')
    expect(state.activeStage).toBe('documents')
    expect(state.isRunning).toBe(false)
  })

  it('retries from the first attention stage without resetting completed work', () => {
    let state = createQueuedGenerationState()
    state = markGenerationStageComplete(state, 'planner')
    state = markGenerationStageFailed(state, 'documents', 'Document request failed')

    expect(getRetryableGenerationStages(state)).toEqual([
      'documents',
      'agentRules',
      'skills',
      'backlog',
      'validation',
    ])

    const retry = resetGenerationForRetry(state)
    expect(retry.stages.planner.status).toBe('complete')
    expect(Object.values(retry.stages).slice(1).every((stage) => stage.status === 'queued')).toBe(true)
  })

  it('does not treat a planned SRS as generated', () => {
    const state = createPersistedGenerationState({
      projectStatus: 'GENERATING',
      artifacts: [
        { type: 'PRD', status: 'READY' },
        { type: 'ARCHITECTURE', status: 'READY' },
      ],
    })

    expect(state.stages.documents.status).toBe('queued')
    expect(state.stages.agentRules.status).toBe('queued')
    expect(isGenerationComplete(state)).toBe(false)
  })

  it('reconstructs failed document progress from persisted artifact state', () => {
    const state = createPersistedGenerationState({
      projectStatus: 'GENERATION_FAILED',
      artifacts: [
        { type: 'PRD', status: 'READY' },
        { type: 'ARCHITECTURE', status: 'FAILED' },
        { type: 'AGENT', status: 'READY' },
      ],
    })

    expect(state.stages.documents.status).toBe('failed')
    expect(state.stages.agentRules.status).toBe('complete')
    expect(getRetryableGenerationStages(state)[0]).toBe('documents')
  })

  it('retries only stages that still need work', () => {
    let state = createQueuedGenerationState()
    state = markGenerationStageComplete(state, 'planner')
    state = markGenerationStageFailed(state, 'documents', 'Document request failed')
    state = { ...state, stages: { ...state.stages, agentRules: { status: 'complete' }, backlog: { status: 'complete' } } }

    expect(getRetryableGenerationStages(state)).toEqual(['documents', 'skills', 'validation'])
    const retry = resetGenerationForRetry(state)
    expect(retry.stages.agentRules.status).toBe('complete')
    expect(retry.stages.backlog.status).toBe('complete')
  })

  it('reconciles a repaired document without clearing completed later stages', () => {
    const state = createPersistedGenerationState({
      projectStatus: 'GENERATION_FAILED',
      artifacts: [
        { type: 'PRD', status: 'READY' },
        { type: 'ARCHITECTURE', status: 'FAILED' },
        { type: 'AGENT', status: 'READY' },
        { type: 'BACKLOG', status: 'READY' },
      ],
      hasSkills: true,
      hasBacklog: true,
    })

    const repaired = reconcileGenerationStateAfterArtifactUpdate({
      state,
      projectStatus: 'GENERATION_FAILED',
      updatedType: 'ARCHITECTURE',
      requiredArtifactTypes: ['PRD', 'ARCHITECTURE'],
      artifacts: [
        { type: 'PRD', status: 'READY' },
        { type: 'ARCHITECTURE', status: 'READY' },
        { type: 'AGENT', status: 'READY' },
        { type: 'BACKLOG', status: 'READY' },
      ],
      hasSkills: true,
      hasBacklog: true,
    })

    expect(repaired.stages.documents.status).toBe('complete')
    expect(repaired.stages.agentRules.status).toBe('complete')
    expect(repaired.stages.backlog.status).toBe('complete')
    expect(repaired.stages.documents.error).toBeUndefined()
  })
})
