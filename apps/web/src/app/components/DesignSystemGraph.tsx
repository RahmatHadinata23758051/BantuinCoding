'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
import { Minus, Plus, RotateCcw, ScanSearch, Undo2 } from 'lucide-react'
import type { SystemGraphData, SystemGraphNode } from '@repo/types'
import { useTranslations } from 'next-intl'
import {
  computeSystemGraphLayout,
  GRAPH_NODE_HEIGHT,
  GRAPH_NODE_WIDTH,
  routeSystemGraphEdges,
  type GraphLayoutPoint,
} from './design-system-graph-layout'

type Point = { x: number; y: number }

type GraphNodeStyle = {
  background: string
  borderColor: string
  labelColor: string
  nameColor: string
}

const CATEGORY_ORDER = ['client', 'auth', 'api', 'service', 'database', 'external'] as const
const CATEGORY_STYLES: Record<string, GraphNodeStyle> = {
  client: {
    background: 'var(--graph-node-client-bg)',
    borderColor: 'var(--graph-node-client-border)',
    labelColor: 'var(--graph-node-client-label)',
    nameColor: 'var(--graph-node-client-name)',
  },
  ui: {
    background: 'var(--graph-node-client-bg)',
    borderColor: 'var(--graph-node-client-border)',
    labelColor: 'var(--graph-node-client-label)',
    nameColor: 'var(--graph-node-client-name)',
  },
  auth: {
    background: 'var(--graph-node-auth-bg)',
    borderColor: 'var(--graph-node-auth-border)',
    labelColor: 'var(--graph-node-auth-label)',
    nameColor: 'var(--graph-node-auth-name)',
  },
  api: {
    background: 'var(--graph-node-api-bg)',
    borderColor: 'var(--graph-node-api-border)',
    labelColor: 'var(--graph-node-api-label)',
    nameColor: 'var(--graph-node-api-name)',
  },
  service: {
    background: 'var(--graph-node-service-bg)',
    borderColor: 'var(--graph-node-service-border)',
    labelColor: 'var(--graph-node-service-label)',
    nameColor: 'var(--graph-node-service-name)',
  },
  database: {
    background: 'var(--graph-node-database-bg)',
    borderColor: 'var(--graph-node-database-border)',
    labelColor: 'var(--graph-node-database-label)',
    nameColor: 'var(--graph-node-database-name)',
  },
  external: {
    background: 'var(--graph-node-external-bg)',
    borderColor: 'var(--graph-node-external-border)',
    labelColor: 'var(--graph-node-external-label)',
    nameColor: 'var(--graph-node-external-name)',
  },
}

function graphNodeKey(node: SystemGraphNode) {
  return node.id.replace(/[^a-zA-Z0-9_-]/g, '-')
}

function getClearArea(viewportWidth: number, viewportHeight: number) {
  const compact = viewportWidth < 1024
  return {
    left: compact ? 16 : 304,
    top: compact ? 104 : 112,
    width: Math.max(280, viewportWidth - (compact ? 32 : 608)),
    height: Math.max(220, viewportHeight - 200),
  }
}

export function DesignSystemGraph({ graph }: { graph: SystemGraphData }) {
  const t = useTranslations('Workspace')
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [selectedId, setSelectedId] = useState<string | null>(graph.nodes[0]?.id ?? null)
  const [isDragging, setIsDragging] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [nodePositions, setNodePositions] = useState<{ key: string; positions: Map<string, GraphLayoutPoint> } | null>(null)
  const viewport = { width: viewportSize.width || 1280, height: viewportSize.height || 800 }
  const lastFitViewport = useRef({ width: 0, height: 0 })
  const dragRef = useRef<{ pointerId: number; start: Point; origin: Point } | null>(null)
  const nodeDragRef = useRef<{ pointerId: number; nodeId: string; start: Point; origin: GraphLayoutPoint } | null>(null)

  const layout = useMemo(() => computeSystemGraphLayout(graph), [graph])
  const { nodes, positions: basePositions, width, height } = layout
  const layoutKey = layout.nodes.map((node) => node.id).join('|') + `::${layout.edges.map((edge) => edge.key).join('|')}`
  const positions = nodePositions?.key === layoutKey ? nodePositions.positions : basePositions
  const bottomLaneStart = Math.max(0, ...[...positions.values()].map((point) => point.y + GRAPH_NODE_HEIGHT)) + 28
  const edges = useMemo(
    () => routeSystemGraphEdges(layout.edges, positions, layout.columns, bottomLaneStart),
    [bottomLaneStart, layout.columns, layout.edges, positions],
  )

  const updateNodePosition = (nodeId: string, next: GraphLayoutPoint) => {
    setNodePositions((current) => {
      const nextPositions = new Map(current?.key === layoutKey ? current.positions : basePositions)
      nextPositions.set(nodeId, next)
      return { key: layoutKey, positions: nextPositions }
    })
  }

  const resetNodePositions = () => setNodePositions(null)

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0] ?? null
  const incoming = selectedNode ? edges.filter((edge) => edge.target === selectedNode.id) : []
  const outgoing = selectedNode ? edges.filter((edge) => edge.source === selectedNode.id) : []
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const categoryLabel = (category: SystemGraphNode['category']) =>
    t(`graphCategory${category === 'ui' ? 'Client' : category.charAt(0).toUpperCase()}${category === 'ui' ? '' : category.slice(1)}` as Parameters<typeof t>[0])

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return

    const updateViewportSize = () => {
      setViewportSize({ width: element.clientWidth, height: element.clientHeight })
    }

    updateViewportSize()
    const observer = new ResizeObserver(updateViewportSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const clear = getClearArea(viewport.width, viewport.height)
  const getBasePosition = (nextScale: number) => ({
    x: clear.left + (clear.width - width * nextScale) / 2,
    y: clear.top + (clear.height - height * nextScale) / 2,
  })

  const fitView = () => {
    const fittedScale = Math.min(1, clear.width / width, clear.height / height)
    setScale(Number(Math.max(0.55, fittedScale).toFixed(2)))
    setOffset({ x: 0, y: 0 })
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const nextViewport = { width: viewport.width, height: viewport.height }
      if (
        nextViewport.width === lastFitViewport.current.width &&
        nextViewport.height === lastFitViewport.current.height
      ) return
      lastFitViewport.current = nextViewport
      fitView()
    })
    return () => window.cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.width, viewport.height, width, height])

  const zoomAt = (delta: number, clientX?: number, clientY?: number) => {
    const nextScale = Math.min(1.8, Math.max(0.55, Number((scale + delta).toFixed(2))))
    if (nextScale === scale) return
    if (clientX === undefined || clientY === undefined) {
      setScale(nextScale)
      return
    }

    const currentBase = getBasePosition(scale)
    const nextBase = getBasePosition(nextScale)
    const worldX = (clientX - currentBase.x - offset.x) / scale
    const worldY = (clientY - currentBase.y - offset.y) / scale
    setOffset({
      x: clientX - nextBase.x - worldX * nextScale,
      y: clientY - nextBase.y - worldY * nextScale,
    })
    setScale(nextScale)
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && Math.abs(event.deltaY) < 2) return
    event.preventDefault()
    const direction = event.deltaY > 0 ? -0.1 : 0.1
    zoomAt(direction, event.clientX, event.clientY)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest('button, summary')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: offset,
    }
    setIsDragging(true)
  }

  const handleNodePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, nodeId: string) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const origin = positions.get(nodeId)
    if (!origin) return
    nodeDragRef.current = {
      pointerId: event.pointerId,
      nodeId,
      start: { x: event.clientX, y: event.clientY },
      origin,
    }
    setSelectedId(nodeId)
    setIsDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const nodeDrag = nodeDragRef.current
    if (nodeDrag?.pointerId === event.pointerId) {
      const next = {
        ...nodeDrag.origin,
        x: nodeDrag.origin.x + (event.clientX - nodeDrag.start.x) / scale,
        y: nodeDrag.origin.y + (event.clientY - nodeDrag.start.y) / scale,
      }
      updateNodePosition(nodeDrag.nodeId, next)
      return
    }

    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setOffset({
      x: drag.origin.x + event.clientX - drag.start.x,
      y: drag.origin.y + event.clientY - drag.start.y,
    })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (nodeDragRef.current?.pointerId === event.pointerId) {
      nodeDragRef.current = null
      setIsDragging(false)
      return
    }
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      setIsDragging(false)
    }
  }

  if (nodes.length === 0) {
    return (
      <section
        aria-labelledby="design-system-empty-title"
        className="flex min-h-full items-center justify-center bg-[var(--graph-canvas-bg)] p-6 text-[var(--workspace-ink)] sm:p-10"
        style={{
          backgroundImage: 'radial-gradient(var(--graph-grid-dot) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="w-full max-w-xl rounded-[24px] border border-[var(--graph-card-border)] bg-[var(--graph-card-bg)] p-6 shadow-[var(--graph-card-shadow)] sm:p-8">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[var(--graph-node-service-border)] bg-[var(--graph-node-service-bg)] text-[var(--graph-node-service-label)]" aria-hidden="true">
            <ScanSearch className="size-5" />
          </div>
          <h2 id="design-system-empty-title" className="mt-5 text-2xl font-bold tracking-[-0.04em]">{t('noGraphData')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">{t('noGraphDataDesc')}</p>
        </div>
      </section>
    )
  }

  const base = getBasePosition(scale)
  const stageStyle = {
    left: base.x + offset.x,
    top: base.y + offset.y,
    width,
    height,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  }

  return (
    <section
      aria-labelledby="design-system-graph-title"
      className={`absolute inset-0 overflow-hidden bg-[var(--graph-canvas-bg)] text-[var(--workspace-ink)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        backgroundImage: 'radial-gradient(circle at 62% 44%, var(--graph-radial-glow), transparent 42%), radial-gradient(var(--graph-grid-dot) 1.2px, transparent 1.2px)',
        backgroundSize: '100% 100%, 24px 24px',
      }}
      ref={viewportRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <header className="absolute left-4 top-20 z-20 w-[min(20rem,calc(100%-2rem))] rounded-[20px] border border-[var(--graph-card-border)] bg-[var(--graph-card-bg)] p-4 shadow-[var(--graph-card-shadow)] backdrop-blur-md lg:left-[19rem] lg:top-4 lg:w-auto lg:max-w-[21rem]">
        <h2 id="design-system-graph-title" className="text-2xl font-bold tracking-[-0.04em] text-[var(--workspace-ink)]">{t('sectionDesignSystem')}</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--workspace-muted)]">{t('sectionDesignSystemDesc')}</p>
        <span className="mt-2 inline-flex rounded-full border border-[var(--graph-node-service-border)] bg-[var(--graph-node-service-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--graph-node-service-label)]">
          {nodes.length} {t('graphNodes')} · {edges.length} {t('graphConnections')}
        </span>
      </header>

      <div className="absolute inset-0 overflow-hidden" aria-label={t('graphCanvasLabel')}>
        <div className="absolute origin-top-left motion-reduce:transition-none" style={stageStyle}>
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={height}>
            <defs>
              <marker id="graph-arrow-normal" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="var(--graph-edge)" /></marker>
              <marker id="graph-arrow-selected" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--graph-edge-selected)" /></marker>
            </defs>
            {edges.map((edge) => {
              const isConnected = selectedNode?.id === edge.source || selectedNode?.id === edge.target
              return (
                <path
                  key={edge.key}
                  d={edge.path}
                  fill="none"
                  stroke={isConnected ? 'var(--graph-edge-selected)' : 'var(--graph-edge)'}
                  strokeWidth={isConnected ? 2.6 : 1.7}
                  strokeLinecap="round"
                  strokeDasharray={edge.kind === 'return' ? '6 5' : undefined}
                  markerEnd={isConnected ? 'url(#graph-arrow-selected)' : 'url(#graph-arrow-normal)'}
                />
              )
            })}
          </svg>
          {nodes.map((node) => {
            const point = positions.get(node.id)
            if (!point) return null
            const isSelected = selectedNode?.id === node.id
            const style = CATEGORY_STYLES[node.category] ?? CATEGORY_STYLES.external
            const nodeStyle = {
              backgroundColor: style.background,
              borderColor: isSelected ? 'var(--graph-edge-selected)' : style.borderColor,
              color: style.nameColor,
              boxShadow: isSelected ? 'var(--graph-node-selected-shadow)' : 'var(--graph-node-shadow)',
            }
            return (
              <button
                key={node.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${node.label.replace(/\s+/g, ' ')}, ${categoryLabel(node.category)}`}
                onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                onClick={() => setSelectedId(node.id)}
                className="absolute flex flex-col justify-center rounded-xl border-[1.5px] px-3.5 py-3 text-left transition-[box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--graph-edge-selected)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--graph-canvas-bg)] motion-reduce:transition-none"
                style={{ ...nodeStyle, left: point.x, top: point.y, width: GRAPH_NODE_WIDTH, height: GRAPH_NODE_HEIGHT }}
              >
                <span className="text-[9.5px] font-bold uppercase tracking-[0.08em]" style={{ color: style.labelColor }}>{categoryLabel(node.category)}</span>
                <span className="mt-1 line-clamp-2 whitespace-pre-line text-[13px] font-semibold leading-4" style={{ color: style.nameColor }}>{node.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-20 max-w-[calc(100%-2rem)] overflow-x-auto rounded-full border border-[var(--graph-card-border)] bg-[var(--graph-card-bg)] px-3 py-2 shadow-[var(--graph-card-shadow)] backdrop-blur-md lg:left-[19rem]">
        <div className="flex min-w-max items-center gap-3 text-[10px] font-semibold text-[var(--workspace-muted)]">
          {CATEGORY_ORDER.map((category) => {
            const style = CATEGORY_STYLES[category]
            return <span key={category} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm border" style={{ backgroundColor: style.background, borderColor: style.borderColor }} />{categoryLabel(category)}</span>
          })}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex items-center rounded-[18px] border border-[var(--graph-card-border)] bg-[var(--graph-card-bg)] p-1.5 shadow-[var(--graph-card-shadow)] backdrop-blur-md">
        <button type="button" onClick={() => zoomAt(0.1)} aria-label={t('zoomIn')} title={t('zoomIn')} className="graph-control"><Plus aria-hidden="true" className="size-4" /></button>
        <button type="button" onClick={() => zoomAt(-0.1)} aria-label={t('zoomOut')} title={t('zoomOut')} className="graph-control"><Minus aria-hidden="true" className="size-4" /></button>
        <button type="button" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} aria-label={t('resetZoom')} title={t('resetZoom')} className="graph-control"><RotateCcw aria-hidden="true" className="size-4" /></button>
        <button type="button" onClick={resetNodePositions} aria-label={t('resetNodePositions')} title={t('resetNodePositions')} className="graph-control"><Undo2 aria-hidden="true" className="size-4" /></button>
        <button type="button" onClick={fitView} aria-label={t('fitView')} title={t('fitView')} className="graph-control graph-control-active"><ScanSearch aria-hidden="true" className="size-4" /></button>
      </div>

      <aside aria-labelledby="node-details-title" className="absolute bottom-0 left-0 right-0 z-30 max-h-[48dvh] overflow-y-auto rounded-t-[24px] border border-[var(--graph-card-border)] bg-[var(--graph-card-bg)] p-5 shadow-[var(--graph-card-shadow)] backdrop-blur-md lg:bottom-auto lg:left-auto lg:right-4 lg:top-4 lg:max-h-[calc(100%-6rem)] lg:w-[276px] lg:rounded-[20px]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--workspace-border-muted)] lg:hidden" aria-hidden="true" />
        <h3 id="node-details-title" className="text-lg font-bold text-[var(--workspace-ink)]">{t('nodeDetails')}</h3>
        {selectedNode && (
          <>
            <p className="mt-3 inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em]" style={{ borderColor: CATEGORY_STYLES[selectedNode.category]?.borderColor ?? CATEGORY_STYLES.external.borderColor, color: CATEGORY_STYLES[selectedNode.category]?.labelColor ?? CATEGORY_STYLES.external.labelColor, backgroundColor: CATEGORY_STYLES[selectedNode.category]?.background ?? CATEGORY_STYLES.external.background }}>{categoryLabel(selectedNode.category)}</p>
            <p className="mt-2 whitespace-pre-line text-xl font-bold tracking-[-0.03em] text-[var(--workspace-ink)]">{selectedNode.label}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--workspace-muted)]">{selectedNode.description}</p>
            <div className="mt-5 border-t border-[var(--workspace-border-subtle)] pt-4">
              <h4 className="text-sm font-bold text-[var(--workspace-ink)]">{t('connections')}</h4>
              <div className="mt-3 space-y-4 text-xs">
                <div><p className="font-bold text-[var(--workspace-muted)]">{t('incomingConnections')}</p>{incoming.length === 0 ? <p className="mt-1 text-[var(--workspace-faint)]">{t('noConnections')}</p> : <ul className="mt-1 space-y-1">{incoming.map((edge) => <li key={`in-${edge.source}-${edge.target}`} className="text-[var(--workspace-body)]">{nodeById.get(edge.source)?.label ?? edge.source}{edge.label ? ` · ${edge.label}` : ''}</li>)}</ul>}</div>
                <div><p className="font-bold text-[var(--workspace-muted)]">{t('outgoingConnections')}</p>{outgoing.length === 0 ? <p className="mt-1 text-[var(--workspace-faint)]">{t('noConnections')}</p> : <ul className="mt-1 space-y-1">{outgoing.map((edge) => <li key={`out-${edge.source}-${edge.target}`} className="text-[var(--workspace-body)]">{nodeById.get(edge.target)?.label ?? edge.target}{edge.label ? ` · ${edge.label}` : ''}</li>)}</ul>}</div>
              </div>
            </div>
          </>
        )}
        <details className="mt-5 border-t border-[var(--workspace-border-subtle)] pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--workspace-ink)]">{t('graphAccessibleView')}</summary>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--workspace-body)]">{nodes.map((node) => <li key={`accessible-${graphNodeKey(node)}`}><strong>{node.label}</strong> — {categoryLabel(node.category)}. {node.description}</li>)}</ul>
        </details>
      </aside>

      <style jsx>{`.graph-control { display:inline-flex; min-height:2.5rem; align-items:center; justify-content:center; gap:.35rem; border-radius:.7rem; padding:0 .7rem; color:var(--workspace-ink); font-size:.7rem; font-weight:600; white-space:nowrap; } .graph-control:hover { background:var(--workspace-blue-soft); } .graph-control-active { background:var(--workspace-rose-soft); color:var(--graph-node-service-label); } .graph-control:focus-visible { outline:2px solid var(--graph-edge-selected); outline-offset:2px; } @media (max-width:1023px) { .graph-control { min-width:2.5rem; padding:0 .55rem; } }`}</style>
    </section>
  )
}
