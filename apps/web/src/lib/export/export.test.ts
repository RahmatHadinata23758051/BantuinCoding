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

  it('detects and blocks OpenAI / Anthropic credential patterns', () => {
    // Build the synthetic value at runtime so secret scanners never encounter
    // a credential-shaped literal in the repository or committed fixtures.
    const syntheticCredential = ['s', 'k', '-', '1234567890', 'abcdef1234567890'].join('')
    const malicious = `const key = "${syntheticCredential}"`

    expect(() => scanContentForSecrets(malicious, 'config.ts')).toThrow(
      'SECURITY ALERT: Potential API key leakage',
    )
  })

  it('detects and blocks Gemini credential patterns', () => {
    const syntheticCredential = [
      'AI',
      'za',
      'Sy',
      '12345678901',
      '23456789012',
      '34567890123',
    ].join('')
    const malicious = `const key = "${syntheticCredential}"`

    expect(() => scanContentForSecrets(malicious, 'config.ts')).toThrow(
      'SECURITY ALERT: Potential API key leakage',
    )
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
        { path: 'ARCHITECTURE.md', status: 'MODIFIED', content: '# ARCH' },
      ],
    } as never)

    const result = await exportProjectZip({ userId: 'u-1', projectId: 'p-1' })

    expect(result.filename).toBe('acme-saas-app-bootstrap-pack.zip')
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.buffer.length).toBeGreaterThan(0)
  })

  it('includes a READY DESIGN artifact and canonical README order in the ZIP', async () => {
    const { db } = await import('@repo/db')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Acme UI',
      targetAgent: 'CLAUDE_CODE',
      artifacts: [
        { path: 'PRD.md', status: 'READY', content: '# PRD' },
        { path: 'DESIGN.md', status: 'READY', content: '# DESIGN\n\nWarm paper.' },
      ],
    } as never)

    const result = await exportProjectZip({ userId: 'u-1', projectId: 'p-1' })
    const zip = await JSZip.loadAsync(result.buffer)
    const design = await zip.file('DESIGN.md')?.async('string')
    const readme = await zip.file('README.md')?.async('string')

    expect(design).toBe('# DESIGN\n\nWarm paper.')
    expect(readme).toContain('3. DESIGN.md (if present)')
    expect(readme).toContain('4. Agent.md')
  })
})
