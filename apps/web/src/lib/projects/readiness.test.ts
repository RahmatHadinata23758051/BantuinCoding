import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => ({
  project: { findFirst: vi.fn(), update: vi.fn() },
}))

vi.mock('@repo/db', () => ({ db: dbMock }))

import { getProjectReadiness, recomputeProjectReadiness } from './readiness-service'

function projectWith(options: {
  contextId?: string
  requiredTypes?: string[]
  artifacts?: Array<{ type: string; contextId: string; status: string }>
}) {
  const contextId = options.contextId ?? 'ctx-current'
  return {
    status: 'GENERATING',
    contexts: options.contextId === ''
      ? []
      : [{
          id: contextId,
          artifactPlans: (options.requiredTypes ?? []).map((type) => ({ type })),
        }],
    artifacts: options.artifacts ?? [],
  }
}

describe('project readiness', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is not ready without a current context', async () => {
    dbMock.project.findFirst.mockResolvedValue(projectWith({ contextId: '' }))
    await expect(getProjectReadiness('u-1', 'p-1')).resolves.toEqual({
      isReady: false,
      requiredTypes: [],
      missingTypes: [],
      blockingTypes: [],
    })
  })

  it('detects a required planned artifact that is missing', async () => {
    dbMock.project.findFirst.mockResolvedValue(projectWith({ requiredTypes: ['PRD', 'SRS'] }))
    const result = await getProjectReadiness('u-1', 'p-1')
    expect(result.missingTypes).toEqual(['PRD', 'SRS'])
    expect(result.isReady).toBe(false)
  })

  it.each(['READY', 'MODIFIED'])('accepts required artifact status %s', async (status) => {
    dbMock.project.findFirst.mockResolvedValue(projectWith({
      requiredTypes: ['PRD'],
      artifacts: [{ type: 'PRD', contextId: 'ctx-current', status }],
    }))
    await expect(getProjectReadiness('u-1', 'p-1')).resolves.toMatchObject({ isReady: true })
  })

  it.each(['FAILED', 'OUTDATED', 'GENERATING', 'NOT_GENERATED'])(
    'blocks required artifact status %s',
    async (status) => {
      dbMock.project.findFirst.mockResolvedValue(projectWith({
        requiredTypes: ['PRD'],
        artifacts: [{ type: 'PRD', contextId: 'ctx-current', status }],
      }))
      await expect(getProjectReadiness('u-1', 'p-1')).resolves.toMatchObject({
        isReady: false,
        blockingTypes: ['PRD'],
      })
    },
  )

  it('blocks a required artifact generated from an old context', async () => {
    dbMock.project.findFirst.mockResolvedValue(projectWith({
      requiredTypes: ['PRD'],
      artifacts: [{ type: 'PRD', contextId: 'ctx-old', status: 'READY' }],
    }))
    await expect(getProjectReadiness('u-1', 'p-1')).resolves.toMatchObject({
      isReady: false,
      blockingTypes: ['PRD'],
    })
  })

  it('ignores optional and unplanned artifact statuses', async () => {
    dbMock.project.findFirst.mockResolvedValue(projectWith({
      requiredTypes: ['PRD'],
      artifacts: [
        { type: 'PRD', contextId: 'ctx-current', status: 'READY' },
        { type: 'README', contextId: 'ctx-old', status: 'FAILED' },
      ],
    }))
    await expect(getProjectReadiness('u-1', 'p-1')).resolves.toMatchObject({ isReady: true })
  })

  it('moves GENERATING to READY only when every current requirement is usable', async () => {
    dbMock.project.findFirst
      .mockResolvedValueOnce({ status: 'GENERATING' })
      .mockResolvedValueOnce(projectWith({
        requiredTypes: ['PRD'],
        artifacts: [{ type: 'PRD', contextId: 'ctx-current', status: 'READY' }],
      }))
    dbMock.project.update.mockResolvedValue({ status: 'READY' })

    await recomputeProjectReadiness('u-1', 'p-1')

    expect(dbMock.project.update).toHaveBeenCalledWith({
      where: { id: 'p-1' },
      data: { status: 'READY' },
    })
  })

  it.each(['OUTDATED', 'FAILED'])('demotes EXPORTABLE when a current required artifact is %s', async (status) => {
    dbMock.project.findFirst
      .mockResolvedValueOnce({ status: 'EXPORTABLE' })
      .mockResolvedValueOnce(projectWith({
        requiredTypes: ['PRD'],
        artifacts: [{ type: 'PRD', contextId: 'ctx-current', status }],
      }))
    dbMock.project.update.mockResolvedValue({ status: 'READY' })

    await recomputeProjectReadiness('u-1', 'p-1')

    expect(dbMock.project.update).toHaveBeenCalledWith({
      where: { id: 'p-1' },
      data: { status: 'READY' },
    })
  })

  it('demotes EXPORTABLE when a required current artifact is missing', async () => {
    dbMock.project.findFirst
      .mockResolvedValueOnce({ status: 'EXPORTABLE' })
      .mockResolvedValueOnce(projectWith({ requiredTypes: ['PRD'] }))
    dbMock.project.update.mockResolvedValue({ status: 'READY' })

    await recomputeProjectReadiness('u-1', 'p-1')

    expect(dbMock.project.update).toHaveBeenCalledWith({
      where: { id: 'p-1' },
      data: { status: 'READY' },
    })
  })

  it('does not update READY when readiness is blocked', async () => {
    dbMock.project.findFirst
      .mockResolvedValueOnce({ status: 'READY' })
      .mockResolvedValueOnce(projectWith({
        requiredTypes: ['PRD'],
        artifacts: [{ type: 'PRD', contextId: 'ctx-old', status: 'READY' }],
      }))

    await recomputeProjectReadiness('u-1', 'p-1')

    expect(dbMock.project.update).not.toHaveBeenCalled()
  })
})
