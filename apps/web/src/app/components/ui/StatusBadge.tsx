import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/ui'

export type StatusTone = 'neutral' | 'current' | 'pending' | 'success' | 'danger' | 'accent'
const toneStyles: Record<StatusTone, string> = {
  neutral: 'bg-[#f2f1f0] text-[var(--color-ink-black)]',
  current: 'bg-[var(--color-notion-blue)] text-white',
  pending: 'bg-[var(--electric-yellow-dim)] text-[var(--color-ink-black)]',
  success: 'bg-[var(--mint-dim)] text-[#1b6a4e]',
  danger: 'bg-[var(--action-red-dim)] text-[var(--color-vermillion)]',
  accent: 'bg-[var(--lavender-dim)] text-[var(--color-midnight-ink)]',
}

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> { tone?: StatusTone }
export function StatusBadge({ tone = 'neutral', className, ...props }: StatusBadgeProps) {
  return <span className={cn('inline-flex min-h-6 items-center gap-1.5 rounded-[var(--radius-pills)] px-2.5 py-1 text-xs font-medium leading-none', toneStyles[tone], className)} {...props} />
}
