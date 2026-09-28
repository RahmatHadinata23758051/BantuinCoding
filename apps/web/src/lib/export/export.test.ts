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

describe('ZIP Path Traversal Security Validator', () => {
  it('allows safe relative paths', () => {
    expect(validateZipPath('PRD.md')).toBe('PRD.md')
    expect(validateZipPath('docs/API.md')).toBe('docs/API.md')
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

  it('detects and blocks OpenAI / Anthropic sk- API keys', () => {
    const malicious = 'const key = "sk-1234567890abcdef1234567890"'
    expect(() => scanContentForSecrets(malicious, 'config.ts')).toThrow('SECURITY ALERT: Potential API key leakage')
  })

  it('detects and blocks Gemini AIzaSy API keys', () => {
    const malicious = 'const key = "AIzaSy123456789012345678901234567890123"'
    expect(() => scanContentForSecrets(malicious, 'config.ts')).toThrow('SECURITY ALERT: Potential API key leakage')
  })
})

describe('Bootstrap README Generator', () => {
  it('generates informative README.md content with target agent', () => {
    const readme = generateBootstrapReadme('Acme SaaS', 'CLAUDE_CODE')
    expect(readme).toContain('# Acme SaaS — Project Bootstrap Pack')
    expect(readme).toContain('CLAUDE_CODE')
    expect(readme).toContain('PRD.md')
    expect(readme).toContain('BACKLOG.md')
  })
})

describe('ZIP Export Engine — exportProjectZip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      exportProjectZip({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('throws error if no READY or MODIFIED artifacts exist', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      artifacts: [{ path: 'PRD.md', status: 'FAILED', content: '' }],
    } as never)

    await expect(
      exportProjectZip({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No ready artifacts available to export')
  })

  it('exports zip buffer without mutating project status', async () => {
    const { db } = await import('@repo/db')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Acme SaaS App',
      targetAgent: 'CLAUDE_CODE',
      artifacts: [
        { path: 'PRD.md', status: 'READY', content: '# PRD' },
        { path: 'SRS.md', status: 'MODIFIED', content: '# SRS' },
      ],
    } as never)

    const result = await exportProjectZip({ userId: 'u-1', projectId: 'p-1' })

    expect(result.filename).toBe('acme-saas-app-bootstrap-pack.zip')
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.buffer.length).toBeGreaterThan(0)
  })
})
