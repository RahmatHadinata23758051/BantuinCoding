import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/ui'

export function Caption({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-tags)] border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2.5 py-1 font-mono text-xs font-semibold tracking-[0.04em] text-[var(--ink)]',
        className,
      )}
      {...props}
    />
  )
}
