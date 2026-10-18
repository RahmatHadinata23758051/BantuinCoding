import type { ReactNode } from 'react'
import { AlertTriangle, FolderKanban, RefreshCw } from 'lucide-react'
import { BacklogKanbanBoard } from '@/app/components/BacklogKanbanBoard'
import { SectionHeading } from '../components/SectionHeading'
import { EmptyState } from '../components/EmptyState'
import { BUTTON_FOCUS_CLASS, PANEL_SOFT_CLASS } from '../constants'
import type { ProjectWorkspaceProps } from '../types'

export interface BacklogTabProps {
  active: boolean
  projectId: string
  phases: ProjectWorkspaceProps['initialData']['phases']
  backlogRevision: number
  isGenerating: boolean
  handleRegenerateBacklog: () => void | Promise<void>
  generateButton: ReactNode
  t: (key: string, values?: Record<string, string | number | Date>) => string
}

export function BacklogTab({
  active,
  projectId,
  phases,
  backlogRevision,
  isGenerating,
  handleRegenerateBacklog,
  generateButton,
  t,
}: BacklogTabProps) {
  const allTasks = phases.flatMap((phase) => phase.tasks)
  const readyTasks = allTasks.filter((task) => task.status === 'READY')
  const doneTasks = allTasks.filter((task) => task.status === 'DONE')
  const blockedTasks = allTasks.filter((task) => task.status === 'BLOCKED')

  return (
    <div className={active ? 'space-y-8' : 'hidden'}>
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
          projectId={projectId}
          phases={phases}
        />
      )}
    </div>
  )
}
