import type {
  SystemGraphCategory,
  SystemGraphData,
  SystemGraphEdge,
  SystemGraphNode,
} from '@repo/types'

export const GRAPH_NODE_WIDTH = 196
export const GRAPH_NODE_HEIGHT = 76
export const GRAPH_COLUMN_GAP = 72
export const GRAPH_ROW_GAP = 32
export const GRAPH_PADDING = 32

export type GraphLayoutPoint = {
  x: number
  y: number
  column: number
  row: number
}

export type GraphLayoutEdge = SystemGraphEdge & {
  key: string
  kind: 'forward' | 'vertical' | 'return'
  path: string
}

export type SystemGraphLayout = {
  nodes: SystemGraphNode[]
  edges: GraphLayoutEdge[]
  positions: Map<string, GraphLayoutPoint>
  columns: Map<string, number>
  width: number
  height: number
}

type RankedNode = SystemGraphNode & { rank: number }
type Point = { x: number; y: number }

const CATEGORY_BASE_RANK: Record<SystemGraphCategory, number> = {
  client: 0,
  ui: 0,
  api: 1,
  auth: 1,
  service: 2,
  database: 4,
  external: 5,
}

function stableNodeCompare(left: SystemGraphNode, right: SystemGraphNode) {
  return left.id.localeCompare(right.id) || left.label.localeCompare(right.label)
}

function edgeKey(edge: SystemGraphEdge, occurrence: number) {
  return `${edge.source}->${edge.target}:${edge.label ?? ''}:${occurrence}`
}

function isValidNode(node: SystemGraphNode) {
  return Boolean(node && typeof node.id === 'string' && node.id.trim())
}

function normalizeGraph(graph: SystemGraphData) {
  const seenIds = new Set<string>()
  const nodes = [...(graph.nodes ?? [])]
    .filter(isValidNode)
    .sort(stableNodeCompare)
    .filter((node) => {
      if (seenIds.has(node.id)) return false
      seenIds.add(node.id)
      return true
    })

  const nodeIds = new Set(nodes.map((node) => node.id))
  const edgeCounts = new Map<string, number>()
  const edges = (graph.edges ?? [])
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => {
      const signature = `${edge.source}->${edge.target}:${edge.label ?? ''}`
      const occurrence = edgeCounts.get(signature) ?? 0
      edgeCounts.set(signature, occurrence + 1)
      return { ...edge, key: edgeKey(edge, occurrence) }
    })

  return { nodes, edges }
}

function wouldCreateCycle(
  source: string,
  target: string,
  forwardAdj: Map<string, string[]>,
): boolean {
  if (source === target) return true
  const visited = new Set<string>()
  const queue = [target]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === source) return true
    if (!visited.has(current)) {
      visited.add(current)
      const nextNodes = forwardAdj.get(current) ?? []
      for (const next of nextNodes) {
        if (!visited.has(next)) queue.push(next)
      }
    }
  }

  return false
}

function selectForwardEdges(
  nodes: SystemGraphNode[],
  edges: Array<SystemGraphEdge & { key: string }>,
) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const forwardAdj = new Map<string, string[]>()
  nodes.forEach((node) => forwardAdj.set(node.id, []))

  // Sort candidate edges so that higher category rank progression is prioritized
  const sortedCandidates = [...edges].sort((left, right) => {
    const leftSource = nodeById.get(left.source)
    const leftTarget = nodeById.get(left.target)
    const rightSource = nodeById.get(right.source)
    const rightTarget = nodeById.get(right.target)

    const leftDiff =
      (leftTarget ? CATEGORY_BASE_RANK[leftTarget.category] : 0) -
      (leftSource ? CATEGORY_BASE_RANK[leftSource.category] : 0)
    const rightDiff =
      (rightTarget ? CATEGORY_BASE_RANK[rightTarget.category] : 0) -
      (rightSource ? CATEGORY_BASE_RANK[rightSource.category] : 0)

    if (rightDiff !== leftDiff) return rightDiff - leftDiff
    return left.key.localeCompare(right.key)
  })

  const forwardEdgeKeys = new Set<string>()

  for (const edge of sortedCandidates) {
    const sourceNode = nodeById.get(edge.source)
    const targetNode = nodeById.get(edge.target)
    if (!sourceNode || !targetNode) continue

    const sourceCatRank = CATEGORY_BASE_RANK[sourceNode.category]
    const targetCatRank = CATEGORY_BASE_RANK[targetNode.category]

    // If target has strictly lower architectural tier than source (e.g. api -> browser),
    // treat it as a return/feedback edge rather than advancing layers backward.
    if (targetCatRank < sourceCatRank) continue

    if (!wouldCreateCycle(edge.source, edge.target, forwardAdj)) {
      forwardEdgeKeys.add(edge.key)
      forwardAdj.get(edge.source)!.push(edge.target)
    }
  }

  return forwardEdgeKeys
}

function assignRanks(
  nodes: SystemGraphNode[],
  edges: Array<SystemGraphEdge & { key: string }>,
  forwardEdgeKeys: Set<string>,
): RankedNode[] {
  const ranks = new Map(nodes.map((node) => [node.id, CATEGORY_BASE_RANK[node.category]]))
  const forwardEdges = edges.filter((edge) => forwardEdgeKeys.has(edge.key))
  const inDegree = new Map(nodes.map((node) => [node.id, 0]))
  const outgoing = new Map<string, typeof forwardEdges>()

  forwardEdges.forEach((edge) => {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    const list = outgoing.get(edge.source) ?? []
    list.push(edge)
    outgoing.set(edge.source, list)
  })

  const queue = nodes
    .filter((node) => inDegree.get(node.id) === 0)
    .sort(stableNodeCompare)
    .map((node) => node.id)

  while (queue.length > 0) {
    const sourceId = queue.shift()!
    const sourceRank = ranks.get(sourceId) ?? 0
    const nextEdges = [...(outgoing.get(sourceId) ?? [])].sort((left, right) =>
      left.key.localeCompare(right.key),
    )

    nextEdges.forEach((edge) => {
      ranks.set(edge.target, Math.max(ranks.get(edge.target) ?? 0, sourceRank + 1))
      const nextInDegree = (inDegree.get(edge.target) ?? 1) - 1
      inDegree.set(edge.target, nextInDegree)
      if (nextInDegree === 0) {
        queue.push(edge.target)
        queue.sort((left, right) => left.localeCompare(right))
      }
    })
  }

  // Ensure external provider nodes are separated from database nodes when both exist
  const hasDatabase = nodes.some((node) => node.category === 'database')
  const hasExternal = nodes.some((node) => node.category === 'external')
  if (hasDatabase && hasExternal) {
    const maxDbRank = Math.max(
      ...nodes
        .filter((node) => node.category === 'database')
        .map((node) => ranks.get(node.id) ?? 0),
    )
    nodes
      .filter((node) => node.category === 'external')
      .forEach((node) => {
        const currentRank = ranks.get(node.id) ?? 0
        if (currentRank <= maxDbRank) {
          ranks.set(node.id, maxDbRank + 1)
        }
      })
  }

  const uniqueRanks = [...new Set([...ranks.values()])].sort((left, right) => left - right)
  const compactRank = new Map(uniqueRanks.map((rank, index) => [rank, index]))

  return nodes.map((node) => ({
    ...node,
    rank: compactRank.get(ranks.get(node.id) ?? 0) ?? 0,
  }))
}

function isForwardRank(edge: SystemGraphEdge, columnById: Map<string, number>) {
  const source = columnById.get(edge.source)
  const target = columnById.get(edge.target)
  return source !== undefined && target !== undefined && source < target
}

function orderColumns(
  rankedNodes: RankedNode[],
  edges: Array<SystemGraphEdge & { key: string }>,
) {
  const grouped = new Map<number, RankedNode[]>()
  rankedNodes.forEach((node) => {
    const group = grouped.get(node.rank) ?? []
    group.push(node)
    grouped.set(node.rank, group)
  })

  const maxColumn = Math.max(0, ...grouped.keys())
  const columns = Array.from({ length: maxColumn + 1 }, (_, column) =>
    [...(grouped.get(column) ?? [])].sort(stableNodeCompare),
  )

  const columnById = new Map(rankedNodes.map((node) => [node.id, node.rank]))
  const forwardEdges = edges.filter((edge) => isForwardRank(edge, columnById))

  const rowById = () => {
    const rows = new Map<string, number>()
    columns.forEach((column) => column.forEach((node, row) => rows.set(node.id, row)))
    return rows
  }

  const sortColumn = (column: number, direction: 'forward' | 'backward') => {
    const current = columns[column]
    if (!current || current.length < 2) return

    const rows = rowById()
    const scored = current.map((node, originalIndex) => {
      const neighborRows = forwardEdges.flatMap((edge) => {
        if (direction === 'forward' && edge.target === node.id) {
          return [rows.get(edge.source) ?? 0]
        }
        if (direction === 'backward' && edge.source === node.id) {
          return [rows.get(edge.target) ?? 0]
        }
        return []
      })

      const score =
        neighborRows.length > 0
          ? neighborRows.reduce((total, value) => total + value, 0) / neighborRows.length
          : originalIndex

      return { node, score, originalIndex }
    })

    scored.sort(
      (left, right) =>
        left.score - right.score ||
        left.originalIndex - right.originalIndex ||
        stableNodeCompare(left.node, right.node),
    )

    columns[column] = scored.map(({ node }) => node)
  }

  for (let sweep = 0; sweep < 4; sweep += 1) {
    for (let column = 1; column <= maxColumn; column += 1) sortColumn(column, 'forward')
    for (let column = maxColumn - 1; column >= 0; column -= 1) sortColumn(column, 'backward')
  }

  return { columns, columnById }
}

function portOffset(index: number, count: number) {
  if (count < 2) return 0
  const spacing = Math.min(14, (GRAPH_NODE_HEIGHT * 0.68) / (count - 1))
  return (index - (count - 1) / 2) * spacing
}

function makeReturnPath(start: Point, target: Point, laneY: number) {
  const R = 16
  if (start.x > target.x) {
    return `M ${start.x} ${start.y} V ${laneY - R} A ${R} ${R} 0 0 1 ${start.x - R} ${laneY} H ${target.x + R} A ${R} ${R} 0 0 1 ${target.x} ${laneY - R} V ${target.y}`
  }
  if (start.x < target.x) {
    return `M ${start.x} ${start.y} V ${laneY - R} A ${R} ${R} 0 0 0 ${start.x + R} ${laneY} H ${target.x - R} A ${R} ${R} 0 0 0 ${target.x} ${laneY - R} V ${target.y}`
  }
  const loopX = start.x + GRAPH_NODE_WIDTH / 2 + 32
  return `M ${start.x} ${start.y} C ${loopX} ${start.y + 24}, ${loopX} ${target.y + 24}, ${target.x} ${target.y}`
}

export function routeSystemGraphEdges(
  edges: Array<SystemGraphEdge & { key: string }>,
  positions: Map<string, GraphLayoutPoint>,
  columns: Map<string, number>,
  bottomLaneStart: number,
): GraphLayoutEdge[] {
  const forwardEdges = edges.filter((edge) => isForwardRank(edge, columns))
  const returnEdges = edges.filter((edge) => !isForwardRank(edge, columns))
  const outgoingGroups = new Map<string, typeof forwardEdges>()
  const incomingGroups = new Map<string, typeof forwardEdges>()

  forwardEdges.forEach((edge) => {
    const outgoing = outgoingGroups.get(edge.source) ?? []
    outgoing.push(edge)
    outgoingGroups.set(edge.source, outgoing)

    const incoming = incomingGroups.get(edge.target) ?? []
    incoming.push(edge)
    incomingGroups.set(edge.target, incoming)
  })

  const outgoingPorts = new Map<string, Map<string, number>>()
  const incomingPorts = new Map<string, Map<string, number>>()

  outgoingGroups.forEach((group, nodeId) => {
    const sorted = [...group].sort((left, right) => {
      const leftY = positions.get(left.target)?.y ?? 0
      const rightY = positions.get(right.target)?.y ?? 0
      return leftY - rightY || left.key.localeCompare(right.key)
    })
    const offsets = new Map<string, number>()
    sorted.forEach((edge, index) => offsets.set(edge.key, portOffset(index, sorted.length)))
    outgoingPorts.set(nodeId, offsets)
  })

  incomingGroups.forEach((group, nodeId) => {
    const sorted = [...group].sort((left, right) => {
      const leftY = positions.get(left.source)?.y ?? 0
      const rightY = positions.get(right.source)?.y ?? 0
      return leftY - rightY || left.key.localeCompare(right.key)
    })
    const offsets = new Map<string, number>()
    sorted.forEach((edge, index) => offsets.set(edge.key, portOffset(index, sorted.length)))
    incomingPorts.set(nodeId, offsets)
  })

  const returnLaneIndex = new Map(returnEdges.map((edge, index) => [edge.key, index]))

  return edges.map((edge) => {
    const source = positions.get(edge.source)!
    const target = positions.get(edge.target)!
    const sourceColumn = columns.get(edge.source) ?? source.column
    const targetColumn = columns.get(edge.target) ?? target.column

    if (sourceColumn < targetColumn) {
      const start: Point = {
        x: source.x + GRAPH_NODE_WIDTH,
        y: source.y + GRAPH_NODE_HEIGHT / 2 + (outgoingPorts.get(edge.source)?.get(edge.key) ?? 0),
      }
      const end: Point = {
        x: target.x,
        y: target.y + GRAPH_NODE_HEIGHT / 2 + (incomingPorts.get(edge.target)?.get(edge.key) ?? 0),
      }
      const dx = end.x - start.x
      const bend = Math.max(36, dx * 0.42)
      const path = `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`
      return { ...edge, kind: 'forward', path }
    }

    if (sourceColumn === targetColumn) {
      if (source.row < target.row) {
        if (target.row === source.row + 1) {
          const start = { x: source.x + GRAPH_NODE_WIDTH / 2, y: source.y + GRAPH_NODE_HEIGHT }
          const end = { x: target.x + GRAPH_NODE_WIDTH / 2, y: target.y }
          return { ...edge, kind: 'vertical', path: `M ${start.x} ${start.y} L ${end.x} ${end.y}` }
        }
        const rightX = source.x + GRAPH_NODE_WIDTH + 28
        const start = { x: source.x + GRAPH_NODE_WIDTH, y: source.y + GRAPH_NODE_HEIGHT / 2 }
        const end = { x: target.x + GRAPH_NODE_WIDTH, y: target.y + GRAPH_NODE_HEIGHT / 2 }
        return {
          ...edge,
          kind: 'vertical',
          path: `M ${start.x} ${start.y} C ${rightX} ${start.y}, ${rightX} ${end.y}, ${end.x} ${end.y}`,
        }
      }

      const rightX = source.x + GRAPH_NODE_WIDTH + 36
      const start = { x: source.x + GRAPH_NODE_WIDTH, y: source.y + GRAPH_NODE_HEIGHT / 2 }
      const end = { x: target.x + GRAPH_NODE_WIDTH, y: target.y + GRAPH_NODE_HEIGHT / 2 }
      return {
        ...edge,
        kind: 'vertical',
        path: `M ${start.x} ${start.y} C ${rightX} ${start.y}, ${rightX} ${end.y}, ${end.x} ${end.y}`,
      }
    }

    const laneIndex = returnLaneIndex.get(edge.key) ?? 0
    const laneY = bottomLaneStart + laneIndex * 20
    const start: Point = {
      x: source.x + GRAPH_NODE_WIDTH / 2,
      y: source.y + GRAPH_NODE_HEIGHT,
    }
    const end: Point = {
      x: target.x + GRAPH_NODE_WIDTH / 2,
      y: target.y + GRAPH_NODE_HEIGHT,
    }
    return { ...edge, kind: 'return', path: makeReturnPath(start, end, laneY) }
  })
}

export function computeSystemGraphLayout(graph: SystemGraphData): SystemGraphLayout {
  const normalized = normalizeGraph(graph)
  if (normalized.nodes.length === 0) {
    return {
      nodes: [],
      edges: [],
      positions: new Map(),
      columns: new Map(),
      width: 0,
      height: 0,
    }
  }

  const forwardEdgeKeys = selectForwardEdges(normalized.nodes, normalized.edges)
  const rankedNodes = assignRanks(normalized.nodes, normalized.edges, forwardEdgeKeys)
  const { columns, columnById } = orderColumns(rankedNodes, normalized.edges)

  const maxRows = Math.max(1, ...columns.map((column) => column.length))
  const contentHeight =
    maxRows * GRAPH_NODE_HEIGHT + Math.max(0, maxRows - 1) * GRAPH_ROW_GAP
  const contentTop = GRAPH_PADDING

  const positions = new Map<string, GraphLayoutPoint>()
  columns.forEach((column, columnIndex) => {
    const groupHeight =
      column.length * GRAPH_NODE_HEIGHT + Math.max(0, column.length - 1) * GRAPH_ROW_GAP
    const top = contentTop + (contentHeight - groupHeight) / 2
    column.forEach((node, row) => {
      positions.set(node.id, {
        x: GRAPH_PADDING + columnIndex * (GRAPH_NODE_WIDTH + GRAPH_COLUMN_GAP),
        y: top + row * (GRAPH_NODE_HEIGHT + GRAPH_ROW_GAP),
        column: columnIndex,
        row,
      })
    })
  })

  const bottomLaneStart = contentTop + contentHeight + 28
  const layoutEdges = routeSystemGraphEdges(
    normalized.edges,
    positions,
    columnById,
    bottomLaneStart,
  )
  const returnEdges = normalized.edges.filter((edge) => !isForwardRank(edge, columnById))

  const bottomLaneSpace = returnEdges.length * 20 + 36
  const graphWidth =
    GRAPH_PADDING * 2 +
    columns.length * GRAPH_NODE_WIDTH +
    Math.max(0, columns.length - 1) * GRAPH_COLUMN_GAP
  const graphHeight = bottomLaneStart + bottomLaneSpace

  return {
    nodes: columns.flat(),
    edges: layoutEdges,
    positions,
    columns: columnById,
    width: graphWidth,
    height: graphHeight,
  }
}
