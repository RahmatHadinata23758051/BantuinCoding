import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/ui'

export { Select } from './Select'
export type { CustomSelectProps as SelectProps } from './Select'

export const fieldClassName = cn(
  'w-full rounded-[var(--radius-buttons)] border border-[var(--border-default)] bg-[var(--color-pure-white)] px-3 py-2.5 text-sm text-[var(--color-ink-black)] transition-colors duration-200',
  'placeholder:text-[var(--color-stone)] hover:border-[var(--border-hi)]',
  'focus:border-[var(--color-sun-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-sun-orange)]',
  'disabled:cursor-not-allowed disabled:bg-[var(--color-paper-warmth)] disabled:opacity-60',
)

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn(fieldClassName, className)} {...props} /> }
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn(fieldClassName, 'min-h-32 resize-y', className)} {...props} /> }
