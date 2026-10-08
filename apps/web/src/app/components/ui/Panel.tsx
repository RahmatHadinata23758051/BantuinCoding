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
  yellow: 'bg-[var(--surface-soft)] text-[var(--ink)]',
  blue: 'bg-[var(--surface-soft)] text-[var(--ink)]',
  pink: 'bg-[var(--surface-soft)] text-[var(--ink)]',
  mint: 'bg-[var(--surface-soft)] text-[var(--ink)]',
  lavender: 'bg-[var(--surface-soft)] text-[var(--ink)]',
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
    'rounded-[var(--radius-cards)] border border-[var(--border-subtle)]',
    toneStyles[tone],
    raised && 'ring-1 ring-[var(--border-subtle)] ring-inset',
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
        'flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3',
        className,
      )}
      {...props}
    />
  )
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5', className)} {...props} />
}
