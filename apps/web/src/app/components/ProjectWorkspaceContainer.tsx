'use client'

import { Link } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  useEffect,
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
  CalendarDays,
  Check,
  ChevronRight,
  FileCheck,
  Circle,
  CircleDashed,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  Files,
  FolderKanban,
  Languages,
  ListChecks,
  Loader2,
  Lock,
  MessageSquareText,
  Network,
  Package,
  Play,
  RefreshCw,
  X,
  ScanText,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import { MarkdownWorkspace, type WorkspaceArtifactItem } from '@/app/components/MarkdownWorkspace'
import { DesignSystemGraph } from '@/app/components/DesignSystemGraph'
import { BacklogKanbanBoard } from '@/app/components/BacklogKanbanBoard'
import type { SystemGraphData } from '@repo/types'
import { BrandLogo } from '@/app/components/BrandLogo'
import { parseProjectBrief, type ParsedProjectBrief } from '@/lib/projects/brief-parser'

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
  reconcileGenerationStateAfterArtifactUpdate,
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
    classificationStatus: string
    classificationError: string | null
    language: string
    status: string
    createdAt: string
    updatedAt: string
    context: Record<string, unknown> | null
    contextVersion: number
    requiredArtifactTypes: string[]
    systemGraph: SystemGraphData | null
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

const ALL_SECTIONS: {
  id: WorkspaceSection
  labelKey: string
  descriptionKey: string
  icon: LucideIcon
}[] = [
  { id: 'overview', labelKey: 'sectionOverview', descriptionKey: 'sectionOverviewDesc', icon: ClipboardCheck },
  { id: 'context', labelKey: 'sectionContext', descriptionKey: 'sectionContextDesc', icon: Braces },
  { id: 'design-system', labelKey: 'sectionDesignSystem', descriptionKey: 'sectionDesignSystemDesc', icon: Network },
  { id: 'documents', labelKey: 'sectionDocuments', descriptionKey: 'sectionDocumentsDesc', icon: Files },
  { id: 'backlog', labelKey: 'sectionBacklog', descriptionKey: 'sectionBacklogDesc', icon: ListChecks },
  { id: 'export', labelKey: 'sectionExport', descriptionKey: 'sectionExportDesc', icon: Package },
]

function getSectionTabKey(id: WorkspaceSection) {
  if (id === 'design-system') return 'tabDesignSystem'
  return `tab${id.charAt(0).toUpperCase() + id.slice(1)}`
}

const WORKSPACE_STYLE = {
  '--workspace-paper': 'var(--color-workspace-paper)',
  '--workspace-ink': 'var(--color-workspace-ink)',
  '--workspace-canvas': 'var(--color-workspace-canvas)',
  '--workspace-panel': 'var(--color-workspace-paper)',
  '--workspace-border': 'var(--color-workspace-border)',
  '--workspace-border-subtle': 'var(--color-workspace-border-subtle)',
  '--workspace-border-muted': 'var(--color-workspace-border-muted)',
  '--workspace-card-shadow': 'var(--color-workspace-card-shadow)',
  '--workspace-body': 'var(--color-workspace-body)',
  '--workspace-muted': 'var(--color-workspace-muted)',
  '--workspace-faint': 'var(--color-workspace-faint)',
  '--workspace-primary': 'var(--color-workspace-primary)',
  '--workspace-primary-hover': 'var(--color-workspace-primary-hover)',
  '--workspace-deep': 'var(--color-workspace-deep)',
  '--workspace-mint': 'var(--color-workspace-mint)',
  '--workspace-rose': 'var(--color-workspace-rose)',
  '--workspace-blue-soft': 'var(--color-workspace-blue-soft)',
  '--workspace-yellow-soft': 'var(--color-workspace-yellow-soft)',
  '--workspace-mint-soft': 'var(--color-workspace-mint-soft)',
  '--workspace-rose-soft': 'var(--color-workspace-rose-soft)',
  '--workspace-sun': 'var(--color-workspace-sun)',
  '--workspace-peach': 'var(--color-workspace-peach)',
} as CSSProperties

const PANEL_CLASS =
  'rounded-[20px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-[0_10px_28px_rgba(36,35,31,0.045)]'
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

type ContextProvenance = 'confirmed' | 'assumed' | 'unknown'
type ContextProvenanceCounts = Record<ContextProvenance, number>

const CONTEXT_CATEGORY_DEFINITIONS = [
  {
    id: 'intent',
    labelKey: 'contextCategoryIntent',
    descriptionKey: 'contextCategoryIntentDesc',
    keys: ['goals', 'non_goals'],
  },
  {
    id: 'audience',
    labelKey: 'contextCategoryAudience',
    descriptionKey: 'contextCategoryAudienceDesc',
    keys: ['target_users'],
  },
  {
    id: 'experience',
    labelKey: 'contextCategoryExperience',
    descriptionKey: 'contextCategoryExperienceDesc',
    keys: ['design_direction', 'core_entities'],
  },
  {
    id: 'scope',
    labelKey: 'contextCategoryScope',
    descriptionKey: 'contextCategoryScopeDesc',
    keys: ['functional_requirements'],
  },
  {
    id: 'constraints',
    labelKey: 'contextCategoryConstraints',
    descriptionKey: 'contextCategoryConstraintsDesc',
    keys: [
      'non_functional_requirements',
      'technical_constraints',
      'stack_preferences',
      'security_requirements',
      'integrations',
      'deployment_target',
      'agent_target',
    ],
  },
  {
    id: 'decisions',
    labelKey: 'contextCategoryDecisions',
    descriptionKey: 'contextCategoryDecisionsDesc',
    keys: ['confirmed_decisions', 'assumptions', 'open_questions'],
  },
] as const

function getContextProvenanceCounts(context: Record<string, unknown>, keys: readonly string[]): ContextProvenanceCounts {
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

function countContextItems(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  if (Array.isArray(value)) return value.length
  if (typeof value !== 'object') return 1

  const record = value as Record<string, unknown>
  if (record.provenance === 'confirmed' || record.provenance === 'assumed' || record.provenance === 'unknown') {
    return 1
  }

  return Object.values(record).reduce<number>((total, nestedValue) => total + countContextItems(nestedValue), 0)
}

function SectionHeading({
  title,
  description,
  action,
  divided = true,
}: {
  title: string
  description: string
  action?: ReactNode
  divided?: boolean
}) {
  return (
    <div className={`flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between ${divided ? 'border-b border-black/[0.08]' : ''}`}>
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

function getExportArtifactDescriptionKey(type: string):
  | 'fileDescAgent'
  | 'fileDescBacklog'
  | 'fileDescPrd'
  | 'fileDescDesign'
  | 'fileDescArchitecture'
  | 'fileDescGeneric' {
  switch (type) {
    case 'AGENT':
      return 'fileDescAgent'
    case 'BACKLOG':
      return 'fileDescBacklog'
    case 'PRD':
      return 'fileDescPrd'
    case 'DESIGN':
      return 'fileDescDesign'
    case 'ARCHITECTURE':
      return 'fileDescArchitecture'
    default:
      return 'fileDescGeneric'
  }
}

function renderPromptPreviewContent(promptText: string) {
  const lines = promptText.split('\n')
  return lines.map((line, index) => {
    if (line.startsWith('# ')) {
      return (
        <div key={index} className="font-bold text-amber-300 text-sm py-0.5">
          {line}
        </div>
      )
    }
    if (line.startsWith('## ')) {
      return (
        <div key={index} className="font-semibold text-amber-200 text-xs pt-3 pb-1">
          {line}
        </div>
      )
    }
    const numberedMatch = line.match(/^(\d+\.\s)(.*)$/)
    if (numberedMatch) {
      return (
        <div key={index} className="flex items-start text-xs text-neutral-200 pl-2 py-0.5">
          <span className="font-semibold text-sky-300 shrink-0 w-6">{numberedMatch[1]}</span>
          <span className="min-w-0">{numberedMatch[2]}</span>
        </div>
      )
    }
    if (line.startsWith('- ')) {
      return (
        <div key={index} className="flex items-start text-xs text-neutral-200 pl-2 py-0.5">
          <span className="text-neutral-400 shrink-0 mr-2">•</span>
          <span className="min-w-0">{line.slice(2)}</span>
        </div>
      )
    }
    if (!line.trim()) {
      return <div key={index} className="h-2" />
    }
    return (
      <div key={index} className="text-xs text-neutral-300 py-0.5">
        {line}
      </div>
    )
  })
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
          className={`inline-flex rounded-full px-2 py-0.5 font-sans text-xs font-semibold ${
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
          <li key={index} className="border-l border-[var(--workspace-border-muted)] pl-3">
            <span className="mb-2 block font-sans text-xs font-semibold text-[var(--workspace-muted)]">
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
      <dl className={depth > 1 ? 'space-y-3' : 'divide-y divide-[var(--workspace-border)]'}>
        {entries.map(([key, nestedValue]) => (
          <div
            key={key}
            className={
              depth > 1
                ? 'grid gap-1 sm:grid-cols-[minmax(8rem,0.35fr)_1fr] sm:gap-4'
                : 'grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(10rem,0.35fr)_1fr] sm:gap-6'
            }
          >
            <dt className="font-sans text-xs font-semibold text-[var(--workspace-muted)]">
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
  const showDesignSystem = initialData.classification !== 'LANDING_PAGE'
  const sectionItems = ALL_SECTIONS.filter((section) => section.id !== 'design-system' || showDesignSystem)
  const activeTab = requestedTab === 'design-system' && !showDesignSystem ? 'overview' : requestedTab

  const selectTab = (section: WorkspaceSection) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('flow')
    if (section === 'overview') params.delete('tab')
    else params.set('tab', section)
    const query = params.toString()
    router.replace(query ? `?${query}` : '?', { scroll: false })
  }

  const selectTabRef = useRef(selectTab)
  useEffect(() => {
    selectTabRef.current = selectTab
  })

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [projectName, setProjectName] = useState(initialData.name)
  const [projectLang, setProjectLang] = useState(initialData.language || 'id')
  const [artifacts, setArtifacts] = useState<WorkspaceArtifactItem[]>(initialData.artifacts)
  const [systemGraph, setSystemGraph] = useState<SystemGraphData | null>(initialData.systemGraph)
  const [isRepairingSystemGraph, setIsRepairingSystemGraph] = useState(false)
  const [systemGraphError, setSystemGraphError] = useState<string | null>(null)
  const [phases, setPhases] = useState(initialData.phases)
  const [backlogRevision, setBacklogRevision] = useState(0)
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
  const [currentClassification, setCurrentClassification] = useState(initialData.classification)
  const [classificationStatus, setClassificationStatus] = useState(initialData.classificationStatus)
  const [classificationRetryError, setClassificationRetryError] = useState<string | null>(null)
  const [classificationTimedOut, setClassificationTimedOut] = useState(false)
  const [isRetryingClassification, setIsRetryingClassification] = useState(false)
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
  const [openContextCategory, setOpenContextCategory] = useState<string | null>(null)
  const [projectStatus, setProjectStatus] = useState(initialData.status)
  const [projectContext, setProjectContext] = useState<Record<string, unknown> | null>(initialData.context)
  const [isGenerationFinished, setIsGenerationFinished] = useState(false)
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState<number | null>(null)
  const [hasDismissedRedirect, setHasDismissedRedirect] = useState(false)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  const autoFlowStartedRef = useRef(false)
  const failureDetailsRef = useRef<HTMLDetailsElement>(null)
  const sectionTabRefs = useRef(new Map<WorkspaceSection, HTMLButtonElement>())

  const readyArtifacts = artifacts.filter(
    (artifact) => artifact.status === 'READY' || artifact.status === 'MODIFIED',
  )
  const attentionArtifacts = artifacts.filter(
    (artifact) => artifact.status !== 'READY' && artifact.status !== 'MODIFIED',
  )
  const requiredDocumentTypes = initialData.requiredArtifactTypes.filter((type) =>
    ['PRD', 'SRS', 'ARCHITECTURE', 'DESIGN', 'AGENT'].includes(type),
  )
  const retryableDocumentArtifacts = requiredDocumentTypes.filter((type) => {
    const artifact = artifacts.find((candidate) => candidate.type === type)
    return !artifact || (artifact.status !== 'READY' && artifact.status !== 'MODIFIED')
  })
  const retryableDocumentCount = retryableDocumentArtifacts.length
  const allTasks = phases.flatMap((phase) => phase.tasks)
  const readyTasks = allTasks.filter((task) => task.status === 'READY')
  const doneTasks = allTasks.filter((task) => task.status === 'DONE')
  const blockedTasks = allTasks.filter((task) => task.status === 'BLOCKED')
  const pendingClarifications = clarifications.filter((question) => question.status === 'PENDING')
  const answeredClarifications = clarifications.filter((question) => question.status === 'ANSWERED')
  const contextReady = hasContextData(projectContext)
  const contextCategories = CONTEXT_CATEGORY_DEFINITIONS.map((category) => {
    const categoryKeys = category.keys.filter((key) => Object.prototype.hasOwnProperty.call(projectContext ?? {}, key))
    const counts = getContextProvenanceCounts(projectContext ?? {}, categoryKeys)
    const itemCount = categoryKeys.reduce((total, key) => total + countContextItems(projectContext?.[key]), 0)

    return { ...category, categoryKeys, counts, itemCount }
  }).filter((category) => category.itemCount > 0)
  const contextProvenanceCounts = contextCategories.reduce<ContextProvenanceCounts>(
    (total, category) => ({
      confirmed: total.confirmed + category.counts.confirmed,
      assumed: total.assumed + category.counts.assumed,
      unknown: total.unknown + category.counts.unknown,
    }),
    { confirmed: 0, assumed: 0, unknown: 0 },
  )
  const selectedContextCategory = contextCategories.find((category) => category.id === openContextCategory) ?? null
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

  const sidebarDocuments = (() => {
    const plannedTypes: { type: string; filename: string }[] = [
      { type: 'PRD', filename: 'PRD.md' },
      ...(initialData.requiredArtifactTypes.includes('SRS') ? [{ type: 'SRS', filename: 'SRS.md' }] : []),
      ...(initialData.requiredArtifactTypes.includes('ARCHITECTURE') ? [{ type: 'ARCHITECTURE', filename: 'ARCHITECTURE.md' }] : []),
      ...(initialData.requiredArtifactTypes.includes('DESIGN') ? [{ type: 'DESIGN', filename: 'DESIGN.md' }] : []),
      { type: 'AGENT', filename: 'Agent.md' },
      { type: 'BACKLOG', filename: 'BACKLOG.md' },
    ]

    const artifactMap = new Map(artifacts.map((a) => [a.type, a]))
    for (const artifact of artifacts) {
      if (!plannedTypes.some(({ type }) => type === artifact.type)) {
        plannedTypes.push({ type: artifact.type, filename: artifact.path.split('/').pop() ?? `${artifact.type}.md` })
      }
    }

    return plannedTypes.map(({ type, filename }) => {
      const artifact = artifactMap.get(type)
      if (artifact) {
        return {
          id: artifact.id || type,
          filename: artifact.path.split('/').pop() ?? filename,
          status: artifact.status,
        }
      }

      let status = 'WAITING'
      if (isGenerating) {
        if (['PRD', 'SRS', 'ARCHITECTURE', 'DESIGN'].includes(type)) {
          if (generationState.stages.documents.status === 'running') status = 'GENERATING'
          else if (generationState.stages.documents.status === 'failed') status = 'FAILED'
          else if (generationState.stages.documents.status === 'complete') status = 'READY'
        } else if (type === 'AGENT') {
          if (generationState.stages.agentRules.status === 'running') status = 'GENERATING'
          else if (generationState.stages.agentRules.status === 'failed') status = 'FAILED'
          else if (generationState.stages.agentRules.status === 'complete') status = 'READY'
        } else if (type === 'BACKLOG') {
          if (generationState.stages.backlog.status === 'running') status = 'GENERATING'
          else if (generationState.stages.backlog.status === 'failed') status = 'FAILED'
          else if (generationState.stages.backlog.status === 'complete') status = 'READY'
        }
      } else if (generationState.stages.documents.status === 'failed' && ['PRD', 'SRS', 'ARCHITECTURE', 'DESIGN'].includes(type)) {
        status = 'FAILED'
      }

      return {
        id: type,
        filename,
        status,
      }
    })
  })()

  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [isBriefExpanded, setIsBriefExpanded] = useState(false)
  const [isBriefOverflowing, setIsBriefOverflowing] = useState(false)
  const [isHeroVisible, setIsHeroVisible] = useState(true)
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)
  const briefCardRef = useRef<HTMLDivElement>(null)
  const briefContentRef = useRef<HTMLDivElement>(null)
  const briefText = initialData.description || t('noBrief')
  const parsedBrief: ParsedProjectBrief = parseProjectBrief(initialData.description, projectContext)
  const briefParagraphs = parsedBrief.paragraphs.length > 0
    ? parsedBrief.paragraphs
    : [parsedBrief.lead || briefText]

  useEffect(() => {
    let frame = 0
    try {
      const stored = window.localStorage.getItem(`project_brief_collapsed_${initialData.id}`)
      if (stored === 'false') {
        frame = window.requestAnimationFrame(() => setIsBriefExpanded(true))
      }
    } catch {}
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [initialData.id])

  useEffect(() => {
    const content = briefContentRef.current
    if (!content) return

    const updateOverflow = () => {
      const overflows = content.scrollHeight > content.clientHeight + 1
      setIsBriefOverflowing((current) => (isBriefExpanded ? current || overflows : overflows))
    }
    updateOverflow()
    const observer = new ResizeObserver(updateOverflow)
    observer.observe(content)
    return () => observer.disconnect()
  }, [briefParagraphs.length, isBriefExpanded])

  useEffect(() => {
    const card = briefCardRef.current
    if (!card) return
    const observer = new IntersectionObserver(([entry]) => setIsHeroVisible(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(card)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleVisibility = () => setIsDocumentVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (autoRedirectSeconds === null || hasDismissedRedirect) return
    const timer = setTimeout(() => {
      if (autoRedirectSeconds === 1) {
        selectTabRef.current('export')
        setAutoRedirectSeconds(null)
      } else {
        setAutoRedirectSeconds((seconds) => seconds === null ? null : seconds - 1)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [autoRedirectSeconds, hasDismissedRedirect])

  useEffect(() => {
    if (classificationStatus !== 'PENDING') return

    let cancelled = false
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/projects/${initialData.id}`)
        if (!response.ok) return
        const data = (await response.json()) as { project?: { classificationStatus?: string; classification?: string } }
        const project = data.project
        if (!project || cancelled) return
        if (project.classificationStatus && project.classificationStatus !== 'PENDING') {
          setClassificationStatus(project.classificationStatus)
          if (project.classification) {
            setCurrentClassification(project.classification)
          }
          clearInterval(pollInterval)
        }
      } catch {
        // Continue polling until timeout
      }
    }, 2000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      if (!cancelled) setClassificationTimedOut(true)
    }, 15000)

    return () => {
      cancelled = true
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [classificationStatus, initialData.id])

  const toggleBrief = () => {
    const nextExpanded = !isBriefExpanded
    setIsBriefExpanded(nextExpanded)
    try {
      window.localStorage.setItem(`project_brief_collapsed_${initialData.id}`, String(!nextExpanded))
    } catch {}

    if (!nextExpanded) {
      window.requestAnimationFrame(() => {
        briefCardRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        })
      })
    }
  }

  const heroMotionPaused = !isHeroVisible || !isDocumentVisible
  const briefHasStructuredSections = parsedBrief.features.length > 0 || parsedBrief.pageStructure.length > 0 || parsedBrief.scope.included.length > 0 || parsedBrief.scope.excluded.length > 0 || parsedBrief.audience.length > 0
  const localizedLanguage = initialData.language === 'id' ? t('settingsLanguageId') : t('settingsLanguageEn')
  const localizedClassification =
    classificationStatus === 'PENDING'
      ? t('classificationPending')
      : classificationStatus === 'FAILED'
        ? t('classificationFailed')
        : formatLabel(currentClassification)
  const formattedUpdatedDate = formatDate(initialData.updatedAt, locale) ?? t('unknownDate')

  const briefActionButton = isBriefOverflowing ? (
    <button
      type="button"
      onClick={toggleBrief}
      aria-expanded={isBriefExpanded}
      aria-controls="project-brief-content"
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--workspace-primary)] bg-[var(--workspace-paper)] px-3.5 py-2 text-xs font-semibold text-[var(--workspace-ink)] transition-colors hover:bg-[var(--workspace-yellow-soft)] ${BUTTON_FOCUS_CLASS}`}
    >
      {isBriefExpanded ? <ChevronRight aria-hidden="true" className="size-3.5 -rotate-90" /> : <ChevronRight aria-hidden="true" className="size-3.5 rotate-90" />}
      {isBriefExpanded ? t('briefCollapse') : t('briefExpand')}
    </button>
  ) : null

  const heroContentClass = isBriefExpanded
    ? 'h-auto'
    : 'h-auto max-h-[calc(100dvh-3rem)] max-[639px]:max-h-[38rem] max-[639px]:overflow-hidden'

  const renderBriefParagraphs = (className?: string) => (
    <div className={`w-full max-w-none text-left text-[15px] leading-7 text-[var(--workspace-body)] sm:text-base ${className ?? ''}`}>
      <div className="w-full space-y-4">
        {briefParagraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 12)}`} className="w-full max-w-none whitespace-pre-line break-words">{paragraph}</p>
        ))}
      </div>
    </div>
  )

  const briefMaskClass = !isBriefExpanded && isBriefOverflowing
    ? '[mask-image:linear-gradient(to_bottom,black_0%,black_85%,transparent_100%)]'
    : ''

  const renderHeroBrief = () => (
    <div
      id="project-brief-content"
      ref={briefContentRef}
      className={`mt-4 min-h-0 flex-1 overflow-hidden ${briefMaskClass}`}
    >
      {renderBriefParagraphs()}
    </div>
  )

  const overviewStructuredContent = (
    <div className="space-y-6">
      {parsedBrief.features.length > 0 && <section aria-labelledby="overview-features-title"><h2 id="overview-features-title" className="text-xl font-semibold tracking-[-0.03em]">{t('overviewFeatures')}</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{parsedBrief.features.map((feature) => <article key={feature.title} className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-4"><h3 className="text-sm font-semibold">{feature.title}</h3>{feature.description && <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">{feature.description}</p>}</article>)}</div></section>}
      {parsedBrief.pageStructure.length > 0 && <section aria-labelledby="overview-structure-title"><h2 id="overview-structure-title" className="text-xl font-semibold tracking-[-0.03em]">{t('overviewStructure')}</h2><div className="mt-4 flex flex-wrap gap-2">{parsedBrief.pageStructure.map((item) => <span key={item} className="rounded-full border border-[var(--workspace-border)] bg-white/60 px-3 py-1.5 text-sm font-medium text-[var(--workspace-ink)]">{item}</span>)}</div></section>}
      {(parsedBrief.scope.included.length > 0 || parsedBrief.scope.excluded.length > 0) && <section aria-labelledby="overview-scope-title"><h2 id="overview-scope-title" className="text-xl font-semibold tracking-[-0.03em]">{t('overviewScope')}</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-[#cdddcf] bg-[var(--workspace-mint-soft)] p-4"><h3 className="text-sm font-semibold">{t('overviewIncluded')}</h3><ul className="mt-3 space-y-2 text-sm leading-6">{parsedBrief.scope.included.map((item) => <li key={item} className="flex gap-2"><Check aria-hidden="true" className="mt-1 size-4 shrink-0" />{item}</li>)}</ul></div><div className="rounded-xl border border-[#e4c7c0] bg-[var(--workspace-rose-soft)] p-4"><h3 className="text-sm font-semibold">{t('overviewExcluded')}</h3><ul className="mt-3 space-y-2 text-sm leading-6">{parsedBrief.scope.excluded.map((item) => <li key={item} className="flex gap-2"><X aria-hidden="true" className="mt-1 size-4 shrink-0" />{item}</li>)}</ul></div></div></section>}
      {parsedBrief.audience.length > 0 && <section aria-labelledby="overview-audience-title"><h2 id="overview-audience-title" className="text-xl font-semibold tracking-[-0.03em]">{t('overviewAudience')}</h2><div className="mt-4 flex flex-wrap gap-2">{parsedBrief.audience.map((item) => <span key={item} className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-blue-soft)] px-3 py-1.5 text-sm font-medium">{item}</span>)}</div></section>}
      {!briefHasStructuredSections && <p className="sr-only">{t('overviewStructuredFallback')}</p>}
    </div>
  )

  const handleRetryClassification = async () => {
    setIsRetryingClassification(true)
    setClassificationRetryError(null)
    setClassificationTimedOut(false)
    setClassificationStatus('PENDING')

    try {
      const response = await fetch(`/api/projects/${initialData.id}/classify`, {
        method: 'POST',
      })
      const result = (await response.json()) as {
        status?: string
        classification?: string
      }

      if (!response.ok) throw new Error('Classification retry failed')
      if (result.classification) setCurrentClassification(result.classification)
      if (result.status) setClassificationStatus(result.status)
    } catch {
      setClassificationStatus('FAILED')
      setClassificationRetryError(t('classificationRetryError'))
    } finally {
      setIsRetryingClassification(false)
    }
  }

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
  const exportManifestArtifacts = readyRequiredArtifacts
  const includesReadme = exportManifestArtifacts.some((artifact) => artifact.path === 'README.md')
  const exportFileCount = exportManifestArtifacts.length + (includesReadme ? 0 : 1)
  const [isExporting, setIsExporting] = useState(false)
  const [isDownloadComplete, setIsDownloadComplete] = useState(false)

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

      setIsDownloadComplete(true)
      setTimeout(() => setIsDownloadComplete(false), 2000)
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

  const handleArtifactUpdated = (
    updated: WorkspaceArtifactItem,
    newSystemGraph?: SystemGraphData | null,
  ) => {
    if (newSystemGraph !== undefined) {
      setSystemGraph(newSystemGraph)
    }
    const mergedArtifacts = artifacts.some((artifact) => artifact.type === updated.type)
      ? artifacts.map((artifact) => (artifact.type === updated.type ? updated : artifact))
      : [...artifacts, updated]

    setArtifacts(mergedArtifacts)
    const reconciled = reconcileGenerationStateAfterArtifactUpdate({
      state: generationState,
      artifacts: mergedArtifacts,
      updatedType: updated.type,
      projectStatus,
      requiredArtifactTypes: initialData.requiredArtifactTypes,
      hasSkills: initialData.skills.length > 0,
      hasBacklog: phases.length > 0,
    })
    setGenerationState(reconciled)

    const hasAnyFailedStage = Object.values(reconciled.stages).some(
      (stage) => stage.status === 'failed',
    )
    if (!hasAnyFailedStage) {
      if (
        reconciled.stages.documents.status === 'complete' &&
        (projectStatus === 'GENERATION_FAILED' || projectStatus === 'GENERATING')
      ) {
        setProjectStatus('READY')
      }
      setGenMessage(null)
    }
  }

  const workspaceNavigation = (
    <>
      <div className="min-w-0 border-b border-[var(--workspace-border)] pb-5">
        <BrandLogo imageSize={28} textClassName="text-xl font-semibold tracking-[-0.04em]" />
        <p className="mt-1 truncate text-xs text-[var(--workspace-muted)]" title={initialData.name}>
          {initialData.name}
        </p>
        {projectStatus !== 'EXPORTABLE' && (
          <span
            className={`mt-3 inline-flex max-w-full rounded-full border border-[var(--workspace-border)] px-3 py-1.5 text-center text-xs font-semibold leading-4 ${statusTone(projectStatus)}`}
            title={tStatus(projectStatus as Parameters<typeof tStatus>[0]) ?? formatStatus(projectStatus)}
          >
            {tStatus(projectStatus as Parameters<typeof tStatus>[0]) ?? formatStatus(projectStatus)}
          </span>
        )}
      </div>
      <div className="mt-6">
        <Link href="/dashboard" className={`inline-flex items-center gap-2 text-sm font-semibold text-[var(--workspace-muted)] transition-colors hover:text-[var(--workspace-primary)] ${BUTTON_FOCUS_CLASS}`}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('backProjects')}
        </Link>
      </div>
      <div className="mt-8">
        <p className="text-xs font-bold text-[var(--workspace-muted)]">{t('workspaceSections')}</p>
        <nav aria-label={t('workspaceSections')} className="mt-3 space-y-1">
          {sectionItems.map((section) => {
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
                aria-current={isActive ? 'page' : undefined}
                aria-controls={getSectionPanelId(section.id)}
                onClick={() => {
                  selectTab(section.id)
                }}
                onKeyDown={(event) => handleSectionKeyDown(event, section.id)}
                title={t(section.descriptionKey as Parameters<typeof t>[0])}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${BUTTON_FOCUS_CLASS} ${isActive ? 'bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)]' : 'text-[var(--workspace-muted)] hover:bg-[var(--workspace-blue-soft)] hover:text-[var(--workspace-ink)]'}`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(getSectionTabKey(section.id) as Parameters<typeof t>[0])}
              </button>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-[var(--workspace-border)] pt-5">
        <button
          type="button"
          onClick={() => {
            setIsSettingsOpen(true)
          }}
          className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-3 py-2.5 text-left text-sm font-semibold text-[var(--workspace-ink)] transition-colors hover:bg-[var(--workspace-blue-soft)] ${BUTTON_FOCUS_CLASS}`}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          <span>{t('projectSettings')}</span>
        </button>
      </div>
    </>
  )

  const handleSectionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentSection: WorkspaceSection,
  ) => {
    const currentIndex = sectionItems.findIndex((section) => section.id === currentSection)
    const lastIndex = sectionItems.length - 1
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
    const nextSection = sectionItems[nextIndex].id
    selectTab(nextSection)
    sectionTabRefs.current.get(nextSection)?.focus()
  }

  const handleRepairSystemGraph = async () => {
    if (isRepairingSystemGraph || isGenerating) return
    setIsRepairingSystemGraph(true)
    setSystemGraphError(null)
    try {
      const result = await requestProjectStage<{ systemGraph?: SystemGraphData | null }>(
        'generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'SYSTEM_GRAPH' }),
        },
        t('systemGraphRepairFailed'),
      )
      setSystemGraph(result.systemGraph ?? null)
      router.refresh()
    } catch (error) {
      setSystemGraphError(error instanceof Error ? error.message : t('systemGraphRepairFailed'))
    } finally {
      setIsRepairingSystemGraph(false)
    }
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

  const runGenerationRef = useRef<(operation: 'initial' | 'retry', contextIsReady?: boolean) => Promise<void>>(async () => {})

  const buildCanonicalContext = async () => {
    setIsAnalyzing(true)
    setDiscoveryMessage({ type: 'status', text: t('normalizingContext') })
    try {
      const result = await requestProjectStage<{
        context: Record<string, unknown>
        version: number
      }>(
        'context',
        { method: 'POST' },
        t('contextGenerationFailed'),
      )

      setProjectContext(result.context)
      setProjectStatus('CONTEXT_READY')
      setDiscoveryMessage({ type: 'status', text: t('contextReadyMessage') })
      setIsAnalyzing(false)
      selectTab('documents')
      await runGenerationRef.current('initial', true)
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

  const handleStartDiscoveryRef = useRef(handleStartDiscovery)
  useEffect(() => {
    handleStartDiscoveryRef.current = handleStartDiscovery
  })

  useEffect(() => {
    if (searchParams.get('flow') !== 'auto' || autoFlowStartedRef.current) return
    if (projectStatus !== 'DRAFT' && projectStatus !== 'CONFIGURED') return
    autoFlowStartedRef.current = true
    selectTabRef.current('context')
    void handleStartDiscoveryRef.current()
  }, [projectStatus, searchParams])

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

  const generationStageRequest = async (stage: GenerationStageId, retryIncomplete = false) => {
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
          artifacts?: Array<{ id: string; type: string; path: string; status: string; content?: string; updatedAt?: string; version?: number; error?: string }>
          systemGraph?: SystemGraphData | null
        }>(
          'generate',
          retryIncomplete
            ? {
                method: 'POST',
                body: JSON.stringify({ regenerateFailed: true }),
                headers: { 'Content-Type': 'application/json' },
              }
            : { method: 'POST' },
          t('documentGenerationFailed'),
        )
        const failedArtifact = result.artifacts?.find((artifact) => artifact.status === 'FAILED')
        if (failedArtifact) {
          throw new Error(failedArtifact.error ?? `${failedArtifact.type}.md generation failed.`)
        }
        if (!result.artifacts?.length) throw new Error(t('documentGenerationEmpty'))
        return result
      }
      case 'agentRules': {
        const result = await requestProjectStage<{
          artifacts?: Array<{ id: string; type: string; path: string; status: string; content?: string; updatedAt?: string; version?: number; error?: string }>
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
        return result
      }
      case 'skills':
        await requestProjectStage('skills', { method: 'POST' }, t('skillResolutionFailed'))
        return
      case 'backlog': {
        const result = await requestProjectStage<{
          artifact?: { id: string; type: string; path: string; status: string; content?: string; updatedAt?: string }
          phases?: typeof initialData.phases
        }>('backlog', { method: 'POST' }, t('backlogGenerationFailed'))
        if (!result.artifact || !['READY', 'MODIFIED'].includes(result.artifact.status)) {
          throw new Error(t('backlogGenerationFailed'))
        }
        return result
      }
      case 'validation': {
        const result = await requestProjectStage<{
          report?: { isConsistent?: boolean }
        }>('validate', { method: 'POST' }, t('readinessValidationFailed'))
        if (!result.report?.isConsistent) {
          throw new Error(t('generationValidationFailed'))
        }
        return
      }
    }
  }

  const handleRegenerateBacklog = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    setGenerationOperation('retry')
    setProjectStatus('GENERATING')
    setGenMessage(null)
    let state = markGenerationStageRunning(generationState, 'backlog')
    updateGenerationState(state)

    try {
      const result = await generationStageRequest('backlog') as {
        artifact?: { id: string; type: string; path: string; status: string; content?: string; updatedAt?: string }
        phases?: typeof initialData.phases
      }
      if (result.phases) {
        setPhases(result.phases)
        setBacklogRevision((revision) => revision + 1)
      }
      if (result.artifact) {
        const artifact = result.artifact
        const updatedArtifact: WorkspaceArtifactItem = {
          id: artifact.id,
          type: artifact.type,
          path: artifact.path,
          content: artifact.content ?? '',
          status: artifact.status,
          updatedAt: artifact.updatedAt ?? new Date().toISOString(),
        }
        const mergedArtifacts = artifacts.some((item) => item.type === updatedArtifact.type)
          ? artifacts.map((item) => (item.type === updatedArtifact.type ? updatedArtifact : item))
          : [...artifacts, updatedArtifact]
        setArtifacts(mergedArtifacts)
      }
      state = markGenerationStageComplete(state, 'backlog')
      updateGenerationState(state)
      setProjectStatus('READY')
    } catch (error) {
      const message = error instanceof Error ? error.message : t('backlogGenerationFailed')
      state = markGenerationStageFailed(state, 'backlog', message)
      updateGenerationState(state)
      setProjectStatus('GENERATION_FAILED')
      setGenMessage({ type: 'error', text: message })
    } finally {
      setIsGenerating(false)
      setGenerationOperation(null)
    }
  }

  const runGeneration = async (operation: 'initial' | 'retry', contextIsReady = contextReady) => {
    if (!contextIsReady || isGenerating) return

    setIsGenerating(true)
    setGenerationOperation(operation)
    setProjectStatus('GENERATING')
    setGenMessage(null)

    let state = operation === 'retry'
      ? resetGenerationForRetry(generationState)
      : createQueuedGenerationState()
    setGenerationState(state)
    let latestArtifacts = artifacts

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
          if (stage === 'documents' || stage === 'agentRules' || stage === 'backlog') {
            const result = await generationStageRequest(stage, operation === 'retry') as {
              artifacts?: Array<{ id: string; type: string; path: string; status: string; content?: string; updatedAt?: string; version?: number }>
              artifact?: { id: string; type: string; path: string; status: string; content?: string; updatedAt?: string }
              systemGraph?: SystemGraphData | null
              phases?: typeof initialData.phases
            }
            if (stage === 'documents' && result.systemGraph !== undefined) {
              setSystemGraph(result.systemGraph)
            }
            if (stage === 'backlog' && result.phases) {
              setPhases(result.phases)
              setBacklogRevision((revision) => revision + 1)
            }
            const incoming = result.artifacts ?? (result.artifact ? [result.artifact] : [])
            const updated = new Map(incoming.map((artifact) => [artifact.type, artifact]))
            latestArtifacts = [
              ...latestArtifacts.filter((artifact) => !updated.has(artifact.type)),
              ...[...updated.values()].map((artifact) => ({
                id: artifact.id || artifact.type,
                type: artifact.type,
                path: artifact.path,
                status: artifact.status,
                content: artifact.content ?? '',
                updatedAt: artifact.updatedAt ?? new Date().toISOString(),
              })),
            ]
            setArtifacts(latestArtifacts)
          } else {
            await generationStageRequest(stage)
          }
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
      setProjectStatus('EXPORTABLE')
      setGenerationState((current) => ({ ...current, activeStage: null, isRunning: false }))
      setIsGenerationFinished(true)
      setAutoRedirectSeconds(4)
      router.refresh()
    } finally {
      setIsGenerating(false)
      setGenerationOperation(null)
    }
  }

  useEffect(() => {
    runGenerationRef.current = runGeneration
  })

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

  const handleRegenerateIncompleteDocuments = async () => {
    if (!contextReady || isGenerating || retryableDocumentCount === 0) return

    setIsGenerating(true)
    setGenerationOperation('retry')
    setProjectStatus('GENERATING')
    setGenMessage(null)

    try {
      const result = await requestProjectStage<{
        artifacts?: Array<{ id: string; type: string; path: string; status: string; content?: string; updatedAt?: string; error?: string }>
        readiness?: { isReady: boolean }
        systemGraph?: SystemGraphData | null
      }>(
        'generate',
        {
          method: 'POST',
          body: JSON.stringify({ regenerateFailed: true }),
          headers: { 'Content-Type': 'application/json' },
        },
        t('documentGenerationFailed'),
      )
      const failedArtifact = result.artifacts?.find((artifact) => artifact.status === 'FAILED')
      if (failedArtifact) throw new Error(failedArtifact.error ?? t('documentGenerationFailed'))

      const incoming = result.artifacts ?? []
      const updated = new Map(incoming.map((artifact) => [artifact.type, artifact]))
      const nextArtifacts = [
        ...artifacts.filter((artifact) => !updated.has(artifact.type)),
        ...[...updated.values()].map((artifact) => ({
          id: artifact.id || artifact.type,
          type: artifact.type,
          path: artifact.path,
          status: artifact.status,
          content: artifact.content ?? '',
          updatedAt: artifact.updatedAt ?? new Date().toISOString(),
        })),
      ]
      setArtifacts(nextArtifacts)
      if (result.systemGraph !== undefined) setSystemGraph(result.systemGraph)

      let reconciled = generationState
      for (const artifact of incoming) {
        reconciled = reconcileGenerationStateAfterArtifactUpdate({
          state: reconciled,
          artifacts: nextArtifacts,
          updatedType: artifact.type,
          projectStatus: result.readiness?.isReady ? 'READY' : 'GENERATION_FAILED',
          requiredArtifactTypes: initialData.requiredArtifactTypes,
          hasSkills: initialData.skills.length > 0,
          hasBacklog: phases.length > 0,
        })
      }
      setGenerationState(reconciled)
      setProjectStatus(result.readiness?.isReady ? 'EXPORTABLE' : 'GENERATION_FAILED')
      setGenMessage({ type: 'status', text: t('generationComplete') })
      router.refresh()
    } catch (error) {
      setProjectStatus('GENERATION_FAILED')
      setGenMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('generationRetryFailed'),
      })
    } finally {
      setIsGenerating(false)
      setGenerationOperation(null)
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

  const showGenerationStatus =
    isGenerating ||
    generationState.stages.documents.status === 'failed' ||
    generationState.stages.agentRules.status === 'failed' ||
    generationState.stages.skills.status === 'failed' ||
    generationState.stages.backlog.status === 'failed' ||
    generationState.stages.validation.status === 'failed'

  const generationProgress = (
    <section
      aria-labelledby="generation-progress-title"
      className="mt-5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-4"
      aria-busy={isGenerating}
    >
      <div className="flex items-start justify-between gap-3 border-b border-black/[0.08] pb-3">
        <div>
          <h2 id="generation-progress-title" className="font-sans text-xs font-semibold">
            {t('stateBProgressTitle')}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--workspace-muted)]">
            {t('generationProgressDesc')}
          </p>
        </div>
        <span className="font-sans text-xs font-medium text-[var(--workspace-muted)]">
          {generationOperation ? t(generationOperation === 'retry' ? 'generationRetrying' : 'generationRunning') : t('generationIdle')}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 font-sans text-xs font-medium">
        <span>{generationPercentage}%</span>
        <span>{t('generationProgressStep', { current: generationStep, total: GENERATION_STAGES.length })}</span>
      </div>
      <div
        className="mt-2 h-2 rounded-full border border-[var(--workspace-border)] bg-black/[0.04] overflow-hidden"
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
              <span className="font-sans text-xs font-semibold">{generationStatusLabel(stage.status)}</span>
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

  const generateButton = contextReady ? (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleGenerateAll}
        disabled={isGenerating}
        className={`inline-flex items-center justify-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-primary)] px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-none hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
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
          className={`inline-flex items-center justify-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-sun)] px-4 py-2.5 font-sans text-sm font-semibold text-[var(--workspace-ink)] shadow-none hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
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
      <div className="min-h-screen items-start gap-6 p-4 sm:p-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden self-start lg:flex lg:flex-col">
          <div className="w-full rounded-[24px] border border-white/80 bg-[var(--workspace-paper)]/88 px-5 py-6 shadow-[0_12px_30px_rgba(36,35,31,0.08)] backdrop-blur-xl">
            <div className="flex flex-col">{workspaceNavigation}</div>
          </div>
        </aside>
        <div className="min-w-0">
          <aside className="mb-6 rounded-[20px] border border-white/80 bg-[var(--workspace-paper)]/90 px-4 py-4 shadow-[0_8px_22px_rgba(36,35,31,0.06)] lg:hidden">
            <div className="flex flex-col">{workspaceNavigation}</div>
          </aside>

          <main className="mx-auto w-full max-w-[1500px] px-0 pb-20 pt-2 sm:px-2 lg:px-10 lg:pt-0 xl:px-14">
            {activeTab === 'overview' && (
              <header className="border-b border-[var(--workspace-border)] pb-0">
                <div
                  ref={briefCardRef}
                className={`relative isolate overflow-hidden rounded-[24px] border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-5 shadow-[0_14px_40px_var(--workspace-card-shadow)] transition-[height] duration-300 ease-out sm:p-6 lg:p-8 ${heroContentClass} ${heroMotionPaused ? 'workspace-motion-paused' : ''}`}
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[2.5px] overflow-hidden bg-[var(--workspace-peach)]">
                  <span className="workspace-hero-border absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[var(--workspace-sun)] via-[var(--workspace-primary)] to-[var(--workspace-sun)]" />
                </span>
                <span aria-hidden="true" className="workspace-hero-blob pointer-events-none absolute -right-16 bottom-[-4rem] z-0 size-64 rounded-full bg-[radial-gradient(circle,var(--workspace-peach)_0%,transparent_68%)]" />
                <span aria-hidden="true" className="workspace-hero-blob workspace-hero-blob-delayed pointer-events-none absolute right-20 bottom-[-5rem] z-0 size-56 rounded-full bg-[radial-gradient(circle,var(--workspace-sun)_0%,transparent_70%)]" />
                <span aria-hidden="true" className="workspace-hero-blob workspace-hero-blob-slow pointer-events-none absolute right-[-3rem] top-24 z-0 size-48 rounded-full bg-[radial-gradient(circle,var(--workspace-peach)_0%,transparent_72%)]" />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3 text-xs font-semibold text-[var(--workspace-primary)]">
                      <span className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--workspace-peach)] bg-[var(--workspace-paper)]">
                        <FileText aria-hidden="true" className="size-4" />
                      </span>
                      <span>{t('briefLabel')}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          role="status"
                          aria-live="polite"
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--workspace-ink)] ${classificationStatus === 'FAILED' ? 'border-[var(--workspace-rose)] bg-[var(--workspace-rose-soft)]' : 'border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)]'}`}
                        >
                          <FolderKanban aria-hidden="true" className="size-3.5" />
                          {localizedClassification}
                        </span>
                        {(classificationStatus === 'FAILED' || classificationTimedOut) && (
                          <button
                            type="button"
                            onClick={handleRetryClassification}
                            disabled={isRetryingClassification}
                            className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-3 py-1.5 text-xs font-semibold text-[var(--workspace-ink)] hover:bg-[var(--workspace-yellow-soft)] disabled:cursor-wait disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                          >
                            {isRetryingClassification && <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />}
                            {isRetryingClassification ? t('classificationRetrying') : t('classificationRetry')}
                          </button>
                        )}
                      </div>
                      {classificationRetryError && (
                        <p role="alert" className="basis-full text-xs text-[var(--workspace-rose)]">
                          {classificationRetryError}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--workspace-border)] bg-white/70 px-3 py-1.5 text-xs text-[var(--workspace-muted)]">
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {formattedUpdatedDate}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--workspace-border)] bg-white/70 px-3 py-1.5 text-xs text-[var(--workspace-muted)]">
                        <Languages aria-hidden="true" className="size-3.5" />
                        {localizedLanguage}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <h1 className="max-w-5xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-[var(--workspace-ink)] sm:text-5xl lg:text-[4.5rem]">{initialData.name}</h1>
                  </div>
                  {renderHeroBrief()}
                  {briefActionButton && <div className="relative z-20 mt-auto flex justify-start border-t border-[var(--workspace-border-subtle)] pt-5">{briefActionButton}</div>}
                </div>
              </div>
              </header>
            )}

            {((showGenerationStatus && activeTab === 'documents') || (isGenerating && activeTab === 'export')) && (
              <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(15rem,.8fr)_minmax(0,1.6fr)]">
                <aside className="order-2 rounded-[20px] border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-4 lg:order-1">
                  <h2 className="text-lg font-semibold">{t('stateBSidebarTitle')}</h2>
                  <ul className="mt-3 space-y-2">
                    {sidebarDocuments.map((document) => {
                      const failed = document.status === 'FAILED' || document.status === 'OUTDATED'
                      const done = document.status === 'READY' || document.status === 'MODIFIED'
                      const busy = document.status === 'GENERATING'
                      return <li key={document.id || document.filename} className="flex items-center justify-between gap-2 border-t border-[var(--workspace-border-subtle)] py-2 text-sm"><span className="min-w-0 truncate">{document.filename}</span><span className="inline-flex shrink-0 items-center gap-1 text-xs">{busy ? <Loader2 aria-hidden="true" className="size-3.5 motion-safe:animate-spin" /> : done ? <Check aria-hidden="true" className="size-3.5" /> : failed ? <AlertTriangle aria-hidden="true" className="size-3.5" /> : <Circle aria-hidden="true" className="size-3.5" />}{failed ? t('stateBStatusFailed') : done ? t('stateBStatusReady') : busy ? t('stateBStatusRunning') : t('stateBStatusWaiting')}</span></li>
                    })}
                  </ul>
                </aside>
                <div className="order-1 min-w-0 lg:order-2">
                  {generationProgress}
                  {(generationState.stages.documents.status === 'failed' || generationState.stages.agentRules.status === 'failed' || generationState.stages.skills.status === 'failed' || generationState.stages.backlog.status === 'failed' || generationState.stages.validation.status === 'failed') && (() => {
                    const firstFailedStage = GENERATION_STAGES.find(({ id }) => generationState.stages[id].status === 'failed')?.id
                    const displayStage = (generationState.activeStage && generationState.stages[generationState.activeStage].status === 'failed')
                      ? generationState.activeStage
                      : firstFailedStage
                    return (
                    <section className="mt-4 rounded-[16px] border border-[var(--workspace-rose)] bg-[var(--workspace-rose-soft)] p-4" aria-labelledby="generation-failure-title">
                      <h2 id="generation-failure-title" className="font-semibold">{t('stateB2AlertTitle', { stage: displayStage ? t(getGenerationStageLabelKey(displayStage) as Parameters<typeof t>[0]) : t('generationStageDocuments') })}</h2>
                      <p className="mt-2 text-sm leading-6">{t('stateB2Assurance')}</p>
                      <details ref={failureDetailsRef} className="mt-3 text-sm" onToggle={(event) => setShowErrorDetails(event.currentTarget.open)}>
                        <summary className="w-fit cursor-pointer font-semibold underline underline-offset-4">{showErrorDetails ? t('stateB2HideDetails') : t('stateB2ShowDetails')}</summary>
                        <p className="mt-2 break-words">{genMessage?.type === 'error' ? genMessage.text : t('generationFailed')}</p>
                      </details>
                      <button type="button" onClick={handleRegenerateFailed} disabled={isGenerating} className={`mt-4 inline-flex min-h-11 items-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}><RefreshCw aria-hidden="true" className="size-4" />{t('stateB2RetryAction')}</button>
                    </section>
                    )
                  })()}
                </div>
              </div>
            )}

            {isGenerationFinished && autoRedirectSeconds !== null && !hasDismissedRedirect && (
              <section aria-labelledby="generation-complete-title" className="mb-6 rounded-[20px] border border-[var(--workspace-border)] bg-[var(--workspace-mint-soft)] p-5 sm:p-7">
                <h2 id="generation-complete-title" className="text-2xl font-semibold tracking-[-0.04em]">{t('stateCTitle')}</h2>
                <p className="mt-2 text-sm leading-6">{t('stateCDescription')}</p>
                <p role="status" aria-live="polite" className="mt-3 text-sm font-semibold">{t('stateCCountdown', { seconds: autoRedirectSeconds })}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => { setAutoRedirectSeconds(null); selectTab('export') }} className={`min-h-11 border border-[var(--workspace-ink)] bg-[var(--workspace-ink)] px-4 py-2 text-sm font-semibold text-white ${BUTTON_FOCUS_CLASS}`}>{t('stateCOpenNow')}</button>
                  <button type="button" onClick={() => { setHasDismissedRedirect(true); setAutoRedirectSeconds(null) }} className={`min-h-11 border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-4 py-2 text-sm font-semibold ${BUTTON_FOCUS_CLASS}`}>{t('stateCStayHere')}</button>
                </div>
              </section>
            )}


            {activeTab !== 'overview' && <h1 className="sr-only">{initialData.name}</h1>}

            <section className={activeTab === 'overview' ? 'py-0' : 'py-5 sm:py-6'}><div id={getSectionPanelId(activeTab)} role="tabpanel" tabIndex={0} aria-labelledby={getSectionTabId(activeTab)}>
              <div className="hidden" aria-hidden="true">
                {sectionItems.map((section) => <button key={section.id} id={getSectionTabId(section.id)} role="tab" aria-selected={activeTab === section.id} aria-controls={getSectionPanelId(section.id)} tabIndex={-1} onClick={() => selectTab(section.id)}>{t(getSectionTabKey(section.id) as Parameters<typeof t>[0])}</button>)}
              </div>
              <div className={activeTab === 'overview' ? (briefHasStructuredSections ? 'space-y-4' : 'space-y-0') : 'hidden'}>
                {overviewStructuredContent}
                <section aria-labelledby="overview-status-title" className="border-t border-[var(--workspace-border-subtle)] pt-5">
                  <div className="flex items-end justify-between gap-4 border-b border-[var(--workspace-border-subtle)] pb-3">
                    <h2 id="overview-status-title" className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{t('overviewStatusTitle')}</h2>
                    <span className="font-sans text-xs font-medium text-[var(--workspace-muted)]">{t('liveData')}</span>
                  </div>

                  <div aria-label={t('overviewStatusTitle')} className="mt-3 overflow-x-auto border-y border-[var(--workspace-border-subtle)] px-2 py-4 sm:px-4 sm:py-5">
                    <ol className="grid min-w-[34rem] grid-cols-3">
                      {overviewStatusItems.map((item, index) => {
                        const Icon = item.tone === 'ready' ? Check : item.tone === 'attention' ? AlertTriangle : CircleDashed
                        const isLast = index === overviewStatusItems.length - 1
                        const nodeClass = item.tone === 'ready'
                          ? 'border-[var(--workspace-ink)] bg-[var(--workspace-ink)] text-[var(--workspace-paper)]'
                          : item.tone === 'attention'
                            ? 'border-[var(--workspace-primary)] bg-[var(--workspace-yellow-soft)] text-[var(--workspace-primary)]'
                            : 'border-[var(--workspace-border-muted)] bg-[var(--workspace-canvas)] text-[var(--workspace-faint)]'
                        const lineClass = item.tone === 'ready'
                          ? 'bg-[var(--workspace-ink)]'
                          : 'bg-[var(--workspace-border)]'

                        return (
                          <li key={item.id} className="relative px-2 sm:px-4">
                            {!isLast && <span aria-hidden="true" className={`absolute left-[calc(50%+1.5rem)] right-[calc(-50%+1.5rem)] top-6 h-px ${lineClass}`} />}
                            <button
                              type="button"
                              onClick={() => selectTab(item.id)}
                              aria-current={activeTab === item.id ? 'step' : undefined}
                              className={`relative z-10 flex w-full flex-col items-center rounded-xl px-2 py-1 text-center transition-colors hover:bg-[var(--workspace-blue-soft)] ${BUTTON_FOCUS_CLASS}`}
                            >
                              <span className={`flex size-12 items-center justify-center rounded-full border-2 ${nodeClass}`}>
                                <Icon aria-hidden="true" className="size-5" strokeWidth={item.tone === 'ready' ? 2.5 : 2} />
                              </span>
                              <span className="mt-4 text-sm font-semibold text-[var(--workspace-ink)]">{item.label}</span>
                              <span className="mt-1 max-w-[11rem] text-xs leading-5 text-[var(--workspace-muted)]">{item.value}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                </section>
              </div>

              <div className={activeTab === 'context' ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={contextReady ? t('contextBriefTitle') : t('contextQuestionsTitle')}
                  description={t('tabContext')}
                  divided={false}
                  action={
                    <span className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-4 py-2 text-sm font-semibold text-[var(--workspace-muted)]">
                      {contextReady ? t('contextReadyStatus') : pendingClarifications.length > 0 ? t('contextQuestionsStatus') : t('contextWaitingStatus')}
                    </span>
                  }
                />

                {!contextReady ? (
                  <section className="mx-auto max-w-4xl">
                    {isAnalyzing && projectStatus !== 'CLARIFYING' ? (
                      <div
                        aria-labelledby="auto-analysis-title"
                        aria-busy="true"
                        className={`${PANEL_CLASS} bg-[var(--workspace-paper)] p-5 sm:p-8`}
                      >
                        <h2 id="auto-analysis-title" className="text-2xl font-semibold tracking-[-0.04em]">{t('stateATitle')}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">{t('stateASubtitle')}</p>
                        <div className="mt-5 border-l-2 border-[var(--workspace-border)] pl-4">
                          <h3 className="text-xs font-semibold text-[var(--workspace-muted)]">{t('stateAIdeaCardTitle')}</h3>
                          <p className="mt-1 font-semibold">{initialData.name}</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--workspace-body)]">{briefText}</p>
                        </div>
                        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                          {[t('stateAStep1'), t('stateAStep2'), t('stateAStep3')].map((label, index) => {
                            const done = index === 0 || (index === 1 && projectStatus !== 'DRAFT' && projectStatus !== 'CONFIGURED')
                            const active = !done && index === 2
                            return (
                              <li key={label} className="flex items-center gap-2 text-sm">
                                <span aria-hidden="true" className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-border)]">
                                  {done ? <Check className="size-3.5" /> : active ? <Loader2 className="size-3.5 motion-safe:animate-spin" /> : <Circle className="size-3.5" />}
                                </span>
                                {label}
                              </li>
                            )
                          })}
                        </ol>
                        {discoveryMessage && (
                          <p role={discoveryMessage.type === 'error' ? 'alert' : 'status'} className="mt-4 text-sm text-[var(--workspace-muted)]">
                            {discoveryMessage.text}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className={`${PANEL_CLASS} bg-[var(--workspace-paper)] p-5 sm:p-8`}>
                        <div className="border-b border-[var(--workspace-border-subtle)] pb-7">
                          <p className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-[var(--workspace-muted)]">{t('discoveryInterview')}</p>
                          <h3 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-[var(--workspace-ink)] sm:text-3xl">
                            {pendingClarifications.length > 0 ? t('answerOpenDecisions') : t('contextNotAssembled')}
                          </h3>
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
                            {pendingClarifications.length > 0 ? t('answersBecomeConfirmed') : t('startAnalysisFirst')}
                          </p>
                        </div>

                        {discoveryMessage && (
                          <p
                            role={discoveryMessage.type === 'error' ? 'alert' : 'status'}
                            aria-live={discoveryMessage.type === 'error' ? 'assertive' : 'polite'}
                            className={`mt-6 border-l-2 border-[var(--workspace-primary)] px-4 py-3 text-sm leading-6 ${
                              discoveryMessage.type === 'error'
                                ? 'bg-[var(--workspace-rose-soft)] text-[var(--workspace-ink)]'
                                : 'bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)]'
                            }`}
                          >
                            {discoveryMessage.text}
                          </p>
                        )}

                        {pendingClarifications.length > 0 ? (
                          <form onSubmit={handleSubmitClarifications} className="mt-8 space-y-8">
                            {pendingClarifications.map((question, index) => (
                              <fieldset key={question.id} className="border-b border-[var(--workspace-border-subtle)] pb-8 last:border-b-0 last:pb-0">
                                <legend className="w-full">
                                  <span className="font-sans text-xs font-semibold text-[var(--workspace-muted)]">{t('questionOf', { current: index + 1, total: pendingClarifications.length })}</span>
                                  <span className="mt-3 block text-lg font-semibold leading-7 tracking-[-0.02em]">{question.question}</span>
                                </legend>
                                {question.impact && <p className="mt-3 border-l-2 border-[var(--workspace-primary)] pl-3 text-sm leading-6 text-[var(--workspace-muted)]">{t('impact')}: {question.impact}</p>}
                                <div className="mt-5 space-y-3">
                                  {(Array.isArray(question.options) ? question.options : []).map((opt, i) => (
                                    <label key={i} className={`flex cursor-pointer items-start gap-3 border border-[var(--workspace-border)] p-3 transition-colors hover:bg-[var(--workspace-yellow-soft)] ${BUTTON_FOCUS_CLASS}`}>
                                      <input type="radio" name={`answer-${question.id}`} value={opt} required className="mt-0.5 size-4 accent-[var(--workspace-primary)]" />
                                      <span className="text-sm font-medium text-[var(--workspace-ink)]">{opt}</span>
                                    </label>
                                  ))}
                                  <label className={`flex cursor-pointer items-start gap-3 border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] p-3 transition-colors hover:bg-[var(--workspace-mint-soft)] ${BUTTON_FOCUS_CLASS}`}>
                                    <input type="radio" name={`answer-${question.id}`} value="[AUTO]" required className="mt-0.5 size-4 accent-[var(--workspace-primary)]" />
                                    <span className="text-sm font-medium text-[var(--workspace-ink)]">{t('autoPick')}</span>
                                  </label>
                                  <div className="pt-2">
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                      <input type="radio" name={`answer-${question.id}`} value="" id={`custom-radio-${question.id}`} className="size-4 accent-[var(--workspace-primary)]" required={(Array.isArray(question.options) ? question.options : []).length === 0} />
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
                                      className={`w-full resize-y border border-[var(--workspace-border)] bg-white px-3 py-3 text-sm leading-6 text-[var(--workspace-ink)] placeholder:text-[var(--workspace-faint)] ${BUTTON_FOCUS_CLASS}`}
                                    />
                                  </div>
                                </div>
                              </fieldset>
                            ))}
                            <button type="submit" disabled={isSubmittingAnswers || isAnalyzing} className={`inline-flex items-center justify-center gap-2 bg-[var(--workspace-primary)] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}>
                              {isSubmittingAnswers ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Check aria-hidden="true" className="size-4" />}
                              {isSubmittingAnswers ? t('savingAnswers') : t('submitAnswersContinue')}
                            </button>
                          </form>
                        ) : (
                          <div className="mt-8">{discoveryButton}</div>
                        )}
                      </div>
                    )}
                  </section>
                ) : (
                  <>
                    <section aria-label={t('structuredProjectContext')} className="mx-auto max-w-5xl space-y-8">
                      <div className={`${PANEL_CLASS} overflow-hidden bg-[var(--workspace-paper)]`}>
                        <div className="border-b border-[var(--workspace-border-subtle)] bg-[var(--workspace-yellow-soft)] p-5 sm:p-6">
                          <p className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-[var(--workspace-muted)]">{t('contextInterviewSummary')}</p>
                          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--workspace-ink)] sm:text-3xl">{t('contextSummaryHeading')}</h3>
                        </div>
                        <div className="p-5 sm:p-6">
                          <div className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] p-5 text-left text-sm leading-relaxed text-[var(--workspace-body)] sm:p-6 sm:text-base sm:leading-7">
                            <ContextValue value={projectContext?.summary ?? initialData.description ?? t('noBrief')} locale={locale} {...contextLabels} />
                          </div>
                          <div className="mt-6 flex flex-wrap items-center gap-2.5 font-sans text-xs font-semibold">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2d8d6b]/30 bg-[var(--workspace-mint-soft)] px-3 py-1.5 text-[#1b6a4e]">
                              <span className="size-1.5 rounded-full bg-[#1b6a4e]" />
                              {t('confirmedByOwner')} <strong className="text-[var(--workspace-ink)]">{contextProvenanceCounts.confirmed}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--workspace-sun)]/40 bg-[var(--workspace-yellow-soft)] px-3 py-1.5 text-[var(--workspace-deep)]">
                              <span className="size-1.5 rounded-full bg-[var(--workspace-sun)]" />
                              {t('assumedBySystem')} <strong className="text-[var(--workspace-ink)]">{contextProvenanceCounts.assumed}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-3 py-1.5 text-[var(--workspace-muted)]">
                              <span className="size-1.5 rounded-full border border-[var(--workspace-border)] bg-white" />
                              {t('stillUnknown')} <strong className="text-[var(--workspace-ink)]">{contextProvenanceCounts.unknown}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-[var(--workspace-muted)]">{t('contextMapLabel')}</p>
                            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--workspace-ink)] sm:text-2xl">{t('contextCategoriesHeading')}</h3>
                          </div>
                          <span className="hidden font-sans text-xs font-semibold text-[var(--workspace-muted)] sm:block">{t('contextCategoryCount', { count: contextCategories.length })}</span>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                          {contextCategories.map((category) => {
                            return (
                              <article key={category.id} className={`${PANEL_CLASS} flex flex-col justify-between bg-[var(--workspace-paper)] p-5 transition-colors hover:border-[var(--workspace-primary)]`}>
                                <button
                                  type="button"
                                  aria-label={`${t(category.labelKey)} — ${t('contextOpenCategory')}`}
                                  onClick={() => setOpenContextCategory(category.id)}
                                  className={`flex w-full items-start justify-between gap-4 text-left ${BUTTON_FOCUS_CLASS}`}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-lg font-semibold tracking-tight text-[var(--workspace-ink)] sm:text-xl">{t(category.labelKey)}</span>
                                    <span className="mt-2 block text-left text-sm leading-relaxed text-[var(--workspace-muted)]">{t(category.descriptionKey)}</span>
                                  </span>
                                  <ChevronRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-[var(--workspace-primary)]" />
                                </button>
                                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--workspace-border-subtle)] pt-3.5 font-sans text-xs font-semibold text-[var(--workspace-muted)]">
                                  <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[var(--workspace-primary)]" />{category.counts.confirmed} {t('confirmedShort')}</span>
                                  <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[var(--workspace-sun)]" />{category.counts.assumed} {t('assumedShort')}</span>
                                  <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full border border-[var(--workspace-border)] bg-white" />{category.counts.unknown} {t('unknownShort')}</span>
                                </div>
                              </article>
                            )
                          })}
                        </div>

                        <div className="mt-6 border-l-2 border-[var(--workspace-primary)] bg-[var(--workspace-yellow-soft)] px-4 py-3 font-sans text-sm leading-6 text-[var(--workspace-ink)]">
                          {t('contextOpenQuestionsNotice', { count: contextProvenanceCounts.unknown })}
                        </div>
                      </div>
                    </section>

                    <Modal
                    open={Boolean(selectedContextCategory)}
                    onClose={() => setOpenContextCategory(null)}
                    title={selectedContextCategory ? t(selectedContextCategory.labelKey) : ''}
                    description={selectedContextCategory ? t(selectedContextCategory.descriptionKey) : undefined}
                    closeLabel={t('closeDialog')}
                    className="max-w-3xl border-[var(--workspace-border)] bg-[var(--workspace-paper)] shadow-[0_24px_70px_rgba(36,35,31,0.18)]"
                  >
                    {selectedContextCategory && (
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2 border-b border-[var(--workspace-border-subtle)] pb-4 font-sans text-xs font-semibold text-[var(--workspace-muted)]">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2d8d6b]/30 bg-[var(--workspace-mint-soft)] px-2.5 py-1 text-[#1b6a4e]"><span className="size-1.5 rounded-full bg-[#1b6a4e]" />{selectedContextCategory.counts.confirmed} {t('confirmedShort')}</span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--workspace-sun)]/40 bg-[var(--workspace-yellow-soft)] px-2.5 py-1 text-[var(--workspace-deep)]"><span className="size-1.5 rounded-full bg-[var(--workspace-sun)]" />{selectedContextCategory.counts.assumed} {t('assumedShort')}</span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-2.5 py-1 text-[var(--workspace-muted)]"><span className="size-1.5 rounded-full border border-[var(--workspace-border)] bg-white" />{selectedContextCategory.counts.unknown} {t('unknownShort')}</span>
                        </div>
                        <div className="space-y-5">
                          {selectedContextCategory.categoryKeys.map((key) => (
                            <section key={key} className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-4 sm:p-5">
                              <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--workspace-ink)]">{formatLabel(key)}</h3>
                              <div className="mt-3 text-left text-sm leading-relaxed text-[var(--workspace-body)] sm:text-base sm:leading-7">
                                {SENSITIVE_CONTEXT_KEY.test(key) || isSensitiveContextValue(projectContext?.[key]) ? <SensitiveContextValue label={contextLabels.sensitiveLabel} /> : <ContextValue value={projectContext?.[key]} locale={locale} {...contextLabels} />}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    )}
                    </Modal>
                  </>
                )}
              </div>

              <div className={activeTab === 'design-system' ? 'space-y-8' : 'hidden'}>
                {systemGraph ? (
                  <DesignSystemGraph graph={systemGraph} />
                ) : (
                  <EmptyState
                    icon={Network}
                    title={t('noGraphData')}
                    description={
                      initialData.artifacts.some((artifact) => artifact.type === 'ARCHITECTURE' && ['READY', 'MODIFIED'].includes(artifact.status))
                        ? t('noGraphDataReadyArchitectureDesc')
                        : t('noGraphDataDesc')
                    }
                    action={
                      <div className="space-y-3">
                        {systemGraphError && <p className="text-sm font-medium text-red-700">{systemGraphError}</p>}
                        {initialData.artifacts.some((artifact) => artifact.type === 'ARCHITECTURE' && ['READY', 'MODIFIED'].includes(artifact.status)) && (
                          <button
                            type="button"
                            onClick={() => void handleRepairSystemGraph()}
                            disabled={isRepairingSystemGraph || isGenerating}
                            className={`inline-flex min-h-11 items-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                          >
                            {isRepairingSystemGraph ? <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
                            {isRepairingSystemGraph ? tCommon('loading') : t('buildSystemMap')}
                          </button>
                        )}
                      </div>
                    }
                  />
                )}
              </div>

              {!isGenerating && (
                <div className={activeTab === 'documents' ? 'space-y-8' : 'hidden'}>
                  <SectionHeading
                    title={t('generatedDocuments')}
                    description={t('generatedDocumentsDesc')}
                    divided={false}
                  />

                {artifacts.length > 0 && (
                  <div
                    className="flex flex-col gap-4 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] px-5 py-4 text-[var(--workspace-ink)] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    role="region"
                    aria-label={t('regenerateAllBannerLabel')}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                        {Array.from({ length: Math.min(5, Math.max(1, artifacts.length)) }).map((_, index) => (
                          <span
                            key={index}
                            className={`size-2.5 rounded-full ${index < readyArtifacts.length ? 'bg-[var(--pass-teal)]' : 'bg-[var(--workspace-muted)]/40'}`}
                          />
                        ))}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5 text-[var(--workspace-ink)] sm:text-base">
                          {t('documentsReadySummary', { count: readyArtifacts.length })}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-[var(--workspace-muted)]">
                          {t('attentionCount', { count: attentionArtifacts.length })} · {t('regenerateAllHint')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {retryableDocumentCount > 0 && (
                        <button
                          type="button"
                          onClick={() => void handleRegenerateIncompleteDocuments()}
                          disabled={isGenerating}
                          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-sun)] px-4 py-2.5 font-sans text-sm font-semibold text-[var(--workspace-ink)] shadow-none transition-colors hover:bg-[var(--workspace-yellow-soft)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                          aria-busy={isGenerating}
                        >
                          {isGenerating ? <Loader2 className="motion-safe:animate-spin size-4" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
                          {isGenerating ? tCommon('loading') : t('retryIncompleteDocuments', { count: retryableDocumentCount })}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleGenerateAll()}
                        disabled={isGenerating}
                        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--workspace-primary)]/20 bg-[var(--workspace-primary)] px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-none transition-colors hover:bg-[var(--workspace-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                        aria-busy={isGenerating}
                      >
                        {isGenerating ? <Loader2 className="motion-safe:animate-spin size-4" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
                        {isGenerating ? tCommon('loading') : t('markdownRegenerateAll')}
                      </button>
                    </div>
                  </div>
                )}

                {artifacts.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={t('noDocumentationGenerated')}
                    description={t('noDocumentationGeneratedDesc')}
                    action={generateButton}
                  />
                ) : (
                  <MarkdownWorkspace
                    projectId={initialData.id}
                    artifacts={artifacts}
                    isGeneratingAll={isGenerating}
                    onArtifactUpdated={handleArtifactUpdated}
                  />
                )}
                </div>
              )}

              <div className={activeTab === 'backlog' ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={t('implementationBacklog')}
                  description={t('implementationBacklogDesc')}
                  divided={false}
                  action={
                    allTasks.length > 0 ? (
                      <div
                        className={`${PANEL_SOFT_CLASS} flex flex-wrap items-center gap-4 px-3 py-2 font-sans text-xs font-semibold text-[var(--workspace-ink)]`}
                      >
                        <span>{t('readyCountShort', { count: readyTasks.length })}</span>
                        <span>{t('doneCount', { count: doneTasks.length })}</span>
                        <span>{t('blockedCount', { count: blockedTasks.length })}</span>
                        <span>{t('totalCount', { count: allTasks.length })}</span>
                      </div>
                    ) : undefined
                  }
                />

                {phases.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title={t('noImplementationBacklog')}
                    description={t('noImplementationBacklogDesc')}
                    action={generateButton}
                  />
                ) : allTasks.length === 0 ? (
                  <EmptyState
                    icon={AlertTriangle}
                    title={t('backlogTasksUnavailable')}
                    description={t('backlogTasksUnavailableDesc')}
                    action={
                      <button
                        type="button"
                        onClick={() => void handleRegenerateBacklog()}
                        disabled={isGenerating}
                        className={`inline-flex min-h-11 items-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-primary)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                      >
                        <RefreshCw aria-hidden="true" className="size-4" />
                        {t('backlogRegenerateAction')}
                      </button>
                    }
                  />
                ) : (
                  <BacklogKanbanBoard
                    key={backlogRevision}
                    projectId={initialData.id}
                    phases={phases}
                  />
                )}
              </div>

              <div className={activeTab === 'export' && !isGenerating ? 'space-y-8' : 'hidden'}>
                <SectionHeading
                  title={t('exportAgentPrompt')}
                  description={t('exportAgentPromptDesc')}
                  divided={false}
                  action={
                    <span
                      className={`inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold sm:self-auto ${
                        canExport
                          ? 'border-[#2d8d6b]/35 bg-[var(--workspace-mint-soft)] text-[#1b6a4e]'
                          : 'border-[var(--workspace-border)] bg-[var(--workspace-paper)] text-[var(--workspace-muted)]'
                      }`}
                    >
                      {canExport && <Check aria-hidden="true" className="size-4" />}
                      {canExport
                        ? t('readyToDownloadFiles', { count: exportFileCount })
                        : t('notReady')}
                    </span>
                  }
                />
                {genMessage?.type === 'error' && (
                  <p role="alert" className="-mt-4 text-sm font-medium text-[var(--workspace-rose)]">
                    {genMessage.text}
                  </p>
                )}

                {!canExport ? (
                  <EmptyState
                    icon={Package}
                    title={t('archiveNoEligibleDocuments')}
                    description={t('archiveNoEligibleDocumentsDesc')}
                    action={generateButton}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="grid items-stretch gap-6 lg:grid-cols-2">
                      <section aria-labelledby="pack-export-title" className={`${PANEL_CLASS} flex h-full flex-col overflow-hidden`}>
                        <div className="border-b border-[var(--workspace-border-subtle)] bg-[var(--workspace-yellow-soft)] p-5 sm:p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--workspace-border)] bg-[var(--workspace-paper)] text-[var(--workspace-deep)]">
                                <Package aria-hidden="true" className="size-5" />
                              </span>
                              <div>
                                <h3 id="pack-export-title" className="text-xl font-semibold tracking-tight text-[var(--workspace-ink)]">
                                  {t('bootstrapPack')}
                                </h3>
                                <p className="mt-0.5 font-sans text-xs text-[var(--workspace-muted)]">
                                  {t('preparedForUniversal')}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleDownloadZip}
                              disabled={isExporting}
                              aria-busy={isExporting}
                              aria-label={isExporting ? t('validatingPack') : isDownloadComplete ? t('downloaded') : t('downloadZipPack')}
                              className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-ink)] px-4 py-2.5 text-sm font-semibold text-white shadow-none transition-colors hover:bg-black disabled:pointer-events-none disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                            >
                              {isExporting ? (
                                <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                              ) : isDownloadComplete ? (
                                <Check aria-hidden="true" className="size-4 text-emerald-400" />
                              ) : (
                                <Download aria-hidden="true" className="size-4" />
                              )}
                              <span>
                                {isExporting
                                  ? t('validatingPack')
                                  : isDownloadComplete
                                    ? t('downloaded')
                                    : t('downloadZipPack')}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col bg-[var(--workspace-paper)]">
                          <div className="flex-1 p-5 sm:p-6">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <h4 className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-[var(--workspace-muted)]">
                                {t('archiveContents')}
                              </h4>
                              <span className="font-sans text-xs font-semibold text-[var(--workspace-muted)]">
                                {t('filesCount', { count: exportFileCount })}
                              </span>
                            </div>
                            <ul className="divide-y divide-[var(--workspace-border-subtle)] border-y border-[var(--workspace-border-subtle)]">
                              {exportManifestArtifacts.map((artifact) => (
                                <li key={artifact.id || artifact.type} className="flex items-start gap-3 py-3">
                                  <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--workspace-ink)]" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-mono text-sm font-bold text-[var(--workspace-ink)]">
                                      {artifact.path}
                                    </p>
                                    <p className="mt-0.5 font-sans text-xs text-[var(--workspace-muted)]">
                                      {t(getExportArtifactDescriptionKey(artifact.type))}
                                    </p>
                                  </div>
                                </li>
                              ))}
                              {!includesReadme && (
                                <li className="flex items-start gap-3 py-3">
                                  <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--workspace-ink)]" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate font-mono text-sm font-bold text-[var(--workspace-ink)]">
                                        README.md
                                      </span>
                                      <span className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--workspace-ink)]">
                                        {t('addedDuringExport')}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 font-sans text-xs text-[var(--workspace-muted)]">
                                      {t('fileDescReadme')}
                                    </p>
                                  </div>
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="mt-auto border-t border-[var(--workspace-border-subtle)] bg-[var(--workspace-paper)] p-5 sm:p-6">
                            <div className="space-y-2.5 font-sans text-xs text-[var(--workspace-muted)]">
                              <div className="flex items-start gap-2.5">
                                <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                <span>{t('assuranceSecrets')}</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                <span>{t('assuranceScanned')}</span>
                              </div>
                              <div className="flex items-start gap-2.5">
                                <FileCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                <span>{t('assuranceFilenames')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section aria-labelledby="kickoff-prompt-title" className={`${PANEL_CLASS} flex h-full flex-col overflow-hidden bg-[var(--workspace-paper)]`}>
                        <div className="border-b border-[var(--workspace-border-subtle)] bg-[var(--workspace-blue-soft)] p-5 sm:p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--workspace-border)] bg-[var(--workspace-paper)] text-[var(--workspace-deep)]">
                                <Terminal aria-hidden="true" className="size-5" />
                              </span>
                              <div>
                                <h3 id="kickoff-prompt-title" className="text-xl font-semibold tracking-tight text-[var(--workspace-ink)]">
                                  {t('oneShotAgentPrompt')}
                                </h3>
                                <p className="mt-0.5 font-sans text-xs text-[var(--workspace-muted)]">
                                  {t('oneShotAgentPromptDesc')}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyOneShotPrompt}
                              aria-label={copiedPrompt ? t('copied') : t('copyPrompt')}
                              className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-4 py-2.5 text-sm font-semibold text-[var(--workspace-ink)] shadow-none transition-colors hover:bg-[var(--workspace-blue-soft)] ${BUTTON_FOCUS_CLASS}`}
                            >
                              {copiedPrompt ? (
                                <>
                                  <Check aria-hidden="true" className="size-4 text-emerald-600" />
                                  <span>{t('copied')}</span>
                                </>
                              ) : (
                                <>
                                  <Copy aria-hidden="true" className="size-4 text-[var(--workspace-ink)]" />
                                  <span>{t('copyPrompt')}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                          <p className="mb-2 font-sans text-xs text-[var(--workspace-muted)]">
                            {t('promptPreviewCaption')}
                          </p>
                          <div
                            role="region"
                            aria-label={t('promptPreviewRegionLabel')}
                            tabIndex={0}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border border-black/20 bg-[#18181b] p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--workspace-primary)]"
                            style={{ maxHeight: '440px', minHeight: '340px' }}
                          >
                            {renderPromptPreviewContent(generateOneShotKickoffPrompt())}
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="rounded-[20px] border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-5 sm:p-6 shadow-[0_8px_22px_rgba(36,35,31,0.06)]">
                      <h4 className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[var(--workspace-muted)]">
                        {t('howToUse')}
                      </h4>
                      <ol className="grid gap-4 sm:grid-cols-3">
                        <li className="flex items-start gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] font-sans text-xs font-bold text-[var(--workspace-ink)]">
                            1
                          </span>
                          <p className="font-sans text-sm font-semibold text-[var(--workspace-ink)]">
                            {t('exportStepDownload')}
                          </p>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] font-sans text-xs font-bold text-[var(--workspace-ink)]">
                            2
                          </span>
                          <p className="font-sans text-sm font-semibold text-[var(--workspace-ink)]">
                            {t('exportStepExtract')}
                          </p>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] font-sans text-xs font-bold text-[var(--workspace-ink)]">
                            3
                          </span>
                          <p className="font-sans text-sm font-semibold text-[var(--workspace-ink)]">
                            {t('exportStepPaste')}
                          </p>
                        </li>
                      </ol>
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
