import type { ReactNode } from 'react'
import { cn } from '@/lib/ui'

const frameWidths = { '5xl': 'max-w-5xl', '6xl': 'max-w-6xl', '7xl': 'max-w-7xl' } as const
export type PageFrameWidth = keyof typeof frameWidths

export interface PageFrameProps { children: ReactNode; width?: PageFrameWidth; fullHeight?: boolean; className?: string; contentClassName?: string }

export function PageFrame({ children, width = '7xl', fullHeight = false, className, contentClassName }: PageFrameProps) {
  return (
    <main className={cn('min-h-screen px-4 py-6 text-[var(--color-ink-black)] sm:px-6 lg:px-8', className)}>
      <div className={cn('mx-auto rounded-[var(--radius-cards)] border border-[var(--border-subtle)] bg-[var(--color-pure-white)]', frameWidths[width], fullHeight && 'flex min-h-[calc(100vh-3rem)] flex-col', contentClassName)}>
        {children}
      </div>
    </main>
  )
}

export interface TopBarProps { children: ReactNode; className?: string }
export function TopBar({ children, className }: TopBarProps) {
  return <header className={cn('flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--color-pure-white)] px-4 py-3 sm:px-6', className)}>{children}</header>
}

export interface AppShellProps extends Omit<PageFrameProps, 'children'> { children: ReactNode; header?: ReactNode }
export function AppShell({ children, header, ...frameProps }: AppShellProps) {
  return <PageFrame {...frameProps}>{header}{children}</PageFrame>
}
