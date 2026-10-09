'use client'

import { useState } from 'react'

export interface LandingTourItem {
  id: string
  label: string
  description: string
  eyebrow: string
  lines: string[]
}

interface LandingProductTourProps {
  ariaLabel: string
  items: LandingTourItem[]
}

export function LandingProductTour({ ariaLabel, items }: LandingProductTourProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')
  const active = items.find((item) => item.id === activeId) ?? items[0]

  if (!active) return null

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]" aria-label={ariaLabel}>
      <div role="tablist" aria-label={ariaLabel} className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
        {items.map((item) => {
          const selected = item.id === active.id
          return (
            <button
              key={item.id}
              id={`tour-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`tour-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => {
                const index = items.findIndex((candidate) => candidate.id === item.id)
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  const next = items[(index + 1) % items.length]
                  setActiveId(next.id)
                  document.getElementById(`tour-tab-${next.id}`)?.focus()
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  const previous = items[(index - 1 + items.length) % items.length]
                  setActiveId(previous.id)
                  document.getElementById(`tour-tab-${previous.id}`)?.focus()
                }
                if (event.key === 'Home' || event.key === 'End') {
                  event.preventDefault()
                  const destination = event.key === 'Home' ? items[0] : items[items.length - 1]
                  setActiveId(destination.id)
                  document.getElementById(`tour-tab-${destination.id}`)?.focus()
                }
              }}
              className={`min-w-max border px-4 py-3 text-left font-mono text-xs uppercase tracking-[0.1em] transition-colors lg:block lg:w-full ${selected ? 'border-[#25241f] bg-[#25241f] text-white' : 'border-[#d8d1c7] bg-[#fbfaf8] text-[#706b64] hover:border-[#a85e3c] hover:text-[#25241f]'}`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <div id={`tour-panel-${active.id}`} role="tabpanel" aria-labelledby={`tour-tab-${active.id}`} tabIndex={0} className="min-h-[280px] border border-[#d8d1c7] bg-white p-6 shadow-[8px_8px_0_#eee5dc] sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a85e3c]">{active.eyebrow}</p>
        <h3 className="mt-3 text-3xl font-semibold tracking-[-.06em]">{active.label}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#68645e]">{active.description}</p>
        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          {active.lines.map((line) => <code key={line} className="border-l-2 border-[#e8b08f] bg-[#f8f5f0] px-3 py-3 font-mono text-xs text-[#4f4b45]">{line}</code>)}
        </div>
      </div>
    </div>
  )
}
