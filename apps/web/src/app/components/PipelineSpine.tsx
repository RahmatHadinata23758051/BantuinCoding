import { Check, Circle, LockKeyhole, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import {
  PIPELINE_STAGES,
  pipelineFromCurrent,
  type PipelineStageKey,
  type PipelineStageState,
  type ResolvedPipeline,
} from '@/lib/workflow/pipeline'
import { cn } from '@/lib/ui'

export type PipelineStage = PipelineStageKey

interface PipelineSpineProps {
  current: PipelineStage
  className?: string
  compact?: boolean
  variant?: 'default' | 'card'
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

function StateIcon({ state }: { state: PipelineStageState }) {
  if (state === 'complete') return <Check size={14} strokeWidth={2.5} aria-hidden="true" />
  if (state === 'error') return <TriangleAlert size={14} strokeWidth={2.5} aria-hidden="true" />
  if (state === 'blocked') return <LockKeyhole size={13} strokeWidth={2} aria-hidden="true" />
  if (state === 'current' || state === 'loading') return <Circle size={9} fill="currentColor" aria-hidden="true" />
  return null
}

export function PipelineSpine({
  current,
  className,
  compact = false,
  variant = 'default',
  pipeline,
  hrefForStage,
}: PipelineSpineProps) {
  const t = useTranslations('Pipeline')
  const tWorkspace = useTranslations('Workspace')
  const resolved = pipeline ?? pipelineFromCurrent(current)
  const isCard = variant === 'card'
  const isCompact = compact && !isCard
  const translatedStateLabel = (state: PipelineStageState) =>
    tWorkspace(stateLabelKey(state) as Parameters<typeof tWorkspace>[0])

  return (
    <nav
      aria-label={tWorkspace('pipelineAriaLabel')}
      className={cn(
        'border border-[#dedbd5] bg-[#fffdfa]',
        isCompact ? 'overflow-x-auto' : 'p-4',
        isCard && 'border-0 bg-transparent p-0',
        className,
      )}
    >
      {isCompact && (
        <div className="border-b border-[#dedbd5] bg-[#f8eee6] px-4 py-3 text-xs font-semibold text-[#24231f] sm:hidden">
          <span>{t(resolved.current.labelKey)}</span>
          <span className="mx-2 text-[#a9a29a]" aria-hidden="true">
            ·
          </span>
          <span className="text-[#706b64]">{translatedStateLabel(resolved.current.state)}</span>
        </div>
      )}
      <ol className={cn(isCompact ? 'grid min-w-[44rem] grid-cols-6' : 'flex flex-col', isCard && 'gap-2')}>
        {resolved.stages.map((stage, index) => {
          const isActive = stage.state === 'current' || stage.state === 'loading' || stage.state === 'error'
          const stageContent = (
            <>
              <span
                className={cn(
                  'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-[#dedbd5] text-xs font-semibold',
                  stage.state === 'complete' && 'border-[#a85e3c] bg-[#a85e3c] text-white',
                  stage.state === 'current' && 'border-[#a85e3c] bg-[#f8eee6] text-[#8e4e32]',
                  stage.state === 'loading' && 'border-[#a85e3c] bg-[#a85e3c] text-white motion-safe:animate-pulse-dot',
                  stage.state === 'error' && 'border-[#9b4434] bg-[#f8e9e5] text-[#9b4434]',
                  stage.state === 'blocked' && 'bg-[#f0ece6] text-[#a9a29a]',
                  stage.state === 'upcoming' && 'bg-[#fffdfa] text-[#a9a29a]',
                )}
                aria-hidden="true"
              >
                <StateIcon state={stage.state} />
                {stage.state === 'upcoming' && String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#24231f]">{t(stage.labelKey)}</span>
                <span className="mt-1 block text-[11px] leading-snug text-[#706b64]">
                  {isCompact && isActive ? translatedStateLabel(stage.state) : t(stage.detailKey)}
                </span>
              </span>
            </>
          )
          const href = hrefForStage?.(stage.key)
          const itemClassName = cn(
            'flex min-w-0 flex-1 gap-3 px-3 py-4 text-left',
            !isCompact && !isCard && 'px-0 py-0',
            isCompact && 'transition-colors hover:bg-[#f8eee6]',
            isCompact && stage.state === 'current' && 'bg-[#f8eee6]',
            isCompact && stage.state === 'complete' && 'bg-[#f1f5ef]',
            isCompact && stage.state === 'error' && 'bg-[#f8e9e5]',
            isCard && 'items-center gap-3 rounded-xl border border-[#dedbd5] px-3 py-2.5 transition-colors hover:bg-[#f8eee6]',
            isCard && stage.state === 'current' && 'border-[#a85e3c] bg-[#f8eee6]',
            isCard && stage.state === 'complete' && 'bg-[#f1f5ef]',
            isCard && stage.state === 'error' && 'border-[#9b4434] bg-[#f8e9e5]',
            stage.state === 'loading' && 'motion-safe:animate-pulse-dot',
          )

          return (
            <li
              key={stage.key}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'relative flex min-w-0',
                isCompact ? 'items-stretch border-r border-[#dedbd5] last:border-r-0' : 'items-start gap-3 pb-5 last:pb-0',
                isCard && 'items-stretch gap-0 pb-0',
              )}
            >
              {!isCompact && !isCard && index < PIPELINE_STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-[13px] top-8 h-[calc(100%-0.5rem)] w-px bg-[#dedbd5]',
                    stage.state === 'complete' && 'bg-[#a85e3c]',
                  )}
                />
              )}
              {href && stage.isActionable ? (
                <Link href={href} className={itemClassName}>
                  {stageContent}
                </Link>
              ) : (
                <div className={itemClassName} title={translatedStateLabel(stage.state)}>
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
