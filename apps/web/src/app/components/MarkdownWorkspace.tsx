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
      return 'bg-[var(--pass-teal)]'
    case 'MODIFIED':
      return 'bg-[var(--workspace-primary)]'
    case 'OUTDATED':
      return 'bg-[var(--workspace-sun)]'
    case 'FAILED':
      return 'bg-[var(--workspace-rose)]'
    case 'GENERATING':
      return 'bg-[var(--workspace-primary)] motion-safe:animate-pulse-dot'
    default:
      return 'bg-[var(--workspace-muted)]'
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'READY':
      return 'border border-[#2d8d6b]/30 bg-[var(--workspace-mint-soft)] text-[#1b6a4e]'
    case 'MODIFIED':
      return 'border border-[var(--workspace-primary)]/20 bg-[var(--workspace-yellow-soft)] text-[var(--workspace-deep)]'
    case 'OUTDATED':
      return 'border border-[var(--workspace-sun)]/30 bg-[var(--workspace-peach)] text-[var(--workspace-ink)]'
    case 'FAILED':
      return 'border border-[var(--workspace-rose)]/20 bg-[var(--workspace-rose-soft)] text-[var(--workspace-rose)]'
    case 'GENERATING':
      return 'border border-[var(--workspace-primary)]/20 bg-[var(--workspace-blue-soft)] text-[var(--workspace-deep)]'
    default:
      return 'border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] text-[var(--workspace-muted)]'
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
      <Panel
        className="border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-8 text-center text-[var(--workspace-ink)]"
        aria-label={t('markdownWorkspace')}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <FileText className="size-9 text-[var(--workspace-muted)]" aria-hidden="true" />
          <p className="text-sm font-semibold leading-6 text-[var(--workspace-muted)]">{t('markdownEmpty')}</p>
        </div>
      </Panel>
    )
  }

  const badge = activeArtifact ? getArtifactStatusBadgeStyle(activeArtifact.status) : null
  const badgeClassName = getStatusBadgeClass(activeArtifact?.status || '')

  return (
    <section
      className="flex min-h-[600px] w-full flex-col overflow-hidden rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-paper)] text-[var(--workspace-ink)] sm:min-h-[760px] lg:h-[760px] lg:flex-row"
      aria-label={t('markdownWorkspace')}
    >
      <aside
        className="flex min-h-0 w-full flex-col overflow-hidden border-b border-[var(--workspace-border)] bg-[var(--workspace-canvas)] lg:h-full lg:max-h-full lg:w-80 lg:flex-shrink-0 lg:border-b-0 lg:border-r"
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-4 py-4">
          <PanelLeft className="mt-0.5 size-5 flex-shrink-0 text-[var(--workspace-primary)]" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-[-0.02em] text-[var(--workspace-ink)]">{t('markdownDocuments')}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--workspace-muted)]">{t('markdownDocumentsDesc')}</p>
          </div>
        </div>

        <nav
          className="flex min-h-0 min-w-0 flex-1 gap-3 overflow-x-auto p-3 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto"
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
                  'w-full min-w-[15rem] rounded-xl border border-[var(--workspace-border)] px-3 py-3 text-left transition-colors lg:min-w-0',
                  isSelected
                    ? 'bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)] ring-1 ring-[var(--workspace-primary)]/20'
                    : 'bg-[var(--workspace-paper)] text-[var(--workspace-ink)] hover:bg-[var(--workspace-canvas)]',
                )}
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm font-medium leading-5 text-[var(--workspace-ink)]">{artifact.path}</span>
                    <span
                      className={cn(
                        'mt-1 block truncate text-xs leading-5',
                        isSelected
                          ? 'font-medium text-[var(--workspace-deep)]'
                          : 'text-[var(--workspace-muted)]',
                      )}
                    >
                      {artifactBadge.label}
                    </span>
                  </span>
                  <span
                    className={cn('mt-1 size-2.5 flex-shrink-0 rounded-full', getStatusDotClass(artifact.status))}
                    title={artifactBadge.label}
                    aria-label={artifactBadge.label}
                  />
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--workspace-canvas)]">
        <header className="border-b border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="min-w-0 max-w-full truncate font-mono text-base font-semibold tracking-tight text-[var(--workspace-ink)]">{activeArtifact?.path}</h1>
                {activeArtifact && <StatusBadge className={badgeClassName} tone={statusTone(activeArtifact.status)}>{badge?.label}</StatusBadge>}
                <span className="text-xs text-[var(--workspace-muted)]">
                  {activeArtifact ? t('updated', { date: formatUpdatedAt(activeArtifact.updatedAt) }) : t('markdownNoArtifact')}
                </span>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
              {saveMessage && (
                <span
                  className={cn(
                    'rounded-md px-2 py-1 text-xs font-medium',
                    saveMessageType === 'error'
                      ? 'bg-[var(--workspace-rose-soft)] text-[var(--workspace-rose)]'
                      : 'bg-[var(--workspace-mint-soft)] text-[#1b6a4e]',
                  )}
                  role={saveMessageType === 'error' ? 'alert' : 'status'}
                  aria-live={saveMessageType === 'error' ? 'assertive' : 'polite'}
                >
                  {saveMessage}
                </span>
              )}

              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                <div
                  className="grid min-w-0 flex-1 grid-cols-3 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] p-1 sm:flex-none"
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
                          'inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 py-2 text-xs font-medium transition-colors sm:min-w-24 sm:gap-2 sm:px-3',
                          isActive
                            ? 'border-[var(--workspace-primary)]/20 bg-[var(--workspace-paper)] text-[var(--workspace-primary)]'
                            : 'text-[var(--workspace-muted)] hover:bg-[var(--workspace-paper)] hover:text-[var(--workspace-ink)]',
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                        {label}
                      </button>
                    )
                  })}
                </div>

                {activeArtifact && (
                  <Button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isRegenerating || isSaving}
                    variant="secondary"
                    className="gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] text-[var(--workspace-ink)] hover:bg-[var(--workspace-yellow-soft)]"
                    aria-busy={isRegenerating}
                  >
                    {isRegenerating ? <Loader2 className="motion-safe:animate-spin size-4" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
                    {isRegenerating ? t('markdownRegenerating') : t('markdownRegenerate')}
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="success"
                  className="bg-[var(--workspace-mint-soft)] text-[var(--workspace-deep)] hover:bg-[var(--workspace-mint)]"
                >
                  {isSaving ? <Loader2 className="motion-safe:animate-spin size-4" aria-hidden="true" /> : saveMessageType === 'status' && saveMessage ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                  {isSaving ? t('markdownSaving') : t('markdownSave')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className={cn('grid min-h-0 flex-1 overflow-hidden', activeTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1')}>
          {(activeTab === 'editor' || activeTab === 'split') && (
            <section
              className={cn(
                'flex min-h-[360px] flex-col overflow-hidden bg-[var(--workspace-canvas)] text-[var(--workspace-ink)]',
                activeTab === 'split' && 'border-b border-[var(--workspace-border)] lg:border-b-0 lg:border-r',
              )}
              aria-labelledby="markdown-editor-title"
            >
              <div className="flex items-center justify-between border-b border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-4 py-2.5">
                <h2 id="markdown-editor-title" className="text-sm font-semibold text-[var(--workspace-ink)]">{t('markdownSource')}</h2>
                <span className="font-mono text-xs text-[var(--workspace-muted)]">{content.length.toLocaleString()} chars</span>
              </div>
              <textarea
                data-lenis-prevent-wheel
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="pointer-events-auto min-h-0 flex-1 cursor-text resize-none select-text overscroll-contain bg-[var(--workspace-paper)] px-4 py-5 font-mono text-sm leading-7 text-[var(--workspace-body)] caret-[var(--workspace-primary)] placeholder:text-[var(--workspace-muted)] focus:bg-[var(--workspace-canvas)] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--workspace-primary)] sm:px-6"
                placeholder={t('markdownWritePlaceholder')}
                aria-label={tCommon('markdownSourceContent')}
                spellCheck={false}
              />
            </section>
          )}

          {(activeTab === 'preview' || activeTab === 'split') && (
            <section className="flex min-h-[360px] flex-col overflow-hidden bg-[var(--workspace-canvas)]" aria-labelledby="markdown-preview-title">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-4 py-2.5">
                <h2 id="markdown-preview-title" className="text-sm font-semibold text-[var(--workspace-ink)]">{t('markdownPreview')}</h2>
                <span className="text-xs text-[var(--workspace-muted)]">{t('markdownUnsafeStripped')}</span>
              </div>
              <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                <article
                  className="prose-doc max-w-none border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-5 sm:p-8"
                  dangerouslySetInnerHTML={{ __html: renderedPreview }}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}
