'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Ticket,
  ArrowUpRight,
  Zap,
  Globe,
  Radio,
  Monitor,
  Tablet,
  Smartphone,
  Check,
} from 'lucide-react'

export type ExpressiveArchetypeId = 'keynote-stage' | 'gallery-works' | 'ticket-pass'

export function ExpressiveCreativeShowcase() {
  const [activeArchetype, setActiveArchetype] = useState<ExpressiveArchetypeId>('keynote-stage')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [selectedTrack, setSelectedTrack] = useState<string>('All')
  const [ticketTier, setTicketTier] = useState<'STUDIO' | 'PATRON'>('STUDIO')

  const archetypes: { id: ExpressiveArchetypeId; label: string; desc: string }[] = [
    {
      id: 'keynote-stage',
      label: 'Avant-Garde Keynote Stage',
      desc: 'Oversized display headline, deliberate asymmetric composition, and geometric accents',
    },
    {
      id: 'gallery-works',
      label: 'Exhibition & Works Matrix',
      desc: 'High-contrast portfolio cards with confident 2px borders and expressive typography',
    },
    {
      id: 'ticket-pass',
      label: 'Digital Event Pass Stub',
      desc: 'Bold graphic admission pass with perforated borders and live badge toggle',
    },
  ]

  const works = [
    {
      id: 'exp-01',
      title: 'KINETIC SYNAPSE',
      artist: 'Studio Monolith',
      track: 'Generative',
      year: '2026',
      accentColor: '#E34B2F',
      desc: 'Real-time neural topology projections mapped across 12-meter brutalist concrete monolithic pillars.',
    },
    {
      id: 'exp-02',
      title: 'TACTILE FREQUENCIES',
      artist: 'Yuki Takahashi',
      track: 'Sonic Sculpture',
      year: '2026',
      accentColor: '#216B52',
      desc: 'Electromagnetic audio resonators tuned to the tidal resonance of the Baltic Sea.',
    },
    {
      id: 'exp-03',
      title: 'CHROMA DRIFT V',
      artist: 'Elena Vance',
      track: 'Digital Light',
      year: '2026',
      accentColor: '#9B5B11',
      desc: 'Autonomous light choreographies responding to environmental carbon density metrics.',
    },
  ]

  return (
    <div className="bg-[#F1EDDF] text-[#16171A] border-2 border-[#27282B] rounded-[8px] overflow-hidden shadow-[4px_4px_0px_#27282B]">
      {/* Expressive Creative Toolbar */}
      <div className="bg-[#FFFCF5] border-b-2 border-[#27282B] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-[#E34B2F] text-white rounded-[3px] font-black text-xs">
            EC
          </span>
          <span className="font-extrabold text-sm tracking-tight text-[#16171A] uppercase">
            Expressive Creative
          </span>
          <span className="text-[#27282B]">/</span>
          <span className="text-xs font-mono font-bold text-[#E34B2F]">
            DELIBERATE PROVOCATION
          </span>
        </div>

        {/* Archetype switcher */}
        <div className="flex items-center gap-1 bg-[#E5DFD0] p-1 rounded-[4px] border border-[#27282B]">
          {archetypes.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => setActiveArchetype(arch.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition-all ${
                activeArchetype === arch.id
                  ? 'bg-[#16171A] text-white shadow-xs'
                  : 'text-[#494B50] hover:text-[#16171A]'
              }`}
            >
              {arch.label}
            </button>
          ))}
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1 bg-[#E5DFD0] p-1 rounded-[4px] border border-[#27282B]">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-[2px] ${
              viewport === 'desktop' ? 'bg-[#16171A] text-white' : 'text-[#494B50]'
            }`}
            title="Desktop 100%"
          >
            <Monitor className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-[2px] ${
              viewport === 'tablet' ? 'bg-[#16171A] text-white' : 'text-[#494B50]'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-[2px] ${
              viewport === 'mobile' ? 'bg-[#16171A] text-white' : 'text-[#494B50]'
            }`}
            title="Mobile 375px"
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main viewport canvas */}
      <div className="p-4 sm:p-6 lg:p-8 bg-[#E5DFD0] flex justify-center overflow-x-auto min-h-[550px]">
        <div
          className={`bg-[#FFFCF5] transition-all duration-300 border-2 border-[#27282B] shadow-[6px_6px_0px_#27282B] ${
            viewport === 'desktop'
              ? 'w-full max-w-5xl'
              : viewport === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
          } rounded-[6px] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="border-b-2 border-[#27282B] px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-[#F1EDDF]">
            <div className="flex items-center gap-2">
              <span className="size-3 bg-[#E34B2F] rounded-full inline-block" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#16171A]">
                SYNTHESIS BIENNALE // BERLIN 2026
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span>OCT 24–28</span>
              <span className="px-2 py-0.5 bg-[#16171A] text-[#FFFCF5] rounded-[2px]">
                LIVE PROGRAM
              </span>
            </div>
          </div>

          {/* Archetype Screen 1: Keynote Stage */}
          {activeArchetype === 'keynote-stage' && (
            <div className="p-6 sm:p-10 space-y-8">
              {/* Massive Hero Block */}
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 bg-[#E34B2F] text-white font-mono text-xs font-black uppercase tracking-wider -rotate-1 border border-[#27282B]">
                  KEYNOTE EXHIBIT // FORUM 01
                </div>

                <h2 className="text-3xl sm:text-6xl font-black uppercase tracking-tight text-[#16171A] leading-[0.95]">
                  WHERE CODE <br />
                  <span className="text-[#E34B2F] underline decoration-4 underline-offset-4">
                    BECOMES FORM
                  </span>
                </h2>

                <p className="text-sm sm:text-base font-medium text-[#494B50] max-w-2xl leading-relaxed">
                  A four-day gathering of computational sculptors, typographic dissidents, and algorithmic provocateurs at the decommissioned Kraftwerk turbine hall.
                </p>
              </div>

              {/* Geometric Highlight Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="p-5 border-2 border-[#27282B] bg-[#F1EDDF] rounded-[4px] shadow-[3px_3px_0px_#27282B] space-y-2">
                  <span className="font-mono text-xs font-black text-[#E34B2F]">01 / RESONANCE</span>
                  <h3 className="font-extrabold text-base text-[#16171A]">36 Autonomous Acoustic Sculptures</h3>
                  <p className="text-xs text-[#494B50]">Spatialized sound synthesis generated dynamically from solar flare radio feeds.</p>
                </div>

                <div className="p-5 border-2 border-[#27282B] bg-[#16171A] text-[#FFFCF5] rounded-[4px] shadow-[3px_3px_0px_#E34B2F] space-y-2">
                  <span className="font-mono text-xs font-black text-[#E34B2F]">02 / CHOREOGRAPHY</span>
                  <h3 className="font-extrabold text-base text-white">Robotic Wire-Arc Metal Sintering</h3>
                  <p className="text-xs text-[#A2B0B5]">Live architectural printing in 12-ton titanium alloy continuously over 96 hours.</p>
                </div>

                <div className="p-5 border-2 border-[#27282B] bg-[#FFFCF5] rounded-[4px] shadow-[3px_3px_0px_#27282B] space-y-2">
                  <span className="font-mono text-xs font-black text-[#216B52]">03 / DISPATCH</span>
                  <h3 className="font-extrabold text-base text-[#16171A]">Catalogue Raisonné Printings</h3>
                  <p className="text-xs text-[#494B50]">Screenprinted foil volumes bound on-site with experimental stochastic layouts.</p>
                </div>
              </div>
            </div>
          )}

          {/* Archetype Screen 2: Gallery Works */}
          {activeArchetype === 'gallery-works' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#27282B] pb-4">
                <div className="flex items-center gap-2">
                  {['All', 'Generative', 'Sonic Sculpture', 'Digital Light'].map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setSelectedTrack(track)}
                      className={`px-3 py-1 text-xs font-bold rounded-[3px] border-2 border-[#27282B] transition-all ${
                        selectedTrack === track
                          ? 'bg-[#E34B2F] text-white shadow-[2px_2px_0px_#27282B]'
                          : 'bg-[#FFFCF5] text-[#16171A] hover:bg-[#F1EDDF]'
                      }`}
                    >
                      {track}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-xs font-bold">3 EXHIBITIONS OPEN</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {works
                  .filter((w) => selectedTrack === 'All' || w.track === selectedTrack)
                  .map((work) => (
                    <div
                      key={work.id}
                      className="border-2 border-[#27282B] bg-[#FFFCF5] rounded-[4px] p-5 shadow-[4px_4px_0px_#27282B] flex flex-col justify-between space-y-4 hover:translate-x-0.5 hover:-translate-y-0.5 transition-transform"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-black uppercase text-[#E34B2F]">
                            {work.track}
                          </span>
                          <span className="text-xs font-mono font-bold">{work.year}</span>
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-[#16171A]">
                          {work.title}
                        </h3>
                        <p className="text-xs text-[#494B50] leading-relaxed">
                          {work.desc}
                        </p>
                      </div>

                      <div className="pt-3 border-t-2 border-[#27282B] flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#16171A]">
                          {work.artist}
                        </span>
                        <ArrowUpRight className="size-4 text-[#E34B2F]" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Archetype Screen 3: Ticket Pass */}
          {activeArchetype === 'ticket-pass' && (
            <div className="p-6 sm:p-10 max-w-lg mx-auto space-y-6">
              <div className="border-2 border-[#27282B] bg-[#FFFCF5] rounded-[6px] shadow-[6px_6px_0px_#27282B] overflow-hidden">
                {/* Perforated Top Header */}
                <div className="bg-[#16171A] text-white p-5 border-b-2 border-dashed border-[#FFFCF5] relative">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#E34B2F] font-bold">
                    OFFICIAL ADMISSION PASS
                  </span>
                  <h3 className="text-2xl font-black uppercase tracking-tight mt-1 text-white">
                    SYNTHESIS // 2026
                  </h3>
                  <p className="text-xs text-[#A2B0B5] mt-0.5 font-mono">
                    VALID ALL 4 DAYS • ACCESS TO WORKSHOPS & CONCERTS
                  </p>
                </div>

                <div className="p-6 space-y-5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketTier('STUDIO')}
                      className={`p-3 rounded-[4px] border-2 text-left font-mono transition-all ${
                        ticketTier === 'STUDIO'
                          ? 'border-[#27282B] bg-[#F1EDDF] shadow-[3px_3px_0px_#27282B]'
                          : 'border-[#27282B]/30 hover:border-[#27282B]'
                      }`}
                    >
                      <span className="font-black text-[#16171A] block">STUDIO PASS</span>
                      <strong className="text-base font-black text-[#E34B2F] mt-1 block">€140</strong>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTicketTier('PATRON')}
                      className={`p-3 rounded-[4px] border-2 text-left font-mono transition-all ${
                        ticketTier === 'PATRON'
                          ? 'border-[#27282B] bg-[#F1EDDF] shadow-[3px_3px_0px_#27282B]'
                          : 'border-[#27282B]/30 hover:border-[#27282B]'
                      }`}
                    >
                      <span className="font-black text-[#16171A] block">PATRON PASS</span>
                      <strong className="text-base font-black text-[#E34B2F] mt-1 block">€280</strong>
                    </button>
                  </div>

                  <div className="p-3 bg-[#F1EDDF] border-2 border-[#27282B] rounded-[4px] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#494B50]">HOLDER:</span>
                      <span className="font-bold text-[#16171A]">RAHMAT HADINATA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#494B50]">VENUE:</span>
                      <span className="font-bold text-[#16171A]">KRAFTWERK MAIN HALL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#494B50]">BADGE UID:</span>
                      <span className="font-bold text-[#E34B2F]">BER-2026-X84</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-3 bg-[#E34B2F] hover:bg-[#C93B20] text-white font-black text-sm uppercase tracking-wider rounded-[4px] border-2 border-[#27282B] shadow-[4px_4px_0px_#27282B] transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  >
                    CONFIRM PASSPORT ISSUE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
