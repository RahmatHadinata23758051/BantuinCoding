import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCurrentRequirementAnalysis,
  persistRequirementAnalysis,
} from '@/lib/engine/analysis-store'

const mocks = vi.hoisted(() => ({
  projectAnalysis: {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('@repo/db', () => ({
  db: {
    projectAnalysis: mocks.projectAnalysis,
    $transaction: vi.fn(async (callback: (tx: { projectAnalysis: typeof mocks.projectAnalysis }) => unknown) =>
      callback({ projectAnalysis: mocks.projectAnalysis }),
    ),
  },
}))

const projectAnalysis = mocks.projectAnalysis

const validAnalysis = {
  known_facts: ['A confirmed fact'],
  missing_information: ['Deployment target'],
  ambiguities: ['Expected scale'],
  important_decisions: ['Authentication method'],
  optional_decisions: ['Dark mode'],
  risk_flags: ['Sensitive data handling'],
}

describe('requirement analysis persistence', () => {
  beforeEach(() => vi.clearAllMocks())

  it('persists the first validated analysis as version 1 and current', async () => {
    projectAnalysis.findFirst.mockResolvedValueOnce(null)
    projectAnalysis.create.mockResolvedValueOnce({ id: 'analysis-1' })

    await persistRequirementAnalysis({ projectId: 'project-1', analysis: validAnalysis })

    expect(projectAnalysis.updateMany).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      data: { isCurrent: false },
    })
    expect(projectAnalysis.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        version: 1,
        contentJson: JSON.stringify(validAnalysis),
        isCurrent: true,
      },
    })
  })

  it('increments the latest version and clears previous current records in the transaction', async () => {
    projectAnalysis.findFirst.mockResolvedValueOnce({ version: 4 })
    projectAnalysis.create.mockResolvedValueOnce({ id: 'analysis-5' })

    await persistRequirementAnalysis({ projectId: 'project-1', analysis: validAnalysis })

    expect(projectAnalysis.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 5, isCurrent: true }),
    })
    expect(projectAnalysis.updateMany).toHaveBeenCalledBefore(projectAnalysis.create)
  })

  it('rejects undeclared provider data, secrets, or transcripts before persistence', async () => {
    const unsafeAnalysis = {
      ...validAnalysis,
      apiKey: 'provider-secret-sentinel',
      rawProviderPayload: { id: 'response-1' },
      chatTranscript: [{ role: 'user', content: 'private prompt' }],
    }

    await expect(
      persistRequirementAnalysis({
        projectId: 'project-1',
        analysis: unsafeAnalysis,
      }),
    ).rejects.toThrow()

    expect(projectAnalysis.create).not.toHaveBeenCalled()
  })

  it('loads and validates only the current analysis', async () => {
    const createdAt = new Date()
    projectAnalysis.findFirst.mockResolvedValueOnce({
      id: 'analysis-2',
      version: 2,
      contentJson: JSON.stringify(validAnalysis),
      createdAt,
    })

    await expect(getCurrentRequirementAnalysis('project-1')).resolves.toEqual({
      id: 'analysis-2',
      version: 2,
      analysis: validAnalysis,
      createdAt,
    })
    expect(projectAnalysis.findFirst).toHaveBeenCalledWith({
      where: { projectId: 'project-1', isCurrent: true },
    })
  })

  it('returns null when no current analysis exists', async () => {
    projectAnalysis.findFirst.mockResolvedValueOnce(null)
    await expect(getCurrentRequirementAnalysis('project-1')).resolves.toBeNull()
  })

  it('throws a safe error for invalid persisted JSON', async () => {
    projectAnalysis.findFirst.mockResolvedValueOnce({
      id: 'analysis-1',
      version: 1,
      contentJson: '{invalid',
      createdAt: new Date(),
    })
    await expect(getCurrentRequirementAnalysis('project-1')).rejects.toThrow(
      'Persisted requirement analysis is invalid.',
    )
  })

  it('throws a safe error for schema-invalid persisted JSON', async () => {
    projectAnalysis.findFirst.mockResolvedValueOnce({
      id: 'analysis-1',
      version: 1,
      contentJson: JSON.stringify({ known_facts: [] }),
      createdAt: new Date(),
    })
    await expect(getCurrentRequirementAnalysis('project-1')).rejects.toThrow(
      'Persisted requirement analysis is invalid.',
    )
  })
})
