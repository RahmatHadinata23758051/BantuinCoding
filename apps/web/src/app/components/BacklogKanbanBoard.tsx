'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Copy, Layers } from 'lucide-react'

import { cn } from '@/lib/ui'
import { Button, Modal, StatusBadge } from './ui'

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
  onTaskUpdated?: (task: { id: string; taskKey: string; status: string }) => void
}

type StatusTone = 'neutral' | 'current' | 'pending' | 'success' | 'danger' | 'accent'

const STATUS_OPTIONS: TaskStatus[] = ['PENDING', 'READY', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE']

const statusTone = (status: TaskStatus): StatusTone => {
  switch (status) {
    case 'READY':
      return 'pending'
    case 'IN_PROGRESS':
      return 'accent'
    case 'BLOCKED':
      return 'danger'
    case 'REVIEW':
      return 'current'
    case 'DONE':
      return 'success'
    default:
      return 'neutral'
  }
}

export function BacklogKanbanBoard({
  projectId,
  phases,
  onTaskUpdated,
}: BacklogKanbanBoardProps) {
  const t = useTranslations('Workspace')
  const tCommon = useTranslations('Common')
  const [tasks, setTasks] = useState<KanbanTask[]>(() =>
    phases.flatMap((phase) =>
      phase.tasks.map((task) => ({
        ...task,
        status: (task.status as TaskStatus) || 'PENDING',
        phaseId: phase.id,
        phaseName: phase.name,
        phaseOrder: phase.order,
      })),
    ),
  )
  const [selectedPhase, setSelectedPhase] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [copiedTaskKey, setCopiedTaskKey] = useState<string | null>(null)
  const [boardMessage, setBoardMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  const getStatusLabel = (status: TaskStatus) => {
    const key =
      status === 'IN_PROGRESS'
        ? 'backlogColumnInProgress'
        : `backlogColumn${status.charAt(0) + status.slice(1).toLowerCase()}`
    return t(key as Parameters<typeof t>[0])
  }

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesPhase = selectedPhase === 'ALL' || task.phaseId === selectedPhase
      const matchesSearch =
        query === '' ||
        task.taskKey.toLowerCase().includes(query) ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      return matchesPhase && matchesSearch
    })
  }, [searchQuery, selectedPhase, tasks])

  const visiblePhases = useMemo(() => {
    const query = searchQuery.trim()
    return phases
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((phase) => ({
        ...phase,
        tasks: filteredTasks.filter((task) => task.phaseId === phase.id),
      }))
      .filter((phase) => query === '' || phase.tasks.length > 0)
  }, [filteredTasks, phases, searchQuery])

  const taskKeyById = new Map(tasks.map((task) => [task.id, task.taskKey]))

  const buildTaskExecutionPrompt = (taskKey: string) => {
    const task = tasks.find((item) => item.taskKey === taskKey || item.id === taskKey)
    if (!task) {
      return `Read Agent.md and execute task ${taskKey} from BACKLOG.md following all acceptance criteria.`
    }

    let prompt = `Read Agent.md and execute task ${task.taskKey} from BACKLOG.md.\n\n`
    prompt += `### Task ${task.taskKey}: ${task.title}\n`
    prompt += `Description: ${task.description}\n`
    if (task.acceptanceCriteria.length > 0) {
      prompt += `\nAcceptance Criteria:\n- ${task.acceptanceCriteria.join('\n- ')}\n`
    }
    if (task.definitionOfDone) {
      prompt += `\nDefinition of Done: ${task.definitionOfDone}\n`
    }
    if (task.relevantDocs.length > 0) {
      prompt += `\nRelevant Docs: ${task.relevantDocs.join(', ')}\n`
    }
    if (task.recommendedSkills.length > 0) {
      prompt += `\nSkills: ${task.recommendedSkills.join(', ')}\n`
    }
    prompt += '\nPlease implement this task following all quality gates, and verify the acceptance criteria before reporting.'
    return prompt
  }

  const copyPrompt = (taskKey: string) => {
    void navigator.clipboard.writeText(buildTaskExecutionPrompt(taskKey))
    setCopiedTaskKey(taskKey)
    setCopyMessage(t('backlogPromptCopied'))
    window.setTimeout(() => {
      setCopiedTaskKey(null)
      setCopyMessage(null)
    }, 2000)
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const target = tasks.find((task) => task.id === taskId || task.taskKey === taskId)
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
        setBoardMessage({ type: 'err', text: data?.error ?? t('backlogTaskUpdateFailed') })
        return
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) => {
          if (
            task.id === taskId ||
            task.taskKey === taskId ||
            task.id === data.task?.id ||
            task.taskKey === data.task?.taskKey
          ) {
            return { ...task, status: newStatus }
          }
          const affected = data.affectedTasks?.find(
            (item) => item.id === task.id || item.taskKey === task.taskKey,
          )
          return affected ? { ...task, status: affected.status as TaskStatus } : task
        }),
      )

      if (data.affectedTasks && data.affectedTasks.length > 0) {
        setBoardMessage({
          type: 'ok',
          text: t('backlogTaskMoved', {
            task: taskKey,
            status: getStatusLabel(newStatus),
            dependencies: data.affectedTasks.map((item) => item.taskKey).join(', '),
          }),
        })
      }
      onTaskUpdated?.(data.task)
    } catch (error) {
      setBoardMessage({
        type: 'err',
        text: error instanceof Error ? error.message : t('backlogTaskUpdateNetworkError'),
      })
    } finally {
      setMovingTaskId(null)
    }
  }

  const nextReadyTask = tasks.find((task) => task.status === 'READY')
  const selectedTask = selectedTaskId ? tasks.find((task) => task.id === selectedTaskId) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[var(--radius-cards)] border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[var(--workspace-primary)]" aria-hidden="true" />
            <label htmlFor="phase-filter" className="text-xs font-medium text-[var(--workspace-body)]">
              {t('phaseLabel')}
            </label>
            <select
              id="phase-filter"
              value={selectedPhase}
              onChange={(event) => setSelectedPhase(event.target.value)}
              className="rounded-[var(--radius-buttons)] border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] px-2.5 py-1.5 font-mono text-xs font-medium text-[var(--workspace-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-primary)]"
            >
              <option value="ALL">{t('allPhases', { count: phases.length })}</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('backlogSearch')}
            aria-label={t('backlogSearch')}
            className="w-48 rounded-[var(--radius-buttons)] border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] px-3 py-1.5 font-mono text-xs font-medium text-[var(--workspace-ink)] placeholder:text-[var(--workspace-muted)] focus:w-64 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-primary)]"
          />
        </div>

        {nextReadyTask && (
          <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-buttons)] border border-[#dfc777] bg-[var(--workspace-yellow-soft)] px-3 py-2">
            <span className="font-mono text-[0.68rem] font-medium uppercase text-[#8a5b00]">
              {t('backlogNextAction')}:
            </span>
            <span className="font-mono text-xs font-semibold text-[var(--workspace-primary)]">
              {nextReadyTask.taskKey}
            </span>
            <span className="max-w-[200px] truncate text-xs font-medium text-[var(--workspace-ink)]">
              {nextReadyTask.title}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => copyPrompt(nextReadyTask.taskKey)}
              className="h-6 gap-1 px-2 text-[0.7rem]"
              title={t('backlogCopyPrompt')}
            >
              {copiedTaskKey === nextReadyTask.taskKey ? (
                <><Check size={12} aria-hidden="true" /> {t('backlogCopied')}</>
              ) : (
                <><Copy size={12} aria-hidden="true" /> {t('backlogCopyPrompt')}</>
              )}
            </Button>
          </div>
        )}
      </div>

      {copyMessage && <p className="sr-only" role="status" aria-live="polite">{copyMessage}</p>}

      {boardMessage && (
        <div
          role={boardMessage.type === 'err' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            'flex items-center justify-between rounded-[var(--radius-buttons)] border border-[var(--workspace-border)] px-4 py-2.5 text-xs font-medium',
            boardMessage.type === 'ok'
              ? 'bg-[var(--workspace-mint-soft)] text-[#28734b]'
              : 'bg-[var(--workspace-rose-soft)] text-[#b21f0b]',
          )}
        >
          <span>{boardMessage.text}</span>
          <button
            type="button"
            onClick={() => setBoardMessage(null)}
            className="ml-4 text-xs font-medium underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-primary)]"
          >
            {t('backlogDismiss')}
          </button>
        </div>
      )}

      <div className="rounded-[var(--radius-cards)] border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--workspace-ink)]">{t('backlogMapTitle')}</h3>
            <p className="mt-1 text-xs text-[var(--workspace-muted)]">{t('backlogMapDescription')}</p>
          </div>
          <span className="font-mono text-[0.68rem] font-medium text-[var(--workspace-muted)]">
            {t('backlogMapHint')}
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-buttons)] border border-dashed border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-6 text-center">
            <p className="text-sm font-medium text-[var(--workspace-muted)]">{t('backlogNoMatchingTasks')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto overscroll-x-contain">
            <div
              className="grid min-w-max items-start gap-8 px-2 py-3"
              role="list"
              aria-label={t('backlogMapTitle')}
              style={{ gridTemplateColumns: `repeat(${visiblePhases.length}, minmax(248px, 280px))` }}
            >
              {visiblePhases.map((phase) => {
                const completed = phase.tasks.filter((task) => task.status === 'DONE').length
                return (
                  <section key={phase.id} role="listitem" aria-labelledby={`backlog-phase-${phase.id}`} className="space-y-4">
                    <div className="flex min-h-24 flex-col justify-center rounded-[1.25rem] border-2 border-[var(--workspace-primary)] bg-[var(--workspace-paper)] px-4 py-3 text-center shadow-sm">
                      <span className="font-mono text-[0.62rem] font-medium uppercase text-[var(--workspace-muted)]">
                        {t('backlogPhaseNumber', { order: phase.order })}
                      </span>
                      <h4 id={`backlog-phase-${phase.id}`} className="mt-1 text-sm font-semibold leading-5 text-[var(--workspace-ink)]">
                        {phase.name}
                      </h4>
                      <span className="mt-1 font-mono text-[0.62rem] text-[var(--workspace-muted)]">
                        {completed}/{phase.tasks.length} {t('backlogDoneLabel')}
                      </span>
                    </div>

                    <div className="space-y-4" role="list" aria-label={phase.name}>
                      {phase.tasks.length === 0 ? (
                        <div className="flex min-h-32 items-center justify-center rounded-[1rem] border border-dashed border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-4 text-center">
                          <p className="text-xs text-[var(--workspace-muted)]">{t('backlogNoMatchingTasks')}</p>
                        </div>
                      ) : (
                        phase.tasks.map((task) => {
                          const dependencyLabels = task.dependencies.map(
                            (dependency) => taskKeyById.get(dependency) ?? dependency,
                          )
                          const isMoving = movingTaskId === task.id || movingTaskId === task.taskKey
                          return (
                            <article
                              key={task.id}
                              role="listitem"
                              className={cn(
                                'rounded-[1rem] border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-3 shadow-sm transition-opacity',
                                isMoving && 'opacity-55',
                                task.status === 'DONE' && 'border-[#9dccb1] bg-[var(--workspace-mint-soft)]/45',
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-mono text-[0.68rem] font-semibold text-[var(--workspace-primary)]">
                                  {task.taskKey}
                                </span>
                                <select
                                  value={task.status}
                                  disabled={isMoving}
                                  onChange={(event) => {
                                    event.stopPropagation()
                                    void handleUpdateTaskStatus(task.id, event.target.value as TaskStatus)
                                  }}
                                  onClick={(event) => event.stopPropagation()}
                                  aria-label={t('backlogMoveTask', { task: task.taskKey })}
                                  title={t('backlogMoveTaskTitle')}
                                  className={cn(
                                    'min-h-6 max-w-[8rem] rounded-full border-0 px-2 py-1 text-[0.65rem] font-semibold leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-primary)]',
                                    statusTone(task.status) === 'neutral' && 'bg-[#f2f1f0] text-[var(--color-ink-black)]',
                                    statusTone(task.status) === 'current' && 'bg-[var(--color-notion-blue)] text-white',
                                    statusTone(task.status) === 'pending' && 'bg-[var(--electric-yellow-dim)] text-[var(--color-ink-black)]',
                                    statusTone(task.status) === 'success' && 'bg-[var(--mint-dim)] text-[#1b6a4e]',
                                    statusTone(task.status) === 'danger' && 'bg-[var(--action-red-dim)] text-[var(--color-vermillion)]',
                                    statusTone(task.status) === 'accent' && 'bg-[var(--lavender-dim)] text-[var(--color-midnight-ink)]',
                                  )}
                                >
                                  {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                      {getStatusLabel(status)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedTaskId(task.id)}
                                className="mt-2 block w-full text-left text-sm font-semibold leading-5 text-[var(--workspace-ink)] underline decoration-transparent underline-offset-4 transition-colors hover:text-[var(--workspace-primary)] hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-primary)]"
                              >
                                {task.title}
                              </button>
                              <p className="mt-1 line-clamp-2 text-xs leading-4 text-[var(--workspace-muted)]">{task.description}</p>

                              {(dependencyLabels.length > 0 || task.recommendedSkills.length > 0) && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {dependencyLabels.length > 0 && (
                                    <span
                                      className="rounded-full border border-[#dfc777] bg-[var(--workspace-yellow-soft)] px-2 py-1 font-mono text-[0.62rem] font-medium text-[#8a5b00]"
                                      title={t('backlogDependsOn', { tasks: dependencyLabels.join(', ') })}
                                    >
                                      {t('backlogDependsShort', { tasks: dependencyLabels.join(', ') })}
                                    </span>
                                  )}
                                  {task.recommendedSkills.length > 0 && (
                                    <span className="rounded-full border border-[#a9d9bf] bg-[var(--workspace-mint-soft)] px-2 py-1 font-mono text-[0.62rem] font-medium text-[#28734b]">
                                      {t('backlogSkillShort', { skills: task.recommendedSkills[0] })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </article>
                          )
                        })
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTaskId(null)}
        title={selectedTask ? `${selectedTask.taskKey} · ${selectedTask.title}` : ''}
        description={selectedTask?.phaseName}
        closeLabel={tCommon('closeModal')}
        className="max-w-2xl"
      >
        {selectedTask && (
          <div className="space-y-5 text-sm text-[var(--workspace-body)]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={statusTone(selectedTask.status)}>{getStatusLabel(selectedTask.status)}</StatusBadge>
              <span className="font-mono text-xs text-[var(--workspace-muted)]">{selectedTask.phaseName}</span>
            </div>

            <div>
              <h3 className="font-mono text-xs font-medium text-[var(--workspace-muted)]">{t('backlogDescription')}</h3>
              <p className="mt-1 leading-6">{selectedTask.description}</p>
            </div>

            {selectedTask.acceptanceCriteria.length > 0 && (
              <div>
                <h3 className="font-mono text-xs font-medium text-[var(--workspace-muted)]">{t('backlogAcceptanceCriteria')}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 leading-5">
                  {selectedTask.acceptanceCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
                </ul>
              </div>
            )}

            {selectedTask.definitionOfDone && (
              <div>
                <h3 className="font-mono text-xs font-medium text-[var(--workspace-muted)]">{t('backlogDefinitionOfDone')}</h3>
                <p className="mt-1 leading-6">{selectedTask.definitionOfDone}</p>
              </div>
            )}

            {selectedTask.relevantDocs.length > 0 && (
              <div>
                <h3 className="font-mono text-xs font-medium text-[var(--workspace-muted)]">{t('backlogRelevantDocs')}</h3>
                <p className="mt-1 font-mono text-xs leading-5 text-[var(--workspace-primary)]">{selectedTask.relevantDocs.join(', ')}</p>
              </div>
            )}

            {selectedTask.recommendedSkills.length > 0 && (
              <div>
                <h3 className="font-mono text-xs font-medium text-[var(--workspace-muted)]">{t('backlogSkill', { skills: '' }).replace(/: $/, ':')}</h3>
                <p className="mt-1 leading-5">{selectedTask.recommendedSkills.join(', ')}</p>
              </div>
            )}

            <div>
              <h3 className="font-mono text-xs font-medium text-[var(--workspace-muted)]">{t('backlogDependsOn', { tasks: '' }).replace(/: $/, ':')}</h3>
              <p className="mt-1 leading-5">
                {selectedTask.dependencies.length > 0
                  ? selectedTask.dependencies.map((dependency) => taskKeyById.get(dependency) ?? dependency).join(', ')
                  : t('backlogNoDependencies')}
              </p>
            </div>

            <Button type="button" variant="secondary" onClick={() => copyPrompt(selectedTask.taskKey)} className="w-full gap-2">
              {copiedTaskKey === selectedTask.taskKey ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copiedTaskKey === selectedTask.taskKey ? t('backlogPromptCopiedButton') : t('backlogCopyTaskPrompt')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
