import type { ReactNode } from 'react'

export function SectionHeading({
  title,
  description,
  action,
  divided = true,
}: {
  title: string
  description: string
  action?: ReactNode
  divided?: boolean
}) {
  return (
    <div className={`flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between ${divided ? 'border-b border-black/[0.08]' : ''}`}>
      <div>
        <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-[var(--workspace-ink)] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--workspace-muted)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
