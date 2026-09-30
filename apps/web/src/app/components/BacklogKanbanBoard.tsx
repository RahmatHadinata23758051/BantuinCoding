'use client'

import { useState } from 'react'
import {
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

export type TaskStatus = 'PENDING' | 'READY' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'

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
    color: 'var(--paper-muted)',
    badgeTone: 'neutral',
    icon: Clock,
  },
  {
    id: 'READY',
    label: 'To Do',
    sublabel: 'Ready for execution',
    color: 'var(--electric-yellow)',
    badgeTone: 'pending',
    icon: Flame,
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Process',
    sublabel: 'Agent / dev working',
    color: 'var(--cobalt)',
    badgeTone: 'accent',
    icon: Code,
  },
  {
    id: 'REVIEW',
    label: 'Review',
    sublabel: 'Verification & tests',
    color: 'var(--lavender)',
    badgeTone: 'current',
    icon: Shield,
  },
  {
    id: 'DONE',
    label: 'Done',
    sublabel: 'Completed & verified',
    color: 'var(--mint)',
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
  const [boardMessage, setBoardMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

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
          text: data?.error ?? 'Task status update failed. Please refresh the page and retry.',
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
          const affected = data.affectedTasks?.find(
            (a) => a.id === t.id || a.taskKey === t.taskKey,
          )
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
          text: `Task ${taskKey} moved to ${newStatus}. Dependent tasks unblocked: ${promotedKeys}!`,
        })
      }

      if (onTaskUpdated && data.task) {
        onTaskUpdated(data.task)
      }
    } catch (err) {
      setBoardMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Network error updating task status.',
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
    setTimeout(() => setCopiedTaskKey(null), 2000)
  }

  const handleCopyQuickPrompt = (taskKey: string) => {
    const task = tasks.find((t) => t.taskKey === taskKey || t.id === taskKey)
    const title = task?.title ? ` (${task.title})` : ''
    const prompt = `Read Agent.md and execute task ${taskKey}${title} from BACKLOG.md as ${targetAgent}. Follow all acceptance criteria and quality gates.`
    void navigator.clipboard.writeText(prompt)
    setCopiedTaskKey(taskKey)
    setTimeout(() => setCopiedTaskKey(null), 2000)
  }

  const nextReadyTask = tasks.find((t) => t.status === 'READY')

  return (
    <div className="space-y-6">
      {/* Board Controls: Filters & Agent Live Gateway */}
      <div className="flex flex-col gap-4 border-2 border-[var(--ink)] bg-[var(--paper-raised)] p-4 shadow-[var(--shadow-sm)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 border-2 border-[var(--ink)] bg-[var(--paper)] px-2.5 py-1 font-mono text-xs font-black shadow-[var(--shadow-xs)]">
            <Bot size={14} className="text-[var(--cobalt)]" aria-hidden="true" />
            <span>Agent: {targetAgent}</span>
          </div>

          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[var(--paper-muted)]" aria-hidden="true" />
            <label htmlFor="phase-filter" className="text-xs font-black">
              Phase:
            </label>
            <select
              id="phase-filter"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="border-2 border-[var(--ink)] bg-[var(--paper)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--ink)] shadow-[var(--shadow-xs)]"
            >
              <option value="ALL">All Phases ({phases.length})</option>
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
              placeholder="Search tasks..."
              className="w-48 border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-1 font-mono text-xs font-bold text-[var(--ink)] shadow-[var(--shadow-xs)] placeholder:text-[var(--paper-muted)] focus:w-64 focus:outline-none"
            />
          </div>
        </div>

        {nextReadyTask && (
          <div className="flex items-center gap-2 border-2 border-[var(--ink)] bg-[var(--electric-yellow-dim)] px-3 py-1.5 shadow-[var(--shadow-xs)]">
            <span className="font-mono text-[0.68rem] font-black uppercase text-[var(--ink)]">
              Next Action:
            </span>
            <span className="font-mono text-xs font-black text-[var(--cobalt)]">
              {nextReadyTask.taskKey}
            </span>
            <span className="max-w-[200px] truncate text-xs font-bold text-[var(--ink)]">
              {nextReadyTask.title}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleCopyQuickPrompt(nextReadyTask.taskKey)}
              className="h-6 gap-1 px-2 text-[0.7rem]"
              title="Copy prompt for coding agent"
            >
              {copiedTaskKey === nextReadyTask.taskKey ? (
                <>
                  <Check size={12} aria-hidden="true" /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} aria-hidden="true" /> Copy Prompt
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {boardMessage && (
        <div
          role={boardMessage.type === 'err' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            'flex items-center justify-between border-2 border-[var(--ink)] px-4 py-2.5 font-mono text-xs font-bold shadow-[var(--shadow-xs)]',
            boardMessage.type === 'ok'
              ? 'bg-[var(--mint-dim)] text-[var(--ink)]'
              : 'bg-[var(--action-red-dim)] text-[var(--ink)]',
          )}
        >
          <span>{boardMessage.text}</span>
          <button
            type="button"
            onClick={() => setBoardMessage(null)}
            className="text-xs font-black underline hover:no-underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id)
          const Icon = col.icon
          const isOver = dragOverColumn === col.id

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={cn(
                'flex flex-col border-2 border-[var(--ink)] bg-[var(--paper-raised)] p-3 shadow-[var(--shadow-sm)] transition-colors',
                isOver && 'bg-[var(--electric-yellow-dim)] ring-2 ring-[var(--cobalt)]',
              )}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between border-b-2 border-[var(--ink)] pb-2.5">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-[var(--ink)]" aria-hidden="true" />
                  <h3 className="font-mono text-sm font-black tracking-tight">{col.label}</h3>
                </div>
                <StatusBadge tone={col.badgeTone}>{colTasks.length}</StatusBadge>
              </div>

              {/* Task Cards List */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="flex h-28 flex-col items-center justify-center border-2 border-dashed border-[var(--paper-muted)] p-3 text-center">
                    <p className="font-mono text-xs font-bold text-[var(--paper-muted)]">
                      No tasks in {col.label}
                    </p>
                    <p className="mt-1 text-[0.68rem] text-[var(--paper-muted)]">
                      Drag tasks here or use card actions
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
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={cn(
                          'group relative flex flex-col border-2 border-[var(--ink)] bg-[var(--paper)] p-3 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]',
                          isMoving && 'opacity-50 pointer-events-none',
                          col.id === 'DONE' && 'bg-[var(--mint-dim)]/40',
                          col.id === 'IN_PROGRESS' && 'border-[var(--cobalt)]',
                        )}
                      >
                        {/* Task Card Header: ID, Title, Quick Move Dropdown */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-black text-[var(--cobalt)]">
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
                              className="border border-[var(--ink)] bg-[var(--paper-raised)] px-1 py-0.5 font-mono text-[0.65rem] font-bold text-[var(--ink)]"
                              title="Move task to column"
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  → {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Task Title */}
                        <h4 className="mt-1.5 text-xs font-black leading-snug tracking-tight text-[var(--ink)]">
                          {task.title}
                        </h4>

                        {/* Task Description Snippet */}
                        <p className="mt-1 line-clamp-2 text-[0.72rem] font-medium leading-4 text-[var(--paper-muted)]">
                          {task.description}
                        </p>

                        {/* Tags / Metadata Pills */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="border border-[var(--ink)] bg-[var(--paper-raised)] px-1.5 py-0.5 font-mono text-[0.62rem] font-bold">
                            P{task.phaseOrder}
                          </span>

                          {dependencyLabels.length > 0 && (
                            <span
                              className="border border-[var(--ink)] bg-[var(--electric-yellow-dim)] px-1.5 py-0.5 font-mono text-[0.62rem] font-bold text-[var(--ink)]"
                              title={`Depends on: ${dependencyLabels.join(', ')}`}
                            >
                              Dep: {dependencyLabels.join(',')}
                            </span>
                          )}

                          {task.recommendedSkills.length > 0 && (
                            <span
                              className="border border-[var(--ink)] bg-[var(--mint-dim)] px-1.5 py-0.5 font-mono text-[0.62rem] font-bold text-[var(--ink)]"
                              title={`Skill: ${task.recommendedSkills.join(', ')}`}
                            >
                              {task.recommendedSkills[0]}
                            </span>
                          )}
                        </div>

                        {/* Expanded Details: Acceptance Criteria, DoD, Docs */}
                        {isExpanded && (
                          <div className="mt-3 border-t-2 border-[var(--ink)] pt-2.5 text-[0.7rem] space-y-2">
                            {task.acceptanceCriteria.length > 0 && (
                              <div>
                                <span className="block font-mono text-[0.65rem] font-black uppercase text-[var(--paper-muted)]">
                                  Acceptance Criteria:
                                </span>
                                <ul className="mt-1 list-disc pl-3.5 space-y-0.5">
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
                                <span className="block font-mono text-[0.65rem] font-black uppercase text-[var(--paper-muted)]">
                                  Definition of Done:
                                </span>
                                <p className="mt-0.5 font-medium text-[var(--ink)]">
                                  {task.definitionOfDone}
                                </p>
                              </div>
                            )}

                            {task.relevantDocs.length > 0 && (
                              <div>
                                <span className="block font-mono text-[0.65rem] font-black uppercase text-[var(--paper-muted)]">
                                  Relevant Docs:
                                </span>
                                <p className="mt-0.5 font-mono text-[0.65rem] font-bold text-[var(--cobalt)]">
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
                                    <Check size={11} aria-hidden="true" /> Prompt Copied to Clipboard!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} aria-hidden="true" /> Copy Task Prompt
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Expand/Collapse Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="mt-2.5 flex items-center justify-between border-t border-[var(--ink)]/20 pt-1.5 font-mono text-[0.65rem] font-bold text-[var(--paper-muted)] hover:text-[var(--ink)]"
                        >
                          <span>{isExpanded ? 'Hide specs' : 'View specs & criteria'}</span>
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
