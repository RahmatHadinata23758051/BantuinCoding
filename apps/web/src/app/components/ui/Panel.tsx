import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/ui'

export type PanelTone = 'paper' | 'yellow' | 'blue' | 'pink' | 'mint' | 'lavender' | 'ink'

const toneStyles: Record<PanelTone, string> = {
  paper: 'bg-[var(--color-pure-white)] text-[var(--color-ink-black)]',
  yellow: 'bg-[var(--electric-yellow-dim)] text-[var(--color-ink-black)]',
  blue: 'bg-[var(--color-sky-tint)] text-[var(--color-notion-blue)]',
  pink: 'bg-[var(--punch-pink-dim)] text-[var(--color-ink-black)]',
  mint: 'bg-[var(--mint-dim)] text-[var(--color-ink-black)]',
  lavender: 'bg-[var(--lavender-dim)] text-[var(--color-ink-black)]',
  ink: 'bg-[var(--color-midnight-ink)] text-white',
}

export function panelClassName({
  tone = 'paper',
  raised = true,
  className,
}: {
  tone?: PanelTone
  raised?: boolean
  className?: string
} = {}) {
  return cn(
    'rounded-[var(--radius-cards)] border border-[var(--border-subtle)]',
    !raised && 'border-transparent',
    toneStyles[tone],
    className,
  )
}

export interface PanelProps extends HTMLAttributes<HTMLDivElement> { tone?: PanelTone; raised?: boolean }
export function Panel({ tone = 'paper', raised = true, className, ...props }: PanelProps) {
  return <div className={panelClassName({ tone, raised, className })} {...props} />
}

export function PanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:px-6', className)} {...props} />
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-6', className)} {...props} />
}
