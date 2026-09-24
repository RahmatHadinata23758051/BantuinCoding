'use client'

import { useState } from 'react'
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

export function ProjectWorkspaceContainer({ initialData }: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'context' | 'documents' | 'skills' | 'backlog' | 'export'
  >('overview')

  const [artifacts, setArtifacts] = useState<WorkspaceArtifactItem[]>(
    initialData.artifacts,
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [genMessage, setGenMessage] = useState<string | null>(null)

  const handleArtifactUpdated = (updated: WorkspaceArtifactItem) => {
    setArtifacts((prev) =>
      prev.map((a) => (a.type === updated.type ? updated : a)),
    )
  }

  const handleGenerateAll = async () => {
    setIsGenerating(true)
    setGenMessage(null)

    try {
      // 1. Generate Core (PRD, SRS, Architecture)
      await fetch(`/api/projects/${initialData.id}/generate`, { method: 'POST' })
      // 2. Resolve Skills
      await fetch(`/api/projects/${initialData.id}/skills`, { method: 'POST' })
      // 3. Generate Backlog
      await fetch(`/api/projects/${initialData.id}/backlog`, { method: 'POST' })

      setGenMessage('All artifacts successfully generated!')
      window.location.reload()
    } catch {
      setGenMessage('Generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 font-mono text-zinc-100">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-3">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            ← Dashboard
          </a>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-semibold text-zinc-200">
            {initialData.name}
          </h1>
          <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-400">
            {initialData.classification}
          </span>
          <span className="rounded border border-emerald-900/60 bg-emerald-950/40 px-2 py-0.5 text-xs text-emerald-400">
            {initialData.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {genMessage && (
            <span className="text-xs text-zinc-400">{genMessage}</span>
          )}
          <button
            onClick={handleGenerateAll}
            disabled={isGenerating}
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isGenerating ? 'Generating Pack...' : 'Generate Full Pack'}
          </button>
        </div>
      </header>

      {/* 6 Workspace Tabs Navigation */}
      <nav className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 text-xs font-medium">
        {(
          [
            'overview',
            'context',
            'documents',
            'skills',
            'backlog',
            'export',
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 capitalize transition-colors ${
              activeTab === tab
                ? 'border-indigo-500 font-semibold text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="text-xs text-zinc-500 uppercase">Target Agent</span>
                <p className="mt-1 text-base font-semibold text-zinc-200">
                  {initialData.targetAgent}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="text-xs text-zinc-500 uppercase">
                  Context Snapshot
                </span>
                <p className="mt-1 text-base font-semibold text-zinc-200">
                  Version {initialData.contextVersion}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="text-xs text-zinc-500 uppercase">
                  Document Readiness
                </span>
                <p className="mt-1 text-base font-semibold text-emerald-400">
                  {artifacts.filter((a) => a.status === 'READY' || a.status === 'MODIFIED').length} / {artifacts.length} Docs Ready
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
              <h3 className="text-sm font-semibold text-zinc-200">
                Project Summary & Goal
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {initialData.description || 'No raw description provided.'}
              </p>
            </div>
          </div>
        )}

        {/* CONTEXT TAB */}
        {activeTab === 'context' && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-200">
              Canonical Project Context (Version {initialData.contextVersion})
            </h3>
            <pre className="max-h-[600px] overflow-auto rounded-lg bg-zinc-900 p-4 text-xs leading-relaxed text-emerald-400">
              {JSON.stringify(initialData.context, null, 2)}
            </pre>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <MarkdownWorkspace
            projectId={initialData.id}
            artifacts={artifacts}
            onArtifactUpdated={handleArtifactUpdated}
          />
        )}

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200">
              Resolved Agent Skills ({initialData.skills.length})
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {initialData.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-indigo-400">
                      `{skill.name}`
                    </span>
                    <span className="text-xs text-zinc-500">{skill.source}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-300">{skill.purpose}</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    <strong className="text-zinc-300">Trigger:</strong>{' '}
                    {skill.trigger}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BACKLOG TAB */}
        {activeTab === 'backlog' && (
          <div className="space-y-6">
            {initialData.phases.map((phase) => (
              <div
                key={phase.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"
              >
                <h3 className="text-sm font-semibold text-zinc-200">
                  {phase.name}
                </h3>
                {phase.description && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {phase.description}
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950 p-4"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-indigo-400">
                            {task.taskKey}
                          </span>
                          <span className="text-sm font-medium text-zinc-200">
                            {task.title}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {task.description}
                        </p>
                      </div>

                      <span
                        className={`rounded px-2.5 py-1 text-xs font-semibold ${
                          task.status === 'READY'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <h3 className="text-lg font-semibold text-zinc-100">
              Download Project Bootstrap Pack
            </h3>
            <p className="mt-2 text-xs text-zinc-400">
              Export all generated documents as a secure, zero-secret ZIP pack.
            </p>
            <a
              href={`/api/projects/${initialData.id}/export`}
              download
              className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Download ZIP Pack (.zip)
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
