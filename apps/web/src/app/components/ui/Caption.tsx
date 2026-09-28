import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/ui'

export function Caption({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[3px] border-2 border-[var(--ink)] bg-[var(--electric-yellow)] px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.04em] text-[var(--ink)] shadow-[var(--shadow-sm)]',
        className,
      )}
      {...props}
    />
  )
}
