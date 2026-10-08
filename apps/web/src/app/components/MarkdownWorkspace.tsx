'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  Columns2,
  Eye,
  FileText,
  Loader2,
  PanelLeft,
  PencilLine,
  RefreshCw,
  Save,
} from 'lucide-react'

import { getArtifactStatusBadgeStyle } from '@/lib/artifacts/artifact-service'
import { renderMarkdownToHtml } from '@/lib/artifacts/sanitizer'
import { cn } from '@/lib/ui'

import { Button, Panel, StatusBadge } from './ui'

export interface WorkspaceArtifactItem {
  id: string
  type: string
  path: string
  content: string
  status: string
  updatedAt: string
}

interface MarkdownWorkspaceProps {
  projectId: string
  artifacts: WorkspaceArtifactItem[]
  onArtifactUpdated?: (updated: WorkspaceArtifactItem) => void
}

type WorkspaceMode = 'editor' | 'preview' | 'split'

const viewModes: Array<{
  id: WorkspaceMode
  label: string
  icon: typeof PencilLine
}> = [
  { id: 'editor', label: 'Edit', icon: PencilLine },
  { id: 'split', label: 'Split', icon: Columns2 },
  { id: 'preview', label: 'Preview', icon: Eye },
]

function getStatusDotClass(status: string) {
  switch (status) {
    case 'READY':
      return 'bg-[#62b894]'
    case 'MODIFIED':
      return 'bg-[#0075de]'
    case 'OUTDATED':
      return 'bg-[#ffb110]'
    case 'FAILED':
      return 'bg-[#e32d14]'
    case 'GENERATING':
      return 'bg-[#0075de] motion-safe:animate-pulse-dot'
    default:
      return 'bg-[#757575]'
  }
}

function statusTone(status: string): 'neutral' | 'current' | 'pending' | 'success' | 'danger' | 'accent' {
  switch (status) {
    case 'READY':
      return 'success'
    case 'MODIFIED':
      return 'current'
    case 'OUTDATED':
      return 'pending'
    case 'FAILED':
      return 'danger'
    case 'GENERATING':
      return 'accent'
    default:
      return 'neutral'
  }
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function MarkdownWorkspace({
  projectId,
  artifacts,
  onArtifactUpdated,
}: MarkdownWorkspaceProps) {
  const t = useTranslations('Workspace')
  const tCommon = useTranslations('Common')
  const [selectedType, setSelectedType] = useState<string>(artifacts[0]?.type || 'PRD')
  const [activeTab, setActiveTab] = useState<WorkspaceMode>('split')
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveMessageType, setSaveMessageType] = useState<'status' | 'error'>('status')

  const localizedViewModes = viewModes.map((mode) => ({
    ...mode,
    label: t(`markdownView${mode.id.charAt(0).toUpperCase() + mode.id.slice(1)}` as Parameters<typeof t>[0]),
  }))

  const announce = (message: string, type: 'status' | 'error' = 'status') => {
    setSaveMessageType(type)
    setSaveMessage(message)
  }

  const activeArtifact = artifacts.find((artifact) => artifact.type === selectedType) || artifacts[0]
  const [content, setContent] = useState<string>(activeArtifact?.content || '')

  const renderedPreview = useMemo(() => renderMarkdownToHtml(content), [content])

  const handleSelectArtifact = (artifact: WorkspaceArtifactItem) => {
    setSelectedType(artifact.type)
    setContent(artifact.content)
    announce('')
  }

  const handleRegenerate = async () => {
    if (!activeArtifact) return
    setIsRegenerating(true)
    announce('')

    try {
      let endpoint = `/api/projects/${projectId}/generate`
      const body: Record<string, unknown> = { type: activeArtifact.type }

      if (activeArtifact.type === 'BACKLOG') endpoint = `/api/projects/${projectId}/backlog`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? t('markdownRegenerateFailed'))
      }

      const data = (await response.json()) as {
        artifacts?: Array<WorkspaceArtifactItem & { error?: string }>
        backlog?: { backlog_md_content: string }
      }
      let newContent = ''
      let errorMsg = ''

      if (activeArtifact.type === 'BACKLOG' && data.backlog) {
        newContent = data.backlog.backlog_md_content
      } else if (data.artifacts) {
        const updated = data.artifacts.find((a) => a.type === activeArtifact.type)
        if (updated?.status === 'FAILED') errorMsg = updated.error || t('markdownOutputFailed')
        else if (updated) newContent = updated.content
      }

      if (errorMsg) announce(`${t('markdownGenerationFailed')}: ${errorMsg}`, 'error')
      else if (newContent) {
        setContent(newContent)
        announce(t('markdownRegenerated'))
        onArtifactUpdated?.({ ...activeArtifact, content: newContent, status: 'READY', updatedAt: new Date().toISOString() })
      } else {
        announce(t('markdownRefreshing'))
        window.location.reload()
      }
    } catch (error) {
      announce(error instanceof Error ? error.message : t('markdownRegenerationError'), 'error')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSave = async () => {
    if (!activeArtifact) return
    setIsSaving(true)
    announce('')

    try {
      const response = await fetch(`/api/projects/${projectId}/artifacts/${activeArtifact.type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? t('markdownSaveFailed'))
      }

      const data = (await response.json()) as { artifact?: WorkspaceArtifactItem }
      announce(t('markdownSaved'))
      if (onArtifactUpdated && data.artifact) onArtifactUpdated(data.artifact)
    } catch (error) {
      announce(error instanceof Error ? error.message : t('markdownSaveError'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (artifacts.length === 0) {
    return (
      <Panel className="p-8 text-center" aria-label={t('markdownWorkspace')}>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <FileText className="size-9 text-[#757575]" aria-hidden="true" />
          <p className="text-sm font-semibold leading-6 text-[#757575]">
            {t('markdownEmpty')}
          </p>
        </div>
      </Panel>
    )
  }

  const badge = activeArtifact ? getArtifactStatusBadgeStyle(activeArtifact.status) : null

  return (
    <section
      className="flex min-h-[600px] w-full flex-col overflow-hidden rounded-xl border border-black/10 bg-white text-[var(--ink)] sm:min-h-[760px] lg:h-[760px] lg:flex-row"
      aria-label={t('markdownWorkspace')}
    >
      <aside className="border-b border-black/10 bg-[#f6f5f4] lg:w-80 lg:flex-shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-start gap-3 border-b border-black/10 bg-white px-4 py-4">
          <PanelLeft className="mt-0.5 size-5 flex-shrink-0 text-[#0075de]" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-[-0.02em]">{t('markdownDocuments')}</h2>
            <p className="mt-1 text-xs leading-5 text-[#615d59]">
              {t('markdownDocumentsDesc')}
            </p>
          </div>
        </div>

        <nav
          className="flex gap-3 overflow-x-auto p-3 lg:max-h-[calc(760px-82px)] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto"
          aria-label={t('markdownArtifacts')}
        >
          {artifacts.map((artifact) => {
            const isSelected = artifact.type === selectedType
            const artifactBadge = getArtifactStatusBadgeStyle(artifact.status)

            return (
              <button
                key={artifact.id}
                type="button"
                onClick={() => handleSelectArtifact(artifact)}
                aria-current={isSelected ? 'page' : undefined}
                className={cn(
                  'min-w-[15rem] rounded-lg border border-black/10 px-3 py-3 text-left transition-colors lg:min-w-0',
                  isSelected
                    ? 'bg-[#e6f3fe] text-[var(--ink)] ring-1 ring-[#0075de]/20'
                    : 'bg-white text-[var(--ink)] hover:bg-[#f6f5f4]',
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm font-medium leading-5">
                      {artifact.path}
                    </span>
                    <span className="mt-1 block truncate text-xs leading-5 text-[#757575]">
                      {artifactBadge.label}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-1 size-2.5 flex-shrink-0 rounded-full',
                      getStatusDotClass(artifact.status),
                    )}
                    title={artifactBadge.label}
                    aria-label={artifactBadge.label}
                  />
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f6f5f4]">
        <header className="border-b border-black/10 bg-white">
          <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between lg:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-mono text-base font-medium tracking-tight">
                  {activeArtifact?.path}
                </h1>
                {activeArtifact && <StatusBadge tone={statusTone(activeArtifact.status)}>{badge?.label}</StatusBadge>}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#757575]">
                {activeArtifact
                  ? t('updated', { date: formatUpdatedAt(activeArtifact.updatedAt) })
                  : t('markdownNoArtifact')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
              <p
                className={cn(
                  'min-h-5 text-xs leading-5',
                  saveMessageType === 'error'
                    ? 'text-[#e32d14]'
                    : 'text-[#757575]',
                )}
                role={saveMessageType === 'error' ? 'alert' : 'status'}
                aria-live={saveMessageType === 'error' ? 'assertive' : 'polite'}
              >
                {saveMessage || t('markdownEditsLocal')}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {activeArtifact && (
                  <Button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating || isSaving}
                    variant="secondary"
                    className="gap-2"
                    aria-busy={isRegenerating}
                  >
                    {isRegenerating ? (
                      <Loader2 className="motion-safe:animate-spin size-4" aria-hidden="true" />
                    ) : (
                      <RefreshCw className="size-4" aria-hidden="true" />
                    )}
                    {isRegenerating ? t('markdownRegenerating') : t('markdownRegenerate')}
                  </Button>
                )}

                <div
                  className="grid grid-cols-3 rounded-lg border border-black/10 bg-[#f6f5f4] p-1"
                  role="group"
                  aria-label={tCommon('workspaceViewMode')}
                >
                  {localizedViewModes.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        aria-pressed={isActive}
                        className={cn(
                          'inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium transition-colors sm:min-w-24',
                          isActive
                            ? 'border-[#0075de]/20 bg-white text-[#0075de]'
                            : 'text-[#757575] hover:bg-white hover:text-[var(--ink)]',
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                        {label}
                      </button>
                    )
                  })}
                </div>

                <Button type="button" onClick={handleSave} disabled={isSaving} variant="success">
                  {isSaving ? (
                    <Loader2 className="motion-safe:animate-spin size-4" aria-hidden="true" />
                  ) : saveMessageType === 'status' && saveMessage ? (
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  {isSaving ? t('markdownSaving') : t('markdownSave')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div
          className={cn(
            'grid min-h-0 flex-1 overflow-hidden',
            activeTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1',
          )}
        >
          {(activeTab === 'editor' || activeTab === 'split') && (
            <section
              className={cn(
                'flex min-h-[360px] flex-col overflow-hidden bg-[#f6f5f4] text-[var(--ink)]',
                activeTab === 'split' && 'border-b border-black/10 lg:border-b-0 lg:border-r',
              )}
              aria-labelledby="markdown-editor-title"
            >
              <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-2.5">
                <h2 id="markdown-editor-title" className="text-sm font-semibold">
                  {t('markdownSource')}
                </h2>
                <span className="font-mono text-xs text-[#757575]">
                  {content.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-0 flex-1 resize-none bg-white px-4 py-5 font-mono text-sm leading-7 text-[var(--ink)] caret-[#0075de] placeholder:text-[#757575] focus:bg-[#f6f5f4] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#0075de] sm:px-6"
                placeholder={t('markdownWritePlaceholder')}
                aria-label={tCommon('markdownSourceContent')}
                spellCheck={false}
              />
            </section>
          )}

          {(activeTab === 'preview' || activeTab === 'split') && (
            <section
              className="flex min-h-[360px] flex-col overflow-hidden bg-[#f6f5f4]"
              aria-labelledby="markdown-preview-title"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-[#e6f3fe] px-4 py-2.5">
                <h2 id="markdown-preview-title" className="text-sm font-semibold">
                  {t('markdownPreview')}
                </h2>
                <span className="text-xs text-[#757575]">
                  {t('markdownUnsafeStripped')}
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                <article
                  className="prose-doc max-w-none border border-black/10 bg-white p-5 sm:p-8"
                  dangerouslySetInnerHTML={{
                    __html: renderedPreview,
                  }}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}
