'use client'

import React from 'react'
import { Button } from './Button'

export interface CommandBandProps {
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
    disabled?: boolean
  }
  secondaryActions?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }[]
  children?: React.ReactNode
  className?: string
}

export function CommandBand({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryActions = [],
  children,
  className = '',
}: CommandBandProps) {
  return (
    <div
      className={`flex flex-col gap-3 pb-4 border-b border-[#D5DFE7] ${className}`}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#546575]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <span className="text-[#8898AA]">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-[#17222D]' : 'hover:underline cursor-pointer'}>
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17222D] font-heading">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-xs sm:text-sm text-[#546575]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {secondaryActions.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              size="sm"
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
          {primaryAction && (
            <Button
              variant="primary"
              size="sm"
              icon={primaryAction.icon}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>

      {children && <div className="pt-1">{children}</div>}
    </div>
  )
}
