import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/ui'

export type StatusTone =
  | 'neutral'
  | 'current'
  | 'pending'
  | 'success'
  | 'danger'
  | 'accent'

const toneStyles: Record<StatusTone, string> = {
  neutral: 'bg-[var(--paper-raised)] text-[var(--ink)]',
  current: 'bg-[var(--ink)] text-white',
  pending: 'bg-[var(--surface-soft)] text-[var(--ink)]',
  success: 'bg-[var(--surface-soft)] text-[var(--ink)]',
  danger: 'bg-[var(--paper)] text-[var(--ink)]',
  accent: 'bg-[var(--surface-soft)] text-[var(--ink)]',
}

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone
}

export function StatusBadge({
  tone = 'neutral',
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center gap-1.5 rounded-[var(--radius-tags)] border border-[var(--border-subtle)] px-2 py-0.5 font-mono text-xs font-semibold leading-none',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  )
}
