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
  primary: 'bg-[var(--cobalt)] text-white hover:bg-[var(--cobalt-hover)]',
  secondary: 'bg-[var(--electric-yellow)] text-[var(--ink)] hover:bg-[#ffce1f]',
  neutral: 'bg-[var(--paper-raised)] text-[var(--ink)] hover:bg-white',
  danger: 'bg-[var(--action-red)] text-[var(--ink)] hover:bg-[#d9342a] hover:text-white',
  success: 'bg-[var(--mint)] text-[var(--ink)] hover:bg-[#38c98d]',
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
    'nb-button-press inline-flex items-center justify-center gap-2 rounded-[4px] border-2 border-[var(--ink)] font-bold shadow-[var(--shadow-sm)]',
    'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hard)]',
    'disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none',
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
