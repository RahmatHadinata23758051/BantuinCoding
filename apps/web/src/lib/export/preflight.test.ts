import { describe, expect, it, vi } from 'vitest'
import { getExportPreflightArtifacts, validateExportPreflight } from '@/lib/export/preflight'

vi.mock('@repo/db', () => ({
  db: {
    project: { findFirst: vi.fn() },
  },
}))

const makeArtifact = (type: string, path: string, content: string, status = 'READY', contextId = 'ctx-1') => ({
  type,
  path,
  content,
  status,
  contextId,
})

const makeProject = (content: string) => ({
  name: 'Test Project',
  contexts: [{ id: 'ctx-1', artifactPlans: [{ type: 'ARCHITECTURE' }] }],
  artifacts: [makeArtifact('ARCHITECTURE', 'ARCHITECTURE.md', content)],
})

describe('Export preflight', () => {
  it('rejects realistic credentials and concrete secrets before export', () => {
    expect(() => validateExportPreflight(makeProject(
      'DATABASE_URL="postgresql://pos_admin:secure_password@db-host:5432/resto_pos"\nNEXTAUTH_SECRET="4f9b8c2e6d1a5f7823e1b0c9a87d4e5f6123456789abcdef0123456789abcdef"',
    ))).toThrow('SECURITY ALERT: Potential API key leakage detected in ARCHITECTURE.md')
  })

  it('allows empty and unresolved placeholders', () => {
    expect(() => validateExportPreflight(makeProject(
      'DATABASE_URL=""\nDIRECT_URL=""\nNEXTAUTH_SECRET=""\nAPI_TOKEN=${API_TOKEN}',
    ))).not.toThrow()
  })

  it('requires every planned artifact to be current and ready', () => {
    const project = makeProject('# Architecture')
    project.artifacts[0]!.contextId = 'old-context'
    expect(() => validateExportPreflight(project)).toThrow('Missing or incomplete: ARCHITECTURE')
  })

  it('uses the same preflight against the persisted current project', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      ...makeProject('DATABASE_URL="postgresql://user:pass@host/db"'),
    } as never)

    await expect(getExportPreflightArtifacts('u-1', 'p-1')).rejects.toThrow('SECURITY ALERT')
    expect(db.project.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'p-1', userId: 'u-1' },
    }))
  })

  it('rejects an unsafe artifact path', () => {
    const project = makeProject('# Architecture')
    project.artifacts[0]!.path = '../ARCHITECTURE.md'
    expect(() => validateExportPreflight(project)).toThrow('Path traversal security risk')
  })
})
 