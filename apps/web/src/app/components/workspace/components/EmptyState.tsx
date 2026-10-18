import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { PANEL_CLASS } from '../constants'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-72 items-center py-10">
      <div className={`${PANEL_CLASS} max-w-xl p-6`}>
        <div className="mb-4 flex size-10 items-center justify-center bg-[var(--workspace-blue-soft)]">
          <Icon aria-hidden="true" className="size-5 text-[var(--workspace-primary)]" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-[var(--workspace-ink)]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
          {description}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  )
}
