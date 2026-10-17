'use client'

import React from 'react'

export type StatusType =
  | 'in-stock'
  | 'low-stock'
  | 'depleted'
  | 'quarantined'
  | 'urgent'
  | 'high'
  | 'normal'
  | 'dock-assigned'
  | 'inspection'
  | 'awaiting-intake'
  | 'cleared'

export interface StatusBadgeProps {
  status: StatusType
  label?: string
  className?: string
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  'in-stock': {
    label: 'In Stock',
    bg: '#E9F5F1',
    text: '#20755D',
    dot: '#20755D',
    border: '#BFE4D8',
  },
  'low-stock': {
    label: 'Low Stock',
    bg: '#FDF4E7',
    text: '#A05C08',
    dot: '#A05C08',
    border: '#F8DDB7',
  },
  depleted: {
    label: 'Depleted',
    bg: '#FCECEE',
    text: '#B83C49',
    dot: '#B83C49',
    border: '#F7C6CB',
  },
  quarantined: {
    label: 'Quarantined',
    bg: '#E9EEF2',
    text: '#546575',
    dot: '#546575',
    border: '#D5DFE7',
  },
  urgent: {
    label: 'Urgent',
    bg: '#FCECEE',
    text: '#B83C49',
    dot: '#B83C49',
    border: '#F7C6CB',
  },
  high: {
    label: 'High Priority',
    bg: '#FDF4E7',
    text: '#A05C08',
    dot: '#A05C08',
    border: '#F8DDB7',
  },
  normal: {
    label: 'Normal Priority',
    bg: '#F4F6F8',
    text: '#546575',
    dot: '#8898AA',
    border: '#D5DFE7',
  },
  'dock-assigned': {
    label: 'Dock Assigned',
    bg: '#E7EFF5',
    text: '#245E84',
    dot: '#245E84',
    border: '#BED4E3',
  },
  inspection: {
    label: 'In Inspection',
    bg: '#FDF4E7',
    text: '#A05C08',
    dot: '#A05C08',
    border: '#F8DDB7',
  },
  'awaiting-intake': {
    label: 'Awaiting Intake',
    bg: '#F4F6F8',
    text: '#546575',
    dot: '#8898AA',
    border: '#D5DFE7',
  },
  cleared: {
    label: 'Cleared & Stored',
    bg: '#E9F5F1',
    text: '#20755D',
    dot: '#20755D',
    border: '#BFE4D8',
  },
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: '#F4F6F8',
    text: '#546575',
    dot: '#8898AA',
    border: '#D5DFE7',
  }

  const displayLabel = label ?? config.label

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.dot }}
        aria-hidden="true"
      />
      <span className="truncate">{displayLabel}</span>
    </span>
  )
}
