import { describe, expect, it, vi, beforeEach } from 'vitest'
import { db } from '@repo/db'
import { parseWorkspaceSystemGraph, repairMissingSystemGraph } from './workspace-service'

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
})
