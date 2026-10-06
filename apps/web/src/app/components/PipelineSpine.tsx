import { Check, Circle, LockKeyhole, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

import { PIPELINE_STAGES, pipelineFromCurrent, type PipelineStageKey, type PipelineStageState, type ResolvedPipeline } from '@/lib/workflow/pipeline'
import { cn } from '@/lib/ui'

export type PipelineStage = PipelineStageKey

interface PipelineSpineProps {
  current: PipelineStage
  className?: string
  compact?: boolean
  pipeline?: ResolvedPipeline
  hrefForStage?: (stage: PipelineStageKey) => string | undefined
}

function stateLabelKey(state: PipelineStageState) {
  switch (state) {
    case 'complete':
      return 'pipelineStateComplete'
    case 'current':
      return 'pipelineStateCurrent'
    case 'blocked':
      return 'pipelineStateBlocked'
    case 'error':
      return 'pipelineStateError'
    case 'loading':
      return 'pipelineStateLoading'
    default:
      return 'pipelineStateUpcoming'
  }
}

function stateLabel(
  state: PipelineStageState,
  translate: (state: PipelineStageState) => string,
) {
  return translate(state)
}

function StateIcon({ state }: { state: PipelineStageState }) {
  if (state === 'complete') return <Check size={14} strokeWidth={3} aria-hidden="true" />
  if (state === 'error') return <TriangleAlert size={14} strokeWidth={3} aria-hidden="true" />
  if (state === 'blocked') return <LockKeyhole size={13} strokeWidth={2.5} aria-hidden="true" />
  if (state === 'current' || state === 'loading') return <Circle size={10} fill="currentColor" aria-hidden="true" />
  return null
}

export function PipelineSpine({
  current,
  className,
  compact = false,
  pipeline,
  hrefForStage,
}: PipelineSpineProps) {
  const t = useTranslations('Pipeline')
  const tWorkspace = useTranslations('Workspace')
  const resolved = pipeline ?? pipelineFromCurrent(current)
  const translatedStateLabel = (state: PipelineStageState) =>
    tWorkspace(stateLabelKey(state) as Parameters<typeof tWorkspace>[0])

  return (
    <nav
      aria-label={tWorkspace('pipelineAriaLabel')}
      className={cn(
        'border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hard)]',
        compact ? 'overflow-hidden' : 'p-4',
        className,
      )}
    >
      {compact && (
        <div className="border-b-2 border-[var(--ink)] bg-[var(--electric-yellow)] px-3 py-2 text-xs font-bold sm:hidden">
          <span className="font-mono">{t(resolved.current.labelKey)}</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>{stateLabel(resolved.current.state, translatedStateLabel)}</span>
        </div>
      )}
      <ol className={cn(compact ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'flex flex-col')}>
        {resolved.stages.map((stage, index) => {
          const isActive = stage.state === 'current' || stage.state === 'loading' || stage.state === 'error'
          const stageContent = (
            <>
              <span
                className={cn(
                  'relative z-10 flex size-7 shrink-0 items-center justify-center border-2 border-[var(--ink)] font-mono text-[10px] font-black shadow-[var(--shadow-xs)]',
                  stage.state === 'complete' && 'bg-[var(--mint)] text-[var(--ink)]',
                  stage.state === 'current' && 'bg-[var(--electric-yellow)] text-[var(--ink)]',
                  stage.state === 'loading' && 'bg-[var(--cobalt)] text-white animate-pulse-dot',
                  stage.state === 'error' && 'bg-[var(--action-red)] text-[var(--ink)]',
                  stage.state === 'blocked' && 'bg-[var(--paper)] text-[var(--paper-muted)]',
                  stage.state === 'upcoming' && 'bg-[var(--paper-raised)] text-[var(--paper-muted)]',
                )}
                aria-hidden="true"
              >
                <StateIcon state={stage.state} />
                {stage.state === 'upcoming' && String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[11px] font-black tracking-[0.03em] text-[var(--ink)]">
                  {String(index + 1).padStart(2, '0')} · {t(stage.labelKey)}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold leading-snug text-[var(--paper-muted)]">
                  {compact && isActive ? stateLabel(stage.state, translatedStateLabel) : t(stage.detailKey)}
                </span>
              </span>
            </>
          )
          const href = hrefForStage?.(stage.key)

          return (
            <li
              key={stage.key}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'relative flex min-w-0',
                compact
                  ? 'items-stretch border-b-2 border-r-2 border-[var(--ink)] last:border-r-0 sm:border-b-0'
                  : 'items-start gap-3 pb-5 last:pb-0',
              )}
            >
              {!compact && index < PIPELINE_STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-[13px] top-8 h-[calc(100%-0.5rem)] w-[3px] border-x border-[var(--ink)]',
                    stage.state === 'complete' ? 'bg-[var(--cobalt)]' : 'bg-[var(--paper)]',
                  )}
                />
              )}
              {href && stage.isActionable ? (
                <Link
                  href={href}
                  className={cn(
                    'flex min-w-0 flex-1 gap-3 px-3 py-3 text-left transition-colors hover:bg-[var(--cobalt-dim)]',
                    !compact && 'px-0 py-0',
                  )}
                >
                  {stageContent}
                </Link>
              ) : (
                <div
                  className={cn(
                    'flex min-w-0 flex-1 gap-3 px-3 py-3 text-left',
                    !compact && 'px-0 py-0',
                    compact && stage.state === 'current' && 'bg-[var(--electric-yellow)]',
                    compact && stage.state === 'complete' && 'bg-[var(--mint-dim)]',
                    compact && stage.state === 'error' && 'bg-[var(--action-red-dim)]',
                  )}
                  title={stateLabel(stage.state, translatedStateLabel)}
                >
                  {stageContent}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
