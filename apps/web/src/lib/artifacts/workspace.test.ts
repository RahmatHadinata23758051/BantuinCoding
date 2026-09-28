import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sanitizeHtml,
  renderMarkdownToHtml,
} from '@/lib/artifacts/sanitizer'
import {
  saveArtifactContent,
  markOutdatedArtifacts,
  getArtifactStatusBadgeStyle,
} from '@/lib/artifacts/artifact-service'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
    projectContext: {
      findFirst: vi.fn(),
    },
    artifact: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('Markdown Sanitizer', () => {
  it('strips dangerous <script> tags and inline handlers', () => {
    const dangerous = `<script>alert('xss')</script><h1 onclick="alert('xss')">Header</h1><iframe src="evil.com"></iframe>`
    const clean = sanitizeHtml(dangerous)

    expect(clean).not.toContain('<script>')
    expect(clean).not.toContain('alert')
    expect(clean).not.toContain('<iframe')
    expect(clean).toContain('<h1>Header</h1>')
  })

  it('renders markdown to sanitized HTML', () => {
    const md = '# Title\n\nThis is **bold** text.'
    const html = renderMarkdownToHtml(md)

    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
  })
})

describe('Artifact Service — Status Badges', () => {
  it('returns correct visual badge styles for artifact statuses', () => {
    expect(getArtifactStatusBadgeStyle('READY').label).toContain('Generated')
    expect(getArtifactStatusBadgeStyle('MODIFIED').label).toContain('User Modified')
    expect(getArtifactStatusBadgeStyle('OUTDATED').label).toContain('Outdated')
    expect(getArtifactStatusBadgeStyle('FAILED').label).toContain('Failed')
  })
})

describe('Artifact Service — saveArtifactContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates artifact content and transitions status to MODIFIED', async () => {
    const { db } = await import('@repo/db')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
    } as never)

    vi.mocked(db.artifact.findUnique).mockResolvedValueOnce({
      id: 'art-1',
      projectId: 'p-1',
      type: 'PRD',
      version: 1,
      status: 'READY',
    } as never)

    vi.mocked(db.artifact.update).mockResolvedValueOnce({
      id: 'art-1',
      content: '# New PRD Content',
      status: 'MODIFIED',
      version: 2,
    } as never)

    const updated = await saveArtifactContent({
      userId: 'u-1',
      projectId: 'p-1',
      artifactType: 'PRD',
      content: '# New PRD Content',
    })

    expect(updated.status).toBe('MODIFIED')
    expect(db.artifact.update).toHaveBeenCalledWith({
      where: { id: 'art-1' },
      data: {
        content: '# New PRD Content',
        status: 'MODIFIED',
        version: 2,
      },
    })
  })
})

describe('Artifact Service — markOutdatedArtifacts', () => {
  it('marks READY artifacts as OUTDATED when current context ID differs', async () => {
    const { db } = await import('@repo/db')

    vi.mocked(db.projectContext.findFirst).mockResolvedValueOnce({
      id: 'ctx-v2',
      projectId: 'p-1',
      version: 2,
      isCurrent: true,
    } as never)

    vi.mocked(db.artifact.findMany).mockResolvedValueOnce([
      { id: 'art-1', contextId: 'ctx-v1', status: 'READY' },
      { id: 'art-2', contextId: 'ctx-v2', status: 'READY' },
      { id: 'art-3', contextId: 'ctx-v1', status: 'MODIFIED' },
      { id: 'art-4', contextId: 'ctx-v1', status: 'FAILED' },
      { id: 'art-5', contextId: 'ctx-v1', status: 'GENERATING' },
      { id: 'art-6', contextId: 'ctx-v1', status: 'NOT_GENERATED' },
    ] as never)

    const count = await markOutdatedArtifacts('p-1')

    expect(count).toBe(2)
    expect(db.artifact.update).toHaveBeenCalledWith({
      where: { id: 'art-1' },
      data: { status: 'OUTDATED' },
    })
    expect(db.artifact.update).toHaveBeenCalledWith({
      where: { id: 'art-3' },
      data: { status: 'OUTDATED' },
    })
    expect(db.artifact.update).not.toHaveBeenCalledWith({
      where: { id: 'art-2' },
      data: { status: 'OUTDATED' },
    })
    expect(db.artifact.update).not.toHaveBeenCalledWith({
      where: { id: 'art-4' },
      data: { status: 'OUTDATED' },
    })
  })
})
