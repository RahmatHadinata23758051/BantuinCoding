'use client'

import Link from 'next/link'
import {
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Braces,
  Check,
  CheckCircle2,
  Circle,
  CircleDashed,
  ClipboardCheck,
  Download,
  FileText,
  Files,
  FolderKanban,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquareText,
  Package,
  Play,
  RefreshCw,
  ScanText,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { MarkdownWorkspace, type WorkspaceArtifactItem } from '@/app/components/MarkdownWorkspace'

export interface ProjectWorkspaceProps {
  initialData: {
    id: string
    name: string
    description: string | null
    classification: string
    targetAgent: string
    status: string
    createdAt: string
    updatedAt: string
    context: Record<string, unknown> | null
    contextVersion: number
    clarifications: {
      id: string
      round: number
      question: string
      impact: string | null
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

type WorkspaceSection = 'overview' | 'context' | 'documents' | 'skills' | 'backlog' | 'export'

type ReadinessTone = 'ready' | 'attention' | 'idle'

const SECTION_ITEMS: {
  id: WorkspaceSection
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Readiness and next action',
    icon: ClipboardCheck,
  },
  {
    id: 'context',
    label: 'Context',
    description: 'Canonical decisions',
    icon: Braces,
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Edit generated guidance',
    icon: Files,
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'Agent capabilities',
    icon: Wrench,
  },
  {
    id: 'backlog',
    label: 'Backlog',
    description: 'Dependency-aware work',
    icon: ListChecks,
  },
  {
    id: 'export',
    label: 'Export',
    description: 'Inspect and download',
    icon: Package,
  },
]

const PIPELINE_STAGES: {
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    label: 'Idea',
    description: 'Intent and scope captured',
    icon: Lightbulb,
  },
  {
    label: 'Clarify',
    description: 'Unknowns resolved',
    icon: MessageSquareText,
  },
  {
    label: 'Context',
    description: 'Decisions normalized',
    icon: Braces,
  },
  {
    label: 'Generate',
    description: 'Pack assembled',
    icon: Play,
  },
  {
    label: 'Review',
    description: 'Documents checked',
    icon: ScanText,
  },
  {
    label: 'Export',
    description: 'Archive prepared',
    icon: Download,
  },
]

const WORKSPACE_STYLE = {
  '--workspace-paper': 'var(--paper-raised)',
  '--workspace-ink': 'var(--ink)',
  '--workspace-canvas': 'var(--paper)',
  '--workspace-panel': 'var(--paper-raised)',
  '--workspace-muted': 'var(--paper-muted)',
  '--workspace-faint': 'var(--paper-faint)',
  '--workspace-primary': 'var(--cobalt)',
  '--workspace-sun': 'var(--electric-yellow)',
  '--workspace-mint': 'var(--mint)',
  '--workspace-rose': 'var(--action-red)',
  '--workspace-blue-soft': 'var(--cobalt-dim)',
  '--workspace-yellow-soft': 'var(--electric-yellow-dim)',
  '--workspace-mint-soft': 'var(--mint-dim)',
  '--workspace-rose-soft': 'var(--action-red-dim)',
} as CSSProperties

const PANEL_CLASS =
  'border-2 border-[var(--workspace-ink)] bg-[var(--workspace-panel)] shadow-[6px_6px_0_var(--workspace-ink)]'
const PANEL_SOFT_CLASS =
  'border-2 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] shadow-[4px_4px_0_var(--workspace-ink)]'
const BUTTON_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--workspace-sun)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--workspace-paper)]'

const SENSITIVE_CONTEXT_KEY =
  /(api.?key|access.?token|authorization|credential|password|private.?key|secret)/i

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

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Unknown'

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}

function getPipelineStageIndex(status: string) {
  switch (status) {
    case 'ANALYZING':
    case 'CLARIFYING':
      return 1
    case 'CONTEXT_READY':
      return 2
    case 'GENERATING':
    case 'GENERATION_FAILED':
      return 3
    case 'READY':
      return 4
    case 'EXPORTABLE':
      return 5
    case 'DRAFT':
    case 'CONFIGURED':
    default:
      return 0
  }
}

function statusTone(status: string) {
  switch (status) {
    case 'READY':
    case 'DONE':
    case 'EXPORTABLE':
      return 'border-[var(--workspace-ink)] bg-[var(--workspace-mint-soft)] text-[var(--workspace-ink)]'
    case 'MODIFIED':
    case 'IN_PROGRESS':
    case 'GENERATING':
      return 'border-[var(--workspace-ink)] bg-[var(--workspace-blue-soft)] text-[var(--workspace-ink)]'
    case 'OUTDATED':
    case 'BLOCKED':
    case 'REVIEW':
      return 'border-[var(--workspace-ink)] bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)]'
    case 'FAILED':
    case 'GENERATION_FAILED':
      return 'border-[var(--workspace-ink)] bg-[var(--workspace-rose-soft)] text-[var(--workspace-ink)]'
    default:
      return 'border-[var(--workspace-ink)] bg-[var(--workspace-paper)] text-[var(--workspace-ink)]'
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
    <div className="flex flex-col gap-4 border-b-4 border-[var(--workspace-ink)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="max-w-3xl text-3xl font-black tracking-[-0.04em] text-[var(--workspace-ink)] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--workspace-muted)]">
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
    <div className="flex min-h-72 items-center py-12">
      <div className={`${PANEL_CLASS} relative max-w-xl p-7`}>
        <span
          aria-hidden="true"
          className="absolute -right-4 -top-4 hidden border-2 border-[var(--workspace-ink)] bg-[var(--workspace-sun)] px-3 py-1 font-mono text-xs font-bold shadow-[3px_3px_0_var(--workspace-ink)] sm:block"
        >
          note
        </span>
        <div className="mb-5 flex size-11 items-center justify-center border-2 border-[var(--workspace-ink)] bg-[var(--workspace-yellow-soft)] shadow-[3px_3px_0_var(--workspace-ink)]">
          <Icon aria-hidden="true" className="size-5 text-[var(--workspace-ink)]" />
        </div>
        <h3 className="text-xl font-black tracking-[-0.03em] text-[var(--workspace-ink)]">
          {title}
        </h3>
        <p className="mt-3 text-sm font-medium leading-6 text-[var(--workspace-muted)]">
          {description}
        </p>
        {action && <div className="mt-6">{action}</div>}
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
    <li className="grid gap-3 border-t-2 border-[var(--workspace-ink)] py-4 first:border-t-0 sm:grid-cols-[minmax(10rem,0.75fr)_minmax(9rem,0.6fr)_1fr] sm:items-center">
      <div className="flex items-center gap-3 text-sm font-black text-[var(--workspace-ink)]">
        <span
          className={`flex size-7 shrink-0 items-center justify-center border-2 border-[var(--workspace-ink)] shadow-[2px_2px_0_var(--workspace-ink)] ${
            tone === 'ready'
              ? 'bg-[var(--workspace-mint-soft)]'
              : tone === 'attention'
                ? 'bg-[var(--workspace-yellow-soft)]'
                : 'bg-[var(--workspace-paper)]'
          }`}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        {label}
      </div>
      <span className="font-mono text-sm font-bold text-[var(--workspace-ink)]">{value}</span>
      <span className="text-sm font-medium leading-5 text-[var(--workspace-muted)]">{detail}</span>
    </li>
  )
}

function ContextValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) {
    return <span className="text-[var(--workspace-faint)]">Not specified</span>
  }

  if (typeof value === 'boolean') {
    return (
      <span className="inline-flex items-center gap-2">
        {value ? (
          <Check aria-hidden="true" className="size-4 text-[var(--workspace-ink)]" />
        ) : (
          <Circle aria-hidden="true" className="size-4 text-[var(--workspace-faint)]" />
        )}
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  if (typeof value === 'string') {
    const isProvenance = ['confirmed', 'assumed', 'unknown'].includes(value.toLowerCase())

    if (isProvenance) {
      return (
        <span
          className={`inline-flex border-2 px-2 py-0.5 font-mono text-xs font-bold ${
            value.toLowerCase() === 'confirmed'
              ? 'border-[var(--workspace-ink)] bg-[var(--workspace-mint-soft)] text-[var(--workspace-ink)]'
              : value.toLowerCase() === 'assumed'
                ? 'border-[var(--workspace-ink)] bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)]'
                : 'border-[var(--workspace-ink)] bg-[var(--workspace-paper)] text-[var(--workspace-ink)]'
          }`}
        >
          {formatLabel(value)}
        </span>
      )
    }

    return <span className="whitespace-pre-wrap break-words">{value}</span>
  }

  if (typeof value === 'number') {
    return <span>{value.toLocaleString('en')}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[var(--workspace-faint)]">None recorded</span>
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
              <ContextValue value={item} depth={depth + 1} />
            </li>
          ))}
        </ul>
      )
    }

    return (
      <ol className="space-y-3">
        {value.map((item, index) => (
          <li key={index} className="border-l-4 border-[var(--workspace-ink)] pl-4">
            <span className="mb-2 block font-mono text-xs font-bold text-[var(--workspace-faint)]">
              Entry {index + 1}
            </span>
            <ContextValue value={item} depth={depth + 1} />
          </li>
        ))}
      </ol>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)

    if (entries.length === 0) {
      return <span className="text-[var(--workspace-faint)]">No fields recorded</span>
    }

    return (
      <dl className={depth > 1 ? 'space-y-3' : 'divide-y-2 divide-[var(--workspace-ink)]'}>
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
              {SENSITIVE_CONTEXT_KEY.test(key) ? (
                <span className="inline-flex items-center gap-2 text-[var(--workspace-muted)]">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  Sensitive value hidden
                </span>
              ) : (
                <ContextValue value={nestedValue} depth={depth + 1} />
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
  const [activeTab, setActiveTab] = useState<WorkspaceSection>('overview')
  const [artifacts, setArtifacts] = useState<WorkspaceArtifactItem[]>(initialData.artifacts)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false)
  const [genMessage, setGenMessage] = useState<{
    type: 'status' | 'error'
    text: string
  } | null>(null)
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
    (artifact) => artifact.status === 'FAILED' || artifact.status === 'OUTDATED',
  )
  const allTasks = initialData.phases.flatMap((phase) => phase.tasks)
  const readyTasks = allTasks.filter((task) => task.status === 'READY')
  const doneTasks = allTasks.filter((task) => task.status === 'DONE')
  const blockedTasks = allTasks.filter((task) => task.status === 'BLOCKED')
  const pendingClarifications = clarifications.filter((question) => question.status === 'PENDING')
  const answeredClarifications = clarifications.filter((question) => question.status === 'ANSWERED')
  const contextReady = hasContextData(initialData.context)
  const canExport = readyArtifacts.length > 0
  const activePipelineIndex = getPipelineStageIndex(projectStatus)
  const taskKeyById = new Map(allTasks.map((task) => [task.id, task.taskKey] as const))
  const includesReadme = readyArtifacts.some((artifact) => artifact.path === 'README.md')

  const handleArtifactUpdated = (updated: WorkspaceArtifactItem) => {
    setArtifacts((previous) =>
      previous.map((artifact) => (artifact.type === updated.type ? updated : artifact)),
    )
  }

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
    setActiveTab(nextSection)
    sectionTabRefs.current.get(nextSection)?.focus()
  }

  const requestProjectStage = async <T,>(
    path: string,
    options: RequestInit,
    fallbackError: string,
  ): Promise<T> => {
    const response = await fetch(`/api/projects/${initialData.id}/${path}`, options)
    const data = (await response.json().catch(() => null)) as
      | (T & { error?: string; message?: string })
      | null

    if (!response.ok) {
      throw new Error(data?.error ?? data?.message ?? fallbackError)
    }

    if (!data) throw new Error(fallbackError)
    return data
  }

  const buildCanonicalContext = async () => {
    setDiscoveryMessage({ type: 'status', text: 'Normalizing the canonical context…' })
    await requestProjectStage(
      'context',
      { method: 'POST' },
      'Canonical context generation failed.',
    )

    setProjectStatus('CONTEXT_READY')
    setDiscoveryMessage({ type: 'status', text: 'Canonical context ready. Refreshing workspace…' })
    window.location.reload()
  }

  const handleStartDiscovery = async () => {
    setIsAnalyzing(true)
    setDiscoveryMessage({ type: 'status', text: 'Analyzing requirements…' })

    try {
      await requestProjectStage(
        'analyze',
        { method: 'POST' },
        'Requirement analysis failed.',
      )
      setProjectStatus('ANALYZING')
      setDiscoveryMessage({ type: 'status', text: 'Preparing focused clarification questions…' })

      const roundResult = await requestProjectStage<{
        questions: Array<{ question: string; impact?: string }>
        is_context_sufficient: boolean
      }>(
        'clarifications?action=generate',
        { method: 'POST' },
        'Clarification planning failed.',
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
      }>('clarifications', { method: 'GET' }, 'Unable to load clarification questions.')

      setClarifications(stored.questions)
      setProjectStatus('CLARIFYING')
      setActiveTab('context')
      setDiscoveryMessage({
        type: 'status',
        text: `Answer ${roundResult.questions.length} clarification question${roundResult.questions.length === 1 ? '' : 's'} to continue.`,
      })
    } catch (error) {
      setDiscoveryMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Project discovery failed. Please retry.',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmitClarifications = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const answers = pendingClarifications.map((question) => ({
      questionId: question.id,
      answer: String(formData.get(`answer-${question.id}`) ?? '').trim(),
    }))

    if (answers.some((item) => !item.answer)) {
      setDiscoveryMessage({ type: 'error', text: 'Answer every pending question before continuing.' })
      return
    }

    setIsSubmittingAnswers(true)
    setDiscoveryMessage({ type: 'status', text: 'Saving confirmed answers…' })

    try {
      await requestProjectStage(
        'clarifications?action=answer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        },
        'Clarification answers could not be saved.',
      )

      setDiscoveryMessage({ type: 'status', text: 'Checking whether more decisions are needed…' })
      const nextRound = await requestProjectStage<{
        questions: Array<{ question: string; impact?: string }>
        is_context_sufficient: boolean
      }>(
        'clarifications?action=generate',
        { method: 'POST' },
        'The next clarification round could not be prepared.',
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
      }>('clarifications', { method: 'GET' }, 'Unable to load clarification questions.')

      setClarifications(stored.questions)
      setDiscoveryMessage({
        type: 'status',
        text: `Round ${stored.questions.at(-1)?.round ?? 1} is ready. Resolve the remaining decisions.`,
      })
    } catch (error) {
      setDiscoveryMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Clarification submission failed. Please retry.',
      })
    } finally {
      setIsSubmittingAnswers(false)
    }
  }

  const handleGenerateAll = async () => {
    if (!contextReady) {
      setActiveTab('context')
      setDiscoveryMessage({
        type: 'error',
        text: 'Complete project discovery before generating documents.',
      })
      return
    }

    setIsGenerating(true)
    setProjectStatus('GENERATING')
    setGenMessage(null)

    const stages = [
      { label: 'artifact planning', path: 'planner' },
      { label: 'document generation', path: 'generate' },
      { label: 'skill resolution', path: 'skills' },
      { label: 'backlog generation', path: 'backlog' },
    ] as const

    try {
      for (const stage of stages) {
        setGenMessage({ type: 'status', text: `Running ${stage.label}…` })
        await requestProjectStage(
          stage.path,
          { method: 'POST' },
          `${formatLabel(stage.label)} failed.`,
        )
      }

      setGenMessage({ type: 'status', text: 'Full pack generated. Refreshing workspace…' })
      window.location.reload()
    } catch (error) {
      setProjectStatus('GENERATION_FAILED')
      setGenMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Generation failed. Check the project context and retry.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const discoveryButton = pendingClarifications.length > 0 ? (
    <button
      type="button"
      onClick={() => setActiveTab('context')}
      className={`inline-flex items-center justify-center gap-2 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-sun)] px-4 py-2.5 font-mono text-sm font-black text-[var(--workspace-ink)] shadow-[4px_4px_0_var(--workspace-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--workspace-ink)] ${BUTTON_FOCUS_CLASS}`}
    >
      <MessageSquareText aria-hidden="true" className="size-4" />
      Continue clarification
    </button>
  ) : (
    <button
      type="button"
      onClick={handleStartDiscovery}
      disabled={isAnalyzing || isSubmittingAnswers}
      className={`inline-flex items-center justify-center gap-2 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-sun)] px-4 py-2.5 font-mono text-sm font-black text-[var(--workspace-ink)] shadow-[4px_4px_0_var(--workspace-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--workspace-ink)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
    >
      {isAnalyzing ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <ScanText aria-hidden="true" className="size-4" />
      )}
      {isAnalyzing ? 'Analyzing project…' : 'Start requirement analysis'}
    </button>
  )

  const generateButton = contextReady ? (
    <button
      type="button"
      onClick={handleGenerateAll}
      disabled={isGenerating}
      className={`inline-flex items-center justify-center gap-2 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-primary)] px-4 py-2.5 font-mono text-sm font-black text-white shadow-[4px_4px_0_var(--workspace-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--workspace-ink)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
    >
      {isGenerating ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : readyArtifacts.length > 0 ? (
        <RefreshCw aria-hidden="true" className="size-4" />
      ) : (
        <Play aria-hidden="true" className="size-4" />
      )}
      {isGenerating
        ? 'Generating pack…'
        : readyArtifacts.length > 0
          ? 'Regenerate full pack'
          : 'Generate full pack'}
    </button>
  ) : (
    discoveryButton
  )

  return (
    <div
      className="min-h-screen bg-[var(--workspace-canvas)] text-[var(--workspace-ink)]"
      style={WORKSPACE_STYLE}
    >
      <header className="border-b-4 border-[var(--workspace-ink)] bg-[var(--workspace-paper)]">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--workspace-ink)] shadow-[3px_3px_0_var(--workspace-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 ${BUTTON_FOCUS_CLASS}`}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Projects
          </Link>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`border-2 px-2.5 py-1 font-mono text-xs font-black shadow-[2px_2px_0_var(--workspace-ink)] ${statusTone(projectStatus)}`}
                >
                  {formatStatus(projectStatus)}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                  Updated {formatDate(initialData.updatedAt)}
                </span>
              </div>
              <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                {initialData.name}
              </h1>
              <p className="mt-5 max-w-3xl border-l-4 border-[var(--workspace-ink)] pl-4 text-base font-semibold leading-7 text-[var(--workspace-muted)]">
                {initialData.description ||
                  'No project brief has been recorded yet. Add the problem, intended users, and expected outcome before generation.'}
              </p>
            </div>

            <div className={`${PANEL_CLASS} bg-[var(--workspace-yellow-soft)] p-5`}>
              <p className="font-mono text-xs font-black text-[var(--workspace-ink)]">
                Control-room action
              </p>
              <div className="mt-4">{generateButton}</div>
              <p
                role={(genMessage ?? discoveryMessage)?.type === 'error' ? 'alert' : 'status'}
                aria-live={(genMessage ?? discoveryMessage)?.type === 'error' ? 'assertive' : 'polite'}
                className={`mt-4 min-h-5 text-sm font-semibold leading-5 ${
                  (genMessage ?? discoveryMessage)?.type === 'error'
                    ? 'text-[var(--workspace-rose)]'
                    : 'text-[var(--workspace-muted)]'
                }`}
              >
                {(genMessage ?? discoveryMessage)?.text ??
                  (contextReady
                    ? 'Plans documents, generates the pack, resolves skills, then builds the backlog.'
                    : pendingClarifications.length > 0
                      ? `${pendingClarifications.length} clarification question${pendingClarifications.length === 1 ? '' : 's'} waiting for your decision.`
                      : 'Analyze the idea before document generation so critical decisions are not invented.')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="border-b-4 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r-4">
          <div className="px-4 py-5 sm:px-6 lg:px-5 lg:py-8">
            <div className={`${PANEL_SOFT_CLASS} bg-[var(--workspace-paper)] p-4`}>
              <h2 className="text-xl font-black tracking-[-0.04em]">Pipeline spine</h2>
              <p className="mt-1 font-mono text-xs font-bold leading-5 text-[var(--workspace-muted)]">
                Step {activePipelineIndex + 1} of {PIPELINE_STAGES.length}. Real project state.
              </p>
            </div>

            <ol className="mt-6 flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-0 lg:overflow-visible lg:pb-0">
              {PIPELINE_STAGES.map((stage, index) => {
                const isComplete = index < activePipelineIndex
                const isCurrent = index === activePipelineIndex
                const Icon = stage.icon

                return (
                  <li
                    key={stage.label}
                    className="relative min-w-40 lg:min-w-0 lg:pb-7 lg:pl-10 lg:last:pb-0"
                  >
                    {index < PIPELINE_STAGES.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[0.875rem] top-8 hidden h-[calc(100%-1.25rem)] w-1 border-x border-[var(--workspace-ink)] lg:block ${
                          isComplete ? 'bg-[var(--workspace-ink)]' : 'bg-[var(--workspace-paper)]'
                        }`}
                      />
                    )}
                    <span
                      className={`mb-2 flex size-8 items-center justify-center border-2 border-[var(--workspace-ink)] shadow-[3px_3px_0_var(--workspace-ink)] lg:absolute lg:left-0 lg:top-0 lg:mb-0 ${
                        isComplete
                          ? 'bg-[var(--workspace-mint)] text-[var(--workspace-ink)]'
                          : isCurrent
                            ? projectStatus === 'GENERATION_FAILED'
                              ? 'bg-[var(--workspace-rose-soft)] text-[var(--workspace-ink)]'
                              : 'bg-[var(--workspace-sun)] text-[var(--workspace-ink)]'
                            : 'bg-[var(--workspace-paper)] text-[var(--workspace-faint)]'
                      }`}
                    >
                      {isComplete ? (
                        <Check aria-hidden="true" className="size-4" />
                      ) : (
                        <Icon aria-hidden="true" className="size-4" />
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-black ${
                          isCurrent || isComplete
                            ? 'text-[var(--workspace-ink)]'
                            : 'text-[var(--workspace-faint)]'
                        }`}
                      >
                        {stage.label}
                      </span>
                      {isCurrent && (
                        <span className="border-2 border-[var(--workspace-ink)] bg-[var(--workspace-primary)] px-1.5 py-0.5 font-mono text-[0.65rem] font-black leading-none text-white shadow-[2px_2px_0_var(--workspace-ink)]">
                          now
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[var(--workspace-muted)]">
                      {stage.description}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>
        </aside>

        <div className="min-w-0">
          <nav
            aria-label="Project workspace sections"
            className="border-b-4 border-[var(--workspace-ink)] bg-[var(--workspace-paper)]"
          >
            <div
              role="tablist"
              aria-label="Project workspace sections"
              className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8"
            >
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
                    onClick={() => setActiveTab(section.id)}
                    onKeyDown={(event) => handleSectionKeyDown(event, section.id)}
                    title={section.description}
                    className={`flex shrink-0 items-center gap-2 border-2 border-[var(--workspace-ink)] px-3 py-2 font-mono text-xs font-black shadow-[3px_3px_0_var(--workspace-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 sm:px-4 ${BUTTON_FOCUS_CLASS} ${
                      isActive
                        ? 'bg-[var(--workspace-sun)] text-[var(--workspace-ink)]'
                        : 'bg-[var(--workspace-paper)] text-[var(--workspace-ink)]'
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {section.label}
                  </button>
                )
              })}
            </div>
          </nav>

          <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div
              id={getSectionPanelId(activeTab)}
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={getSectionTabId(activeTab)}
            >
              {activeTab === 'overview' && (
              <div className="space-y-10">
                <SectionHeading
                  title="Documentation control room"
                  description="A direct view of what the coding agent can rely on now, what still needs attention, and the next safe action."
                />

                <section className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.8fr)]">
                  <div className={`${PANEL_CLASS} bg-[var(--workspace-paper)] p-6 lg:-rotate-1`}>
                    <div className="border-l-8 border-[var(--workspace-primary)] pl-5">
                      <p className="font-mono text-xs font-black text-[var(--workspace-ink)]">
                        Next checkpoint
                      </p>
                      <h3 className="mt-2 text-3xl font-black leading-none tracking-[-0.05em] sm:text-4xl">
                        {!contextReady
                          ? 'Establish the canonical context'
                          : readyArtifacts.length === 0
                            ? 'Generate the first documentation pack'
                            : attentionArtifacts.length > 0
                              ? 'Resolve document warnings before export'
                              : projectStatus === 'EXPORTABLE'
                                ? 'The bootstrap pack is exportable'
                                : 'Review the generated pack'}
                      </h3>
                      <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[var(--workspace-muted)]">
                        {!contextReady
                          ? 'The project has no normalized context yet. Complete analysis and clarification so generators do not invent high-impact decisions.'
                          : readyArtifacts.length === 0
                            ? 'The context exists, but no documents are ready. Generation will create the core artifacts, resolve skills, and assemble dependency-aware work.'
                            : attentionArtifacts.length > 0
                              ? `${attentionArtifacts.length} document${attentionArtifacts.length === 1 ? '' : 's'} are failed or outdated. Review their status in Documents before packaging the project.`
                              : projectStatus === 'EXPORTABLE'
                                ? 'A previous export completed successfully. Review modified documents before downloading a fresh archive.'
                                : 'The current documents can be inspected, edited, and packaged. Modified documents remain eligible for export.'}
                      </p>
                    </div>

                    <dl className="mt-8 grid border-y-4 border-[var(--workspace-ink)] sm:grid-cols-2">
                      <div className="border-b-2 border-[var(--workspace-ink)] py-4 sm:border-r-2 sm:pr-5">
                        <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                          Project type
                        </dt>
                        <dd className="mt-1 text-sm font-black">
                          {formatLabel(initialData.classification)}
                        </dd>
                      </div>
                      <div className="border-b-2 border-[var(--workspace-ink)] py-4 sm:pl-5">
                        <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                          Target agent
                        </dt>
                        <dd className="mt-1 text-sm font-black">
                          {formatLabel(initialData.targetAgent)}
                        </dd>
                      </div>
                      <div className="border-b-2 border-[var(--workspace-ink)] py-4 sm:border-b-0 sm:border-r-2 sm:pr-5">
                        <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                          Context snapshot
                        </dt>
                        <dd className="mt-1 text-sm font-black">
                          Version {initialData.contextVersion}
                        </dd>
                      </div>
                      <div className="py-4 sm:pl-5">
                        <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                          Created
                        </dt>
                        <dd className="mt-1 text-sm font-black">
                          {formatDate(initialData.createdAt)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <section
                    aria-labelledby="readiness-title"
                    className={`${PANEL_CLASS} bg-[var(--workspace-yellow-soft)] p-5 lg:rotate-1`}
                  >
                    <div className="flex items-center justify-between border-b-4 border-[var(--workspace-ink)] pb-4">
                      <h3 id="readiness-title" className="text-2xl font-black tracking-[-0.04em]">
                        Actual readiness
                      </h3>
                      <span className="font-mono text-xs font-bold text-[var(--workspace-muted)]">
                        Live data
                      </span>
                    </div>
                    <ul>
                      <ReadinessLine
                        label="Canonical context"
                        value={contextReady ? 'Available' : 'Missing'}
                        detail={
                          contextReady
                            ? `Snapshot v${initialData.contextVersion}`
                            : 'Required before reliable generation'
                        }
                        tone={contextReady ? 'ready' : 'idle'}
                      />
                      <ReadinessLine
                        label="Documents"
                        value={`${readyArtifacts.length} of ${artifacts.length} ready`}
                        detail={
                          attentionArtifacts.length > 0
                            ? `${attentionArtifacts.length} need attention`
                            : artifacts.length > 0
                              ? 'Ready and modified files can export'
                              : 'No artifacts generated'
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
                        label="Resolved skills"
                        value={`${initialData.skills.length} selected`}
                        detail={
                          initialData.skills.length > 0
                            ? 'Triggers and phases are mapped'
                            : 'Resolution has not produced recommendations'
                        }
                        tone={initialData.skills.length > 0 ? 'ready' : 'idle'}
                      />
                      <ReadinessLine
                        label="Backlog"
                        value={`${readyTasks.length} of ${allTasks.length} ready`}
                        detail={
                          blockedTasks.length > 0
                            ? `${blockedTasks.length} blocked; ${doneTasks.length} done`
                            : allTasks.length > 0
                              ? `${doneTasks.length} completed; no tasks blocked`
                              : 'No implementation tasks generated'
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
                        label="ZIP export"
                        value={canExport ? 'Available' : 'Unavailable'}
                        detail={
                          canExport
                            ? `${readyArtifacts.length} document${readyArtifacts.length === 1 ? '' : 's'} eligible`
                            : 'At least one ready document is required'
                        }
                        tone={canExport ? 'ready' : 'idle'}
                      />
                    </ul>
                  </section>
                </section>
              </div>
            )}

            {activeTab === 'context' && (
              <div className="space-y-8">
                <SectionHeading
                  title="Canonical project context"
                  description="The normalized source of truth consumed by every generator. Provenance labels distinguish confirmed decisions from assumptions and unknowns."
                  action={
                    <span
                      className={`${PANEL_SOFT_CLASS} inline-flex items-center gap-2 px-3 py-2 font-mono text-xs font-black text-[var(--workspace-ink)]`}
                    >
                      <Braces aria-hidden="true" className="size-4" />
                      Snapshot v{initialData.contextVersion}
                    </span>
                  }
                />

                {!contextReady ? (
                  <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className={`${PANEL_CLASS} bg-[var(--workspace-paper)] p-6`}>
                      <div className="border-b-4 border-[var(--workspace-ink)] pb-5">
                        <p className="font-mono text-xs font-black text-[var(--workspace-faint)]">
                          Discovery interview
                        </p>
                        <h3 className="mt-2 text-3xl font-black leading-none tracking-[-0.05em]">
                          {pendingClarifications.length > 0
                            ? 'Answer the open decisions'
                            : 'Canonical context has not been assembled'}
                        </h3>
                        <p className="mt-3 text-sm font-semibold leading-6 text-[var(--workspace-muted)]">
                          {pendingClarifications.length > 0
                            ? 'These answers become confirmed input for the canonical context. Keep them specific; the generator will not silently invent these decisions.'
                            : 'Start requirement analysis first. If important decisions are missing, the system will ask focused clarification questions before document generation.'}
                        </p>
                      </div>

                      {discoveryMessage && (
                        <p
                          role={discoveryMessage.type === 'error' ? 'alert' : 'status'}
                          aria-live={discoveryMessage.type === 'error' ? 'assertive' : 'polite'}
                          className={`mt-5 border-2 border-[var(--workspace-ink)] p-4 text-sm font-bold leading-5 shadow-[3px_3px_0_var(--workspace-ink)] ${
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
                              className="border-2 border-[var(--workspace-ink)] bg-[var(--workspace-yellow-soft)] p-4 shadow-[4px_4px_0_var(--workspace-ink)]"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="border-2 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] px-2 py-0.5 font-mono text-xs font-black shadow-[2px_2px_0_var(--workspace-ink)]">
                                  Round {question.round}
                                </span>
                                <span className="font-mono text-xs font-bold text-[var(--workspace-muted)]">
                                  Question {index + 1} of {pendingClarifications.length}
                                </span>
                              </div>
                              <label
                                htmlFor={`answer-${question.id}`}
                                className="mt-4 block text-lg font-black leading-6 tracking-[-0.02em]"
                              >
                                {question.question}
                              </label>
                              {question.impact && (
                                <p className="mt-2 border-l-4 border-[var(--workspace-ink)] pl-3 text-sm font-semibold leading-5 text-[var(--workspace-muted)]">
                                  Impact: {question.impact}
                                </p>
                              )}
                              <textarea
                                id={`answer-${question.id}`}
                                name={`answer-${question.id}`}
                                rows={4}
                                required
                                placeholder="Write the confirmed decision, constraint, or acceptable assumption…"
                                className={`mt-4 w-full resize-y border-2 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--workspace-ink)] shadow-[3px_3px_0_var(--workspace-ink)] placeholder:text-[var(--workspace-faint)] ${BUTTON_FOCUS_CLASS}`}
                              />
                            </div>
                          ))}

                          <button
                            type="submit"
                            disabled={isSubmittingAnswers || isAnalyzing}
                            className={`inline-flex items-center justify-center gap-2 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-primary)] px-4 py-2.5 font-mono text-sm font-black text-white shadow-[4px_4px_0_var(--workspace-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--workspace-ink)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                          >
                            {isSubmittingAnswers ? (
                              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                            ) : (
                              <Check aria-hidden="true" className="size-4" />
                            )}
                            {isSubmittingAnswers ? 'Saving answers…' : 'Submit answers and continue'}
                          </button>
                        </form>
                      ) : (
                        <div className="mt-6">{discoveryButton}</div>
                      )}
                    </div>

                    <aside className={`${PANEL_CLASS} bg-[var(--workspace-blue-soft)] p-5 xl:rotate-1`}>
                      <h3 className="text-2xl font-black tracking-[-0.04em]">Decision ledger</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--workspace-muted)]">
                        Answered questions stay attached to this project and are folded into the context normalizer.
                      </p>

                      <dl className="mt-5 divide-y-2 divide-[var(--workspace-ink)] border-y-4 border-[var(--workspace-ink)]">
                        <div className="grid grid-cols-[1fr_auto] gap-3 py-3">
                          <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                            Pending
                          </dt>
                          <dd className="font-mono text-sm font-black">{pendingClarifications.length}</dd>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-3 py-3">
                          <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                            Answered
                          </dt>
                          <dd className="font-mono text-sm font-black">{answeredClarifications.length}</dd>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] gap-3 py-3">
                          <dt className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                            Context snapshot
                          </dt>
                          <dd className="font-mono text-sm font-black">v{initialData.contextVersion}</dd>
                        </div>
                      </dl>

                      {answeredClarifications.length > 0 && (
                        <div className="mt-6 space-y-3">
                          {answeredClarifications.slice(-4).map((question) => (
                            <div
                              key={question.id}
                              className="border-2 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] p-3 shadow-[3px_3px_0_var(--workspace-ink)]"
                            >
                              <p className="font-mono text-[0.68rem] font-black text-[var(--workspace-faint)]">
                                Round {question.round} answered
                              </p>
                              <p className="mt-1 text-sm font-black leading-5">{question.question}</p>
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
                  <section aria-label="Structured project context">
                    <div
                      className={`${PANEL_SOFT_CLASS} mb-7 flex flex-wrap items-center gap-x-5 gap-y-2 bg-[var(--workspace-paper)] p-4 font-mono text-xs font-bold text-[var(--workspace-muted)]`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-mint)]" />
                        Confirmed by the project owner
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-sun)]" />
                        Assumed by the system
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-3 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-paper)]" />
                        Still unknown
                      </span>
                    </div>
                    <div
                      className={`${PANEL_CLASS} divide-y-4 divide-[var(--workspace-ink)] bg-[var(--workspace-paper)]`}
                    >
                      {Object.entries(initialData.context ?? {}).map(([key, value]) => (
                        <section
                          key={key}
                          className="grid gap-4 p-6 lg:grid-cols-[minmax(12rem,0.28fr)_1fr] lg:gap-10"
                        >
                          <div>
                            <h3 className="text-xl font-black tracking-[-0.04em]">
                              {formatLabel(key)}
                            </h3>
                          </div>
                          <div className="min-w-0 text-sm font-medium leading-6">
                            {SENSITIVE_CONTEXT_KEY.test(key) ? (
                              <span className="inline-flex items-center gap-2 text-[var(--workspace-muted)]">
                                <ShieldCheck aria-hidden="true" className="size-4" />
                                Sensitive value hidden
                              </span>
                            ) : (
                              <ContextValue value={value} />
                            )}
                          </div>
                        </section>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-8">
                <SectionHeading
                  title="Generated documents"
                  description="Edit markdown, compare rendered output, and save intentional changes. Ready and modified documents are eligible for export."
                  action={
                    artifacts.length > 0 ? (
                      <div
                        className={`${PANEL_SOFT_CLASS} flex items-center gap-3 px-3 py-2 font-mono text-xs font-black text-[var(--workspace-ink)]`}
                      >
                        <span>{readyArtifacts.length} ready</span>
                        <span aria-hidden="true">/</span>
                        <span>{attentionArtifacts.length} need attention</span>
                      </div>
                    ) : undefined
                  }
                />

                {artifacts.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No documentation has been generated"
                    description="Generate the full pack to create the planned project documents. The workspace will then support per-file editing without regenerating unrelated artifacts."
                    action={generateButton}
                  />
                ) : (
                  <div className="[&>div]:rounded-none [&>div]:border-4 [&>div]:border-[var(--workspace-ink)] [&>div]:shadow-[8px_8px_0_var(--workspace-ink)]">
                    <MarkdownWorkspace
                      projectId={initialData.id}
                      artifacts={artifacts}
                      onArtifactUpdated={handleArtifactUpdated}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-8">
                <SectionHeading
                  title="Resolved agent skills"
                  description="Capabilities selected for this project, with the conditions that should invoke them and the implementation phases they support."
                  action={
                    initialData.skills.length > 0 ? (
                      <span
                        className={`${PANEL_SOFT_CLASS} px-3 py-2 font-mono text-xs font-black text-[var(--workspace-ink)]`}
                      >
                        {initialData.skills.length} recommendation
                        {initialData.skills.length === 1 ? '' : 's'}
                      </span>
                    ) : undefined
                  }
                />

                {initialData.skills.length === 0 ? (
                  <EmptyState
                    icon={Wrench}
                    title="No skills have been resolved"
                    description="Skill resolution runs after document generation and uses the canonical context to choose only capabilities relevant to the project."
                    action={generateButton}
                  />
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {initialData.skills.map((skill, index) => (
                      <article
                        key={skill.id}
                        className={`${PANEL_CLASS} ${index % 2 === 0 ? 'bg-[var(--workspace-paper)]' : 'bg-[var(--workspace-blue-soft)]'} p-6`}
                      >
                        <div className="flex items-start justify-between gap-4 border-b-4 border-[var(--workspace-ink)] pb-4">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center border-2 border-[var(--workspace-ink)] bg-[var(--workspace-sun)] shadow-[3px_3px_0_var(--workspace-ink)]">
                              <Wrench aria-hidden="true" className="size-4" />
                            </span>
                            <h3 className="text-xl font-black tracking-[-0.04em]">{skill.name}</h3>
                          </div>
                          <p className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                            {skill.source}
                          </p>
                        </div>

                        <div className="mt-5 space-y-5">
                          <div>
                            <h4 className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                              Purpose
                            </h4>
                            <p className="mt-1 text-sm font-semibold leading-6">{skill.purpose}</p>
                          </div>
                          <div>
                            <h4 className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                              Trigger
                            </h4>
                            <p className="mt-1 text-sm font-medium leading-6 text-[var(--workspace-muted)]">
                              {skill.trigger}
                            </p>
                          </div>

                          {(skill.metadata?.applicable_phases?.length ||
                            skill.metadata?.applicable_task_types?.length) && (
                            <div className="flex flex-wrap gap-2">
                              {skill.metadata?.applicable_phases?.map((phase) => (
                                <span
                                  key={`phase-${phase}`}
                                  className="border-2 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--workspace-ink)] shadow-[2px_2px_0_var(--workspace-ink)]"
                                >
                                  {phase}
                                </span>
                              ))}
                              {skill.metadata?.applicable_task_types?.map((taskType) => (
                                <span
                                  key={`type-${taskType}`}
                                  className="border-2 border-[var(--workspace-ink)] bg-[var(--workspace-mint-soft)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--workspace-ink)] shadow-[2px_2px_0_var(--workspace-ink)]"
                                >
                                  {formatLabel(taskType)}
                                </span>
                              ))}
                            </div>
                          )}

                          {skill.metadata?.installation_hint && (
                            <div className="border-l-4 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] p-4">
                              <h4 className="font-mono text-xs font-bold text-[var(--workspace-faint)]">
                                Setup note
                              </h4>
                              <p className="mt-1 font-mono text-xs font-bold leading-5 text-[var(--workspace-muted)]">
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
            )}

            {activeTab === 'backlog' && (
              <div className="space-y-8">
                <SectionHeading
                  title="Implementation backlog"
                  description="Phased work ordered by dependency. Open a task to inspect its acceptance criteria, definition of done, documentation, and recommended skills."
                  action={
                    allTasks.length > 0 ? (
                      <div
                        className={`${PANEL_SOFT_CLASS} flex flex-wrap items-center gap-4 px-3 py-2 font-mono text-xs font-black text-[var(--workspace-ink)]`}
                      >
                        <span>{readyTasks.length} ready</span>
                        <span>{doneTasks.length} done</span>
                        <span>{blockedTasks.length} blocked</span>
                        <span>{allTasks.length} total</span>
                      </div>
                    ) : undefined
                  }
                />

                {initialData.phases.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title="No implementation backlog exists"
                    description="Generate the full pack to turn the project context and document plan into ordered, dependency-aware implementation tasks."
                    action={generateButton}
                  />
                ) : (
                  <div className="space-y-10">
                    {initialData.phases.map((phase) => (
                      <section key={phase.id} aria-labelledby={`phase-${phase.id}`}>
                        <div
                          className={`${PANEL_CLASS} grid gap-3 bg-[var(--workspace-sun)] p-5 sm:grid-cols-[4rem_1fr_auto] sm:items-end`}
                        >
                          <span className="font-mono text-3xl font-black tracking-[-0.08em] text-[var(--workspace-ink)]">
                            {String(phase.order).padStart(2, '0')}
                          </span>
                          <div>
                            <h3
                              id={`phase-${phase.id}`}
                              className="text-2xl font-black tracking-[-0.05em]"
                            >
                              {phase.name}
                            </h3>
                            {phase.description && (
                              <p className="mt-1 text-sm font-semibold leading-5 text-[var(--workspace-muted)]">
                                {phase.description}
                              </p>
                            )}
                          </div>
                          <span className="font-mono text-xs font-black text-[var(--workspace-ink)]">
                            {phase.tasks.length} task
                            {phase.tasks.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {phase.tasks.length === 0 ? (
                          <p
                            className={`${PANEL_SOFT_CLASS} mt-4 bg-[var(--workspace-paper)] p-5 text-sm font-semibold text-[var(--workspace-muted)]`}
                          >
                            This phase has no generated tasks.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-4">
                            {phase.tasks.map((task) => {
                              const dependencyLabels = task.dependencies.map(
                                (dependencyId) => taskKeyById.get(dependencyId) ?? dependencyId,
                              )

                              return (
                                <details
                                  key={task.id}
                                  className={`${PANEL_SOFT_CLASS} group bg-[var(--workspace-paper)]`}
                                >
                                  <summary
                                    className={`grid cursor-pointer list-none gap-3 p-5 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-start [&::-webkit-details-marker]:hidden ${BUTTON_FOCUS_CLASS}`}
                                  >
                                    <span className="font-mono text-xs font-black text-[var(--workspace-primary)]">
                                      {task.taskKey}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="flex items-start gap-2">
                                        <h4 className="text-base font-black leading-5 tracking-[-0.02em]">
                                          {task.title}
                                        </h4>
                                        <span className="mt-0.5 font-mono text-lg font-black text-[var(--workspace-faint)] transition-transform group-open:rotate-90">
                                          ›
                                        </span>
                                      </div>
                                      <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-[var(--workspace-muted)]">
                                        {task.description}
                                      </p>
                                    </div>
                                    <span
                                      className={`w-fit border-2 px-2.5 py-1 font-mono text-xs font-black shadow-[2px_2px_0_var(--workspace-ink)] ${statusTone(task.status)}`}
                                    >
                                      {formatStatus(task.status)}
                                    </span>
                                  </summary>

                                  <div className="grid gap-6 border-t-2 border-[var(--workspace-ink)] p-5 sm:pl-28 lg:grid-cols-2">
                                    <div>
                                      <h5 className="font-mono text-xs font-black text-[var(--workspace-faint)]">
                                        Acceptance criteria
                                      </h5>
                                      {task.acceptanceCriteria.length > 0 ? (
                                        <ul className="mt-3 space-y-2">
                                          {task.acceptanceCriteria.map((criterion) => (
                                            <li
                                              key={criterion}
                                              className="flex gap-2 text-sm font-semibold leading-5"
                                            >
                                              <Check
                                                aria-hidden="true"
                                                className="mt-0.5 size-4 shrink-0 text-[var(--workspace-ink)]"
                                              />
                                              {criterion}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="mt-2 text-sm font-medium text-[var(--workspace-muted)]">
                                          No acceptance criteria recorded.
                                        </p>
                                      )}
                                    </div>

                                    <dl className="space-y-4 text-sm">
                                      <div>
                                        <dt className="font-mono text-xs font-black text-[var(--workspace-faint)]">
                                          Definition of done
                                        </dt>
                                        <dd className="mt-1 font-medium leading-5 text-[var(--workspace-muted)]">
                                          {task.definitionOfDone || 'Not specified'}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-mono text-xs font-black text-[var(--workspace-faint)]">
                                          Dependencies
                                        </dt>
                                        <dd className="mt-1 font-medium leading-5 text-[var(--workspace-muted)]">
                                          {dependencyLabels.length > 0
                                            ? dependencyLabels.join(', ')
                                            : 'No blockers'}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-mono text-xs font-black text-[var(--workspace-faint)]">
                                          Relevant documents
                                        </dt>
                                        <dd className="mt-1 font-medium leading-5 text-[var(--workspace-muted)]">
                                          {task.relevantDocs.length > 0
                                            ? task.relevantDocs.join(', ')
                                            : 'None linked'}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="font-mono text-xs font-black text-[var(--workspace-faint)]">
                                          Recommended skills
                                        </dt>
                                        <dd className="mt-1 font-medium leading-5 text-[var(--workspace-muted)]">
                                          {task.recommendedSkills.length > 0
                                            ? task.recommendedSkills.join(', ')
                                            : 'No specific skill'}
                                        </dd>
                                      </div>
                                    </dl>
                                  </div>
                                </details>
                              )
                            })}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-8">
                <SectionHeading
                  title="Export bootstrap pack"
                  description="Inspect the exact document manifest, then download a UTF-8 ZIP prepared for the selected coding agent."
                  action={
                    <span
                      className={`border-2 px-2.5 py-1 font-mono text-xs font-black shadow-[2px_2px_0_var(--workspace-ink)] ${
                        canExport
                          ? 'border-[var(--workspace-ink)] bg-[var(--workspace-mint-soft)] text-[var(--workspace-ink)]'
                          : 'border-[var(--workspace-ink)] bg-[var(--workspace-paper)] text-[var(--workspace-ink)]'
                      }`}
                    >
                      {canExport ? 'Ready to download' : 'Not ready'}
                    </span>
                  }
                />

                {!canExport ? (
                  <EmptyState
                    icon={Package}
                    title="The archive has no eligible documents"
                    description="Generate at least one document first. Only artifacts marked ready or modified are included; failed, outdated, and incomplete files remain outside the archive."
                    action={generateButton}
                  />
                ) : (
                  <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_23rem]">
                    <section aria-labelledby="manifest-title" className={PANEL_CLASS}>
                      <div className="flex items-center justify-between border-b-4 border-[var(--workspace-ink)] bg-[var(--workspace-sun)] p-5">
                        <h3 id="manifest-title" className="text-2xl font-black tracking-[-0.05em]">
                          Archive manifest
                        </h3>
                        <span className="font-mono text-xs font-black text-[var(--workspace-ink)]">
                          {readyArtifacts.length + (includesReadme ? 0 : 1)} files
                        </span>
                      </div>
                      <ul className="bg-[var(--workspace-paper)]">
                        {readyArtifacts.map((artifact) => (
                          <li
                            key={artifact.id}
                            className="grid gap-2 border-b-2 border-[var(--workspace-ink)] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
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
                              className={`w-fit border-2 px-2 py-0.5 font-mono text-xs font-black shadow-[2px_2px_0_var(--workspace-ink)] ${statusTone(artifact.status)}`}
                            >
                              {formatStatus(artifact.status)}
                            </span>
                          </li>
                        ))}
                        {!includesReadme && (
                          <li className="grid gap-2 border-b-2 border-[var(--workspace-ink)] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
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
                              Added during export
                            </span>
                          </li>
                        )}
                      </ul>

                      {artifacts.length > readyArtifacts.length && (
                        <p className="m-5 flex gap-2 border-l-4 border-[var(--workspace-ink)] bg-[var(--workspace-yellow-soft)] p-4 text-sm font-semibold leading-5 text-[var(--workspace-muted)]">
                          <AlertTriangle
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-[var(--workspace-ink)]"
                          />
                          {artifacts.length - readyArtifacts.length} ineligible document
                          {artifacts.length - readyArtifacts.length === 1 ? '' : 's'} will be
                          omitted because their status is not ready or modified.
                        </p>
                      )}
                    </section>

                    <aside
                      className={`${PANEL_CLASS} bg-[var(--workspace-blue-soft)] p-6 xl:-rotate-1`}
                    >
                      <span className="flex size-12 items-center justify-center border-2 border-[var(--workspace-ink)] bg-[var(--workspace-paper)] shadow-[4px_4px_0_var(--workspace-ink)]">
                        <Package aria-hidden="true" className="size-6" />
                      </span>
                      <h3 className="mt-6 text-3xl font-black leading-none tracking-[-0.05em]">
                        Bootstrap pack
                      </h3>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[var(--workspace-muted)]">
                        Prepared for {formatLabel(initialData.targetAgent)}. Provider keys, session
                        credentials, and project secrets are never intentionally added to the
                        archive.
                      </p>

                      <div className="mt-6 space-y-3 border-y-4 border-[var(--workspace-ink)] py-4 text-sm font-black">
                        <div className="flex items-center gap-3">
                          <ShieldCheck aria-hidden="true" className="size-4" />
                          Content is scanned before packaging
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 aria-hidden="true" className="size-4" />
                          Controlled filenames and UTF-8 text
                        </div>
                      </div>

                      <Link
                        href={`/api/projects/${initialData.id}/export`}
                        download
                        className={`mt-6 inline-flex w-full items-center justify-center gap-2 border-2 border-[var(--workspace-ink)] bg-[var(--workspace-primary)] px-4 py-3 font-mono text-sm font-black text-white shadow-[5px_5px_0_var(--workspace-ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--workspace-ink)] ${BUTTON_FOCUS_CLASS}`}
                      >
                        <Download aria-hidden="true" className="size-4" />
                        Download ZIP pack
                      </Link>
                    </aside>
                  </div>
                )}
              </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
