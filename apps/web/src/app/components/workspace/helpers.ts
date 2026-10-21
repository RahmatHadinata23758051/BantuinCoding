import type { ContextProvenanceCounts } from './types'
import { SENSITIVE_CONTEXT_KEY, SENSITIVE_CONTEXT_VALUE } from './constants'
import type { WorkspaceSection } from '@/lib/navigation/workspace'
import type { SystemGraphData } from '@repo/types'

export function shouldShowDesignSystemGraph(
  graph: SystemGraphData | null | undefined,
  classification?: string | null,
): boolean {
  if (!classification || classification === 'LANDING_PAGE' || classification === 'STATIC_SITE') {
    return false
  }
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length < 2 || !Array.isArray(graph.edges)) {
    return false
  }

  const nodeIds = new Set(graph.nodes.map(({ id }) => id))
  return graph.edges.some((edge) => edge.source !== edge.target && nodeIds.has(edge.source) && nodeIds.has(edge.target))
}

export function getSectionTabKey(id: WorkspaceSection) {
  if (id === 'design-system') return 'tabDesignSystem'
  return `tab${id.charAt(0).toUpperCase() + id.slice(1)}`
}

export function getSectionPanelId(section: WorkspaceSection) {
  return `workspace-panel-${section}`
}

export function getSectionTabId(section: WorkspaceSection) {
  return `workspace-tab-${section}`
}

export function formatLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

export function formatDate(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

export function statusTone(status: string) {
  switch (status) {
    case 'READY':
    case 'DONE':
    case 'EXPORTABLE':
      return 'bg-[var(--workspace-mint-soft)] text-[var(--workspace-ink)]'
    case 'MODIFIED':
    case 'IN_PROGRESS':
    case 'GENERATING':
      return 'bg-[var(--workspace-blue-soft)] text-[var(--workspace-ink)]'
    case 'OUTDATED':
    case 'BLOCKED':
    case 'REVIEW':
      return 'bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)]'
    case 'FAILED':
    case 'GENERATION_FAILED':
      return 'bg-[var(--workspace-rose-soft)] text-[var(--workspace-ink)]'
    default:
      return 'bg-black/[0.04] text-[var(--workspace-ink)]'
  }
}

export function hasContextData(context: Record<string, unknown> | null) {
  return Boolean(context && Object.keys(context).length > 0)
}

export function isSensitiveContextValue(value: unknown): boolean {
  if (typeof value === 'string') return SENSITIVE_CONTEXT_VALUE.test(value.trim())
  if (Array.isArray(value)) return value.some(isSensitiveContextValue)
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(([key, nestedValue]) =>
      SENSITIVE_CONTEXT_KEY.test(key) || isSensitiveContextValue(nestedValue),
    )
  }
  return false
}

export function getContextProvenanceCounts(context: Record<string, unknown>, keys: readonly string[]): ContextProvenanceCounts {
  const counts: ContextProvenanceCounts = { confirmed: 0, assumed: 0, unknown: 0 }

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!value || typeof value !== 'object') return

    const record = value as Record<string, unknown>
    const provenance = record.provenance
    if (provenance === 'confirmed' || provenance === 'assumed' || provenance === 'unknown') {
      counts[provenance] += 1
      return
    }
    Object.values(record).forEach(visit)
  }

  keys.forEach((key) => visit(context[key]))
  return counts
}

export function countContextItems(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  if (Array.isArray(value)) return value.length
  if (typeof value !== 'object') return 1

  const record = value as Record<string, unknown>
  if (record.provenance === 'confirmed' || record.provenance === 'assumed' || record.provenance === 'unknown') {
    return 1
  }
  return Object.values(record).reduce<number>((total, nestedValue) => total + countContextItems(nestedValue), 0)
}

export interface DocumentReadiness {
  readyCount: number
  totalCount: number
  attentionCount: number
  retryableCount: number
  pendingDocuments: Array<{ id: string; type: string; filename: string; status: string }>
}

export function getDocumentReadiness({
  requiredArtifactTypes,
  artifacts,
  plannedDocuments,
}: {
  requiredArtifactTypes: string[]
  artifacts: Array<{ type: string; status: string; path?: string }>
  plannedDocuments: Array<{ id: string; type: string; filename: string; status: string }>
}): DocumentReadiness {
  if (requiredArtifactTypes.length === 0) {
    const readyArtifacts = artifacts.filter(
      (artifact) => artifact.status === 'READY' || artifact.status === 'MODIFIED',
    )
    const nonReadyArtifacts = artifacts.filter(
      (artifact) => artifact.status !== 'READY' && artifact.status !== 'MODIFIED',
    )
    return {
      readyCount: readyArtifacts.length,
      totalCount: artifacts.length,
      attentionCount: nonReadyArtifacts.length,
      retryableCount: 0,
      pendingDocuments: [],
    }
  }

  const requiredTypes = [...new Set(requiredArtifactTypes)]
  const requiredTypeSet = new Set(requiredTypes)
  const requiredArtifacts = artifacts.filter((artifact) => requiredTypeSet.has(artifact.type))
  const readyTypes = new Set(
    requiredArtifacts
      .filter((artifact) => artifact.status === 'READY' || artifact.status === 'MODIFIED')
      .map((artifact) => artifact.type),
  )
  const existingTypes = new Set(requiredArtifacts.map((artifact) => artifact.type))
  const plannedByType = new Map(plannedDocuments.map((document) => [document.type, document]))
  const pendingDocuments = requiredTypes
    .filter((type) => !existingTypes.has(type))
    .map((type) => plannedByType.get(type) ?? {
      id: type,
      type,
      filename: `${type}.md`,
      status: 'WAITING',
    })

  const retryableCount = requiredTypes.filter((type) => {
    if (!['PRD', 'ARCHITECTURE', 'DESIGN', 'AGENT'].includes(type)) return false
    const artifact = requiredArtifacts.find((candidate) => candidate.type === type)
    return !artifact || (artifact.status !== 'READY' && artifact.status !== 'MODIFIED')
  }).length
  const attentionCount = requiredTypes.filter((type) => {
    const artifact = requiredArtifacts.find((candidate) => candidate.type === type)
    return !artifact || (artifact.status !== 'READY' && artifact.status !== 'MODIFIED')
  }).length

  return {
    readyCount: readyTypes.size,
    totalCount: requiredTypes.length,
    attentionCount,
    retryableCount,
    pendingDocuments,
  }
}

export type ExportBlockedReason = 'no-documents' | 'incomplete-pack' | 'project-not-ready' | null

export function getExportBlockedReason({
  canExport,
  hasAnyReadyArtifacts,
  readyRequiredCount,
  totalRequiredCount,
  projectStatus,
}: {
  canExport: boolean
  hasAnyReadyArtifacts: boolean
  readyRequiredCount: number
  totalRequiredCount: number
  projectStatus: string
}): ExportBlockedReason {
  if (canExport) return null
  if (!hasAnyReadyArtifacts) return 'no-documents'
  if (readyRequiredCount < totalRequiredCount) return 'incomplete-pack'
  if (projectStatus !== 'READY' && projectStatus !== 'EXPORTABLE') return 'project-not-ready'
  return 'no-documents'
}
