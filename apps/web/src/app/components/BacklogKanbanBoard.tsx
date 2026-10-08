'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Ban,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code,
  Copy,
  Flame,
  Layers,
  ListChecks,
  Shield,
} from 'lucide-react'

import { cn } from '@/lib/ui'
import { Button, StatusBadge } from './ui'

export type TaskStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'DONE'

export interface KanbanTask {
  id: string
  taskKey: string
  title: string
  description: string
  status: TaskStatus
  acceptanceCriteria: string[]
  definitionOfDone: string
  relevantDocs: string[]
  recommendedSkills: string[]
  dependencies: string[]
  phaseId: string
  phaseName: string
  phaseOrder: number
}

interface BacklogKanbanBoardProps {
  projectId: string
  phases: Array<{
    id: string
    name: string
    order: number
    description: string | null
    tasks: Array<{
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
    }>
  }>
  targetAgent?: string
  onTaskUpdated?: (task: { id: string; taskKey: string; status: string }) => void
}

const COLUMNS: Array<{
  id: TaskStatus
  label: string
  sublabel: string
  color: string
  badgeTone: 'neutral' | 'pending' | 'accent' | 'current' | 'success'
  icon: typeof ListChecks
}> = [
  {
    id: 'PENDING',
    label: 'Backlog',
    sublabel: 'Waiting on prerequisites',
    color: '#615d59',
    badgeTone: 'neutral',
    icon: Clock,
  },
  {
    id: 'READY',
    label: 'To Do',
    sublabel: 'Ready for execution',
    color: '#ffb110',
    badgeTone: 'pending',
    icon: Flame,
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Process',
    sublabel: 'Agent / dev working',
    color: '#0075de',
    badgeTone: 'accent',
    icon: Code,
  },
  {
    id: 'BLOCKED',
    label: 'Blocked',
    sublabel: 'Waiting on a dependency',
    color: '#e32d14',
    badgeTone: 'current',
    icon: Ban,
  },
  {
    id: 'REVIEW',
    label: 'Review',
    sublabel: 'Verification & tests',
    color: '#8176d9',
    badgeTone: 'current',
    icon: Shield,
  },
  {
    id: 'DONE',
    label: 'Done',
    sublabel: 'Completed & verified',
    color: '#62b894',
    badgeTone: 'success',
    icon: CheckCircle2,
  },
]

export function BacklogKanbanBoard({
  projectId,
  phases,
  targetAgent = 'CLAUDE_CODE',
  onTaskUpdated,
}: BacklogKanbanBoardProps) {
  const t = useTranslations('Workspace')
  const getColumnLabel = (status: TaskStatus) => {
    const key =
      status === 'IN_PROGRESS'
        ? 'backlogColumnInProgress'
        : `backlogColumn${status.charAt(0) + status.slice(1).toLowerCase()}`
    return t(key as Parameters<typeof t>[0])
  }

  // Flatten tasks with phase info
  const initialTasks: KanbanTask[] = phases.flatMap((phase) =>
    phase.tasks.map((task) => ({
      ...task,
      status: (task.status as TaskStatus) || 'PENDING',
      phaseId: phase.id,
      phaseName: phase.name,
      phaseOrder: phase.order,
    })),
  )

  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks)
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [copiedTaskKey, setCopiedTaskKey] = useState<string | null>(null)
  const [boardMessage, setBoardMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  )
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  // Map task IDs to taskKeys for dependency labels
  const taskKeyById = new Map(tasks.map((t) => [t.id, t.taskKey]))

  // Filter tasks by phase and search query
  const filteredTasks = tasks.filter((task) => {
    const matchesPhase = selectedPhase === 'ALL' || task.phaseId === selectedPhase
    const matchesSearch =
      searchQuery === '' ||
      task.taskKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesPhase && matchesSearch
  })

  // Update task status via API
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const target = tasks.find((t) => t.id === taskId || t.taskKey === taskId)
    const taskKey = target?.taskKey || taskId
    setMovingTaskId(taskId)
    setBoardMessage(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, taskKey }),
      })

      const data = (await response.json().catch(() => null)) as {
        task?: { id: string; taskKey: string; status: string }
        affectedTasks?: Array<{ id: string; taskKey: string; status: string }>
        error?: string
      } | null

      if (!response.ok || !data?.task) {
        setBoardMessage({
          type: 'err',
          text: data?.error ?? t('backlogTaskUpdateFailed'),
        })
        return
      }

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (
            t.id === taskId ||
            t.taskKey === taskId ||
            t.id === data.task?.id ||
            t.taskKey === data.task?.taskKey
          ) {
            return { ...t, status: newStatus }
          }
          // Also update any auto-promoted/demoted dependent tasks
          const affected = data.affectedTasks?.find((a) => a.id === t.id || a.taskKey === t.taskKey)
          if (affected) {
            return { ...t, status: affected.status as TaskStatus }
          }
          return t
        }),
      )

      if (data.affectedTasks && data.affectedTasks.length > 0) {
        const promotedKeys = data.affectedTasks.map((a) => a.taskKey).join(', ')
        setBoardMessage({
          type: 'ok',
          text: t('backlogTaskMoved', {
            task: taskKey,
            status: getColumnLabel(newStatus),
            dependencies: promotedKeys,
          }),
        })
      }

      if (onTaskUpdated && data.task) {
        onTaskUpdated(data.task)
      }
    } catch (err) {
      setBoardMessage({
        type: 'err',
        text: err instanceof Error ? err.message : t('backlogTaskUpdateNetworkError'),
      })
    } finally {
      setMovingTaskId(null)
    }
  }

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
    setDraggedTaskId(null)

    if (!taskId) return

    const task = tasks.find((t) => t.id === taskId || t.taskKey === taskId)
    if (task && task.status !== targetStatus) {
      await handleUpdateTaskStatus(taskId, targetStatus)
    }
  }

  const buildTaskExecutionPrompt = (taskKey: string) => {
    const task = tasks.find((t) => t.taskKey === taskKey || t.id === taskKey)
    if (!task) {
      return `Read Agent.md and execute task ${taskKey} from BACKLOG.md as ${targetAgent} following all acceptance criteria.`
    }

    let p = `Read Agent.md and execute task ${task.taskKey} from BACKLOG.md as ${targetAgent}.\n\n`
    p += `### Task ${task.taskKey}: ${task.title}\n`
    p += `Description: ${task.description}\n`
    if (task.acceptanceCriteria && task.acceptanceCriteria.length > 0) {
      p += `\nAcceptance Criteria:\n- ${task.acceptanceCriteria.join('\n- ')}\n`
    }
    if (task.definitionOfDone) {
      p += `\nDefinition of Done: ${task.definitionOfDone}\n`
    }
    if (task.relevantDocs && task.relevantDocs.length > 0) {
      p += `\nRelevant Docs: ${task.relevantDocs.join(', ')}\n`
    }
    if (task.recommendedSkills && task.recommendedSkills.length > 0) {
      p += `\nSkills: ${task.recommendedSkills.join(', ')}\n`
    }
    p += `\nPlease implement this task following all quality gates, and verify the acceptance criteria before reporting.`
    return p
  }

  const handleCopyTaskPrompt = (taskKey: string) => {
    const prompt = buildTaskExecutionPrompt(taskKey)
    void navigator.clipboard.writeText(prompt)
    setCopiedTaskKey(taskKey)
    setCopyMessage(t('backlogPromptCopied'))
    setTimeout(() => {
      setCopiedTaskKey(null)
      setCopyMessage(null)
    }, 2000)
  }

  const handleCopyQuickPrompt = (taskKey: string) => {
    const task = tasks.find((t) => t.taskKey === taskKey || t.id === taskKey)
    const title = task?.title ? ` (${task.title})` : ''
    const prompt = `Read Agent.md and execute task ${taskKey}${title} from BACKLOG.md as ${targetAgent}. Follow all acceptance criteria and quality gates.`
    void navigator.clipboard.writeText(prompt)
    setCopiedTaskKey(taskKey)
    setCopyMessage(t('backlogPromptCopied'))
    setTimeout(() => {
      setCopiedTaskKey(null)
      setCopyMessage(null)
    }, 2000)
  }

  const nextReadyTask = tasks.find((t) => t.status === 'READY')

  return (
    <div className="space-y-6">
      {/* Board Controls: Filters & Agent Live Gateway */}
      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#f6f5f4] px-3 py-1.5 font-mono text-xs font-medium text-[var(--ink)]">
            <Bot size={14} className="text-[#0075de]" aria-hidden="true" />
            <span>{t('agentLabel', { agent: targetAgent })}</span>
          </div>

          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#615d59]" aria-hidden="true" />
            <label htmlFor="phase-filter" className="text-xs font-medium">
              {t('phaseLabel')}
            </label>
            <select
              id="phase-filter"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="rounded-md border border-black/10 bg-white px-2.5 py-1.5 font-mono text-xs font-medium text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]"
            >
              <option value="ALL">{t('allPhases', { count: phases.length })}</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('backlogSearch')}
              aria-label={t('backlogSearch')}
              className="w-48 rounded-md border border-black/10 bg-white px-3 py-1.5 font-mono text-xs font-medium text-[var(--ink)] placeholder:text-[#615d59] focus:w-64 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]"
            />
          </div>
        </div>

        {nextReadyTask && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-[#fff4d6] px-3 py-2">
            <span className="font-mono text-[0.68rem] font-medium uppercase text-[#8a5b00]">
              {t('backlogNextAction')}:
            </span>
            <span className="font-mono text-xs font-semibold text-[#0075de]">
              {nextReadyTask.taskKey}
            </span>
            <span className="max-w-[200px] truncate text-xs font-medium text-[var(--ink)]">
              {nextReadyTask.title}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleCopyQuickPrompt(nextReadyTask.taskKey)}
              className="h-6 gap-1 px-2 text-[0.7rem]"
              title={t('backlogCopyPrompt')}
            >
              {copiedTaskKey === nextReadyTask.taskKey ? (
                <>
                  <Check size={12} aria-hidden="true" /> {t('backlogCopied')}
                </>
              ) : (
                <>
                  <Copy size={12} aria-hidden="true" /> {t('backlogCopyPrompt')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {copyMessage && (
        <p className="sr-only" role="status" aria-live="polite">
          {copyMessage}
        </p>
      )}

      {boardMessage && (
        <div
          role={boardMessage.type === 'err' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            'flex items-center justify-between rounded-lg border border-black/10 px-4 py-2.5 text-xs font-medium',
            boardMessage.type === 'ok'
              ? 'bg-[#e9f8f0] text-[#28734b]'
              : 'bg-[#fff0ed] text-[#b21f0b]',
          )}
        >
          <span>{boardMessage.text}</span>
          <button
            type="button"
            onClick={() => setBoardMessage(null)}
            className="ml-4 text-xs font-medium underline underline-offset-2 hover:no-underline"
          >
            {t('backlogDismiss')}
          </button>
        </div>
      )}

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id)
          const Icon = col.icon
          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              role="region"
              aria-labelledby={`backlog-column-${col.id}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={cn(
                'flex flex-col rounded-xl border border-black/10 bg-white p-3 transition-colors',
                isOver && 'bg-[#e6f3fe] ring-1 ring-[#0075de]/30',
              )}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between border-b border-black/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-[var(--ink)]" aria-hidden="true" />
                  <h3
                    id={`backlog-column-${col.id}`}
                    className="font-mono text-sm font-semibold tracking-tight text-[var(--ink)]"
                  >
                    {getColumnLabel(col.id)}
                  </h3>
                </div>
                <StatusBadge tone={col.badgeTone}>{colTasks.length}</StatusBadge>
              </div>

              {/* Task Cards List */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-black/10 bg-[#f6f5f4] p-3 text-center">
                    <p className="font-mono text-xs font-medium text-[#615d59]">
                      {t('backlogNoTasks', { column: getColumnLabel(col.id) })}
                    </p>
                    <p className="mt-1 text-[0.68rem] text-[#615d59]">
                      {t('backlogDragHint')}
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isExpanded = expandedTaskId === task.id
                    const isMoving = movingTaskId === task.id || movingTaskId === task.taskKey
                    const dependencyLabels = task.dependencies.map(
                      (depId) => taskKeyById.get(depId) ?? depId,
                    )

                    return (
                      <div
                        key={task.id}
                        draggable
                        tabIndex={0}
                        role="article"
                        aria-label={`${task.taskKey}: ${task.title}`}
                        onKeyDown={(event) => {
                          if (
                            event.currentTarget !== event.target ||
                            (event.key !== 'Enter' && event.key !== ' ')
                          ) {
                            return
                          }

                          event.preventDefault()
                          setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                        }}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={cn(
                          'group relative flex flex-col rounded-lg border border-black/10 bg-white p-3 transition-opacity',
                          isMoving && 'pointer-events-none opacity-50',
                          col.id === 'DONE' && 'bg-[#f6fbf8]',
                          col.id === 'IN_PROGRESS' && 'border-[#0075de]/30',
                        )}
                      >
                        {/* Task Card Header: ID, Title, Quick Move Dropdown */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-[#0075de]">
                            {task.taskKey}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* Quick status mover dropdown */}
                            <select
                              value={task.status}
                              disabled={isMoving}
                              onChange={(e) =>
                                handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                              }
                              className="rounded-md border border-black/10 bg-[#f6f5f4] px-1.5 py-1 font-mono text-[0.65rem] font-medium text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]"
                              aria-label={t('backlogMoveTask', { task: task.taskKey })}
                              title={t('backlogMoveTaskTitle')}
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  → {getColumnLabel(c.id)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Task Title */}
                        <h4 className="mt-1.5 text-xs font-semibold leading-snug tracking-tight text-[var(--ink)]">
                          {task.title}
                        </h4>

                        {/* Task Description Snippet */}
                        <p className="mt-1 line-clamp-2 text-[0.72rem] font-medium leading-4 text-[#615d59]">
                          {task.description}
                        </p>

                        {/* Tags / Metadata Pills */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full border border-black/10 bg-[#f6f5f4] px-2 py-0.5 font-mono text-[0.62rem] font-medium text-[#615d59]">
                            {t('backlogPhase', { order: task.phaseOrder })}
                          </span>

                          {dependencyLabels.length > 0 && (
                            <span
                              className="rounded-full border border-black/10 bg-[#fff4d6] px-2 py-0.5 font-mono text-[0.62rem] font-medium text-[#8a5b00]"
                              title={t('backlogDependsOn', { tasks: dependencyLabels.join(', ') })}
                            >
                              {t('backlogDependsShort', { tasks: dependencyLabels.join(',') })}
                            </span>
                          )}

                          {task.recommendedSkills.length > 0 && (
                            <span
                              className="rounded-full border border-black/10 bg-[#e9f8f0] px-2 py-0.5 font-mono text-[0.62rem] font-medium text-[#28734b]"
                              title={t('backlogSkill', {
                                skills: task.recommendedSkills.join(', '),
                              })}
                            >
                              {t('backlogSkillShort', { skills: task.recommendedSkills[0] })}
                            </span>
                          )}
                        </div>

                        {/* Expanded Details: Acceptance Criteria, DoD, Docs */}
                        {isExpanded && (
                          <div
                            id={`task-details-${task.id}`}
                            className="mt-3 space-y-2 border-t border-black/10 pt-2.5 text-[0.7rem]"
                          >
                            {task.acceptanceCriteria.length > 0 && (
                              <div>
                                <span className="block font-mono text-[0.65rem] font-medium uppercase text-[#615d59]">
                                  {t('backlogAcceptanceCriteria')}
                                </span>
                                <ul className="mt-1 list-disc space-y-0.5 pl-3.5">
                                  {task.acceptanceCriteria.map((ac, idx) => (
                                    <li key={idx} className="font-medium text-[var(--ink)]">
                                      {ac}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {task.definitionOfDone && (
                              <div>
                                <span className="block font-mono text-[0.65rem] font-medium uppercase text-[#615d59]">
                                  {t('backlogDefinitionOfDone')}
                                </span>
                                <p className="mt-0.5 font-medium text-[var(--ink)]">
                                  {task.definitionOfDone}
                                </p>
                              </div>
                            )}

                            {task.relevantDocs.length > 0 && (
                              <div>
                                <span className="block font-mono text-[0.65rem] font-medium uppercase text-[#615d59]">
                                  {t('backlogRelevantDocs')}
                                </span>
                                <p className="mt-0.5 font-mono text-[0.65rem] font-medium text-[#0075de]">
                                  {task.relevantDocs.join(', ')}
                                </p>
                              </div>
                            )}

                            <div className="pt-1">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCopyTaskPrompt(task.taskKey)}
                                className="w-full gap-1 py-1 text-[0.65rem]"
                              >
                                {copiedTaskKey === task.taskKey ? (
                                  <>
                                    <Check size={11} aria-hidden="true" />{' '}
                                    {t('backlogPromptCopiedButton')}
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} aria-hidden="true" />{' '}
                                    {t('backlogCopyTaskPrompt')}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Expand/Collapse Toggle Button */}
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={`task-details-${task.id}`}
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="mt-2.5 flex items-center justify-between border-t border-black/10 pt-1.5 font-mono text-[0.65rem] font-medium text-[#615d59] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]"
                        >
                          <span>{isExpanded ? t('backlogHideSpecs') : t('backlogViewSpecs')}</span>
                          <ChevronDown
                            size={12}
                            className={cn('transition-transform', isExpanded && 'rotate-180')}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
