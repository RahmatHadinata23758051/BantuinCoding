import { Check, Circle, LockKeyhole, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { PIPELINE_STAGES, pipelineFromCurrent, type PipelineStageKey, type PipelineStageState, type ResolvedPipeline } from '@/lib/workflow/pipeline'
import { cn } from '@/lib/ui'

export type PipelineStage = PipelineStageKey
interface PipelineSpineProps { current: PipelineStage; className?: string; compact?: boolean; pipeline?: ResolvedPipeline; hrefForStage?: (stage: PipelineStageKey) => string | undefined }

function stateLabelKey(state: PipelineStageState) {
  switch (state) {
    case 'complete': return 'pipelineStateComplete'
    case 'current': return 'pipelineStateCurrent'
    case 'blocked': return 'pipelineStateBlocked'
    case 'error': return 'pipelineStateError'
    case 'loading': return 'pipelineStateLoading'
    default: return 'pipelineStateUpcoming'
  }
}
function StateIcon({ state }: { state: PipelineStageState }) {
  if (state === 'complete') return <Check size={14} strokeWidth={2.5} aria-hidden="true" />
  if (state === 'error') return <TriangleAlert size={14} strokeWidth={2.5} aria-hidden="true" />
  if (state === 'blocked') return <LockKeyhole size={13} strokeWidth={2} aria-hidden="true" />
  if (state === 'current' || state === 'loading') return <Circle size={9} fill="currentColor" aria-hidden="true" />
  return null
}

export function PipelineSpine({ current, className, compact = false, pipeline, hrefForStage }: PipelineSpineProps) {
  const t = useTranslations('Pipeline')
  const tWorkspace = useTranslations('Workspace')
  const resolved = pipeline ?? pipelineFromCurrent(current)
  const translatedStateLabel = (state: PipelineStageState) => tWorkspace(stateLabelKey(state) as Parameters<typeof tWorkspace>[0])

  return (
    <nav aria-label={tWorkspace('pipelineAriaLabel')} className={cn('rounded-[var(--radius-cards)] border border-[var(--border-subtle)] bg-[var(--color-pure-white)]', compact ? 'overflow-hidden' : 'p-4', className)}>
      {compact && <div className="border-b border-[var(--border-subtle)] bg-[var(--color-sky-tint)] px-3 py-2 text-xs font-medium text-[var(--color-notion-blue)] sm:hidden"><span>{t(resolved.current.labelKey)}</span><span className="mx-2" aria-hidden="true">·</span><span>{translatedStateLabel(resolved.current.state)}</span></div>}
      <ol className={cn(compact ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' : 'flex flex-col')}>
        {resolved.stages.map((stage, index) => {
          const isActive = stage.state === 'current' || stage.state === 'loading' || stage.state === 'error'
          const stageContent = <>
            <span className={cn('relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] text-xs font-medium', stage.state === 'complete' && 'border-[var(--color-notion-blue)] bg-[var(--color-notion-blue)] text-white', stage.state === 'current' && 'border-[var(--color-notion-blue)] bg-[var(--color-sky-tint)] text-[var(--color-notion-blue)]', stage.state === 'loading' && 'border-[var(--color-notion-blue)] bg-[var(--color-notion-blue)] text-white animate-pulse-dot', stage.state === 'error' && 'border-[var(--color-vermillion)] bg-[var(--action-red-dim)] text-[var(--color-vermillion)]', stage.state === 'blocked' && 'bg-[#f2f1f0] text-[var(--color-stone)]', stage.state === 'upcoming' && 'bg-white text-[var(--color-stone)]')} aria-hidden="true"><StateIcon state={stage.state} />{stage.state === 'upcoming' && String(index + 1).padStart(2, '0')}</span>
            <span className="min-w-0"><span className="block text-xs font-medium text-[var(--color-ink-black)]">{String(index + 1).padStart(2, '0')} · {t(stage.labelKey)}</span><span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-stone)]">{compact && isActive ? translatedStateLabel(stage.state) : t(stage.detailKey)}</span></span>
          </>
          const href = hrefForStage?.(stage.key)
          return <li key={stage.key} aria-current={isActive ? 'step' : undefined} className={cn('relative flex min-w-0', compact ? 'items-stretch border-b border-r border-[var(--border-subtle)] last:border-r-0 sm:border-b-0' : 'items-start gap-3 pb-5 last:pb-0')}>
            {!compact && index < PIPELINE_STAGES.length - 1 && <span aria-hidden="true" className={cn('absolute left-[13px] top-8 h-[calc(100%-0.5rem)] w-px bg-[var(--border-subtle)]', stage.state === 'complete' && 'bg-[var(--color-notion-blue)]')} />}
            {href && stage.isActionable ? <Link href={href} className={cn('flex min-w-0 flex-1 gap-3 px-3 py-3 text-left transition-colors hover:bg-[var(--color-sky-tint)]', !compact && 'px-0 py-0', stage.state === 'loading' && 'motion-safe:animate-pulse-dot')}>{stageContent}</Link> : <div className={cn('flex min-w-0 flex-1 gap-3 px-3 py-3 text-left', !compact && 'px-0 py-0', compact && stage.state === 'current' && 'bg-[var(--color-sky-tint)]', compact && stage.state === 'complete' && 'bg-[#f4fbf8]', compact && stage.state === 'error' && 'bg-[var(--action-red-dim)]')} title={translatedStateLabel(stage.state)}>{stageContent}</div>}
          </li>
        })}
      </ol>
    </nav>
  )
}
