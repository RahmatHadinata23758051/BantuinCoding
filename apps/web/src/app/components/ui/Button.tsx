import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/ui'

export type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-notion-blue)] text-white hover:bg-[#0068c5]',
  secondary: 'bg-[var(--color-sky-tint)] text-[var(--color-notion-blue)] hover:bg-[#d8eafc]',
  neutral: 'border border-[var(--border-subtle)] bg-[var(--color-pure-white)] text-[var(--color-ink-black)] hover:bg-[#f2f1f0]',
  danger: 'bg-[var(--action-red-dim)] text-[var(--color-vermillion)] hover:bg-[#fcd3ce]',
  success: 'bg-[var(--mint-dim)] text-[#1b6a4e] hover:bg-[#d4ede3]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 py-1 text-xs',
  md: 'min-h-9 px-3.5 py-1.5 text-sm',
  lg: 'min-h-10 px-4 py-2 text-base',
  icon: 'size-9 p-0',
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
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-buttons)] font-medium transition-colors duration-200',
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
