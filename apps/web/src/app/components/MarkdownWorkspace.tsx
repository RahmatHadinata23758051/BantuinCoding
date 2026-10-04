'use client'

import { useMemo, useState } from 'react'
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
      return 'bg-[var(--mint)]'
    case 'MODIFIED':
      return 'bg-[var(--cobalt)]'
    case 'OUTDATED':
      return 'bg-[var(--electric-yellow)]'
    case 'FAILED':
      return 'bg-[var(--action-red)]'
    case 'GENERATING':
      return 'bg-[var(--cobalt)] motion-safe:animate-pulse-dot'
    default:
      return 'bg-[var(--paper-dim)]'
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
  const [selectedType, setSelectedType] = useState<string>(artifacts[0]?.type || 'PRD')
  const [activeTab, setActiveTab] = useState<WorkspaceMode>('split')
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const activeArtifact = artifacts.find((artifact) => artifact.type === selectedType) || artifacts[0]
  const [content, setContent] = useState<string>(activeArtifact?.content || '')

  const renderedPreview = useMemo(() => renderMarkdownToHtml(content), [content])

  const handleSelectArtifact = (artifact: WorkspaceArtifactItem) => {
    setSelectedType(artifact.type)
    setContent(artifact.content)
    setSaveMessage(null)
  }

  const handleRegenerate = async () => {
    if (!activeArtifact) return
    setIsRegenerating(true)
    setSaveMessage(null)

    try {
      let endpoint = `/api/projects/${projectId}/generate`
      const body: Record<string, unknown> = { type: activeArtifact.type }

      if (activeArtifact.type === 'SKILLS') {
        endpoint = `/api/projects/${projectId}/skills`
      } else if (activeArtifact.type === 'BACKLOG') {
        endpoint = `/api/projects/${projectId}/backlog`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Regeneration failed')
      }

      const data = (await response.json()) as {
        artifacts?: Array<WorkspaceArtifactItem & { error?: string }>
        backlog?: { backlog_md_content: string }
        result?: { skills_md_content: string }
      }

      // Determine updated content based on endpoint type
      let newContent = ''
      let isFailed = false
      let errorMsg = ''

      if (activeArtifact.type === 'SKILLS' && data.result) {
        newContent = data.result.skills_md_content
      } else if (activeArtifact.type === 'BACKLOG' && data.backlog) {
        newContent = data.backlog.backlog_md_content
      } else if (data.artifacts) {
        const updated = data.artifacts.find((a) => a.type === activeArtifact.type)
        if (updated) {
          if (updated.status === 'FAILED') {
            isFailed = true
            errorMsg = updated.error || 'The model failed to produce document output. Please retry.'
          } else {
            newContent = updated.content
          }
        }
      }

      if (isFailed) {
        setSaveMessage(`Generation failed: ${errorMsg}`)
      } else if (newContent) {
        setContent(newContent)
        setSaveMessage('Saved. Document regenerated successfully!')
        if (onArtifactUpdated) {
          // Tell parent to update the artifact in the list
          onArtifactUpdated({
            ...activeArtifact,
            content: newContent,
            status: 'READY',
            updatedAt: new Date().toISOString(),
          })
        }
      } else {
        setSaveMessage('Regenerated. Refreshing…')
        window.location.reload()
      }
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Regeneration error')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleSave = async () => {
    if (!activeArtifact) return
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/artifacts/${activeArtifact.type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Failed to save artifact')
      }

      const data = (await response.json()) as { artifact?: WorkspaceArtifactItem }
      setSaveMessage('Saved. Artifact status changed to modified.')
      if (onArtifactUpdated && data.artifact) onArtifactUpdated(data.artifact)
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Save error')
    } finally {
      setIsSaving(false)
    }
  }

  if (artifacts.length === 0) {
    return (
      <Panel className="p-8 text-center" aria-label="Markdown workspace">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <FileText className="size-9 text-[var(--paper-muted)]" aria-hidden="true" />
          <p className="text-sm font-semibold leading-6 text-[var(--paper-muted)]">
            No generated artifacts are available for this project yet.
          </p>
        </div>
      </Panel>
    )
  }

  const badge = activeArtifact ? getArtifactStatusBadgeStyle(activeArtifact.status) : null
  const isSaveError = Boolean(saveMessage && !saveMessage.startsWith('Saved'))

  return (
    <section
      className="flex min-h-[760px] w-full flex-col overflow-hidden border-4 border-[var(--ink)] bg-[var(--paper-raised)] text-[var(--ink)] shadow-[var(--shadow-hero)] lg:h-[760px] lg:flex-row"
      aria-label="Markdown workspace"
    >
      <aside className="border-b-2 border-[var(--ink)] bg-[var(--lavender-dim)] lg:w-80 lg:flex-shrink-0 lg:border-b-0 lg:border-r-2">
        <div className="flex items-center gap-2.5 border-b-2 border-[var(--ink)] bg-[var(--lavender)] px-4 py-4">
          <PanelLeft className="size-5 text-[var(--ink)]" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-[-0.03em] text-[var(--ink)]">Project documents</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-[var(--ink-soft)]">Select an artifact to edit, compare, or preview.</p>
          </div>
        </div>


        <nav
          className="flex gap-2 overflow-x-auto p-2.5 lg:max-h-[calc(760px-57px)] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto"
          aria-label="Generated artifacts"
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
                  'nb-button-press min-w-[15rem] border-2 border-[var(--ink)] px-3 py-3 text-left shadow-[var(--shadow-xs)] lg:min-w-0',
                  isSelected
                    ? 'bg-[var(--electric-yellow)] text-[var(--ink)]'
                    : 'bg-[var(--paper-raised)] text-[var(--ink)] hover:bg-white',
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm font-black leading-5">
                      {artifact.path}
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold leading-5 text-[var(--paper-muted)]">
                      {artifactBadge.label}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-1 size-3 flex-shrink-0 border-2 border-[var(--ink)]',
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--paper)]">
        <header className="border-b-2 border-[var(--ink)] bg-[var(--paper-raised)]">
          <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-mono text-base font-black tracking-tight text-[var(--ink)]">
                  {activeArtifact?.path}
                </h1>
                {activeArtifact && <StatusBadge tone={statusTone(activeArtifact.status)}>{badge?.label}</StatusBadge>}
              </div>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-[var(--paper-muted)]">
                {activeArtifact
                  ? `Last updated ${formatUpdatedAt(activeArtifact.updatedAt)}`
                  : 'No artifact selected'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              {saveMessage && (
                <span
                  className={cn(
                    'text-xs font-bold mr-2',
                    isSaveError ? 'text-[var(--action-red)]' : 'text-[var(--pass-teal)]',
                  )}
                  role={isSaveError ? 'alert' : undefined}
                >
                  {saveMessage}
                </span>
              )}

              {activeArtifact && (
                <Button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isRegenerating || isSaving}
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-xs"
                  aria-busy={isRegenerating}
                >
                  {isRegenerating ? (
                    <Loader2 className="animate-spin size-4" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden="true" />
                  )}
                  {isRegenerating ? 'Regenerating…' : 'Regenerate'}
                </Button>
              )}

              <div
                className="grid grid-cols-3 border-2 border-[var(--ink)] bg-[var(--paper-raised)] p-1 shadow-[var(--shadow-xs)]"
                role="group"
                aria-label="Workspace view mode"
              >
                {viewModes.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      aria-pressed={isActive}
                      className={cn(
                        'inline-flex items-center justify-center gap-1.5 border-2 border-transparent px-3 py-1.5 text-xs font-black transition-colors',
                        isActive
                          ? 'border-[var(--ink)] bg-[var(--electric-yellow)] text-[var(--ink)]'
                          : 'text-[var(--paper-muted)] hover:border-[var(--ink)] hover:bg-white hover:text-[var(--ink)]',
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
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : saveMessage?.startsWith('Saved') ? (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
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
                'flex min-h-[360px] flex-col overflow-hidden bg-[var(--ink)] text-[var(--paper-raised)]',
                activeTab === 'split' && 'border-b-2 border-[var(--ink)] lg:border-b-0 lg:border-r-2',
              )}
              aria-labelledby="markdown-editor-title"
            >
              <div className="flex items-center justify-between border-b-2 border-[var(--paper-raised)] bg-[var(--ink)] px-4 py-2.5">
                <h2 id="markdown-editor-title" className="text-sm font-black text-[var(--paper-raised)]">
                  Markdown source
                </h2>
                <span className="font-mono text-xs text-[var(--paper-dim)]">
                  {content.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-0 flex-1 resize-none bg-[var(--ink)] px-4 py-5 font-mono text-sm leading-7 text-[var(--paper-raised)] caret-[var(--electric-yellow)] placeholder:text-[var(--paper-dim)] focus:bg-[var(--ink-soft)] focus-visible:outline-[3px] focus-visible:outline-offset-[-6px] focus-visible:outline-[var(--electric-yellow)] sm:px-6"
                placeholder="Write markdown content..."
                aria-label="Markdown source content"
                spellCheck={false}
              />
            </section>
          )}

          {(activeTab === 'preview' || activeTab === 'split') && (
            <section
              className="flex min-h-[360px] flex-col overflow-hidden bg-[var(--paper)]"
              aria-labelledby="markdown-preview-title"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--ink)] bg-[var(--mint-dim)] px-4 py-2.5">
                <h2 id="markdown-preview-title" className="text-sm font-black text-[var(--ink)]">
                  Sanitized preview
                </h2>
                <span className="text-xs font-bold text-[var(--paper-muted)]">
                  Scripts and unsafe HTML are stripped
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                <article
                  className="prose-doc bg-[var(--paper-raised)] p-5 shadow-[var(--shadow-sm)] border-2 border-[var(--ink)]"
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
