import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

import { cn } from '@/lib/ui'

export const fieldClassName = cn(
  'w-full rounded-[var(--radius-inputs)] border border-[var(--border-subtle)] bg-[var(--paper)] px-3 py-2.5 font-sans text-sm text-[var(--ink)] transition-colors',
  'placeholder:text-[var(--paper-muted)] hover:border-[var(--ink)]',
  'focus:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
  'disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] disabled:opacity-60',
)

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClassName, className)} {...props} />
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldClassName, 'min-h-32 resize-y', className)}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClassName, className)} {...props} />
}
