'use client'

import React, { useState } from 'react'
import {
  Compass,
  ArrowRight,
  Shield,
  Key,
  Check,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react'

export type LuxuryArchetypeId = 'architectural-residence' | 'horology-ledger' | 'concierge-voucher'

export function RefinedLuxuryShowcase() {
  const [activeArchetype, setActiveArchetype] = useState<LuxuryArchetypeId>('architectural-residence')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [selectedPiece, setSelectedPiece] = useState<string>('piece-01')
  const [viewingReserved, setViewingReserved] = useState(false)

  const archetypes: { id: LuxuryArchetypeId; label: string; desc: string }[] = [
    {
      id: 'architectural-residence',
      label: 'Architectural Residence Portfolio',
      desc: 'Cinematic spatial framing with restrained typography and material provenance',
    },
    {
      id: 'horology-ledger',
      label: 'Haute Horlogerie & Provenance Ledger',
      desc: 'Numbered curation of unique mechanical pieces with caliber specifications',
    },
    {
      id: 'concierge-voucher',
      label: 'Private Salon Reservation',
      desc: 'Understated commission slip with bespoke date selection',
    },
  ]

  const pieces = [
    {
      id: 'piece-01',
      title: 'CHRONOMÈTRE SOUVERAIN N° 04',
      atelier: 'Les Ateliers Horlogers de Genève',
      edition: 'Unique Piece 04/12',
      caliber: 'Calibre 1404 Manual-Wind Chronometer',
      balance: 'Free-Sprung Gyromax • 21,600 vph',
      material: 'Grade 5 Titanium & Raw Meteorite Dial',
      price: 'CHF 148,000',
    },
    {
      id: 'piece-02',
      title: 'TOURBILLON VOLANT CÉLESTE',
      atelier: 'Maison Vaneck & Cie',
      edition: 'Unique Piece 01/05',
      caliber: 'Calibre 1820 Flying Tourbillon with Sidereal Display',
      balance: 'Silicon escapement • 80h Reserve',
      material: 'Fairmined Honey Gold & Enamel Grand Feu',
      price: 'CHF 220,000',
    },
  ]

  return (
    <div className="bg-[#F6F2EA] text-[#24211D] border border-[#CFC4B7] rounded-[8px] overflow-hidden shadow-xs font-sans">
      {/* Refined Luxury Control Band */}
      <div className="bg-[#FFFCF8] border-b border-[#CFC4B7] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-base font-bold text-[#665144]">
            Refined Luxury
          </span>
          <span className="text-[#CFC4B7]">/</span>
          <span className="text-[11px] font-mono tracking-widest uppercase text-[#655E56]">
            QUIET PRESTIGE
          </span>
        </div>

        {/* Archetype switcher */}
        <div className="flex items-center gap-1 bg-[#E5DED3] p-1 rounded-[6px]">
          {archetypes.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => setActiveArchetype(arch.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[4px] transition-all ${
                activeArchetype === arch.id
                  ? 'bg-[#FFFCF8] text-[#24211D] shadow-xs font-serif font-bold'
                  : 'text-[#655E56] hover:text-[#24211D]'
              }`}
            >
              {arch.label}
            </button>
          ))}
        </div>

        {/* Viewport switch */}
        <div className="flex items-center gap-1 bg-[#E5DED3] p-1 rounded-[6px]">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-[4px] ${
              viewport === 'desktop' ? 'bg-[#FFFCF8] text-[#665144]' : 'text-[#655E56]'
            }`}
            title="Desktop 100%"
          >
            <Monitor className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-[4px] ${
              viewport === 'tablet' ? 'bg-[#FFFCF8] text-[#665144]' : 'text-[#655E56]'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-[4px] ${
              viewport === 'mobile' ? 'bg-[#FFFCF8] text-[#665144]' : 'text-[#655E56]'
            }`}
            title="Mobile 375px"
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport Frame */}
      <div className="p-4 sm:p-6 lg:p-8 bg-[#ECE5D9] flex justify-center overflow-x-auto min-h-[550px]">
        <div
          className={`bg-[#FFFCF8] transition-all duration-300 border border-[#CFC4B7] shadow-sm ${
            viewport === 'desktop'
              ? 'w-full max-w-5xl'
              : viewport === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
          } rounded-[6px] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="border-b border-[#CFC4B7] px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-[#FAF6EE]">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#655E56] block">
                PALAIS D’ORANGERIE • GENÈVE
              </span>
              <h2 className="font-serif text-lg tracking-wider text-[#24211D] uppercase">
                Maison de Haute Facture
              </h2>
            </div>
            <span className="text-xs font-serif italic text-[#665144]">
              Par invitation uniquement
            </span>
          </div>

          {/* Archetype Screen 1: Architectural Residence */}
          {activeArchetype === 'architectural-residence' && (
            <div className="p-6 sm:p-12 space-y-8">
              <div className="space-y-3 max-w-2xl">
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#665144]">
                  PROPRIÉTÉ EXCLUSIVE // LAKE GENEVA
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl font-light tracking-tight text-[#24211D] leading-tight">
                  RESIDENCE BELLERIVE
                </h1>
                <p className="text-xs sm:text-sm text-[#655E56] font-light leading-relaxed">
                  Conceived by architect Peter Zumthor across four terraces of Vals quartzite overlooking the Jura mountain range. Private deep-water mooring and subterranean gallery.
                </p>
              </div>

              {/* Architectural Spec Ledger */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-[#CFC4B7] text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#655E56] block">
                    Living Surface
                  </span>
                  <strong className="font-serif text-lg text-[#24211D]">940 m²</strong>
                  <span className="text-[11px] text-[#655E56] block mt-0.5">Interior Gross</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#655E56] block">
                    Private Grounds
                  </span>
                  <strong className="font-serif text-lg text-[#24211D]">1.4 Hectares</strong>
                  <span className="text-[11px] text-[#655E56] block mt-0.5">Protected Parkland</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#655E56] block">
                    Bedrooms & Suites
                  </span>
                  <strong className="font-serif text-lg text-[#24211D]">6 Primary Suites</strong>
                  <span className="text-[11px] text-[#655E56] block mt-0.5">Dual Dressing Salons</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#655E56] block">
                    Nautical Access
                  </span>
                  <strong className="font-serif text-lg text-[#24211D]">Private Pier</strong>
                  <span className="text-[11px] text-[#655E56] block mt-0.5">Boathouse for 42ft Craft</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-xs font-serif italic text-[#655E56]">
                  Acquisition dossier available upon confidential client registration.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveArchetype('concierge-voucher')}
                  className="px-6 py-3 bg-[#24211D] hover:bg-[#3D3730] text-[#FFFCF8] font-serif text-xs uppercase tracking-widest transition-colors shadow-xs"
                >
                  Request Private Viewing Protocol
                </button>
              </div>
            </div>
          )}

          {/* Archetype Screen 2: Horology Ledger */}
          {activeArchetype === 'horology-ledger' && (
            <div className="p-6 sm:p-10 space-y-6">
              <div className="border-b border-[#CFC4B7] pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-[#24211D]">Les Pièces Uniques</h3>
                  <p className="text-xs text-[#655E56]">Mechanical pieces manufactured entirely by hand in Geneva</p>
                </div>
                <span className="text-xs font-mono text-[#665144]">2 PIECES RECORDED</span>
              </div>

              <div className="space-y-6">
                {pieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="p-6 border border-[#CFC4B7] bg-[#FAF6EE] rounded-[4px] space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CFC4B7] pb-3">
                      <div>
                        <span className="text-[10px] font-mono tracking-widest text-[#665144] uppercase">
                          {piece.edition}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-[#24211D] mt-0.5">
                          {piece.title}
                        </h4>
                      </div>
                      <strong className="font-serif text-base text-[#665144]">{piece.price}</strong>
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-[#655E56]">Movement</dt>
                        <dd className="font-medium text-[#24211D] mt-0.5">{piece.caliber}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-[#655E56]">Regulation</dt>
                        <dd className="font-medium text-[#24211D] mt-0.5">{piece.balance}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] uppercase tracking-wider text-[#655E56]">Case & Dial</dt>
                        <dd className="font-medium text-[#24211D] mt-0.5">{piece.material}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Archetype Screen 3: Concierge Voucher */}
          {activeArchetype === 'concierge-voucher' && (
            <div className="p-6 sm:p-10 max-w-lg mx-auto space-y-6">
              <div className="border border-[#CFC4B7] bg-[#FAF6EE] p-6 rounded-[6px] space-y-5">
                <div className="text-center border-b border-[#CFC4B7] pb-4">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#665144]">
                    CONFIDENTIAL PROTOCOL
                  </span>
                  <h3 className="font-serif text-xl text-[#24211D] mt-1">
                    Salon de Présentation Privée
                  </h3>
                  <p className="text-xs text-[#655E56] mt-0.5">
                    Geneva • Paris • Tokyo • New York
                  </p>
                </div>

                {viewingReserved ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="size-10 rounded-full bg-[#EBF4EE] text-[#356A55] mx-auto flex items-center justify-center">
                      <Check className="size-5" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#24211D]">
                      Protocole Enregistré
                    </h4>
                    <p className="text-xs text-[#655E56] max-w-xs mx-auto">
                      Your confidential salon session has been recorded. Our private concierge will contact your representative directly.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setViewingReserved(true)
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label className="font-serif text-[#24211D] block mb-1">
                        Principal Representative Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Rahmat Hadinata"
                        required
                        className="w-full p-2.5 bg-white border border-[#CFC4B7] rounded-[4px] text-xs text-[#24211D] focus:outline-none focus:border-[#24211D]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-serif text-[#24211D] block mb-1">Preferred Salon</label>
                        <select className="w-full p-2.5 bg-white border border-[#CFC4B7] rounded-[4px] text-xs text-[#24211D] focus:outline-none focus:border-[#24211D]">
                          <option>Genève • Quai des Bergues</option>
                          <option>Paris • Place Vendôme</option>
                          <option>Tokyo • Ginza Atelier</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-serif text-[#24211D] block mb-1">Viewing Date</label>
                        <input
                          type="date"
                          defaultValue="2026-11-04"
                          className="w-full p-2 bg-white border border-[#CFC4B7] rounded-[4px] text-xs text-[#24211D] focus:outline-none focus:border-[#24211D]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#24211D] hover:bg-[#3D3730] text-[#FFFCF8] font-serif text-xs uppercase tracking-widest transition-colors shadow-xs mt-2"
                    >
                      Authorize Private Salon Request
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
