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
  neutral: 'bg-[var(--paper-raised)]',
  current: 'bg-[var(--cobalt)] text-white',
  pending: 'bg-[var(--electric-yellow)]',
  success: 'bg-[var(--mint)]',
  danger: 'bg-[var(--action-red)] text-[var(--ink)]',
  accent: 'bg-[var(--lavender)]',
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
        'inline-flex min-h-7 items-center gap-1.5 rounded-[3px] border-2 border-[var(--ink)] px-2 py-0.5 font-mono text-[11px] font-bold leading-none',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  )
}
