import { describe, expect, it, vi, beforeEach } from 'vitest'
import { db } from '@repo/db'
import { getProjectWorkspaceData, parseWorkspaceSystemGraph, repairMissingSystemGraph } from './workspace-service'

vi.mock('@repo/db', () => ({
  db: {
    project: { findFirst: vi.fn() },
    artifact: { upsert: vi.fn() },
  },
}))

beforeEach(() => vi.clearAllMocks())

describe('workspace system graph parsing', () => {
  it('accepts a valid graph and removes invalid edges', () => {
    expect(parseWorkspaceSystemGraph(JSON.stringify({
      nodes: [{ id: 'client', label: 'Client', category: 'client', description: 'Browser' }],
      edges: [{ source: 'client', target: 'missing' }],
    }))).toEqual({
      nodes: [{ id: 'client', label: 'Client', category: 'client', description: 'Browser' }],
      edges: [],
    })
  })

  it('parses explicit Mermaid graphs and filters undeclared edges', () => {
    const markdown = [
      '# Architecture',
      '```mermaid',
      'graph TD',
      '  browser[Web Dashboard\\nclient/ui]',
      '  api[JWT Bearer API\\napi]',
      '  browser -->|HTTPS| api',
      '  api --> missing',
      '```',
    ].join('\n')

    expect(parseWorkspaceSystemGraph(markdown)).toEqual({
      nodes: [
        { id: 'browser', label: 'Web Dashboard', category: 'client', description: 'Web Dashboard' },
        { id: 'api', label: 'JWT Bearer API', category: 'api', description: 'JWT Bearer API' },
      ],
      edges: [{ source: 'browser', target: 'api', label: 'HTTPS' }],
    })
  })

  it('parses inline Mermaid node labels on edge lines', () => {
    const markdown = [
      '# Architecture',
      '```mermaid',
      'flowchart TD',
      '  browser[Web Browser] --> app[Next.js App]',
      '  app --> database[(PostgreSQL Database)]',
      '```',
    ].join('\n')

    expect(parseWorkspaceSystemGraph(markdown)).toEqual({
      nodes: [
        { id: 'browser', label: 'Web Browser', category: 'client', description: 'Web Browser' },
        { id: 'app', label: 'Next.js App', category: 'service', description: 'Next.js App' },
        { id: 'database', label: 'PostgreSQL Database', category: 'database', description: 'PostgreSQL Database' },
      ],
      edges: [
        { source: 'browser', target: 'app', label: undefined },
        { source: 'app', target: 'database', label: undefined },
      ],
    })
  })

  it('parses the project-style Mermaid architecture without corrupting inline nodes', () => {
    const markdown = [
      '# Architecture',
      '```mermaid',
      'flowchart TD',
      'client_browser[Responsive Web Browser] --> ui_app[Next.js App Router]',
      'ui_app --> auth_service[HTTP-Only Cookie Session Manager & RBAC Guard]',
      'ui_app --> api_monolith[Next.js Server Actions & API Handlers]',
      'auth_service --> api_monolith',
      'api_monolith --> course_service[Course & Module Domain Engine]',
      'api_monolith --> progress_service[Enrollment & Progress Tracker]',
      'api_monolith --> quiz_engine[Quiz Evaluation & Attempt Engine]',
      'course_service --> managed_db[(Managed PostgreSQL Database)]',
      'progress_service --> managed_db[(Managed PostgreSQL Database)]',
      'quiz_engine --> managed_db[(Managed PostgreSQL Database)]',
      'client_browser -.-> video_embed_providers[External Video Embeds (YouTube, Vimeo, Loom)]',
      '```',
    ].join('\n')

    const graph = parseWorkspaceSystemGraph(markdown)
    expect(graph?.nodes).toHaveLength(9)
    expect(graph?.edges).toHaveLength(11)
    expect(graph?.nodes.find((node) => node.id === 'client_browser')?.label).toBe('Responsive Web Browser')
    expect(graph?.nodes.find((node) => node.id === 'managed_db')?.label).toBe('Managed PostgreSQL Database')
    expect(graph?.edges.some((edge) => edge.source === 'client_browser' && edge.target === 'video_embed_providers')).toBe(true)
  })

  it('discards cached system-graph JSON with a Mermaid arrow in a node label', () => {
    const content = JSON.stringify({
      nodes: [{
        id: 'client_browser',
        label: 'Responsive Web Browser] --> ui_app[Next.js App Router',
        category: 'client',
        description: 'Responsive Web Browser] --> ui_app[Next.js App Router',
      }],
      edges: [],
    })

    expect(parseWorkspaceSystemGraph(content)).toBeNull()
  })


  it('discards cached system graph JSON with corrupted node labels and re-derives from markdown', () => {
    const corruptedJson = JSON.stringify({
      nodes: [
        {
          id: 'client_browser',
          label: 'Responsive Web Browser] --> ui_app[Next.js App Router',
          category: 'client',
          description: 'Responsive Web Browser] --> ui_app[Next.js App Router',
        },
      ],
      edges: [],
    })

    expect(parseWorkspaceSystemGraph(corruptedJson)).toBeNull()
  })

  it('normalizes generated line-break markers without interpreting other markup', () => {
    expect(parseWorkspaceSystemGraph(JSON.stringify({
      nodes: [{
        id: 'admin',
        label: 'Administrator Browser<br/>Catalog and circulation operations',
        category: 'client',
        description: 'Manage <strong>catalog</strong><BR /> records',
      }],
      edges: [{
        source: 'admin',
        target: 'admin',
        label: 'Open <em>catalog</em><br> flow',
      }],
    }))).toEqual({
      nodes: [{
        id: 'admin',
        label: 'Administrator Browser\nCatalog and circulation operations',
        category: 'client',
        description: 'Manage <strong>catalog</strong>\n records',
      }],
      edges: [{
        source: 'admin',
        target: 'admin',
        label: 'Open <em>catalog</em>\n flow',
      }],
    })
  })

  it('returns null for malformed or empty graphs', () => {
    expect(parseWorkspaceSystemGraph('not-json')).toBeNull()
    expect(parseWorkspaceSystemGraph(JSON.stringify({ nodes: [], edges: [] }))).toBeNull()
    expect(parseWorkspaceSystemGraph('```mermaid\ngraph TD\n  unsupported syntax\n```')).toBeNull()
  })

  it('extracts system graph from architecture prose when Mermaid is absent', () => {
    const proseMarkdown = [
      '# Architecture',
      '## 1. Overview',
      'Modular architecture.',
      '## 3. System Component Breakdown & Module Boundaries',
      '### 3.1 Web Client',
      'React UI application for user interaction.',
      '### 3.2 Backend Server',
      'Next.js application server providing domain services.',
      '### 3.3 PostgreSQL Database',
      'Relational database storing user data.',
      '## 4. Data Flow & Sequence Descriptions',
      '### 4.1 Authenticated Request',
      '1. The Web Client sends request to the Backend Server.',
      '2. The Backend Server queries the PostgreSQL Database.',
      '## 8. Hidden System Architecture Graph',
      'No diagram provided.',
    ].join('\n')

    expect(parseWorkspaceSystemGraph(proseMarkdown)).toEqual({
      nodes: [
        { id: 'web-client', label: 'Web Client', category: 'client', description: 'React UI application for user interaction.' },
        { id: 'backend-server', label: 'Backend Server', category: 'service', description: 'Next.js application server providing domain services.' },
        { id: 'postgresql-database', label: 'PostgreSQL Database', category: 'database', description: 'Relational database storing user data.' },
      ],
      edges: [
        { source: 'web-client', target: 'backend-server', label: 'Authenticated Request' },
        { source: 'backend-server', target: 'postgresql-database', label: 'Authenticated Request' },
      ],
    })
  })

  it('does not invent edges when flow steps do not mention ordered components', () => {
    const markdown = [
      '# Architecture',
      '## 3. System Component Breakdown',
      '### 3.1 Web Client',
      'Browser UI.',
      '### 3.2 Database',
      'Postgres database.',
      '## 4. Data Flow',
      '### 4.1 Maintenance Window',
      'Nightly background backup process.',
    ].join('\n')

    expect(parseWorkspaceSystemGraph(markdown)).toEqual({
      nodes: [
        { id: 'web-client', label: 'Web Client', category: 'client', description: 'Browser UI.' },
        { id: 'database', label: 'Database', category: 'database', description: 'Postgres database.' },
      ],
      edges: [],
    })
  })

  it('repairs missing system graph using architecture prose when Mermaid is absent', async () => {
    const proseArchitecture = [
      '# ARCHITECTURE.md — Personal Finance Manager',
      '## 3. System Component Breakdown & Module Boundaries',
      '### 3.1 Web Client',
      'Browser UI for personal finance workflows.',
      '### 3.2 Finance API Service',
      'API backend for financial operations.',
      '## 4. Data Flow & Sequence Descriptions',
      '### 4.1 Sync Transactions',
      '1. Web Client sends transactions to Finance API Service.',
    ].join('\n')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      contexts: [{ id: 'ctx-1', isCurrent: true }],
      artifacts: [
        { type: 'ARCHITECTURE', status: 'READY', contextId: 'ctx-1', content: proseArchitecture },
      ],
    } as never)

    const repaired = await repairMissingSystemGraph({ userId: 'u-1', projectId: 'p-1' })

    expect(repaired).toEqual({
      nodes: [
        { id: 'web-client', label: 'Web Client', category: 'client', description: 'Browser UI for personal finance workflows.' },
        { id: 'finance-api-service', label: 'Finance API Service', category: 'api', description: 'API backend for financial operations.' },
      ],
      edges: [
        { source: 'web-client', target: 'finance-api-service', label: 'Sync Transactions' },
      ],
    })

    expect(db.artifact.upsert).toHaveBeenCalledWith({
      where: { projectId_type: { projectId: 'p-1', type: 'SYSTEM_GRAPH' } },
      update: {
        content: JSON.stringify(repaired),
        status: 'READY',
        contextId: 'ctx-1',
      },
      create: {
        projectId: 'p-1',
        contextId: 'ctx-1',
        type: 'SYSTEM_GRAPH',
        path: '.system-graph.json',
        content: JSON.stringify(repaired),
        status: 'READY',
      },
    })
  })

  it('loads workspace project data with target agent and parsed skill metadata', async () => {
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      name: 'Acme',
      rawIdea: 'Acme idea',
      classification: 'SAAS',
      classificationStatus: 'READY',
      classificationError: null,
      targetAgent: 'CLAUDE_CODE',
      language: 'en',
      status: 'READY',
      createdAt: new Date('2026-10-21T00:00:00Z'),
      updatedAt: new Date('2026-10-21T00:00:00Z'),
      contexts: [{ id: 'ctx-1', isCurrent: true, version: 1, contentJson: '{"name":"Acme"}', artifactPlans: [] }],
      artifacts: [],
      clarificationQuestions: [],
      skillRecommendations: [{
        id: 's-1',
        name: 'ui-ux-pro-max',
        source: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
        purpose: 'Improves UI.',
        trigger: 'When building UI.',
        metadata: JSON.stringify({
          installation_mode: 'ui-ux-pro-max-cli',
          installation_hint: 'npx ui-ux-pro-max-cli init --ai <agent>',
        }),
      }],
      backlogPhases: [],
    } as never)

    const data = await getProjectWorkspaceData('u-1', 'p-1')
    expect(data?.targetAgent).toBe('CLAUDE_CODE')
    expect(data?.skills[0]?.name).toBe('ui-ux-pro-max')
    expect(data?.skills[0]?.metadata).toEqual({
      installation_mode: 'ui-ux-pro-max-cli',
      installation_hint: 'npx ui-ux-pro-max-cli init --ai <agent>',
    })
  })
})
