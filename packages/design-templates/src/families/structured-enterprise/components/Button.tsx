'use client'

import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245E84] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[6px]'

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 h-8',
    md: 'text-sm px-3.5 py-2 h-9',
  }[size]

  const variantStyles = {
    primary:
      'bg-[#245E84] text-white hover:bg-[#1B4764] active:bg-[#153850] border border-[#245E84] shadow-xs',
    secondary:
      'bg-white text-[#17222D] hover:bg-[#F4F6F8] active:bg-[#E9EEF2] border border-[#D5DFE7]',
    danger:
      'bg-[#B83C49] text-white hover:bg-[#9B2F3B] active:bg-[#7F2630] border border-[#B83C49]',
    ghost:
      'bg-transparent text-[#546575] hover:text-[#17222D] hover:bg-[#E9EEF2] active:bg-[#DCE4EB]',
  }[variant]

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
