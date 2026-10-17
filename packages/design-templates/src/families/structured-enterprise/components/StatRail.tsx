'use client'

import React from 'react'

export interface StatItem {
  id: string
  label: string
  value: string | number
  unit?: string
  context?: string
  status?: 'normal' | 'warning' | 'danger'
}

export interface StatRailProps {
  stats: StatItem[]
  className?: string
}

export function StatRail({ stats, className = '' }: StatRailProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D5DFE7] bg-white border border-[#D5DFE7] rounded-[8px] overflow-hidden ${className}`}
    >
      {stats.map((stat) => (
        <div key={stat.id} className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#546575]">
            {stat.label}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums ${
                stat.status === 'danger'
                  ? 'text-[#B83C49]'
                  : stat.status === 'warning'
                  ? 'text-[#A05C08]'
                  : 'text-[#17222D]'
              }`}
            >
              {stat.value}
            </span>
            {stat.unit && (
              <span className="text-xs font-medium text-[#546575]">
                {stat.unit}
              </span>
            )}
          </div>
          {stat.context && (
            <p className="mt-1 text-xs text-[#546575] leading-relaxed">
              {stat.context}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
