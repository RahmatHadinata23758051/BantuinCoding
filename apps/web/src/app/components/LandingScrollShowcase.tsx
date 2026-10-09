'use client'

import { useEffect, useState } from 'react'

export interface LandingShowcaseStage {
  id: string
  number: string
  label: string
  detail: string
  artifact: string
}

interface LandingScrollShowcaseProps {
  ariaLabel: string
  stages: LandingShowcaseStage[]
  staticNote: string
}

export function LandingScrollShowcase({ ariaLabel, stages, staticNote }: LandingScrollShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || !('IntersectionObserver' in window)) return

    const stageElements = Array.from(document.querySelectorAll<HTMLElement>('[data-showcase-stage]'))
    if (!stageElements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const next = visible[0]?.target.getAttribute('data-showcase-stage')
        const nextIndex = next ? stages.findIndex((stage) => stage.id === next) : -1
        if (nextIndex >= 0) setActiveIndex(nextIndex)
      },
      { rootMargin: '-34% 0px -48% 0px', threshold: [0.2, 0.55, 0.9] },
    )

    stageElements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [stages])

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight * 0.42
      let closestIndex = 0
      let closestDistance = Number.POSITIVE_INFINITY
      document.querySelectorAll<HTMLElement>('[data-showcase-stage]').forEach((element, index) => {
        const distance = Math.abs(element.getBoundingClientRect().top - viewportCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })
      setActiveIndex((currentIndex) => currentIndex === closestIndex ? currentIndex : closestIndex)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  const activeStage = stages[activeIndex] ?? stages[0]

  return (
    <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-[18px] border border-[#d8d1c7] bg-[#25241f] text-white shadow-[12px_12px_0_#f4a261]" aria-label={ariaLabel}>
          <div className="flex items-center justify-between border-b border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
            <span>pack-assembly / live view</span>
            <span className="flex items-center gap-2 text-[#f0b493]"><span className="size-1.5 rounded-full bg-[#e9a27b]" />{activeStage?.number ?? '01'} / {String(stages.length).padStart(2, '0')}</span>
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#f0b493]">current transformation</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">{activeStage?.label}</p>
              </div>
              <span className="font-mono text-xs text-white/45">{activeStage?.artifact}</span>
            </div>
            <div className="mt-8 grid gap-3" aria-hidden="true">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors ${index <= activeIndex ? 'border-[#f0b493] bg-[#f0b493] text-[#25241f]' : 'border-white/25 text-white/45'}`}>{stage.number}</span>
                  <span className={`h-px flex-1 transition-colors ${index < activeIndex ? 'bg-[#f0b493]' : 'bg-white/15'}`} />
                  <span className={`w-24 text-right font-mono text-[10px] uppercase tracking-[0.11em] transition-colors ${index === activeIndex ? 'text-white' : 'text-white/40'}`}>{stage.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-white/15 pt-4">
              <p className="text-sm leading-6 text-white/68">{activeStage?.detail}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-white/42">{staticNote}</p>
            </div>
          </div>
        </div>
      </div>

      <ol className="space-y-3">
        {stages.map((stage, index) => (
          <li
            key={stage.id}
            data-showcase-stage={stage.id}
            className={`rounded-[14px] border p-5 transition-[border-color,background-color,transform] duration-300 sm:p-7 ${index === activeIndex ? 'border-[#a85e3c] bg-white shadow-[6px_6px_0_#f4a261] lg:translate-x-1' : 'border-[#ded8cf] bg-[#fbfaf8]'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="font-mono text-xs text-[#a85e3c]">{stage.number}</span>
                <div>
                  <h3 className="text-xl font-semibold tracking-[-.04em] sm:text-2xl">{stage.label}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#68645e]">{stage.detail}</p>
                </div>
              </div>
              <code className="rounded-md bg-[#f0ece6] px-2.5 py-1.5 font-mono text-[10px] text-[#71695f]">{stage.artifact}</code>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
