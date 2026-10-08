import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/ui'

export function Caption({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center rounded-[var(--radius-pills)] bg-[var(--color-sky-tint)] px-3 py-1 text-xs font-medium tracking-[0.01em] text-[var(--color-notion-blue)]', className)} {...props} />
}
