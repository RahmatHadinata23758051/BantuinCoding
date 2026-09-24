'use client'

import { useState } from 'react'
import { renderMarkdownToHtml } from '@/lib/artifacts/sanitizer'
import { getArtifactStatusBadgeStyle } from '@/lib/artifacts/artifact-service'

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

export function MarkdownWorkspace({
  projectId,
  artifacts,
  onArtifactUpdated,
}: MarkdownWorkspaceProps) {
  const [selectedType, setSelectedType] = useState<string>(
    artifacts[0]?.type || 'PRD',
  )
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('split')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const activeArtifact = artifacts.find((a) => a.type === selectedType) || artifacts[0]
  const [content, setContent] = useState<string>(activeArtifact?.content || '')

  const handleSelectArtifact = (art: WorkspaceArtifactItem) => {
    setSelectedType(art.type)
    setContent(art.content)
    setSaveMessage(null)
  }

  const handleSave = async () => {
    if (!activeArtifact) return
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts/${activeArtifact.type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) throw new Error('Failed to save artifact')

      const data = await res.json()
      setSaveMessage('Saved & updated to MODIFIED')
      if (onArtifactUpdated && data.artifact) {
        onArtifactUpdated(data.artifact)
      }
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Save error')
    } finally {
      setIsSaving(false)
    }
  }

  if (artifacts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
        No generated artifacts available for this project yet.
      </div>
    )
  }

  const badge = activeArtifact ? getArtifactStatusBadgeStyle(activeArtifact.status) : null

  return (
    <div className="flex h-[750px] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100">
      {/* Sidebar document navigation */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Project Documents
        </h3>
        <div className="space-y-1">
          {artifacts.map((art) => {
            const isSelected = art.type === selectedType
            const artBadge = getArtifactStatusBadgeStyle(art.status)
            return (
              <button
                key={art.id}
                onClick={() => handleSelectArtifact(art)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-zinc-800 font-medium text-white'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{art.path}</span>
                <span
                  className={`ml-2 inline-block h-2 w-2 rounded-full ${
                    art.status === 'READY'
                      ? 'bg-emerald-400'
                      : art.status === 'MODIFIED'
                        ? 'bg-blue-400'
                        : art.status === 'OUTDATED'
                          ? 'bg-amber-400'
                          : art.status === 'FAILED'
                            ? 'bg-rose-400'
                            : 'bg-zinc-600'
                  }`}
                  title={artBadge.label}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Workspace Toolbar */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/30 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-zinc-200">
              {activeArtifact?.path}
            </span>
            {badge && (
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium ${badge.colorClass}`}
              >
                {badge.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="text-xs text-zinc-400">{saveMessage}</span>
            )}

            {/* View Mode Controls */}
            <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('editor')}
                className={`rounded-md px-3 py-1 ${
                  activeTab === 'editor'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setActiveTab('split')}
                className={`rounded-md px-3 py-1 ${
                  activeTab === 'split'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`rounded-md px-3 py-1 ${
                  activeTab === 'preview'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Preview
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Markdown Code Editor */}
          {(activeTab === 'editor' || activeTab === 'split') && (
            <div
              className={`h-full ${
                activeTab === 'split' ? 'w-1/2 border-r border-zinc-800' : 'w-full'
              }`}
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-full w-full resize-none bg-zinc-950 p-6 font-mono text-sm leading-relaxed text-zinc-200 outline-none focus:ring-0"
                placeholder="Write markdown content..."
              />
            </div>
          )}

          {/* Sanitized HTML Preview Pane */}
          {(activeTab === 'preview' || activeTab === 'split') && (
            <div
              className={`h-full overflow-y-auto bg-zinc-900/20 p-6 ${
                activeTab === 'split' ? 'w-1/2' : 'w-full'
              }`}
            >
              <div
                className="prose prose-invert max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-code:rounded prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-emerald-400"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownToHtml(content),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
