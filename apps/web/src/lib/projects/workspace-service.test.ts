import { describe, expect, it } from 'vitest'
import { parseWorkspaceSystemGraph } from './workspace-service'

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
})
