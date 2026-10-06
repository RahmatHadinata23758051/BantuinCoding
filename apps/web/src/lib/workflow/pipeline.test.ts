import { describe, expect, it } from 'vitest'

import { pipelineFromCurrent, resolvePipeline } from './pipeline'

describe('resolvePipeline', () => {
  it('keeps a new draft at the idea stage', () => {
    const result = resolvePipeline({ projectStatus: 'DRAFT', hasContext: false })

    expect(result.current.key).toBe('idea')
    expect(result.nextAction).toBe('idea')
    expect(result.stages[1].state).toBe('blocked')
  })

  it('prioritizes unanswered clarification over generation', () => {
    const result = resolvePipeline({
      projectStatus: 'CLARIFYING',
      hasContext: false,
      pendingClarifications: 2,
    })

    expect(result.current.key).toBe('clarify')
    expect(result.nextAction).toBe('clarify')
  })

  it('marks a failed generation as an actionable error', () => {
    const result = resolvePipeline({
      projectStatus: 'GENERATION_FAILED',
      hasContext: true,
      artifacts: [{ status: 'FAILED' }],
    })

    expect(result.current.key).toBe('generate')
    expect(result.current.state).toBe('error')
    expect(result.nextAction).toBe('generate')
  })

  it('moves a complete pack to review until export succeeds', () => {
    const result = resolvePipeline({
      projectStatus: 'READY',
      hasContext: true,
      artifacts: [{ status: 'READY' }],
      canExport: true,
    })

    expect(result.current.key).toBe('review')
    expect(result.stages[4].state).toBe('current')
    expect(result.stages[5].state).toBe('upcoming')
  })

  it('marks the export stage complete only after authoritative export state', () => {
    const result = resolvePipeline({
      projectStatus: 'EXPORTABLE',
      hasContext: true,
      artifacts: [{ status: 'READY' }],
      canExport: true,
      hasExported: true,
    })

    expect(result.current.key).toBe('export')
    expect(result.stages.every((stage) => stage.state === 'complete' || stage.state === 'current')).toBe(true)
  })
})

describe('pipelineFromCurrent', () => {
  it('falls back safely for an unknown stage', () => {
    const result = pipelineFromCurrent('not-a-stage' as never)

    expect(result.current.key).toBe('idea')
  })
})
