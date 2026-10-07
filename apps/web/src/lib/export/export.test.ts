import JSZip from 'jszip'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateZipPath,
  scanContentForSecrets,
  generateBootstrapReadme,
  exportProjectZip,
} from '@/lib/export/export-service'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
  },
}))

const currentContext = (types: string[]) => ({
  id: 'ctx-1',
  artifactPlans: types.map((type) => ({ type })),
})

const artifact = (type: string, path: string, content: string, status = 'READY', contextId = 'ctx-1') => ({
  type,
  path,
  content,
  status,
  contextId,
})

describe('ZIP Path Traversal Security Validator', () => {
  it('allows safe relative paths', () => {
    expect(validateZipPath('PRD.md')).toBe('PRD.md')
    expect(validateZipPath('docs/API.md')).toBe('docs/API.md')
  })

  it('rejects control characters and normalizes separators', () => {
    expect(() => validateZipPath('bad\n.md')).toThrow('Control character detected')
    expect(validateZipPath('docs\\API.md')).toBe('docs/API.md')
  })

  it('rejects path traversal attempts with ../', () => {
    expect(() => validateZipPath('../../../etc/passwd')).toThrow('Path traversal security risk')
    expect(() => validateZipPath('docs/../../secret.txt')).toThrow('Path traversal security risk')
  })

  it('rejects leading slashes and drive letters', () => {
    expect(() => validateZipPath('/etc/passwd')).toThrow('Path traversal security risk')
    expect(() => validateZipPath('C:\\Windows\\System32')).toThrow('Absolute path drive letter')
  })
})

describe('ZIP Secret Leakage Scanner', () => {
  it('passes clean content without secrets', () => {
    expect(() => scanContentForSecrets('# PRD.md\n\nNo secrets here.', 'PRD.md')).not.toThrow()
  })

  it('detects and blocks OpenAI / Anthropic credential patterns', () => {
    const syntheticCredential = ['s', 'k', '-', '1234567890', 'abcdef1234567890'].join('')
    expect(() => scanContentForSecrets(`const key = "${syntheticCredential}"`, 'config.ts')).toThrow(
      'SECURITY ALERT: Potential API key leakage',
    )
  })

  it('detects and blocks Gemini credential patterns', () => {
    const syntheticCredential = ['AI', 'za', 'Sy', '12345678901', '23456789012', '34567890123'].join('')
    expect(() => scanContentForSecrets(`const key = "${syntheticCredential}"`, 'config.ts')).toThrow(
      'SECURITY ALERT: Potential API key leakage',
    )
  })

  it('detects private keys and database URLs', () => {
    expect(() => scanContentForSecrets('-----BEGIN PRIVATE KEY-----', 'Agent.md')).toThrow('SECURITY ALERT')
    expect(() => scanContentForSecrets('DATABASE_URL=postgres://user:pass@host/db', 'Agent.md')).toThrow('SECURITY ALERT')
  })
})

describe('Bootstrap README Generator', () => {
  it('generates informative README.md content with target agent and DESIGN reference', () => {
    const readme = generateBootstrapReadme('Acme SaaS', 'CLAUDE_CODE')
    expect(readme).toContain('# Acme SaaS — Project Bootstrap Pack')
    expect(readme).toContain('CLAUDE_CODE')
    expect(readme).toContain('PRD.md')
    expect(readme).toContain('DESIGN.md')
    expect(readme).toContain('BACKLOG.md')
    expect(readme).toContain('3. DESIGN.md (if present)')
  })
})

describe('ZIP Export Engine — exportProjectZip', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(exportProjectZip({ userId: 'u-1', projectId: 'p-invalid' })).rejects.toThrow('Project not found')
  })

  it('rejects a project that has not passed validation', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test Project', status: 'READY', contexts: [], artifacts: [],
    } as never)

    await expect(exportProjectZip({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('Project is not exportable')
  })

  it('rejects incomplete, failed, and stale current requirements', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test Project', status: 'EXPORTABLE',
      contexts: [currentContext(['PRD', 'AGENT'])],
      artifacts: [artifact('PRD', 'PRD.md', '# PRD', 'READY', 'ctx-old')],
    } as never)

    await expect(exportProjectZip({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('Missing or incomplete: PRD, AGENT')
  })

  it('rejects normalized duplicate artifact paths', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test Project', status: 'EXPORTABLE', targetAgent: 'CLAUDE_CODE',
      contexts: [currentContext(['PRD', 'AGENT'])],
      artifacts: [artifact('PRD', 'docs/pack.md', '# PRD'), artifact('AGENT', 'docs\\pack.md', '# Agent')],
    } as never)

    await expect(exportProjectZip({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('Duplicate file path detected')
  })

  it('rejects projects without a current context', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Test Project', status: 'EXPORTABLE', contexts: [], artifacts: [],
    } as never)

    await expect(exportProjectZip({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('no current context')
  })

  it('exports the current required artifact pack without mutating project status', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Acme SaaS App', targetAgent: 'CLAUDE_CODE', status: 'EXPORTABLE',
      contexts: [currentContext(['PRD', 'ARCHITECTURE'])],
      artifacts: [artifact('PRD', 'PRD.md', '# PRD'), artifact('ARCHITECTURE', 'ARCHITECTURE.md', '# ARCH')],
    } as never)

    const result = await exportProjectZip({ userId: 'u-1', projectId: 'p-1' })
    expect(result.filename).toBe('acme-saas-app-bootstrap-pack.zip')
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.buffer.length).toBeGreaterThan(0)
  })

  it('includes a READY DESIGN artifact and canonical README order in the ZIP', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1', userId: 'u-1', name: 'Acme UI', targetAgent: 'CLAUDE_CODE', status: 'EXPORTABLE',
      contexts: [currentContext(['PRD', 'DESIGN'])],
      artifacts: [artifact('PRD', 'PRD.md', '# PRD'), artifact('DESIGN', 'DESIGN.md', '# DESIGN\n\nWarm paper.')],
    } as never)

    const result = await exportProjectZip({ userId: 'u-1', projectId: 'p-1' })
    const zip = await JSZip.loadAsync(result.buffer)
    expect(await zip.file('DESIGN.md')?.async('string')).toBe('# DESIGN\n\nWarm paper.')
    expect(await zip.file('README.md')?.async('string')).toContain('3. DESIGN.md (if present)')
  })
})
