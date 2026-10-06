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

  it('starts with every stage queued', () => {
    const state = createQueuedGenerationState()

    expect(Object.values(state.stages).every((stage) => stage.status === 'queued')).toBe(true)
    expect(state.activeStage).toBeNull()
    expect(state.isRunning).toBe(false)
  })

  it('moves a stage through running to complete without inferring later success', () => {
    const running = markGenerationStageRunning(createQueuedGenerationState(), 'planner')
    const complete = markGenerationStageComplete(running, 'planner')

    expect(running.stages.planner.status).toBe('running')
    expect(complete.stages.planner.status).toBe('complete')
    expect(complete.stages.documents.status).toBe('queued')
    expect(complete.activeStage).toBe('documents')
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
})
