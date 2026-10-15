'use client'

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Minus, Plus, RotateCcw, ScanSearch } from 'lucide-react'
import type { SystemGraphData, SystemGraphNode } from '@repo/types'
import { useTranslations } from 'next-intl'

type Point = { x: number; y: number }

const NODE_WIDTH = 220
const NODE_HEIGHT = 142
const COLUMN_GAP = 110
const ROW_GAP = 42
const PADDING = 42
const CATEGORY_ORDER = ['client', 'ui', 'auth', 'api', 'service', 'database', 'external'] as const

const CATEGORY_CLASSES: Record<SystemGraphNode['category'], string> = {
  client: 'border-[#8fd3ff] bg-[#102b40] text-[#dff3ff]',
  ui: 'border-[#b9a7ff] bg-[#241c46] text-[#eeeaff]',
  auth: 'border-[#f7c873] bg-[#44331a] text-[#fff3d5]',
  api: 'border-[#85dec1] bg-[#10382e] text-[#ddfff4]',
  service: 'border-[#ff9e82] bg-[#452419] text-[#ffe9e2]',
  database: 'border-[#d1b0ff] bg-[#332047] text-[#f2e9ff]',
  external: 'border-[#b8c8d6] bg-[#29323a] text-[#edf4fa]',
}

function graphNodeKey(node: SystemGraphNode) {
  return node.id.replace(/[^a-zA-Z0-9_-]/g, '-')
}

export function DesignSystemGraph({ graph }: { graph: SystemGraphData }) {
  const t = useTranslations('Workspace')
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [selectedId, setSelectedId] = useState<string | null>(graph.nodes[0]?.id ?? null)
  const dragRef = useRef<{ pointerId: number; start: Point; origin: Point } | null>(null)

  const { nodes, edges, positions, width, height } = useMemo(() => {
    const categoryIndexes = new Map<string, number>()
    const sortedNodes = [...graph.nodes].sort((a, b) => {
      const categoryDifference = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
      if (categoryDifference !== 0) return categoryDifference
      return a.label.localeCompare(b.label)
    })
    const positionMap = new Map<string, Point>()

    sortedNodes.forEach((node) => {
      const row = categoryIndexes.get(node.category) ?? 0
      categoryIndexes.set(node.category, row + 1)
      const column = CATEGORY_ORDER.indexOf(node.category)
      positionMap.set(node.id, {
        x: PADDING + Math.max(column, 0) * (NODE_WIDTH + COLUMN_GAP),
        y: PADDING + row * (NODE_HEIGHT + ROW_GAP),
      })
    })

    const maxRow = Math.max(0, ...[...categoryIndexes.values()])
    const maxColumn = Math.max(0, ...sortedNodes.map((node) => CATEGORY_ORDER.indexOf(node.category)))
    return {
      nodes: sortedNodes,
      edges: graph.edges.filter((edge) => positionMap.has(edge.source) && positionMap.has(edge.target)),
      positions: positionMap,
      width: PADDING * 2 + (maxColumn + 1) * NODE_WIDTH + maxColumn * COLUMN_GAP,
      height: PADDING * 2 + Math.max(1, maxRow) * NODE_HEIGHT + Math.max(0, maxRow - 1) * ROW_GAP,
    }
  }, [graph])

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0] ?? null
  const incoming = selectedNode ? edges.filter((edge) => edge.target === selectedNode.id) : []
  const outgoing = selectedNode ? edges.filter((edge) => edge.source === selectedNode.id) : []
  const connectedIds = new Set(
    selectedNode
      ? [selectedNode.id, ...incoming.map((edge) => edge.source), ...outgoing.map((edge) => edge.target)]
      : [],
  )

  const categoryLabel = (category: SystemGraphNode['category']) => t(`graphCategory${category.charAt(0).toUpperCase()}${category.slice(1)}` as Parameters<typeof t>[0])
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  const zoom = (delta: number) => {
    setScale((current) => Math.min(1.8, Math.max(0.55, Number((current + delta).toFixed(2)))))
  }

  const fitView = () => {
    const viewport = viewportRef.current
    if (!viewport) {
      setScale(0.8)
      setOffset({ x: 0, y: 0 })
      return
    }
    const availableWidth = Math.max(280, viewport.clientWidth - 32)
    const availableHeight = Math.max(220, viewport.clientHeight - 32)
    const fittedScale = Math.min(1, availableWidth / width, availableHeight / height)
    setScale(Number(Math.max(0.55, fittedScale).toFixed(2)))
    setOffset({ x: 0, y: 0 })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: offset,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setOffset({
      x: drag.origin.x + event.clientX - drag.start.x,
      y: drag.origin.y + event.clientY - drag.start.y,
    })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  if (nodes.length === 0) {
    return (
      <section className="rounded-[20px] border border-[var(--workspace-border)] bg-[#101820] p-6 text-[#e9f2f7]">
        <h2 className="text-xl font-semibold">{t('noGraphData')}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aab9c3]">{t('noGraphDataDesc')}</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="design-system-graph-title" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="design-system-graph-title" className="text-2xl font-semibold tracking-[-0.03em] text-[var(--workspace-ink)] sm:text-3xl">
            {t('sectionDesignSystem')}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">{t('sectionDesignSystemDesc')}</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label={t('graphControls')}>
          <button type="button" onClick={() => zoom(0.1)} aria-label={t('zoomIn')} className="graph-control"><Plus aria-hidden="true" className="size-4" />{t('zoomIn')}</button>
          <button type="button" onClick={() => zoom(-0.1)} aria-label={t('zoomOut')} className="graph-control"><Minus aria-hidden="true" className="size-4" />{t('zoomOut')}</button>
          <button type="button" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} aria-label={t('resetZoom')} className="graph-control"><RotateCcw aria-hidden="true" className="size-4" />{t('resetZoom')}</button>
          <button type="button" onClick={fitView} aria-label={t('fitView')} className="graph-control"><ScanSearch aria-hidden="true" className="size-4" />{t('fitView')}</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div
          ref={viewportRef}
          className="relative min-h-[32rem] overflow-hidden rounded-[20px] border border-[#314554] bg-[#0d151c] shadow-[0_16px_40px_rgba(17,24,39,0.16)]"
          style={{ backgroundImage: 'radial-gradient(#344955 1px, transparent 1px)', backgroundSize: '18px 18px' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="absolute left-4 top-4 z-20 rounded-md border border-[#3a4d5a] bg-[#101d26]/95 px-3 py-2 text-xs text-[#afc0ca]">
            {nodes.length} {t('graphNodes')} · {edges.length} {t('graphConnections')}
          </div>
          <div className="absolute inset-0 overflow-auto">
            <div className="relative" style={{ width: width * scale + 32, height: height * scale + 32 }}>
              <div className="absolute left-4 top-4 origin-top-left" style={{ width, height, transform: `translate(${offset.x / scale}px, ${offset.y / scale}px) scale(${scale})` }}>
                <svg aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={height}>
                  {edges.map((edge) => {
                    const source = positions.get(edge.source)
                    const target = positions.get(edge.target)
                    if (!source || !target) return null
                    const isConnected = selectedNode?.id === edge.source || selectedNode?.id === edge.target
                    const startX = source.x + NODE_WIDTH
                    const startY = source.y + NODE_HEIGHT / 2
                    const endX = target.x
                    const endY = target.y + NODE_HEIGHT / 2
                    const bend = Math.max(60, Math.abs(endX - startX) * 0.45)
                    return <path key={`${edge.source}-${edge.target}-${edge.label ?? ''}`} d={`M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`} fill="none" stroke={isConnected ? '#f7c873' : '#66808f'} strokeWidth={isConnected ? 3 : 1.5} opacity={selectedNode && !isConnected ? 0.28 : 0.82} markerEnd="url(#graph-arrow)" />
                  })}
                  <defs>
                    <marker id="graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f7c873" /></marker>
                  </defs>
                </svg>
                {nodes.map((node) => {
                  const point = positions.get(node.id)
                  if (!point) return null
                  const isSelected = selectedNode?.id === node.id
                  const isConnected = connectedIds.has(node.id)
                  return (
                    <button
                      key={node.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${node.label}, ${categoryLabel(node.category)}`}
                      onClick={() => setSelectedId(node.id)}
                      className={`absolute flex flex-col rounded-xl border-2 p-4 text-left shadow-[5px_5px_0_rgba(0,0,0,0.28)] transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7c873] ${CATEGORY_CLASSES[node.category]} ${isSelected ? 'ring-2 ring-[#f7c873] ring-offset-2 ring-offset-[#0d151c]' : ''} ${selectedNode && !isConnected ? 'opacity-45' : 'opacity-100'}`}
                      style={{ left: point.x, top: point.y, width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">{categoryLabel(node.category)}</span>
                      <span className="mt-2 text-base font-semibold leading-5">{node.label}</span>
                      <span className="mt-2 line-clamp-3 text-xs leading-5 opacity-80">{node.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <aside aria-labelledby="node-details-title" className="rounded-[20px] border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-5">
          <h3 id="node-details-title" className="text-lg font-semibold text-[var(--workspace-ink)]">{t('nodeDetails')}</h3>
          {selectedNode ? (
            <>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--workspace-muted)]">{categoryLabel(selectedNode.category)}</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--workspace-ink)]">{selectedNode.label}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--workspace-body)]">{selectedNode.description}</p>
              <div className="mt-6 border-t border-[var(--workspace-border-subtle)] pt-4">
                <h4 className="text-sm font-semibold text-[var(--workspace-ink)]">{t('connections')}</h4>
                <div className="mt-3 space-y-4 text-sm">
                  <div>
                    <p className="font-semibold text-[var(--workspace-muted)]">{t('incomingConnections')}</p>
                    {incoming.length === 0 ? <p className="mt-1 text-[var(--workspace-faint)]">{t('noConnections')}</p> : <ul className="mt-1 space-y-1">{incoming.map((edge) => <li key={`in-${edge.source}-${edge.target}`} className="text-[var(--workspace-body)]">{nodeById.get(edge.source)?.label ?? edge.source}{edge.label ? ` · ${edge.label}` : ''}</li>)}</ul>}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--workspace-muted)]">{t('outgoingConnections')}</p>
                    {outgoing.length === 0 ? <p className="mt-1 text-[var(--workspace-faint)]">{t('noConnections')}</p> : <ul className="mt-1 space-y-1">{outgoing.map((edge) => <li key={`out-${edge.source}-${edge.target}`} className="text-[var(--workspace-body)]">{nodeById.get(edge.target)?.label ?? edge.target}{edge.label ? ` · ${edge.label}` : ''}</li>)}</ul>}
                  </div>
                </div>
              </div>
            </>
          ) : <p className="mt-3 text-sm text-[var(--workspace-muted)]">{t('noGraphDataDesc')}</p>}
        </aside>
      </div>

      <details className="rounded-[16px] border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--workspace-ink)]">{t('graphAccessibleView')}</summary>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--workspace-body)]">
          {nodes.map((node) => <li key={`accessible-${graphNodeKey(node)}`}><strong>{node.label}</strong> — {categoryLabel(node.category)}. {node.description}</li>)}
        </ul>
      </details>

      <style jsx>{`.graph-control { display:inline-flex; min-height:2.5rem; align-items:center; gap:.4rem; border:1px solid var(--workspace-border); border-radius:.65rem; background:var(--workspace-paper); padding:0 .75rem; font-size:.75rem; font-weight:600; color:var(--workspace-ink); } .graph-control:hover { background:var(--workspace-blue-soft); } .graph-control:focus-visible { outline:2px solid #f4a261; outline-offset:2px; }`}</style>
    </section>
  )
}
