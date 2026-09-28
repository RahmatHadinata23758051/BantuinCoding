import { Check, Circle } from 'lucide-react'

import { cn } from '@/lib/ui'

const STAGES = [
  { key: 'idea', label: 'Idea', detail: 'Capture intent' },
  { key: 'clarify', label: 'Clarify', detail: 'Resolve gaps' },
  { key: 'context', label: 'Context', detail: 'Normalize decisions' },
  { key: 'generate', label: 'Generate', detail: 'Build documents' },
  { key: 'review', label: 'Review', detail: 'Inspect and edit' },
  { key: 'export', label: 'Export', detail: 'Package for agent' },
] as const

export type PipelineStage = (typeof STAGES)[number]['key']

interface PipelineSpineProps {
  current: PipelineStage
  className?: string
  compact?: boolean
}

export function PipelineSpine({ current, className, compact = false }: PipelineSpineProps) {
  const currentIndex = STAGES.findIndex((stage) => stage.key === current)

  return (
    <nav
      aria-label="Project pipeline"
      className={cn(
        'rounded-[4px] border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hard)]',
        compact ? 'overflow-x-auto' : 'p-4',
        className,
      )}
    >
      <ol className={cn(compact ? 'flex min-w-[760px] items-stretch' : 'flex flex-col')}>
        {STAGES.map((stage, index) => {
          const complete = index < currentIndex
          const active = index === currentIndex
          const future = index > currentIndex

          return (
            <li
              key={stage.key}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'relative flex',
                compact
                  ? 'min-w-0 flex-1 items-stretch border-r-2 border-[var(--ink)] last:border-r-0'
                  : 'items-start gap-3 pb-5 last:pb-0',
              )}
            >
              {!compact && index < STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-[12px] top-7 h-[calc(100%-0.5rem)] w-[3px] border-x border-[var(--ink)]',
                    complete ? 'bg-[var(--cobalt)]' : 'bg-[var(--paper)]',
                  )}
                />
              )}

              <div
                className={cn(
                  'flex min-w-0 gap-3',
                  compact ? 'w-full items-center px-3 py-2.5' : 'items-start',
                  active && compact && 'bg-[var(--electric-yellow)]',
                  complete && compact && 'bg-[var(--mint-dim)]',
                  future && compact && 'bg-[var(--paper-raised)]',
                )}
              >
                <span
                  className={cn(
                    'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-[3px] border-2 border-[var(--ink)] font-mono text-[10px] font-black shadow-[var(--shadow-xs)]',
                    complete && 'bg-[var(--cobalt)] text-white',
                    active && 'bg-[var(--electric-yellow)] text-[var(--ink)] animate-pulse-dot',
                    future && 'bg-[var(--paper)] text-[var(--paper-muted)]',
                  )}
                  aria-hidden="true"
                >
                  {complete ? (
                    <Check size={14} strokeWidth={3} />
                  ) : active ? (
                    <Circle size={10} fill="currentColor" />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>

                <span className="min-w-0">
                  <span className="block font-mono text-[11px] font-black tracking-[0.03em] text-[var(--ink)]">
                    {String(index + 1).padStart(2, '0')} · {stage.label}
                  </span>
                  {!compact && (
                    <span className="mt-0.5 block text-[11px] leading-snug text-[var(--paper-muted)]">
                      {stage.detail}
                    </span>
                  )}
                  {compact && active && (
                    <span className="mt-0.5 block text-[10px] font-bold text-[var(--ink)]">
                      Current chapter
                    </span>
                  )}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
