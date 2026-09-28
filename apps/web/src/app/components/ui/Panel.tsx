import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/ui'

export type PanelTone =
  | 'paper'
  | 'yellow'
  | 'blue'
  | 'pink'
  | 'mint'
  | 'lavender'
  | 'ink'

const toneStyles: Record<PanelTone, string> = {
  paper: 'bg-[var(--paper-raised)] text-[var(--ink)]',
  yellow: 'bg-[var(--electric-yellow)] text-[var(--ink)]',
  blue: 'bg-[var(--cobalt)] text-white',
  pink: 'bg-[var(--punch-pink)] text-[var(--ink)]',
  mint: 'bg-[var(--mint)] text-[var(--ink)]',
  lavender: 'bg-[var(--lavender)] text-[var(--ink)]',
  ink: 'bg-[var(--ink)] text-[var(--paper-raised)]',
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
    'rounded-[4px] border-2 border-[var(--ink)]',
    raised && 'shadow-[var(--shadow-hard)]',
    toneStyles[tone],
    className,
  )
}

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  tone?: PanelTone
  raised?: boolean
}

export function Panel({
  tone = 'paper',
  raised = true,
  className,
  ...props
}: PanelProps) {
  return (
    <div className={panelClassName({ tone, raised, className })} {...props} />
  )
}

export function PanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b-2 border-[var(--ink)] px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5', className)} {...props} />
}
