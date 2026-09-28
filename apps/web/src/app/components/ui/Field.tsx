import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

import { cn } from '@/lib/ui'

export const fieldClassName = cn(
  'w-full rounded-[3px] border-2 border-[var(--ink)] bg-white px-3 py-2.5 text-sm text-[var(--ink)] shadow-[var(--shadow-xs)]',
  'placeholder:text-[var(--paper-faint)] hover:bg-[var(--paper-raised)]',
  'focus:bg-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--focus-ring)]',
  'disabled:cursor-not-allowed disabled:bg-[var(--paper)] disabled:opacity-60',
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
