'use client'

import { useState } from 'react'

export interface TransformationStage {
  id: string
  number: string
  label: string
  detail: string
  artifact: string
}

interface InteractiveTransformationProps {
  ariaLabel: string
  stages: TransformationStage[]
  rawLabel: string
  rawCopy: string
  outputLabel: string
  outputCopy: string
}

export function InteractiveTransformation({ ariaLabel, stages, rawLabel, rawCopy, outputLabel, outputCopy }: InteractiveTransformationProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = stages[activeIndex] ?? stages[0]

  if (!active) return null

  return (
    <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]" aria-label={ariaLabel}>
      <div className="border border-[#d8d1c7] bg-[#fffdfa] p-5 shadow-[8px_8px_0_#f4a261] sm:p-7">
        <div className="flex items-center justify-between border-b border-[#e9e1d8] pb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8c8175]">
          <span>{rawLabel}</span>
          <span className="text-[#a85e3c]">idea.md</span>
        </div>
        <p className="mt-6 max-w-md font-mono text-sm leading-7 text-[#4e4942] sm:text-base">{rawCopy}</p>
        <div className="mt-7 flex flex-wrap gap-2">
          {['users', 'job', 'boundaries'].map((token) => <span key={token} className="border border-[#ded4c8] bg-[#f8f2eb] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#786e64]">{token}</span>)}
        </div>
      </div>
      <div className="border border-[#3e3c35] bg-[#25241f] p-5 text-white sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
          <span>{outputLabel}</span>
          <span className="text-[#f4a261]">{active.number} / {String(stages.length).padStart(2, '0')}</span>
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-5">
          {stages.map((stage, index) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${stage.number} ${stage.label}`}
              aria-pressed={activeIndex === index}
              className={`border p-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] sm:p-3 ${activeIndex === index ? 'border-[#f4a261] bg-[#f4a261] text-[#25241f]' : 'border-white/15 bg-white/[0.03] text-white/55 hover:border-white/45 hover:text-white'}`}
            >
              <span className="block font-mono text-[10px]">{stage.number}</span>
              <span className="mt-3 block text-xs font-semibold leading-tight">{stage.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-7 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#f4a261]">{active.artifact}</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-.06em]">{active.label}</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">{active.detail}</p>
          </div>
          <p className="max-w-[180px] text-sm leading-6 text-white/45">{outputCopy}</p>
        </div>
      </div>
    </div>
  )
}
