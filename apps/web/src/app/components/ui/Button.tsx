import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/ui'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'danger'
  | 'success'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'border-[var(--ink)] bg-[var(--ink)] text-white hover:bg-[var(--ink-soft)]',
  secondary: 'border-[var(--border-subtle)] bg-transparent text-[var(--ink)] hover:bg-[var(--surface-soft)]',
  neutral: 'border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--ink)] hover:border-[var(--ink)]',
  danger: 'border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--surface-soft)]',
  success: 'border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--surface-soft)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs',
  md: 'min-h-11 px-4 py-2 text-sm',
  lg: 'min-h-12 px-5 py-3 text-base',
  icon: 'size-11 p-0',
}

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-buttons)] border font-medium font-sans transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]',
    'disabled:pointer-events-none disabled:opacity-50',
    variantStyles[variant],
    sizeStyles[size],
    className,
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  )
}
