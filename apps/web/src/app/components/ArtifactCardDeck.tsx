'use client'

import { useState } from 'react'

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
}

export function ArtifactCardDeck({ ariaLabel, cards, deckLabel, deckCopy }: ArtifactCardDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = cards[activeIndex] ?? cards[0]

  if (!active) return null

  return (
    <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center" aria-label={ariaLabel}>
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{deckLabel}</p>
        <p className="mt-5 max-w-md text-base leading-7 text-[#706b64]">{deckCopy}</p>
        <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label={ariaLabel}>
          {cards.map((card, index) => (
            <button
              key={card.name}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              aria-controls={`artifact-panel-${index}`}
              onClick={() => setActiveIndex(index)}
              className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f] ${activeIndex === index ? 'border-[#24231f] bg-[#24231f] text-white' : 'border-[#d8d1c7] bg-white text-[#716c65] hover:border-[#a85e3c] hover:text-[#24231f]'}`}
            >
              {card.name}
            </button>
          ))}
        </div>
      </div>
      <div className="relative min-h-[370px] [perspective:1200px] sm:min-h-[420px]" id={`artifact-panel-${activeIndex}`} role="tabpanel" tabIndex={0}>
        {cards.map((card, index) => {
          const distance = index - activeIndex
          const visible = Math.abs(distance) <= 2
          return (
            <button
              key={card.name}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={card.name}
              tabIndex={visible ? 0 : -1}
              className={`absolute left-1/2 top-1/2 flex h-[250px] w-[min(88vw,440px)] -translate-x-1/2 -translate-y-1/2 flex-col justify-between border border-[#282722] bg-[#fffdfa] p-6 text-left shadow-[10px_10px_0_#f4a261] transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#24231f] sm:h-[300px] sm:p-8 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'} ${distance === 0 ? 'z-30' : distance < 0 ? 'z-10' : 'z-20'}`}
              style={{ transform: `translate(-50%, -50%) translate3d(${distance * 18}px, ${Math.abs(distance) * 18}px, ${-Math.abs(distance) * 50}px) rotate(${distance * 3}deg)`, transformOrigin: 'center center' }}
            >
              <span className="flex items-start justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8c8175]"><span>{card.type}</span><span>0{index + 1}</span></span>
              <span><strong className="block text-3xl font-semibold tracking-[-.07em] text-[#24231f]">{card.name}</strong><span className="mt-3 block max-w-sm text-sm leading-6 text-[#706b64]">{card.description}</span></span>
              <code className="border-l-2 border-[#f4a261] bg-[#f8f2eb] px-3 py-2 font-mono text-[10px] leading-5 text-[#575048]">{card.snippet}</code>
            </button>
          )
        })}
      </div>
    </div>
  )
}
