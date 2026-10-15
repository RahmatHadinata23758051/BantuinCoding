import { describe, expect, it } from 'vitest'
import type { SystemGraphData } from '@repo/types'
import {
  computeSystemGraphLayout,
  GRAPH_NODE_HEIGHT,
  GRAPH_NODE_WIDTH,
  routeSystemGraphEdges,
} from './design-system-graph-layout'

const INVENTORY_MANAGEMENT_FIXTURE: SystemGraphData = {
  nodes: [
    {
      id: 'browser',
      label: 'Web Dashboard',
      category: 'client',
      description: 'Role-based inventory dashboard',
    },
    {
      id: 'api',
      label: 'JWT Bearer API',
      category: 'api',
      description: 'Stateless API router and rate limiter',
    },
    {
      id: 'auth',
      label: 'Auth and Tenant Authorization',
      category: 'auth',
      description: 'Validates sessions and tenant scopes',
    },
    {
      id: 'products',
      label: 'Product Module',
      category: 'service',
      description: 'SKU, pricing, and category lifecycle',
    },
    {
      id: 'inventory',
      label: 'Inventory and Immutable Ledger',
      category: 'service',
      description: 'Stock transactions and balance invariants',
    },
    {
      id: 'notifications',
      label: 'Notification Outbox Module',
      category: 'service',
      description: 'Reliable asynchronous event dispatch',
    },
    {
      id: 'worker',
      label: 'Email Notification Worker',
      category: 'service',
      description: 'Processes background alert queues',
    },
    {
      id: 'db',
      label: 'PostgreSQL Shared Schema with RLS',
      category: 'database',
      description: 'Row-level security tenant isolation',
    },
    {
      id: 'email',
      label: 'Email Provider',
      category: 'external',
      description: 'Third-party transactional delivery',
    },
  ],
  edges: [
    { source: 'browser', target: 'api' },
    { source: 'api', target: 'auth' },
    { source: 'auth', target: 'products' },
    { source: 'auth', target: 'inventory' },
    { source: 'products', target: 'db' },
    { source: 'inventory', target: 'db' },
    { source: 'inventory', target: 'notifications' },
    { source: 'notifications', target: 'db' },
    { source: 'worker', target: 'db' },
    { source: 'worker', target: 'email' },
    { source: 'api', target: 'browser', label: 'Response' },
  ],
}

describe('computeSystemGraphLayout', () => {
  it('cleanly arranges the real-world Inventory Management architecture', () => {
    const layout = computeSystemGraphLayout(INVENTORY_MANAGEMENT_FIXTURE)

    expect(layout.nodes).toHaveLength(9)
    expect(layout.edges).toHaveLength(11)

    const browserCol = layout.columns.get('browser')!
    const apiCol = layout.columns.get('api')!
    const authCol = layout.columns.get('auth')!
    const productsCol = layout.columns.get('products')!
    const inventoryCol = layout.columns.get('inventory')!
    const notificationsCol = layout.columns.get('notifications')!
    const workerCol = layout.columns.get('worker')!
    const dbCol = layout.columns.get('db')!
    const emailCol = layout.columns.get('email')!

    // 1. Strict architectural rank flow
    expect(browserCol).toBeLessThan(apiCol)
    expect(apiCol).toBeLessThan(authCol)
    expect(authCol).toBeLessThan(productsCol)
    expect(authCol).toBeLessThan(inventoryCol)
    expect(inventoryCol).toBeLessThan(notificationsCol)
    expect(notificationsCol).toBeLessThan(dbCol)
    expect(productsCol).toBeLessThan(dbCol)
    expect(workerCol).toBeLessThan(dbCol)

    // 2. Database and External provider are in distinct columns (not crammed together)
    expect(dbCol).not.toBe(emailCol)
    expect(emailCol).toBeGreaterThan(workerCol)

    // 3. Return edge classification
    const returnEdge = layout.edges.find(
      (edge) => edge.source === 'api' && edge.target === 'browser',
    )
    expect(returnEdge).toBeDefined()
    expect(returnEdge?.kind).toBe('return')
    expect(returnEdge?.path).toContain('M ')
    expect(returnEdge?.path).toContain(' V ')
    expect(returnEdge?.path).toContain(' H ')

    // 4. Forward edges all flow left to right
    const forwardEdges = layout.edges.filter((edge) => edge.kind === 'forward')
    expect(forwardEdges).toHaveLength(10)
    forwardEdges.forEach((edge) => {
      const sourceCol = layout.columns.get(edge.source)!
      const targetCol = layout.columns.get(edge.target)!
      expect(sourceCol).toBeLessThan(targetCol)
    })

    // 5. Zero node coordinate overlaps
    const nodeIds = layout.nodes.map((node) => node.id)
    for (let i = 0; i < nodeIds.length; i += 1) {
      for (let j = i + 1; j < nodeIds.length; j += 1) {
        const posA = layout.positions.get(nodeIds[i])!
        const posB = layout.positions.get(nodeIds[j])!

        const overlapsX =
          posA.x < posB.x + GRAPH_NODE_WIDTH && posB.x < posA.x + GRAPH_NODE_WIDTH
        const overlapsY =
          posA.y < posB.y + GRAPH_NODE_HEIGHT && posB.y < posA.y + GRAPH_NODE_HEIGHT

        expect(overlapsX && overlapsY).toBe(false)
      }
    }

    // 6. Valid positive canvas boundaries
    expect(layout.width).toBeGreaterThan(600)
    expect(layout.height).toBeGreaterThanOrEqual(300)
  })

  it('produces completely deterministic output regardless of input ordering', () => {
    const shuffledNodes = [...INVENTORY_MANAGEMENT_FIXTURE.nodes].reverse()
    const shuffledEdges = [...INVENTORY_MANAGEMENT_FIXTURE.edges].reverse()

    const layoutA = computeSystemGraphLayout(INVENTORY_MANAGEMENT_FIXTURE)
    const layoutB = computeSystemGraphLayout({
      nodes: shuffledNodes,
      edges: shuffledEdges,
    })

    expect(layoutA.width).toBe(layoutB.width)
    expect(layoutA.height).toBe(layoutB.height)

    layoutA.nodes.forEach((node) => {
      const posA = layoutA.positions.get(node.id)!
      const posB = layoutB.positions.get(node.id)!
      expect(posA).toEqual(posB)
    })

    layoutA.edges.forEach((edgeA) => {
      const edgeB = layoutB.edges.find((e) => e.key === edgeA.key)
      expect(edgeB).toBeDefined()
      expect(edgeA.path).toBe(edgeB?.path)
      expect(edgeA.kind).toBe(edgeB?.kind)
    })
  })

  it('distributes incoming ports cleanly for high fan-in target nodes', () => {
    const layout = computeSystemGraphLayout(INVENTORY_MANAGEMENT_FIXTURE)
    const dbEdges = layout.edges.filter((e) => e.target === 'db' && e.kind === 'forward')

    // 4 edges connect to db: products, inventory, notifications, worker
    expect(dbEdges).toHaveLength(4)

    // Extract the final Y coordinate from each curve's final control point.
    const endYs = dbEdges.map((edge) => {
      const matches = [...edge.path.matchAll(/([\d.]+)\s*$/g)]
      return matches.length > 0 ? matches[matches.length - 1][1] : null
    })

    // Every route must carry a distinct port offset at the database boundary.
    expect(new Set(dbEdges.map((edge) => edge.path)).size).toBe(4)
    expect(new Set(endYs).size).toBeGreaterThan(1)
  })

  it('handles bidirectional request/response pairs without cycles', () => {
    const graph: SystemGraphData = {
      nodes: [
        { id: 'client', label: 'Client', category: 'client', description: 'App' },
        { id: 'server', label: 'Server', category: 'api', description: 'API' },
      ],
      edges: [
        { source: 'client', target: 'server', label: 'POST /data' },
        { source: 'server', target: 'client', label: '200 OK' },
      ],
    }

    const layout = computeSystemGraphLayout(graph)
    expect(layout.nodes).toHaveLength(2)
    expect(layout.edges).toHaveLength(2)

    const forward = layout.edges.find((e) => e.source === 'client' && e.target === 'server')
    const backward = layout.edges.find((e) => e.source === 'server' && e.target === 'client')

    expect(forward?.kind).toBe('forward')
    expect(backward?.kind).toBe('return')
  })

  it('handles same-column edges with proper vertical routing', () => {
    const graph: SystemGraphData = {
      nodes: [
        { id: 's1', label: 'Service 1', category: 'service', description: 'S1' },
        { id: 's2', label: 'Service 2', category: 'service', description: 'S2' },
        { id: 's3', label: 'Service 3', category: 'service', description: 'S3' },
      ],
      edges: [
        { source: 's1', target: 's2' },
        { source: 's1', target: 's3' },
      ],
    }

    const layout = computeSystemGraphLayout(graph)
    expect(layout.nodes).toHaveLength(3)
    expect(layout.edges).toHaveLength(2)

    layout.edges.forEach((edge) => {
      expect(edge.path).toBeDefined()
      expect(edge.path.length).toBeGreaterThan(0)
    })
  })

  it('safely handles empty and single-node graphs', () => {
    const emptyLayout = computeSystemGraphLayout({ nodes: [], edges: [] })
    expect(emptyLayout.nodes).toEqual([])
    expect(emptyLayout.edges).toEqual([])
    expect(emptyLayout.width).toBe(0)
    expect(emptyLayout.height).toBe(0)

    const singleNodeLayout = computeSystemGraphLayout({
      nodes: [{ id: 'core', label: 'Core', category: 'api', description: 'Monolith' }],
      edges: [],
    })
    expect(singleNodeLayout.nodes).toHaveLength(1)
    expect(singleNodeLayout.edges).toHaveLength(0)
    expect(singleNodeLayout.width).toBeGreaterThan(0)
    expect(singleNodeLayout.height).toBeGreaterThan(0)
  })

  it('filters duplicate node IDs and dangling edges pointing to missing nodes', () => {
    const graph: SystemGraphData = {
      nodes: [
        { id: 'dup', label: 'Node 1', category: 'client', description: 'First' },
        { id: 'dup', label: 'Node 1 Dup', category: 'client', description: 'Duplicate' },
        { id: 'valid', label: 'Valid', category: 'api', description: 'Valid' },
      ],
      edges: [
        { source: 'dup', target: 'valid' },
        { source: 'valid', target: 'phantom_target' },
        { source: 'phantom_source', target: 'dup' },
      ],
    }

    const layout = computeSystemGraphLayout(graph)
    expect(layout.nodes).toHaveLength(2)
    expect(layout.edges).toHaveLength(1)
    expect(layout.edges[0].source).toBe('dup')
    expect(layout.edges[0].target).toBe('valid')
  })

  it('dynamically recalculates edge paths when node positions are dragged', () => {
    const layout = computeSystemGraphLayout(INVENTORY_MANAGEMENT_FIXTURE)
    const originalPos = layout.positions.get('browser')!

    // Simulate dragging 'browser' node by +50px x and +30px y
    const customPositions = new Map(layout.positions)
    customPositions.set('browser', {
      ...originalPos,
      x: originalPos.x + 50,
      y: originalPos.y + 30,
    })

    const updatedEdges = routeSystemGraphEdges(
      layout.edges,
      customPositions,
      layout.columns,
      layout.height - 56,
    )
    expect(updatedEdges).toHaveLength(layout.edges.length)

    const originalBrowserEdge = layout.edges.find((e) => e.source === 'browser' && e.target === 'api')!
    const updatedBrowserEdge = updatedEdges.find((e) => e.source === 'browser' && e.target === 'api')!

    // Path must update to reflect the new starting position
    expect(updatedBrowserEdge.path).not.toBe(originalBrowserEdge.path)
    expect(updatedBrowserEdge.path).toContain(`M ${originalPos.x + 50 + GRAPH_NODE_WIDTH}`)
  })
})
