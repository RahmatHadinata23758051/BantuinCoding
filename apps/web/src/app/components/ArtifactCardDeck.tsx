'use client'

import { useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

export interface ArtifactCard {
  name: string
  type: string
  description: string
  snippet: string
}

interface ArtifactCardDeckProps {
  ariaLabel: string
  cards: ArtifactCard[]
  deckLabel: string
  deckCopy: string
  stageLabel: string
  stageCount: string
}

export function ArtifactCardDeck({ ariaLabel, cards, deckLabel, deckCopy, stageLabel, stageCount }: ArtifactCardDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const reducedMotion = useReducedMotion()
  const active = cards[activeIndex] ?? cards[0]

  if (!active) return null

  const selectCard = (index: number) => setActiveIndex(index)
  const moveTab = (index: number) => {
    const nextIndex = (index + cards.length) % cards.length
    selectCard(nextIndex)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start" aria-label={ariaLabel}>
      <div className="pt-1">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{deckLabel}</p>
        <p className="mt-5 max-w-md text-base leading-7 text-[#706b64]">{deckCopy}</p>
        <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label={ariaLabel}>
          {cards.map((card, index) => (
            <button
              key={card.name}
              ref={(node) => { tabRefs.current[index] = node }}
              type="button"
              role="tab"
              id={`artifact-tab-${index}`}
              aria-selected={activeIndex === index}
              aria-controls="artifact-panel"
              tabIndex={activeIndex === index ? 0 : -1}
              onClick={() => selectCard(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault()
                  moveTab(index + 1)
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  moveTab(index - 1)
                }
                if (event.key === 'Home') {
                  event.preventDefault()
                  moveTab(0)
                }
                if (event.key === 'End') {
                  event.preventDefault()
                  moveTab(cards.length - 1)
                }
              }}
              className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f] ${activeIndex === index ? 'border-[#24231f] bg-[#24231f] text-white' : 'border-[#d8d1c7] bg-white text-[#716c65] hover:border-[#a85e3c] hover:text-[#24231f]'}`}
            >
              {card.name}
            </button>
          ))}
        </div>
      </div>
      <div className="relative min-h-[385px] overflow-hidden border border-[#ded4c8] bg-[#f0e9e1] p-4 [perspective:1200px] sm:min-h-[425px] sm:p-6" aria-label={`${active.name} ${active.type}`}>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(168,94,60,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(168,94,60,.07)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" aria-hidden="true" />
        <div className="relative mb-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-[#967f6f]"><span>{stageLabel}</span><span>{stageCount.replace('{current}', `0${activeIndex + 1}`).replace('{total}', `0${cards.length}`)}</span></div>
        <div id="artifact-panel" role="tabpanel" aria-labelledby={`artifact-tab-${activeIndex}`} tabIndex={0} className="relative min-h-[300px] outline-none">
          {cards.map((card, index) => {
            const distance = index - activeIndex
            const visible = Math.abs(distance) <= 2
            const offsetX = distance === 0 ? 0 : distance > 0 ? Math.min(distance * 15, 34) : Math.max(distance * 10, -22)
            const offsetY = distance === 0 ? 12 : Math.abs(distance) * 20 + 18
            const rotate = distance === 0 ? 0 : distance * 2.5
            return (
              <button
                key={card.name}
                type="button"
                onClick={() => selectCard(index)}
                aria-label={card.name}
                tabIndex={visible ? 0 : -1}
                className={`absolute left-[4%] top-0 flex h-[250px] w-[92%] flex-col justify-between border border-[#282722] bg-[#fffdfa] p-5 text-left shadow-[10px_10px_0_#f4a261] transition-[opacity,transform,box-shadow] duration-500 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#24231f] sm:h-[300px] sm:p-8 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'} ${distance === 0 ? 'z-30' : distance < 0 ? 'z-10' : 'z-20'}`}
                style={{ transform: reducedMotion ? 'none' : `translate3d(${offsetX}px, ${offsetY}px, ${distance === 0 ? 36 : -Math.abs(distance) * 45}px) rotate(${rotate}deg)`, transformOrigin: 'top left' }}
              >
                <span className="flex items-start justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8c8175]"><span>{card.type}</span><span>0{index + 1}</span></span>
                <span><strong className="block text-3xl font-semibold tracking-[-.07em] text-[#24231f]">{card.name}</strong><span className="mt-3 block max-w-sm text-sm leading-6 text-[#706b64]">{card.description}</span></span>
                <code className="border-l-2 border-[#f4a261] bg-[#f8f2eb] px-3 py-2 font-mono text-[10px] leading-5 text-[#575048]">{card.snippet}</code>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
