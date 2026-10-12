'use client'

import dynamic from 'next/dynamic'
import { Link } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useRouter } from '@/i18n/routing'
import {
  AlertTriangle,
  ArrowLeft,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDashed,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  Files,
  FolderKanban,
  ListChecks,
  Loader2,
  Menu,
  MessageSquareText,
  Package,
  Play,
  RefreshCw,
  X,
  ScanText,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { MarkdownWorkspace, type WorkspaceArtifactItem } from '@/app/components/MarkdownWorkspace'
import { BacklogKanbanBoard } from '@/app/components/BacklogKanbanBoard'
import { PackHandoffVisual } from '@/app/components/PackHandoffVisual'

const PackHandoffWebGL = dynamic(
  () => import('@/app/components/PackHandoffWebGL').then((module) => module.PackHandoffWebGL),
  { ssr: false },
)
import { Modal, Input, Select, Button } from '@/app/components/ui'
import {
  GENERATION_STAGES,
  createPersistedGenerationState,
  createQueuedGenerationState,
  getGenerationStageDescriptionKey,
  getGenerationStageLabelKey,
  getGenerationStageStatusKey,
  getGenerationProgressPercentage,
  getRetryableGenerationStages,
  markGenerationStageComplete,
  markGenerationStageFailed,
  markGenerationStageRunning,
  resetGenerationForRetry,
  type GenerationStageId,
  type GenerationState,
  type GenerationStageStatus,
} from '@/lib/workflow/generation-stages'

export interface ProjectWorkspaceProps {
  initialData: {
    id: string
    name: string
    description: string | null
    classification: string
    language: string
    status: string
    createdAt: string
    updatedAt: string
    context: Record<string, unknown> | null
    contextVersion: number
    requiredArtifactTypes: string[]
    clarifications: {
      id: string
      round: number
      question: string
      impact: string | null
      options?: string[]
      answer: string | null
      status: string
    }[]
    artifacts: WorkspaceArtifactItem[]
    skills: {
      id: string
      name: string
      source: string
      purpose: string
      trigger: string
      metadata: {
        applicable_phases?: string[]
        applicable_task_types?: string[]
        installation_hint?: string
      } | null
    }[]
    phases: {
      id: string
      name: string
      order: number
      description: string | null
      tasks: {
        id: string
        taskKey: string
        title: string
        description: string
        status: string
        acceptanceCriteria: string[]
        definitionOfDone: string
        relevantDocs: string[]
        recommendedSkills: string[]
        dependencies: string[]
      }[]
    }[]
  }
}

import { parseWorkspaceTab, type WorkspaceSection } from '@/lib/navigation/workspace'

type ReadinessTone = 'ready' | 'attention' | 'idle'

const SECTION_ITEMS: {
  id: WorkspaceSection
  labelKey: string
  descriptionKey: string
  icon: LucideIcon
}[] = [
  { id: 'overview', labelKey: 'sectionOverview', descriptionKey: 'sectionOverviewDesc', icon: ClipboardCheck },
  { id: 'context', labelKey: 'sectionContext', descriptionKey: 'sectionContextDesc', icon: Braces },
  { id: 'documents', labelKey: 'sectionDocuments', descriptionKey: 'sectionDocumentsDesc', icon: Files },
  { id: 'skills', labelKey: 'sectionSkills', descriptionKey: 'sectionSkillsDesc', icon: Wrench },
  { id: 'backlog', labelKey: 'sectionBacklog', descriptionKey: 'sectionBacklogDesc', icon: ListChecks },
  { id: 'export', labelKey: 'sectionExport', descriptionKey: 'sectionExportDesc', icon: Package },
]

const WORKSPACE_STYLE = {
  '--workspace-paper': '#fffdfa',
  '--workspace-ink': '#24231f',
  '--workspace-canvas': '#f7f6f3',
  '--workspace-panel': '#fffdfa',
  '--workspace-muted': '#706b64',
  '--workspace-faint': '#a9a29a',
  '--workspace-primary': '#a85e3c',
  '--workspace-mint': '#e7eee7',
  '--workspace-rose': '#9b4434',
  '--workspace-blue-soft': '#f0ece6',
  '--workspace-yellow-soft': '#f8eee6',
  '--workspace-mint-soft': '#edf2eb',
  '--workspace-rose-soft': '#f8e9e5',
  '--workspace-sun': '#f4a261',
} as CSSProperties

const PANEL_CLASS =
  'rounded-[20px] border border-[#dedbd5] bg-[var(--workspace-panel)] shadow-[0_10px_28px_rgba(36,35,31,0.045)]'
const PANEL_SOFT_CLASS =
  'rounded-[16px] bg-[var(--workspace-paper)]'
const BUTTON_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--workspace-canvas)]'

const SENSITIVE_CONTEXT_KEY =
  /(api.?key|access.?token|authorization|credential|password|private.?key|secret|token)/i
const SENSITIVE_CONTEXT_VALUE =
  /^(?:bearer\s+|sk-[a-z0-9_-]{12,}|AIza[a-z0-9_-]{20,}|gh[pousr]_[a-z0-9_]{20,}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$)/i

function isSensitiveContextValue(value: unknown): boolean {
  if (typeof value === 'string') return SENSITIVE_CONTEXT_VALUE.test(value.trim())
  if (Array.isArray(value)) return value.some(isSensitiveContextValue)
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(([key, nestedValue]) =>
      SENSITIVE_CONTEXT_KEY.test(key) || isSensitiveContextValue(nestedValue),
    )
  }
  return false
}

function SensitiveContextValue({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[var(--workspace-muted)]">
      <ShieldCheck aria-hidden="true" className="size-4" />
      {label}
    </span>
  )
}

function getSectionPanelId(section: WorkspaceSection) {
  return `workspace-panel-${section}`
}

function getSectionTabId(section: WorkspaceSection) {
  return `workspace-tab-${section}`
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

function formatDate(value: string, locale: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}

function statusTone(status: string) {
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

function hasContextData(context: Record<string, unknown> | null) {
  return Boolean(context && Object.keys(context).length > 0)
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-black/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-[var(--workspace-ink)] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-72 items-center py-10">
      <div className={`${PANEL_CLASS} max-w-xl p-6`}>
        <div className="mb-4 flex size-10 items-center justify-center bg-[var(--workspace-blue-soft)]">
          <Icon aria-hidden="true" className="size-5 text-[var(--workspace-primary)]" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-[var(--workspace-ink)]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
          {description}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  )
}

function ReadinessLine({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: ReadinessTone
}) {
  const Icon = tone === 'ready' ? CheckCircle2 : tone === 'attention' ? AlertTriangle : CircleDashed

  return (
    <li className="grid gap-2 border-t border-black/[0.08] py-3 first:border-t-0 sm:grid-cols-[minmax(10rem,0.75fr)_minmax(9rem,0.6fr)_1fr] sm:items-center">
      <div className="flex items-center gap-2.5 text-sm font-medium text-[var(--workspace-ink)]">
        <span
          className={`flex size-6 shrink-0 items-center justify-center ${
            tone === 'ready'
              ? 'bg-[var(--workspace-mint-soft)] text-emerald-700'
              : tone === 'attention'
                ? 'bg-[var(--workspace-yellow-soft)] text-amber-700'
                : 'bg-black/[0.04] text-[var(--workspace-faint)]'
          }`}
        >
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
        {label}
      </div>
      <span className="font-mono text-xs text-[var(--workspace-ink)]">{value}</span>
      <span className="text-xs leading-5 text-[var(--workspace-muted)]">{detail}</span>
    </li>
  )
}

function ContextValue({
  value,
  depth = 0,
  locale,
  emptyLabel,
  yesLabel,
  noLabel,
  entryLabel,
  noFieldsLabel,
  sensitiveLabel,
}: {
  value: unknown
  depth?: number
  locale: string
  emptyLabel: string
  yesLabel: string
  noLabel: string
  entryLabel: (index: number) => string
  noFieldsLabel: string
  sensitiveLabel: string
}) {
  if (value === null || value === undefined) {
    return <span className="text-[var(--workspace-faint)]">{emptyLabel}</span>
  }

  if (typeof value === 'boolean') {
    return (
      <span className="inline-flex items-center gap-2">
        {value ? (
          <Check aria-hidden="true" className="size-4 text-[var(--workspace-ink)]" />
        ) : (
          <Circle aria-hidden="true" className="size-4 text-[var(--workspace-faint)]" />
        )}
        {value ? yesLabel : noLabel}
      </span>
    )
  }

  if (typeof value === 'string') {
    const isProvenance = ['confirmed', 'assumed', 'unknown'].includes(value.toLowerCase())

    if (isProvenance) {
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 font-mono text-xs font-medium ${
            value.toLowerCase() === 'confirmed'
              ? 'bg-[var(--workspace-mint-soft)] text-emerald-800'
              : value.toLowerCase() === 'assumed'
                ? 'bg-[var(--workspace-yellow-soft)] text-amber-800'
                : 'bg-black/[0.04] text-[var(--workspace-ink)]'
          }`}
        >
          {formatLabel(value)}
        </span>
      )
    }

    return <span className="whitespace-pre-wrap break-words">{value}</span>
  }

  if (typeof value === 'number') {
    return <span>{value.toLocaleString(locale)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[var(--workspace-faint)]">{emptyLabel}</span>
    }

    const primitivesOnly = value.every((item) => item === null || typeof item !== 'object')

    if (primitivesOnly) {
      return (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li key={`${String(item)}-${index}`} className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-2.5 size-2 shrink-0 border border-[var(--workspace-ink)] bg-[var(--workspace-primary)]"
              />
              <ContextValue
                value={item}
                depth={depth + 1}
                locale={locale}
                emptyLabel={emptyLabel}
                yesLabel={yesLabel}
                noLabel={noLabel}
                entryLabel={entryLabel}
                noFieldsLabel={noFieldsLabel}
                sensitiveLabel={sensitiveLabel}
              />
            </li>
          ))}
        </ul>
      )
    }

    return (
      <ol className="space-y-3">
        {value.map((item, index) => (
          <li key={index} className="border-l border-[#c9c4bc] pl-3">
            <span className="mb-2 block font-mono text-xs font-bold text-[var(--workspace-faint)]">
              {entryLabel(index + 1)}
            </span>
            <ContextValue
              value={item}
              depth={depth + 1}
              locale={locale}
              emptyLabel={emptyLabel}
              yesLabel={yesLabel}
              noLabel={noLabel}
              entryLabel={entryLabel}
              noFieldsLabel={noFieldsLabel}
              sensitiveLabel={sensitiveLabel}
            />
          </li>
        ))}
      </ol>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)

    if (entries.length === 0) {
      return <span className="text-[var(--workspace-faint)]">{noFieldsLabel}</span>
    }

    return (
      <dl className={depth > 1 ? 'space-y-3' : 'divide-y divide-[#dedbd5]'}>
        {entries.map(([key, nestedValue]) => (
          <div
            key={key}
            className={
              depth > 1
                ? 'grid gap-1 sm:grid-cols-[minmax(8rem,0.35fr)_1fr] sm:gap-4'
                : 'grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(10rem,0.35fr)_1fr] sm:gap-6'
            }
          >
            <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
              {formatLabel(key)}
            </dt>
            <dd className="min-w-0 text-sm font-medium leading-6 text-[var(--workspace-ink)]">
              {SENSITIVE_CONTEXT_KEY.test(key) || isSensitiveContextValue(nestedValue) ? (
                <SensitiveContextValue label={sensitiveLabel} />
              ) : (
                <ContextValue
                  value={nestedValue}
                  depth={depth + 1}
                  locale={locale}
                  emptyLabel={emptyLabel}
                  yesLabel={yesLabel}
                  noLabel={noLabel}
                  entryLabel={entryLabel}
                  noFieldsLabel={noFieldsLabel}
                  sensitiveLabel={sensitiveLabel}
                />
              )}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <span>{String(value)}</span>
}

export function ProjectWorkspaceContainer({ initialData }: ProjectWorkspaceProps) {
  const locale = useLocale()
  const t = useTranslations('Workspace')
  const tCommon = useTranslations('Common')
  const tStatus = useTranslations('Status')
  const contextLabels = {
    emptyLabel: t('notSpecified'),
    yesLabel: t('yes'),
    noLabel: t('no'),
    entryLabel: (index: number) => t('contextEntry', { index }),
    noFieldsLabel: t('noFieldsRecorded'),
    sensitiveLabel: t('sensitiveValueHidden'),
  }
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedTab = parseWorkspaceTab(searchParams.get('tab'))
  const activeTab = requestedTab

  const selectTab = (section: WorkspaceSection) => {
    const params = new URLSearchParams(searchParams.toString())
    if (section === 'overview') params.delete('tab')
    else params.set('tab', section)
    const query = params.toString()
    router.replace(query ? `?${query}` : '?', { scroll: false })
  }
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isWorkspaceNavOpen, setIsWorkspaceNavOpen] = useState(false)
  const [projectName, setProjectName] = useState(initialData.name)
  const [projectLang, setProjectLang] = useState(initialData.language || 'id')
  const [artifacts, setArtifacts] = useState<WorkspaceArtifactItem[]>(initialData.artifacts)
  const [generationState, setGenerationState] = useState<GenerationState>(() =>
    createPersistedGenerationState({
      projectStatus: initialData.status,
      artifacts: initialData.artifacts,
      requiredArtifactTypes: initialData.requiredArtifactTypes,
      hasSkills: initialData.skills.length > 0,
      hasBacklog: initialData.phases.length > 0,
    }),
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false)
  const [genMessage, setGenMessage] = useState<{
    type: 'status' | 'error'
    text: string
  } | null>(null)
  const [generationAnnouncement, setGenerationAnnouncement] = useState<string | null>(null)
  const [generationOperation, setGenerationOperation] = useState<'initial' | 'retry' | null>(null)
  const [discoveryMessage, setDiscoveryMessage] = useState<{
    type: 'status' | 'error'
    text: string
  } | null>(null)
  const [clarifications, setClarifications] = useState(initialData.clarifications)
  const [projectStatus, setProjectStatus] = useState(initialData.status)
  const sectionTabRefs = useRef(new Map<WorkspaceSection, HTMLButtonElement>())

  const readyArtifacts = artifacts.filter(
    (artifact) => artifact.status === 'READY' || artifact.status === 'MODIFIED',
  )
  const attentionArtifacts = artifacts.filter(
    (artifact) => artifact.status !== 'READY' && artifact.status !== 'MODIFIED',
  )
  const allTasks = initialData.phases.flatMap((phase) => phase.tasks)
  const readyTasks = allTasks.filter((task) => task.status === 'READY')
  const doneTasks = allTasks.filter((task) => task.status === 'DONE')
  const blockedTasks = allTasks.filter((task) => task.status === 'BLOCKED')
  const pendingClarifications = clarifications.filter((question) => question.status === 'PENDING')
  const answeredClarifications = clarifications.filter((question) => question.status === 'ANSWERED')
  const contextReady = hasContextData(initialData.context)
  const requiredArtifacts = initialData.requiredArtifactTypes
    .map((type) => artifacts.find((artifact) => artifact.type === type))
    .filter((artifact): artifact is WorkspaceArtifactItem => Boolean(artifact))
  const readyRequiredArtifacts = requiredArtifacts.filter(
    (artifact) => artifact.status === 'READY' || artifact.status === 'MODIFIED',
  )
  // The export action first runs validation, so READY projects with a complete
  // current pack must still be able to start that validation request.
  const canExport =
    (projectStatus === 'READY' || projectStatus === 'EXPORTABLE') &&
    initialData.requiredArtifactTypes.length > 0 &&
    readyRequiredArtifacts.length === initialData.requiredArtifactTypes.length
  const [hasExportedZip, setHasExportedZip] = useState(initialData.status === 'EXPORTABLE')
  const [isBriefExpanded, setIsBriefExpanded] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const briefText = initialData.description || t('noBrief')
  const briefParagraphs = briefText.split(/\n{2,}/).filter(Boolean)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    try {
      const res = await fetch(`/api/projects/${initialData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, language: projectLang })
      })
      if (res.ok) {
        window.location.reload()
      }
    } finally {
      setIsSavingSettings(false)
    }
  }

  const overviewStatusItems: {
    id: WorkspaceSection
    label: string
    value: string
    tone: ReadinessTone
  }[] = [
    {
      id: 'context',
      label: t('canonicalContext'),
      value: contextReady ? t('available') : t('missing'),
      tone: contextReady ? 'ready' : 'attention',
    },
    {
      id: 'documents',
      label: t('tabDocuments'),
      value: attentionArtifacts.length > 0 ? t('needAttention', { count: attentionArtifacts.length }) : readyArtifacts.length > 0 ? t('docsReady', { ready: readyArtifacts.length, total: artifacts.length }) : t('noDocsGenerated'),
      tone: attentionArtifacts.length > 0 ? 'attention' : readyArtifacts.length > 0 ? 'ready' : 'idle',
    },
    {
      id: 'backlog',
      label: t('tabBacklog'),
      value: blockedTasks.length > 0 ? t('blockedCount', { count: blockedTasks.length }) : allTasks.length > 0 ? t('tasksReadyOfTotal', { ready: readyTasks.length, total: allTasks.length }) : t('noTasksGenerated'),
      tone: blockedTasks.length > 0 ? 'attention' : allTasks.length > 0 ? 'ready' : 'idle',
    },
  ]
  const overviewProgress = Math.max(0, Math.min(100, Math.round((overviewStatusItems.filter((item) => item.tone === 'ready').length / overviewStatusItems.length) * 100)))
  const overviewActionIsAttention = Boolean(genMessage ?? discoveryMessage)
  const overviewStatusTone: ReadinessTone = overviewActionIsAttention ? 'attention' : overviewProgress === 100 ? 'ready' : 'idle'
  const includesReadme = readyArtifacts.some((artifact) => artifact.path === 'README.md')
  const [isExporting, setIsExporting] = useState(false)

  const handleDownloadZip = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const validation = await fetch(`/api/projects/${initialData.id}/validate`, { method: 'POST' })
      const validationData = (await validation.json().catch(() => null)) as { error?: string; report?: { isConsistent?: boolean } } | null
      if (!validation.ok) throw new Error(validationData?.error ?? t('exportValidationFailed'))
      if (validationData?.report && !validationData.report.isConsistent) {
        // Validation demotes EXPORTABLE projects back to READY on the server.
        // Keep the export desk in sync so it does not claim the stale pack is complete.
        setProjectStatus('READY')
        setHasExportedZip(false)
        throw new Error(t('consistencyIssues'))
      }
      const download = await fetch(`/api/projects/${initialData.id}/export`)
      if (!download.ok) {
        const exportData = (await download.json().catch(() => null)) as { error?: string } | null
        throw new Error(exportData?.error ?? t('exportFailed'))
      }

      const blob = await download.blob()
      const contentDisposition = download.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i)
      const filename = filenameMatch?.[1] ?? `${initialData.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-bootstrap-pack.zip`
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)

      setHasExportedZip(true)
      setProjectStatus('EXPORTABLE')
    } catch (error) {
      setGenMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('exportValidationFailed'),
      })
    } finally {
      setIsExporting(false)
    }
  }

  const generateOneShotKickoffPrompt = () => {
    return `# Project implementation brief — ${initialData.name}

Prepare an implementation plan for **${initialData.name}** (${initialData.classification}). Use the generated pack as the source of project context, and keep the human owner in control of scope, sequencing, and execution.

## Pack reading order
Read the available specification files before making implementation decisions:
1. \`PRD.md\` — product goals, scope, user flows, and non-goals
2. \`ARCHITECTURE.md\` — system boundaries, data flow, and technical structure
3. \`DESIGN.md\` — the visual authority for interface direction, interaction, responsive behavior, and accessibility
4. \`Agent.md\` — coding-agent workflow, constraints, and quality expectations
5. \`BACKLOG.md\` — implementation tasks, acceptance criteria, and verification steps
6. \`SRS.md\` — read this only when it is included in the pack; it provides detailed software requirements for higher-complexity projects

The lean pack generates \`PRD.md\`, conditional \`SRS.md\`, \`ARCHITECTURE.md\`, \`DESIGN.md\`, \`Agent.md\`, and \`BACKLOG.md\`. Guidance that older packs may have placed in standalone \`RULES.md\` or \`SKILLS.md\` is incorporated into \`Agent.md\`; do not expect those standalone files.

## Working guidance
- Treat \`DESIGN.md\` as the visual source of truth. Do not invent a competing visual system or override it with conventions from this prompt.
- Review the backlog and its dependencies, then propose the next appropriate task for the human owner’s approval before implementation.
- Follow the pack’s quality gates, verify your work with the relevant checks, and report assumptions, changes, and unresolved decisions clearly.
- Do not assume that every backlog item is in scope for this session; do not silently expand the project beyond the generated requirements.`
  }

  const handleCopyOneShotPrompt = () => {
    const promptText = generateOneShotKickoffPrompt()
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard
        .writeText(promptText)
        .then(() => {
          setCopiedPrompt(true)
          setTimeout(() => setCopiedPrompt(false), 2000)
        })
        .catch(() => {
          setCopiedPrompt(false)
        })
    }
  }

  const handleArtifactUpdated = (updated: WorkspaceArtifactItem) => {
    setArtifacts((previous) =>
      previous.map((artifact) => (artifact.type === updated.type ? updated : artifact)),
    )
  }

  const workspaceNavigation = (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-[#dedbd5] pb-5">
        <div className="min-w-0">
          <p className="text-xl font-semibold tracking-[-0.04em]">bantuin<span className="text-[var(--workspace-primary)]">.</span></p>
          <p className="mt-1 truncate text-xs text-[var(--workspace-muted)]">{initialData.name}</p>
        </div>
        <span className={`rounded-full border border-[#dedbd5] px-2.5 py-1 text-[10px] font-semibold ${statusTone(projectStatus)}`}>
          {tStatus(projectStatus as Parameters<typeof tStatus>[0]) ?? formatStatus(projectStatus)}
        </span>
      </div>
      <div className="mt-6">
        <Link href="/dashboard" onClick={() => setIsWorkspaceNavOpen(false)} className={`inline-flex items-center gap-2 text-sm font-semibold text-[var(--workspace-muted)] transition-colors hover:text-[var(--workspace-primary)] ${BUTTON_FOCUS_CLASS}`}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('backProjects')}
        </Link>
      </div>
      <div className="mt-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--workspace-faint)]">{t('workspaceSections')}</p>
        <nav aria-label={t('workspaceSections')} className="mt-3 space-y-1">
          {SECTION_ITEMS.map((section) => {
            const Icon = section.icon
            const isActive = activeTab === section.id
            return (
              <button
                key={section.id}
                ref={(element) => {
                  if (element) sectionTabRefs.current.set(section.id, element)
                  else sectionTabRefs.current.delete(section.id)
                }}
                id={getSectionTabId(section.id)}
                type="button"
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={getSectionPanelId(section.id)}
                onClick={() => {
                  selectTab(section.id)
                  setIsWorkspaceNavOpen(false)
                }}
                onKeyDown={(event) => handleSectionKeyDown(event, section.id)}
                title={t(section.descriptionKey as Parameters<typeof t>[0])}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${BUTTON_FOCUS_CLASS} ${isActive ? 'bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)]' : 'text-[var(--workspace-muted)] hover:bg-[var(--workspace-blue-soft)] hover:text-[var(--workspace-ink)]'}`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(`tab${section.id.charAt(0).toUpperCase() + section.id.slice(1)}` as Parameters<typeof t>[0])}
              </button>
            )
          })}
        </nav>
      </div>
      <div className="mt-8 border-t border-[#dedbd5] pt-5">
        <Button size="sm" variant="neutral" onClick={() => { setIsSettingsOpen(true); setIsWorkspaceNavOpen(false) }} className="w-full justify-start border-[#dedbd5] px-3 text-xs font-semibold">
          <Wrench className="size-3.5" /> {t('settings')}
        </Button>
      </div>
    </>
  )

  const handleSectionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentSection: WorkspaceSection,
  ) => {
    const currentIndex = SECTION_ITEMS.findIndex((section) => section.id === currentSection)
    const lastIndex = SECTION_ITEMS.length - 1
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = lastIndex
    }

    if (nextIndex === null) return

    event.preventDefault()
    const nextSection = SECTION_ITEMS[nextIndex].id
    selectTab(nextSection)
    sectionTabRefs.current.get(nextSection)?.focus()
  }

  const requestProjectStage = async <T,>(
    path: string,
    options: RequestInit,
    fallbackError: string,
  ): Promise<T> => {
    let response = await fetch(`/api/projects/${initialData.id}/${path}`, options)
    let data = (await response.json().catch(() => null)) as
      | (T & { error?: string; message?: string })
      | null

    // If server lost session due to dev server rebuild/hot-reload, auto-restore from tab sessionStorage and retry
    if (
      !response.ok &&
      (data?.error?.includes('No active AI provider session') ||
        data?.message?.includes('No active AI provider session')) &&
      typeof window !== 'undefined' &&
      window.sessionStorage
    ) {
      const stored = window.sessionStorage.getItem('byok_session')
      if (stored) {
        try {
          const configRes = await fetch('/api/provider/configure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: stored,
          })
          if (configRes.ok) {
            response = await fetch(`/api/projects/${initialData.id}/${path}`, options)
            data = (await response.json().catch(() => null)) as
              | (T & { error?: string; message?: string })
              | null
          }
        } catch {}
      }
    }

    if (!response.ok) {
      throw new Error(data?.error ?? data?.message ?? fallbackError)
    }

    if (!data) throw new Error(fallbackError)
    return data
  }

  const buildCanonicalContext = async () => {
    setIsAnalyzing(true)
    setDiscoveryMessage({ type: 'status', text: t('normalizingContext') })
    try {
      await requestProjectStage(
        'context',
        { method: 'POST' },
        t('contextGenerationFailed'),
      )

      setProjectStatus('CONTEXT_READY')
      setDiscoveryMessage({ type: 'status', text: t('contextReadyMessage') })
      window.location.reload()
    } catch (error) {
      setDiscoveryMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `${t('contextGenerationFailed')} Please retry.`,
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStartDiscovery = async () => {
    setIsAnalyzing(true)
    setDiscoveryMessage({ type: 'status', text: t('analyzingProject') })

    try {
      await requestProjectStage(
        'analyze',
        { method: 'POST' },
        t('requirementAnalysisFailed'),
      )
      setProjectStatus('ANALYZING')
      setDiscoveryMessage({ type: 'status', text: t('preparingClarifications') })

      const roundResult = await requestProjectStage<{
        questions: Array<{ question: string; impact?: string }>
        is_context_sufficient: boolean
      }>(
        'clarifications?action=generate',
        { method: 'POST' },
        t('clarificationPlanningFailed'),
      )

      if (roundResult.is_context_sufficient) {
        await buildCanonicalContext()
        return
      }

      const stored = await requestProjectStage<{
        questions: Array<{
          id: string
          round: number
          question: string
          impact: string | null
          answer: string | null
          status: string
        }>
      }>('clarifications', { method: 'GET' }, t('clarificationQuestionsLoadFailed'))

      setClarifications(stored.questions)
      setProjectStatus('CLARIFYING')
      selectTab('context')
      setDiscoveryMessage({
        type: 'status',
        text:
          roundResult.questions.length === 1
            ? t('clarificationWaitingSingular', { count: roundResult.questions.length })
            : t('clarificationWaitingPlural', { count: roundResult.questions.length }),
      })
    } catch (error) {
      setDiscoveryMessage({
        type: 'error',
        text: error instanceof Error ? error.message : `${t('requirementAnalysisFailed')} Please retry.`
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmitClarifications = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const answers = pendingClarifications.map((question) => {
      let rawAns = String(formData.get(`answer-${question.id}`) ?? '').trim()
      if (!rawAns && formData.get(`custom-answer-${question.id}`)) {
        rawAns = String(formData.get(`custom-answer-${question.id}`)).trim()
      }
      return {
        questionId: question.id,
        answer: rawAns,
      }
    })

    if (answers.some((item) => !item.answer)) {
      setDiscoveryMessage({ type: 'error', text: t('answerEveryPending') })
      return
    }

    setIsSubmittingAnswers(true)
    setDiscoveryMessage({ type: 'status', text: t('savingAnswers') })

    try {
      await requestProjectStage(
        'clarifications?action=answer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        },
        t('clarificationAnswersSaveFailed'),
      )

      // Immediately reflect answered status in client state so pending questions form clears
      const answeredMap = new Map(answers.map((a) => [a.questionId, a.answer]))
      setClarifications((prev) =>
        prev.map((q) =>
          answeredMap.has(q.id)
            ? { ...q, status: 'ANSWERED', answer: answeredMap.get(q.id) ?? q.answer }
            : q,
        ),
      )

      setDiscoveryMessage({ type: 'status', text: t('checkingDecisions') })
      const nextRound = await requestProjectStage<{
        questions: Array<{ question: string; impact?: string }>
        is_context_sufficient: boolean
      }>(
        'clarifications?action=generate',
        { method: 'POST' },
        t('nextClarificationRoundFailed'),
      )

      if (nextRound.is_context_sufficient) {
        await buildCanonicalContext()
        return
      }

      const stored = await requestProjectStage<{
        questions: Array<{
          id: string
          round: number
          question: string
          impact: string | null
          answer: string | null
          status: string
        }>
      }>('clarifications', { method: 'GET' }, t('clarificationQuestionsLoadFailed'))

      setClarifications(stored.questions)
      setDiscoveryMessage({
        type: 'status',
        text: t('clarificationRoundReady', { round: stored.questions.at(-1)?.round ?? 1 }),
      })
    } catch (error) {
      // Synchronize latest questions from server so UI reflects any saved answers
      try {
        const stored = await requestProjectStage<{
          questions: Array<{
            id: string
            round: number
            question: string
            impact: string | null
            answer: string | null
            status: string
          }>
        }>('clarifications', { method: 'GET' }, '')
        if (stored?.questions) {
          setClarifications(stored.questions)
        }
      } catch {}

      setDiscoveryMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('clarificationSubmissionFailed'),
      })
    } finally {
      setIsSubmittingAnswers(false)
    }
  }

  const updateGenerationState = (next: GenerationState) => {
    setGenerationState(next)
    const activeStage = next.activeStage
    if (activeStage) {
      setGenerationAnnouncement(t(getGenerationStageLabelKey(activeStage) as Parameters<typeof t>[0]))
    }
  }

  const generationStageRequest = async (stage: GenerationStageId) => {
    switch (stage) {
      case 'planner':
        await requestProjectStage<{ plan?: { artifacts?: Array<{ type: string; isRequired?: boolean }> } }>(
          'planner',
          { method: 'POST' },
          t('artifactPlanningFailed'),
        )
        return
      case 'documents': {
        const result = await requestProjectStage<{
          artifacts?: Array<{ type: string; status: string; error?: string }>
        }>(
          'generate',
          { method: 'POST' },
          t('documentGenerationFailed'),
        )
        const failedArtifact = result.artifacts?.find((artifact) => artifact.status === 'FAILED')
        if (failedArtifact) {
          throw new Error(failedArtifact.error ?? `${failedArtifact.type}.md generation failed.`)
        }
        if (!result.artifacts?.length) throw new Error(t('documentGenerationEmpty'))
        return
      }
      case 'agentRules': {
        const result = await requestProjectStage<{
          artifacts?: Array<{ type: string; status: string; error?: string }>
        }>(
          'generate',
          {
            method: 'POST',
            body: JSON.stringify({ type: 'AGENT_RULES' }),
            headers: { 'Content-Type': 'application/json' },
          },
          t('agentRulesGenerationFailed'),
        )
        const failedArtifact = result.artifacts?.find((artifact) => artifact.status === 'FAILED')
        if (failedArtifact) throw new Error(failedArtifact.error ?? t('agentGenerationFailed'))
        if (!result.artifacts?.length) throw new Error(t('agentInstructionsEmpty'))
        return
      }
      case 'skills':
        await requestProjectStage('skills', { method: 'POST' }, t('skillResolutionFailed'))
        return
      case 'backlog':
        await requestProjectStage('backlog', { method: 'POST' }, t('backlogGenerationFailed'))
        return
      case 'validation': {
        const result = await requestProjectStage<{
          report?: { isConsistent?: boolean }
        }>('validate', { method: 'POST' }, t('readinessValidationFailed'))
        if (result.report && result.report.isConsistent === false) {
          throw new Error(t('generationValidationFailed'))
        }
        return
      }
    }
  }

  const runGeneration = async (operation: 'initial' | 'retry') => {
    if (!contextReady || isGenerating) return

    setIsGenerating(true)
    setGenerationOperation(operation)
    setProjectStatus('GENERATING')
    setGenMessage(null)

    let state = operation === 'retry'
      ? resetGenerationForRetry(generationState)
      : createQueuedGenerationState()
    setGenerationState(state)

    const stagesToRun = operation === 'retry'
      ? getRetryableGenerationStages(state)
      : GENERATION_STAGES.map(({ id }) => id)

    try {
      for (const stage of stagesToRun) {
        state = markGenerationStageRunning(state, stage)
        updateGenerationState(state)
        setGenMessage({
          type: 'status',
          text: t(getGenerationStageLabelKey(stage) as Parameters<typeof t>[0]),
        })

        try {
          await generationStageRequest(stage)
        } catch (error) {
          const message = error instanceof Error ? error.message : t('generationFailed')
          state = markGenerationStageFailed(state, stage, message)
          updateGenerationState(state)
          setProjectStatus('GENERATION_FAILED')
          setGenMessage({ type: 'error', text: message })
          return
        }

        state = markGenerationStageComplete(state, stage)
        updateGenerationState(state)
      }

      setGenMessage({ type: 'status', text: t('generationComplete') })
      window.location.reload()
    } finally {
      setIsGenerating(false)
      setGenerationOperation(null)
    }
  }

  const handleGenerateAll = async () => {
    if (!contextReady) {
      selectTab('context')
      setDiscoveryMessage({
        type: 'error',
        text: t('completeDiscoveryFirst'),
      })
      return
    }

    try {
      await runGeneration('initial')
    } catch (error) {
      setProjectStatus('GENERATION_FAILED')
      setGenMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('generationFailed'),
      })
    }
  }

  const handleRegenerateFailed = async () => {
    if (!contextReady) return

    try {
      await runGeneration('retry')
    } catch (error) {
      setProjectStatus('GENERATION_FAILED')
      setGenMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('generationRetryFailed'),
      })
    }
  }

  const generationStatusLabel = (status: GenerationStageStatus) =>
    t(getGenerationStageStatusKey(status) as Parameters<typeof t>[0])
  const generationPercentage = getGenerationProgressPercentage(generationState)
  const activeGenerationStageIndex = generationState.activeStage
    ? GENERATION_STAGES.findIndex(({ id }) => id === generationState.activeStage)
    : -1
  const completedGenerationStageCount = GENERATION_STAGES.filter(
    ({ id }) => generationState.stages[id].status === 'complete',
  ).length
  const generationStep = generationState.activeStage
    ? activeGenerationStageIndex + 1
    : completedGenerationStageCount === GENERATION_STAGES.length
      ? GENERATION_STAGES.length
      : Math.max(1, completedGenerationStageCount + 1)

  const generationProgress = (
    <section
      aria-labelledby="generation-progress-title"
      className="mt-5 rounded-lg border border-[#dedbd5] bg-[var(--workspace-paper)] p-4"
      aria-busy={isGenerating}
    >
      <div className="flex items-start justify-between gap-3 border-b border-black/[0.08] pb-3">
        <div>
          <h2 id="generation-progress-title" className="font-mono text-xs font-semibold">
            {t('generationProgressTitle')}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--workspace-muted)]">
            {t('generationProgressDesc')}
          </p>
        </div>
        <span className="font-mono text-xs font-medium text-[var(--workspace-muted)]">
          {generationOperation ? t(generationOperation === 'retry' ? 'generationRetrying' : 'generationRunning') : t('generationIdle')}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 font-mono text-xs font-medium">
        <span>{generationPercentage}%</span>
        <span>{t('generationProgressStep', { current: generationStep, total: GENERATION_STAGES.length })}</span>
      </div>
      <div
        className="mt-2 h-2 rounded-full border border-[#dedbd5] bg-black/[0.04] overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={generationPercentage}
        aria-label={t('generationProgressLabel')}
      >
        <div
          className="h-full bg-[var(--workspace-primary)] motion-safe:transition-[width] motion-safe:duration-300"
          style={{ width: `${generationPercentage}%` }}
        />
      </div>
      <ol className="mt-3 max-h-[18rem] space-y-1.5 overflow-y-auto pr-1">
        {GENERATION_STAGES.map(({ id }) => {
          const stage = generationState.stages[id]
          const isActive = generationState.activeStage === id && stage.status === 'running'
          const isFailed = stage.status === 'failed'
          return (
            <li
              key={id}
              aria-current={isActive ? 'step' : undefined}
              className={`grid grid-cols-[auto_1fr_auto] items-start gap-2.5 rounded-lg border border-black/[0.06] px-3 py-2 ${
                isFailed ? 'bg-[var(--workspace-rose-soft)] text-rose-900' : isActive ? 'bg-[var(--workspace-blue-soft)] text-blue-900' : 'bg-black/[0.02]'
              }`}
            >
              <span aria-hidden="true" className="mt-0.5 font-mono text-xs font-semibold">{isActive ? '→' : stage.status === 'complete' ? '✓' : stage.status === 'failed' ? '!' : '·'}</span>
              <div>
                <p className="text-xs font-semibold">{t(getGenerationStageLabelKey(id) as Parameters<typeof t>[0])}</p>
                <p className="text-[11px] leading-4 text-[var(--workspace-muted)]">
                  {t(getGenerationStageDescriptionKey(id) as Parameters<typeof t>[0])}
                </p>
                {stage.error && <p className="mt-1 text-xs font-medium text-[var(--workspace-rose)]">{stage.error}</p>}
              </div>
              <span className="font-mono text-[0.68rem] font-medium">{generationStatusLabel(stage.status)}</span>
            </li>
          )
        })}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">{generationAnnouncement}</p>
      {genMessage?.type === 'error' && (
        <p className="sr-only" role="alert" aria-live="assertive">{genMessage.text}</p>
      )}
    </section>
  )

  const discoveryButton = pendingClarifications.length > 0 ? (
    <button
      type="button"
      onClick={() => selectTab('context')}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--workspace-primary)] px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 ${BUTTON_FOCUS_CLASS}`}
    >
      <MessageSquareText aria-hidden="true" className="size-4" />
      {t('actionClarify')}
    </button>
  ) : projectStatus === 'CLARIFYING' && answeredClarifications.length > 0 ? (
    <button
      type="button"
      onClick={buildCanonicalContext}
      disabled={isAnalyzing || isSubmittingAnswers}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--workspace-primary)] px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
    >
      {isAnalyzing ? (
        <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
      ) : (
        <Braces aria-hidden="true" className="size-4" />
      )}
      {isAnalyzing ? t('normalizingContext') : t('actionGenerate')}
    </button>
  ) : (
    <button
      type="button"
      onClick={handleStartDiscovery}
      disabled={isAnalyzing || isSubmittingAnswers}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--workspace-primary)] px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
    >
      {isAnalyzing ? (
        <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
      ) : (
        <ScanText aria-hidden="true" className="size-4" />
      )}
      {isAnalyzing ? t('analyzingProject') : t('actionGenerate')}
    </button>
  )

  const nextMove = projectStatus === 'ANALYZING' || projectStatus === 'GENERATING' || isAnalyzing || isGenerating
    ? {
        title: projectStatus === 'GENERATING' || isGenerating ? t('generationRunning') : t('analyzingProject'),
        description: projectStatus === 'GENERATING' || isGenerating ? t('generationProgressDesc') : t('preparingClarifications'),
        tab: projectStatus === 'GENERATING' || isGenerating ? 'documents' as WorkspaceSection : 'context' as WorkspaceSection,
        action: (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#fffdfa]/10 px-5 py-3 text-sm font-semibold text-white" role="status" aria-live="polite">
            <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
            {projectStatus === 'GENERATING' || isGenerating ? t('generationRunning') : t('analyzingProject')}
          </span>
        ),
      }
    : !contextReady
    ? pendingClarifications.length > 0
      ? {
          title: t('actionClarify'),
          description: t('actionClarifyDesc'),
          tab: 'context' as WorkspaceSection,
          action: discoveryButton,
        }
      : projectStatus === 'CLARIFYING' && answeredClarifications.length > 0
        ? {
            title: t('actionGenerate'),
            description: t('descEstablishContext'),
            tab: 'context' as WorkspaceSection,
            action: (
              <button
                type="button"
                onClick={buildCanonicalContext}
                disabled={isAnalyzing || isSubmittingAnswers}
                className={`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--workspace-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
              >
                {isAnalyzing ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Braces aria-hidden="true" className="size-4" />}
                {isAnalyzing ? t('normalizingContext') : t('actionGenerate')}
              </button>
            ),
          }
        : {
            title: t('stateEstablishContext'),
            description: t('descEstablishContext'),
            tab: 'overview' as WorkspaceSection,
            action: discoveryButton,
          }
    : projectStatus === 'GENERATION_FAILED' || attentionArtifacts.length > 0
      ? {
          title: t('generationFailed'),
          description: t('descResolveWarnings', { count: Math.max(attentionArtifacts.length, 1) }),
          tab: 'documents' as WorkspaceSection,
          action: (
            <button
              type="button"
              onClick={handleRegenerateFailed}
              disabled={isGenerating}
              className={`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--workspace-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
            >
              {isGenerating ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <RefreshCw aria-hidden="true" className="size-4" />}
              {isGenerating ? tCommon('loading') : t('retryFailed', { count: Math.max(attentionArtifacts.length, 1) })}
            </button>
          ),
        }
      : readyArtifacts.length === 0
        ? {
            title: t('stateGenerateFirst'),
            description: t('descGenerateFirst'),
            tab: 'documents' as WorkspaceSection,
            action: (
              <button
                type="button"
                onClick={handleGenerateAll}
                disabled={isGenerating}
                className={`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--workspace-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
              >
                {isGenerating ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Play aria-hidden="true" className="size-4" />}
                {isGenerating ? tCommon('loading') : t('actionGenerate')}
              </button>
            ),
          }
        : canExport && !hasExportedZip
          ? {
              title: t('stateExportable'),
              description: t('descExportable'),
              tab: 'export' as WorkspaceSection,
              action: (
                <button
                  type="button"
                  onClick={() => selectTab('export')}
                  className={`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--workspace-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] ${BUTTON_FOCUS_CLASS}`}
                >
                  <Package aria-hidden="true" className="size-4" />
                  {t('downloadZipPack')}
                </button>
              ),
            }
          : {
              title: t('stateReviewPack'),
              description: t('descReviewPack'),
              tab: 'documents' as WorkspaceSection,
              action: (
                <button
                  type="button"
                  onClick={() => selectTab('documents')}
                  className={`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--workspace-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] ${BUTTON_FOCUS_CLASS}`}
                >
                  <FileText aria-hidden="true" className="size-4" />
                  {t('actionReview')}
                </button>
              ),
            }

  const isExportReady = projectStatus === 'EXPORTABLE' || (canExport && !hasExportedZip)
  const overviewAction = isExportReady ? null : nextMove.action
  const overviewActionTitle = nextMove.title
  const overviewActionDescription = nextMove.description

  const generateButton = contextReady ? (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleGenerateAll}
        disabled={isGenerating}
        className={`inline-flex items-center justify-center gap-2 border border-[#dedbd5] bg-[var(--workspace-primary)] px-4 py-2.5 font-mono text-sm font-semibold text-white shadow-none hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
      >
        {isGenerating ? (
          <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
        ) : readyArtifacts.length > 0 ? (
          <RefreshCw aria-hidden="true" className="size-4" />
        ) : (
          <Play aria-hidden="true" className="size-4" />
        )}
        {isGenerating ? tCommon('loading') : readyArtifacts.length > 0 ? t('actionRegenerate') : t('actionGenerate')}
      </button>
      {attentionArtifacts.length > 0 && (
        <button
          type="button"
          onClick={handleRegenerateFailed}
          disabled={isGenerating}
          className={`inline-flex items-center justify-center gap-2 border border-[#dedbd5] bg-[var(--workspace-sun)] px-4 py-2.5 font-mono text-sm font-semibold text-[var(--workspace-ink)] shadow-none hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {t('retryFailed', { count: attentionArtifacts.length })}
        </button>
      )}
    </div>
  ) : (
    discoveryButton
  )

  return (
    <div className="min-h-screen bg-[var(--workspace-canvas)] text-[var(--workspace-ink)]" style={WORKSPACE_STYLE}>
      <div className="min-h-screen lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden h-screen items-center self-start px-3 py-8 lg:sticky lg:top-0 lg:flex">
          <div className="w-full rounded-[24px] border border-white/80 bg-[var(--workspace-paper)]/88 px-5 py-6 shadow-[0_12px_30px_rgba(36,35,31,0.08)] backdrop-blur-xl">
            <div className="flex flex-col">{workspaceNavigation}</div>
          </div>
        </aside>
        <div className="min-w-0">
          <header className="border-b border-[#dedbd5] bg-[var(--workspace-paper)] px-4 py-4 sm:px-6 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <button type="button" aria-expanded={isWorkspaceNavOpen} aria-controls="workspace-mobile-navigation" onClick={() => setIsWorkspaceNavOpen((open) => !open)} className={`inline-flex items-center gap-2 rounded-lg border border-[#dedbd5] px-3 py-2 text-sm font-semibold ${BUTTON_FOCUS_CLASS}`}>
                {isWorkspaceNavOpen ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
                <span>{t(`tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` as Parameters<typeof t>[0])}</span>
              </button>
            </div>
            {isWorkspaceNavOpen && <div id="workspace-mobile-navigation" className="mt-4 border-t border-[#dedbd5] pt-4"><div className="flex flex-col gap-5">{workspaceNavigation}</div></div>}
          </header>

          <main className="mx-auto w-full max-w-[1500px] px-4 pb-20 pt-8 sm:px-6 lg:px-10 xl:px-14">
            <header className="border-b border-[#dedbd5] pb-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[var(--workspace-muted)]"><span>{t('updated', { date: formatDate(initialData.updatedAt, locale) ?? t('unknownDate') })}</span><span>{formatLabel(initialData.classification)}</span><span>{initialData.language === 'id' ? t('settingsLanguageId') : t('settingsLanguageEn')}</span></div>
                  <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[4.5rem]">{initialData.name}</h1>
                </div>
              </div>
              <div className="mt-6 max-w-3xl">
                <div id="project-brief" className="max-w-[68ch] break-words text-base leading-7 text-[var(--workspace-muted)] sm:text-lg sm:leading-8">
                  {isBriefExpanded ? (
                    <div className="space-y-5">
                      {briefParagraphs.map((paragraph, index) => (
                        <p key={`${index}-${paragraph.slice(0, 12)}`} className="whitespace-pre-line">{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="line-clamp-2 whitespace-pre-line">{briefText}</p>
                  )}
                </div>
                {(initialData.description?.length ?? 0) > 180 && <button type="button" aria-controls="project-brief" aria-expanded={isBriefExpanded} onClick={() => setIsBriefExpanded((expanded) => !expanded)} className={`mt-3 inline-flex items-center rounded-md px-1 text-xs font-semibold text-[var(--workspace-primary)] underline decoration-[var(--workspace-primary)]/40 underline-offset-4 hover:text-[#8e4e32] ${BUTTON_FOCUS_CLASS}`}>{isBriefExpanded ? t('collapseBrief') : t('expandBrief')}</button>}
              </div>
            </header>

            {(isGenerating || generationState.stages.documents.status === 'failed' || generationState.stages.agentRules.status === 'failed' || generationState.stages.skills.status === 'failed' || generationState.stages.backlog.status === 'failed' || generationState.stages.validation.status === 'failed') && <div>{generationProgress}</div>}
            {activeTab === 'overview' && !isExportReady && (
              <section aria-labelledby="next-move-title" className="border-b border-[#dedbd5] py-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 max-w-3xl">
                    <p className={`font-mono text-[10px] font-semibold tracking-[0.08em] ${overviewStatusTone === 'attention' ? 'text-[var(--workspace-rose)]' : 'text-[var(--workspace-primary)]'}`}>{overviewStatusTone === 'attention' ? t('overviewAttention') : t('overviewNextStep')}</p>
                    <h2 id="next-move-title" className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.03em]">{overviewActionTitle}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{overviewActionDescription}</p>
                    {(genMessage ?? discoveryMessage) && (
                      <p role={(genMessage ?? discoveryMessage)?.type === 'error' ? 'alert' : 'status'} aria-live={(genMessage ?? discoveryMessage)?.type === 'error' ? 'assertive' : 'polite'} className="mt-4 border-l-2 border-[var(--workspace-rose)] pl-3 text-sm font-semibold leading-6 text-[var(--workspace-rose)]">{(genMessage ?? discoveryMessage)?.text}</p>
                    )}
                  </div>
                  {overviewAction ? <div className="shrink-0 lg:pt-1">{overviewAction}</div> : null}
                </div>
              </section>
            )}
            <section className="py-8 sm:py-10"><div id={getSectionPanelId(activeTab)} role="tabpanel" tabIndex={0} aria-labelledby={getSectionTabId(activeTab)}>
              <div className="hidden" aria-hidden="true">
                {SECTION_ITEMS.map((section) => <button key={section.id} id={getSectionTabId(section.id)} role="tab" aria-selected={activeTab === section.id} aria-controls={getSectionPanelId(section.id)} tabIndex={-1} onClick={() => selectTab(section.id)}>{t(`tab${section.id.charAt(0).toUpperCase() + section.id.slice(1)}` as Parameters<typeof t>[0])}</button>)}
              </div>
              <div className={activeTab === 'overview' ? 'space-y-8' : 'hidden'}>
                <div className="flex items-end justify-between gap-4 border-b border-black/[0.08] pb-4">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{t('overviewStatusTitle')}</h2>
                  <span className="font-mono text-xs text-[var(--workspace-muted)]">{t('liveData')}</span>
                </div>

                <section aria-label={t('overviewStatusTitle')} className="border-y border-black/[0.08]">
                  <ul className="divide-y divide-black/[0.08]">
                    {overviewStatusItems.map((item) => {
                      const Icon = item.tone === 'ready' ? CheckCircle2 : item.tone === 'attention' ? AlertTriangle : CircleDashed
                      return (
                        <li key={item.id}>
                          <button type="button" onClick={() => selectTab(item.id)} className={`flex w-full items-center gap-3 px-1 py-4 text-left transition-colors hover:bg-[var(--workspace-blue-soft)] sm:px-2 ${BUTTON_FOCUS_CLASS}`}>
                            <Icon aria-hidden="true" className={`size-4 shrink-0 ${item.tone === 'ready' ? 'text-emerald-700' : item.tone === 'attention' ? 'text-amber-700' : 'text-[var(--workspace-faint)]'}`} />
                            <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--workspace-ink)]">{item.label}</span>
                            <span className="shrink-0 text-right text-sm text-[var(--workspace-muted)]">{item.value}</span>
                            <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--workspace-faint)]" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              </div>

              <div className={activeTab === 'context' ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={t('docControlRoom')}
                  description={t('docControlRoomDesc')}
                />

                <section className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.8fr)]">
                  <div className={`${PANEL_CLASS} bg-[var(--workspace-paper)] p-6`}>
                    <div className="border-l border-[var(--workspace-primary)] pl-4">
                      <p className="font-mono text-xs font-semibold text-[var(--workspace-ink)]">
                        {t('nextCheckpoint')}
                      </p>
                      <h3 className="mt-2 text-3xl font-semibold leading-none tracking-[-0.05em] sm:text-4xl">
                        {!contextReady
                          ? t('stateEstablishContext')
                          : readyArtifacts.length === 0
                            ? t('stateGenerateFirst')
                            : attentionArtifacts.length > 0
                              ? t('stateResolveWarnings')
                              : projectStatus === 'EXPORTABLE'
                                ? t('stateExportable')
                                : t('stateReviewPack')}
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[var(--workspace-muted)]">
                        {!contextReady
                          ? t('descEstablishContext')
                          : readyArtifacts.length === 0
                            ? t('descGenerateFirst')
                            : attentionArtifacts.length > 0
                              ? t('descResolveWarnings', { count: attentionArtifacts.length })
                              : projectStatus === 'EXPORTABLE'
                                ? t('descExportable')
                                : t('descReviewPack')}
                      </p>
                    </div>

                    <dl className="mt-8 grid border-y border-black/[0.08] sm:grid-cols-2">
                      <div className="border-b border-black/[0.08] py-4 sm:border-r sm:border-black/[0.08] sm:pr-5">
                        <dt className="font-mono text-xs font-medium text-[var(--workspace-faint)]">
                          {t('projectType')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold">
                          {formatLabel(initialData.classification)}
                        </dd>
                      </div>
                      <div className="border-b border-black/[0.08] py-4 sm:pl-5">
                        <dt className="font-mono text-xs font-medium text-[var(--workspace-faint)]">
                          {t('language')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold">
                          {initialData.language === 'id' ? t('settingsLanguageId') : t('settingsLanguageEn')}
                        </dd>
                      </div>
                      <div className="border-b border-black/[0.08] py-4 sm:border-b-0 sm:border-r sm:border-black/[0.08] sm:pr-5">
                        <dt className="font-mono text-xs font-medium text-[var(--workspace-faint)]">
                          {t('contextSnapshot')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold">
                          {t('snapshot', { version: initialData.contextVersion })}
                        </dd>
                      </div>
                      <div className="py-4 sm:pl-5">
                        <dt className="font-mono text-xs font-medium text-[var(--workspace-faint)]">
                          {t('created')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold">
                          {formatDate(initialData.createdAt, locale) ?? t('unknownDate')}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <section
                    aria-labelledby="readiness-title"
                    className={`${PANEL_CLASS} bg-[var(--workspace-paper)] p-5`}
                  >
                    <div className="flex items-center justify-between border-b border-black/[0.08] pb-4">
                      <h3 id="readiness-title" className="text-xl font-semibold tracking-tight">
                        {t('actualReadiness')}
                      </h3>
                      <span className="font-mono text-xs font-bold text-[var(--workspace-muted)]">
                        {t('liveData')}
                      </span>
                    </div>
                    <ul>
                      <ReadinessLine
                        label={t("canonicalContext")}
                        value={contextReady ? t('available') : t('missing')}
                        detail={
                          contextReady ? t('snapshot', { version: initialData.contextVersion }) : t('reqBeforeGen')
                        }
                        tone={contextReady ? 'ready' : 'idle'}
                      />
                      <ReadinessLine
                        label={t("tabDocuments")}
                        value={t('docsReady', { ready: readyArtifacts.length, total: artifacts.length })}
                        detail={
                          attentionArtifacts.length > 0 ? t('needAttention', { count: attentionArtifacts.length }) : artifacts.length > 0 ? t('readyExportable') : t('noDocsGenerated')
                        }
                        tone={
                          attentionArtifacts.length > 0
                            ? 'attention'
                            : readyArtifacts.length > 0
                              ? 'ready'
                              : 'idle'
                        }
                      />
                      <ReadinessLine
                        label={t("resolvedSkills")}
                        value={t('selectedCount', { count: initialData.skills.length })}
                        detail={
                          initialData.skills.length > 0 ? t('triggersMapped') : t('noRecommendations')
                        }
                        tone={initialData.skills.length > 0 ? 'ready' : 'idle'}
                      />
                      <ReadinessLine
                        label={t("tabBacklog")}
                        value={t('tasksReadyOfTotal', { ready: readyTasks.length, total: allTasks.length })}
                        detail={
                          blockedTasks.length > 0 ? t('blockedAndDone', { blocked: blockedTasks.length, done: doneTasks.length }) : allTasks.length > 0 ? t('completedNoBlocked', { done: doneTasks.length }) : t('noTasksGenerated')
                        }
                        tone={
                          blockedTasks.length > 0
                            ? 'attention'
                            : allTasks.length > 0
                              ? 'ready'
                              : 'idle'
                        }
                      />
                      <ReadinessLine
                        label={t("zipExport")}
                        value={canExport ? t('available') : t('unavailable')}
                        detail={
                          canExport ? t('docsEligible', { count: readyArtifacts.length }) : t('atLeastOneReq')
                        }
                        tone={canExport ? 'ready' : 'idle'}
                      />
                    </ul>
                  </section>
                </section>
              </div>

              <div className={activeTab === 'context' ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={t('canonicalProjectContext')}
                  description={t('canonicalProjectContextDesc')}
                  action={
                    <span
                      className={`${PANEL_SOFT_CLASS} inline-flex items-center gap-2 px-3 py-2 font-mono text-xs font-semibold text-[var(--workspace-ink)]`}
                    >
                      <Braces aria-hidden="true" className="size-4" />
                      Snapshot v{initialData.contextVersion}
                    </span>
                  }
                />

                {!contextReady ? (
                  <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className={`${PANEL_CLASS} bg-[var(--workspace-paper)] p-6`}>
                      <div className="border-b border-black/[0.08] pb-5">
                        <p className="font-mono text-xs font-medium text-[var(--workspace-faint)]">
                          {t('discoveryInterview')}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.03em]">
                          {pendingClarifications.length > 0
                            ? t('answerOpenDecisions')
                            : t('contextNotAssembled')}
                        </h3>
                        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--workspace-muted)]">
                          {pendingClarifications.length > 0
                            ? t('answersBecomeConfirmed')
                            : t('startAnalysisFirst')}
                        </p>
                      </div>

                      {discoveryMessage && (
                        <p
                          role={discoveryMessage.type === 'error' ? 'alert' : 'status'}
                          aria-live={discoveryMessage.type === 'error' ? 'assertive' : 'polite'}
                          className={`mt-5 rounded-lg border border-[#dedbd5] p-4 text-sm font-medium leading-5 ${
                            discoveryMessage.type === 'error'
                              ? 'bg-[var(--workspace-rose-soft)] text-[var(--workspace-ink)]'
                              : 'bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)]'
                          }`}
                        >
                          {discoveryMessage.text}
                        </p>
                      )}

                      {pendingClarifications.length > 0 ? (
                        <form onSubmit={handleSubmitClarifications} className="mt-6 space-y-6">
                          {pendingClarifications.map((question, index) => (
                            <div
                              key={question.id}
                              className="rounded-lg border border-[#dedbd5] bg-[var(--workspace-paper)] p-4"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-[#dedbd5] bg-[var(--workspace-paper)] px-2 py-0.5 font-mono text-xs font-medium">
                                  {t('roundLabel', { round: question.round })}
                                </span>
                                <span className="font-mono text-xs font-medium text-[var(--workspace-muted)]">
                                  {t('questionOf', { current: index + 1, total: pendingClarifications.length })}
                                </span>
                              </div>
                              <label
                                htmlFor={`answer-${question.id}`}
                                className="mt-3 block text-base font-semibold leading-6 tracking-tight"
                              >
                                {question.question}
                              </label>
                              {question.impact && (
                                <p className="mt-2 border-l-2 border-[#c9c4bc] pl-3 text-sm leading-5 text-[var(--workspace-muted)]">
                                  {t('impact')}: {question.impact}
                                </p>
                              )}
                              <div className="mt-4 space-y-3">
                                {(Array.isArray(question.options) ? question.options : []).map((opt, i) => (
                                  <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-lg border border-[#dedbd5] bg-[var(--workspace-paper)] p-3 transition-colors hover:bg-[var(--workspace-blue-soft)] ${BUTTON_FOCUS_CLASS}`}>
                                    <input type="radio" name={`answer-${question.id}`} value={opt} required className="mt-0.5 size-4 border border-[#dedbd5] accent-[var(--workspace-ink)]" />
                                    <span className="text-sm font-bold text-[var(--workspace-ink)]">{opt}</span>
                                  </label>
                                ))}
                                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border border-[#dedbd5] bg-[var(--workspace-blue-soft)] p-3 transition-colors hover:bg-[var(--workspace-mint-soft)] ${BUTTON_FOCUS_CLASS}`}>
                                  <input type="radio" name={`answer-${question.id}`} value="[AUTO]" required className="mt-0.5 size-4 border border-[#dedbd5] accent-[var(--workspace-ink)]" />
                                  <span className="text-sm font-semibold text-[var(--workspace-ink)]">{t('autoPick')}</span>
                                </label>
                                <div className="pt-2">
                                  <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                                    <input type="radio" name={`answer-${question.id}`} value="" id={`custom-radio-${question.id}`} className="size-4 border border-[#dedbd5] accent-[var(--workspace-ink)]" required={(Array.isArray(question.options) ? question.options : []).length === 0} />
                                    {t('otherCustom')}
                                  </label>
                                  <textarea
                                    name={`custom-answer-${question.id}`}
                                    rows={(Array.isArray(question.options) ? question.options : []).length === 0 ? 4 : 2}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        const radio = document.getElementById(`custom-radio-${question.id}`) as HTMLInputElement
                                        if (radio) {
                                          radio.value = e.target.value
                                          radio.checked = true
                                        }
                                      }
                                    }}
                                    placeholder={t('writeDecision')}
                                    className={`w-full resize-y rounded-lg border border-[#dedbd5] bg-[var(--workspace-paper)] px-3 py-2 text-sm font-medium leading-6 text-[var(--workspace-ink)] placeholder:text-[var(--workspace-faint)] ${BUTTON_FOCUS_CLASS}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="submit"
                            disabled={isSubmittingAnswers || isAnalyzing}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--workspace-primary)] px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                          >
                            {isSubmittingAnswers ? (
                              <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                            ) : (
                              <Check aria-hidden="true" className="size-4" />
                            )}
                            {isSubmittingAnswers ? t('savingAnswers') : t('submitAnswersContinue')}
                          </button>
                        </form>
                      ) : (
                        <div className="mt-6">{discoveryButton}</div>
                      )}
                    </div>

                    <aside className={`${PANEL_CLASS} bg-[var(--workspace-blue-soft)] p-5`}>
                      <h3 className="text-xl font-semibold tracking-[-0.03em]">{t('decisionLedger')}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--workspace-muted)]">
                        {t('decisionLedgerDesc')}
                      </p>

                      <dl className="mt-5 divide-y divide-[#dedbd5] border-y border-black/[0.08]">
                        <div className="grid grid-cols-[1fr_auto] gap-3 py-3">
                          <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                            {t('pending')}

                          </dt>
                          <dd className="font-mono text-sm font-semibold">{pendingClarifications.length}</dd>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-3 py-3">
                          <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                            {t('answered')}

                          </dt>
                          <dd className="font-mono text-sm font-semibold">{answeredClarifications.length}</dd>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-3 py-3">
                          <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                            {t('contextSnapshot')}
                          </dt>
                          <dd className="font-mono text-sm font-semibold">v{initialData.contextVersion}</dd>
                        </div>
                      </dl>

                      {answeredClarifications.length > 0 && (
                        <div className="mt-6 space-y-3">
                          {answeredClarifications.slice(-4).map((question) => (
                            <div
                              key={question.id}
                              className="border border-[#dedbd5] bg-[var(--workspace-paper)] p-3 shadow-none"
                            >
                              <p className="font-mono text-[0.68rem] font-semibold text-[var(--workspace-faint)]">
                                {t('answerRound', { round: question.round })}
                              </p>
                              <p className="mt-1 text-sm font-semibold leading-5">{question.question}</p>
                              <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-[var(--workspace-muted)]">
                                {question.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </aside>
                  </section>
                ) : (
                  <section aria-label={t('structuredProjectContext')}>
                    <div
                      className={`${PANEL_SOFT_CLASS} mb-7 flex flex-wrap items-center gap-x-5 gap-y-2 bg-[var(--workspace-paper)] p-4 font-mono text-xs font-bold text-[var(--workspace-muted)]`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3 border border-[#dedbd5] bg-[var(--workspace-mint)]" />
                        {t('confirmedByOwner')}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3 border border-[#dedbd5] bg-[var(--workspace-sun)]" />
                        {t('assumedBySystem')}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3 border border-[#dedbd5] bg-[var(--workspace-paper)]" />
                        {t('stillUnknown')}
                      </span>
                    </div>
                    <div
                      className={`${PANEL_CLASS} divide-y divide-[#dedbd5] bg-[var(--workspace-paper)]`}
                    >
                      {Object.entries(initialData.context ?? {}).map(([key, value]) => (
                        <section
                          key={key}
                          className="grid gap-4 p-6 lg:grid-cols-[minmax(12rem,0.28fr)_1fr] lg:gap-10"
                        >
                          <div>
                            <h3 className="text-xl font-semibold tracking-[-0.04em]">
                              {formatLabel(key)}
                            </h3>
                          </div>
                          <div className="min-w-0 text-sm font-medium leading-6">
                            {SENSITIVE_CONTEXT_KEY.test(key) || isSensitiveContextValue(value) ? (
                              <SensitiveContextValue label={contextLabels.sensitiveLabel} />
                            ) : (
                              <ContextValue value={value} locale={locale} {...contextLabels} />
                            )}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className={activeTab === 'documents' ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={t('generatedDocuments')}
                  description={t('generatedDocumentsDesc')}
                  action={
                    artifacts.length > 0 ? (
                      <div
                        className={`${PANEL_SOFT_CLASS} flex items-center gap-3 px-3 py-2 font-mono text-xs font-semibold text-[var(--workspace-ink)]`}
                      >
                        <span>{t('readyCount', { count: readyArtifacts.length })}</span>
                        <span aria-hidden="true">/</span>
                        <span>{t('attentionCount', { count: attentionArtifacts.length })}</span>
                      </div>
                    ) : undefined
                  }
                />

                {artifacts.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={t('noDocumentationGenerated')}
                    description={t('noDocumentationGeneratedDesc')}
                    action={generateButton}
                  />
                ) : (
                  <div className="[&>div]:rounded-xl [&>div]:border [&>div]:border-black/[0.08] [&>div]:shadow-none">
                    <MarkdownWorkspace
                      projectId={initialData.id}
                      artifacts={artifacts}
                      onArtifactUpdated={handleArtifactUpdated}
                    />
                  </div>
                )}
              </div>

              <div className={activeTab === 'skills' ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={t('resolvedAgentSkills')}
                  description={t('resolvedAgentSkillsDesc')}
                  action={
                    initialData.skills.length > 0 ? (
                      <span
                        className={`${PANEL_SOFT_CLASS} rounded-lg px-3 py-2 font-mono text-xs font-semibold text-[var(--workspace-muted)]`}
                      >
                        {initialData.skills.length === 1
                          ? t('recommendationCount', { count: initialData.skills.length })
                          : t('recommendationCountPlural', { count: initialData.skills.length })}
                      </span>
                    ) : undefined
                  }
                />

                {initialData.skills.length === 0 ? (
                  <EmptyState
                    icon={Wrench}
                    title={t('noSkillsResolved')}
                    description={t('noSkillsResolvedDesc')}
                    action={generateButton}
                  />
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {initialData.skills.map((skill, index) => (
                      <article
                        key={skill.id}
                        className="rounded-xl border border-[#dedbd5] bg-[#fffdfa] p-5 transition-colors hover:border-black/20"
                      >
                        <div className="flex min-w-0 flex-col gap-3 border-b border-black/[0.08] pb-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#dedbd5] ${index % 2 === 0 ? 'bg-[var(--workspace-sun)]' : 'bg-[var(--workspace-blue-soft)]'}`}
                              aria-hidden="true"
                            >
                              <Wrench className="size-4 text-[var(--workspace-ink)]" />
                            </span>
                            <h3 className="min-w-0 break-words text-base font-semibold leading-6 text-[var(--workspace-ink)]">
                              {skill.name}
                            </h3>
                          </div>
                          <p className="shrink-0 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--workspace-faint)]">
                            {skill.source}
                          </p>
                        </div>

                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--workspace-faint)]">
                              {t('purpose')}
                            </h4>
                            <p className="mt-1.5 text-sm leading-6 text-[var(--workspace-ink)]">{skill.purpose}</p>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--workspace-faint)]">
                              {t('trigger')}
                            </h4>
                            <p className="mt-1.5 text-sm leading-6 text-[var(--workspace-muted)]">{skill.trigger}</p>
                          </div>

                          {(skill.metadata?.applicable_phases?.length ||
                            skill.metadata?.applicable_task_types?.length) && (
                            <div className="flex flex-wrap gap-2" aria-label={t('purpose')}>
                              {skill.metadata?.applicable_phases?.map((phase) => (
                                <span
                                  key={`phase-${phase}`}
                                  className="rounded-lg border border-[#dedbd5] bg-[var(--workspace-paper)] px-2 py-1 font-mono text-[11px] font-medium text-[var(--workspace-muted)]"
                                >
                                  {phase}
                                </span>
                              ))}
                              {skill.metadata?.applicable_task_types?.map((taskType) => (
                                <span
                                  key={`type-${taskType}`}
                                  className="rounded-lg border border-[#dedbd5] bg-[var(--workspace-mint-soft)] px-2 py-1 font-mono text-[11px] font-medium text-[var(--workspace-muted)]"
                                >
                                  {formatLabel(taskType)}
                                </span>
                              ))}
                            </div>
                          )}

                          {skill.metadata?.installation_hint && (
                            <div className="rounded-lg border border-[#dedbd5] bg-[var(--workspace-paper)] p-3">
                              <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--workspace-faint)]">
                                {t('setupNote')}
                              </h4>
                              <p className="mt-1.5 break-words font-mono text-xs leading-5 text-[var(--workspace-muted)]">
                                {skill.metadata.installation_hint}
                              </p>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className={activeTab === 'backlog' ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={t('implementationBacklog')}
                  description={t('implementationBacklogDesc')}
                  action={
                    allTasks.length > 0 ? (
                      <div
                        className={`${PANEL_SOFT_CLASS} flex flex-wrap items-center gap-4 px-3 py-2 font-mono text-xs font-semibold text-[var(--workspace-ink)]`}
                      >
                        <span>{t('readyCountShort', { count: readyTasks.length })}</span>
                        <span>{t('doneCount', { count: doneTasks.length })}</span>
                        <span>{t('blockedCount', { count: blockedTasks.length })}</span>
                        <span>{t('totalCount', { count: allTasks.length })}</span>
                      </div>
                    ) : undefined
                  }
                />

                {initialData.phases.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title={t('noImplementationBacklog')}
                    description={t('noImplementationBacklogDesc')}
                    action={generateButton}
                  />
                ) : (
                  <BacklogKanbanBoard
                    projectId={initialData.id}
                    phases={initialData.phases}
                  />
                )}
              </div>

              <div className={activeTab === 'export' ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={t('exportAgentPrompt')}
                  description={t('exportAgentPromptDesc')}
                  action={
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${
                        canExport
                          ? 'border-[var(--workspace-ink)] bg-[var(--workspace-mint-soft)] text-[var(--workspace-ink)]'
                          : 'border-[var(--workspace-ink)] bg-[var(--workspace-paper)] text-[var(--workspace-ink)]'
                      }`}
                    >
                      {canExport ? (hasExportedZip ? t('exportCompleted') : t('readyToDownload')) : t('notReady')}
                    </span>
                  }
                />

                {!canExport ? (
                  <EmptyState
                    icon={Package}
                    title={t('archiveNoEligibleDocuments')}
                    description={t('archiveNoEligibleDocumentsDesc')}
                    action={generateButton}
                  />
                ) : (
                  <div className="space-y-8">
                    {/* One-Shot Kickoff Prompt Card */}
                    <section aria-label={t('oneShotAgentPrompt')} className={`${PANEL_CLASS} bg-[var(--workspace-paper)] p-6 sm:p-8`}>
                      <div className="flex flex-col gap-5 border-b border-black/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center border border-[#dedbd5] bg-[#f8eee6] text-[#8e4e32]">
                            <Wrench aria-hidden="true" className="size-5" />
                          </span>
                          <div>
                            <h3 className="text-xl font-semibold tracking-tight text-[var(--workspace-ink)]">{t('oneShotAgentPrompt')}</h3>
                            <p className="text-xs font-semibold text-[var(--workspace-muted)]">
                              {t('oneShotAgentPromptDesc')}
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Prompt Output Box */}
                      <div className="mt-5 relative">
                        <pre className="max-h-80 overflow-y-auto border border-[#dedbd5] bg-[var(--workspace-ink)] p-4 font-mono text-xs font-medium leading-relaxed text-[var(--workspace-paper)] shadow-none whitespace-pre-wrap">
                          {generateOneShotKickoffPrompt()}
                        </pre>

                        <button
                          type="button"
                          onClick={handleCopyOneShotPrompt}
                          className={`mt-4 inline-flex items-center justify-center gap-2 border border-[#dedbd5] bg-[var(--workspace-sun)] px-5 py-3 font-mono text-sm font-semibold text-[var(--workspace-ink)] shadow-none hover:shadow-none ${BUTTON_FOCUS_CLASS}`}
                        >
                          {copiedPrompt ? (
                            <>
                              <Check aria-hidden="true" className="size-4 text-[var(--workspace-ink)]" />
                              {t('promptCopiedToClipboard')}
                            </>
                          ) : (
                            <>
                              <Copy aria-hidden="true" className="size-4 text-[var(--workspace-ink)]" />
                              {t('copyAgentKickoffPrompt')}
                            </>
                          )}
                        </button>
                      </div>
                    </section>

                    {/* Download ZIP & Manifest Grid */}
                    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_23rem]">
                      <section aria-labelledby="manifest-title" className={PANEL_CLASS}>
                        <div className="flex items-center justify-between border-b border-black/[0.08] bg-[var(--workspace-yellow-soft)] p-5">
                          <h3 id="manifest-title" className="text-2xl font-semibold tracking-[-0.05em]">
                            {t('archiveManifest')}
                          </h3>
                          <span className="font-mono text-xs font-semibold text-[var(--workspace-ink)]">
                            {t('filesCount', { count: readyArtifacts.length + (includesReadme ? 0 : 1) })}
                          </span>
                        </div>
                        <ul className="bg-[var(--workspace-paper)] divide-y divide-[#dedbd5]">
                          {readyArtifacts.map((artifact) => (
                            <li
                              key={artifact.id}
                              className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <FileText
                                  aria-hidden="true"
                                  className="size-4 shrink-0 text-[var(--workspace-ink)]"
                                />
                                <span className="truncate font-mono text-sm font-bold">
                                  {artifact.path}
                                </span>
                              </div>
                              <span
                                className={`w-fit rounded-full px-2 py-0.5 font-mono text-xs font-medium ${statusTone(artifact.status)}`}
                              >
                                {tStatus(artifact.status as Parameters<typeof tStatus>[0]) ?? formatStatus(artifact.status)}
                              </span>
                            </li>
                          ))}
                          {!includesReadme && (
                            <li className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                              <div className="flex min-w-0 items-center gap-3">
                                <FileText
                                  aria-hidden="true"
                                  className="size-4 shrink-0 text-[var(--workspace-ink)]"
                                />
                                <span className="truncate font-mono text-sm font-bold">
                                  README.md
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold text-[var(--workspace-muted)]">
                                {t('addedDuringExport')}
                              </span>
                            </li>
                          )}
                        </ul>
                      </section>

                      <aside
                        className={`${PANEL_CLASS} bg-[var(--workspace-blue-soft)] p-6 flex flex-col justify-between`}
                      >
                        <div>
                          <PackHandoffVisual
                            className="mb-7"
                            labels={{
                              ariaLabel: t('packHandoffVisualLabel'),
                              packageLabel: t('packHandoffPackageLabel'),
                              packageMeta: t('packHandoffPackageMeta'),
                              documentLabel: t('packHandoffDocumentLabel'),
                              documentMeta: t('packHandoffDocumentMeta'),
                              handoffLabel: t('packHandoffAgentLabel'),
                              handoffMeta: t('packHandoffAgentMeta'),
                              connectorLabel: t('packHandoffConnectorLabel'),
                            }}
                          />
                          <PackHandoffWebGL
                            className="mt-6"
                            ariaLabel={t('packHandoffVisualLabel')}
                            description={`${t('packHandoffPackageLabel')} ${t('packHandoffConnectorLabel')} ${t('packHandoffAgentLabel')}`}
                          />
                          <span className="flex size-12 items-center justify-center border border-[#dedbd5] bg-[var(--workspace-paper)] shadow-none">
                            <Package aria-hidden="true" className="size-6" />
                          </span>
                          <h3 className="mt-6 text-3xl font-semibold leading-none tracking-[-0.05em]">
                            {t('bootstrapPack')}
                          </h3>
                          <p className="mt-3 text-sm font-semibold leading-6 text-[var(--workspace-muted)]">
                            {t('preparedForUniversal')}
                          </p>

                          <div className="mt-6 space-y-2 border-y border-black/[0.08] py-4 text-sm font-medium">
                            <div className="flex items-center gap-3">
                              <ShieldCheck aria-hidden="true" className="size-4" />
                              {t('contentScanned')}
                            </div>
                            <div className="flex items-center gap-3">
                              <CheckCircle2 aria-hidden="true" className="size-4" />
                              {t('controlledFilenames')}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDownloadZip}
                          disabled={isExporting}
                          aria-busy={isExporting}
                          className={`mt-6 inline-flex w-full items-center justify-center gap-2 border border-[#dedbd5] bg-[var(--workspace-primary)] px-4 py-3 font-mono text-sm font-semibold text-white shadow-none hover:shadow-none disabled:pointer-events-none disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                        >
                          {isExporting ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
                          {isExporting ? t('validatingPack') : t('downloadZipPack')}
                        </button>
                      </aside>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          </main>
        </div>
      </div>

      <Modal
        open={isSettingsOpen}
        onClose={() => !isSavingSettings && setIsSettingsOpen(false)}
        title={t('settings')}
        closeLabel={t('closeDialog')}
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="projectName" className="text-sm font-semibold text-[var(--workspace-ink)]">
              {t('projectName')}
            </label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="projectLang" className="text-sm font-semibold text-[var(--workspace-ink)]">
              {t('language')}
            </label>
            <Select id="projectLang" value={projectLang} onChange={(e) => setProjectLang(e.target.value)}>
              <option value="id">{t('settingsLanguageId')}</option>
              <option value="en">{t('settingsLanguageEn')}</option>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" disabled={isSavingSettings}>
              {isSavingSettings ? tCommon('loading') : t('saveChanges')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
