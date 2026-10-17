'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Layers,
  Eye,
  FileCode,
  ShieldCheck,
  Network,
  Palette,
} from 'lucide-react'
import {
  listTemplateFamilies,
  TemplateFamilyId,
  StructuredEnterpriseShowcase,
  EditorialCraftShowcase,
  PrecisionTechnicalShowcase,
  ExpressiveCreativeShowcase,
  CalmAndHumanShowcase,
  RefinedLuxuryShowcase,
  DesignBlueprint,
} from '@repo/design-templates'

export interface TemplateFamilySelectorProps {
  currentFamilyId?: TemplateFamilyId
  onSelectFamily?: (familyId: TemplateFamilyId) => void
  onApplyBlueprint?: (blueprint: DesignBlueprint) => void
  children?: React.ReactNode // For embedding the existing graph if toggled
  hasGraph?: boolean
}

export function TemplateFamilySelector({
  currentFamilyId = 'structured-enterprise',
  onSelectFamily,
  onApplyBlueprint,
  children,
  hasGraph = false,
}: TemplateFamilySelectorProps) {
  const families = listTemplateFamilies()
  const [selectedId, setSelectedId] = useState<TemplateFamilyId>(currentFamilyId)
  const [activeView, setActiveView] = useState<'templates' | 'graph'>('templates')
  const [showBlueprintModal, setShowBlueprintModal] = useState(false)
  const [isSynthesized, setIsSynthesized] = useState(false)

  const selectedFamily =
    families.find((f) => f.id === selectedId) ?? families[0]

  const handleSelect = (id: TemplateFamilyId) => {
    setSelectedId(id)
    onSelectFamily?.(id)
  }

  // Generate deterministic client-side blueprint preview
  const generatedBlueprint: DesignBlueprint = {
    familyId: selectedFamily.id,
    familyVersion: selectedFamily.version,
    contextVersion: 1,
    screenArchetypes: selectedFamily.supportedArchetypes,
    recipeSelections: {
      'page:navigation': 'top-command-nav',
      'page:command': 'title-filter-band',
      'page:overview': 'stat-rail',
      'page:collection': 'dense-table',
      'page:inspection': 'right-drawer',
      'page:feedback': 'inline-validation',
    },
    tokens: selectedFamily.tokens,
    typography: selectedFamily.typography,
    designDecisions: [
      `Selected ${selectedFamily.name} to maximize operational clarity and high-density task execution.`,
      'Locked 6-8px component radius hierarchy without decorative pill buttons.',
      'Enforced WCAG AA contrast rules and tabular numerals for data accuracy.',
    ],
    constraintsPassed: true,
    status: isSynthesized ? 'APPROVED' : 'DRAFT',
  }

  const renderMiniPreview = (familyId: TemplateFamilyId) => {
    switch (familyId) {
      case 'structured-enterprise':
        return (
          <div className="h-44 w-full bg-[#0F172A] text-slate-200 p-2.5 flex flex-col justify-between overflow-hidden font-sans select-none text-[10px] relative rounded-t-[4px]">
            {/* Mini Browser Bar */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500/80" />
                <span className="size-2 rounded-full bg-amber-500/80" />
                <span className="size-2 rounded-full bg-emerald-500/80" />
                <span className="text-[9px] font-mono text-slate-400 ml-1">cloud.northline.io/prod</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-semibold">
                <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
                99.99% SLA
              </div>
            </div>

            {/* Mini Nav Bar */}
            <div className="flex items-center justify-between py-1 border-b border-slate-800 text-[9px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white flex items-center gap-1">
                  <span className="size-2.5 rounded bg-blue-600 inline-block" /> Northline
                </span>
                <span className="text-slate-300">Clusters</span>
                <span>Workflows</span>
                <span>Audit</span>
              </div>
              <span className="size-4 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-[8px]">RH</span>
            </div>

            {/* Mini Content Grid */}
            <div className="grid grid-cols-[1.2fr_1fr] gap-2 items-center py-1">
              {/* Left Column: Metrics & Telemetry Bars */}
              <div className="space-y-1">
                <div className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">
                  Global Ingress Traffic
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight">4,892.4</span>
                  <span className="text-[9px] text-slate-400">req/s</span>
                  <span className="text-[8px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 rounded">↑ 14.8%</span>
                </div>
                {/* 6 Vertical Bar Chart */}
                <div className="flex items-end gap-1 h-7 pt-1">
                  <div className="w-2.5 bg-blue-500/40 rounded-t h-3" />
                  <div className="w-2.5 bg-blue-500/60 rounded-t h-4" />
                  <div className="w-2.5 bg-blue-500/50 rounded-t h-3.5" />
                  <div className="w-2.5 bg-blue-500/80 rounded-t h-5" />
                  <div className="w-2.5 bg-blue-500 rounded-t h-6 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                  <div className="w-2.5 bg-cyan-400 rounded-t h-6.5 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                </div>
              </div>

              {/* Right Column: Floating Ledger Card */}
              <div className="bg-slate-800/90 border border-slate-700 rounded p-1.5 space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-[8px] border-b border-slate-700/60 pb-0.5 text-slate-300 font-semibold">
                  <span>Active Nodes</span>
                  <span className="text-blue-400">3/3</span>
                </div>
                <div className="space-y-0.5 text-[8px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="truncate">us-east-1a</span>
                    <span className="text-emerald-400 font-mono">1.2ms</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="truncate">eu-west-1</span>
                    <span className="text-emerald-400 font-mono">18.4ms</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="truncate">ap-east-1</span>
                    <span className="text-cyan-400 font-mono">42.1ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Strip */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[8px]">
              <span className="text-slate-400">Cluster: prod-tokyo-09</span>
              <span className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2 py-0.5 rounded shadow-xs">
                Inspect Ingress →
              </span>
            </div>
          </div>
        )

      case 'editorial-craft':
        return (
          <div className="h-44 w-full bg-[#FAF7F2] text-[#25231F] p-2.5 flex flex-col justify-between overflow-hidden font-serif select-none relative border border-[#E3DBD0] rounded-t-[4px]">
            {/* Mini Masthead */}
            <div className="border-b border-[#D8CEBF] pb-1.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase block text-[#25231F]">
                  THE NORDIC REVIEW
                </span>
                <span className="text-[7.5px] font-sans tracking-wider uppercase text-[#8C8274]">
                  Issue 14 • Copenhagen & Oslo
                </span>
              </div>
              <span className="text-[8px] font-sans px-1.5 py-0.5 bg-[#EFE9DD] text-[#8B4335] font-semibold rounded">
                ESSAYS
              </span>
            </div>

            {/* Asymmetric Magazine Spread */}
            <div className="grid grid-cols-[1.3fr_0.9fr] gap-2.5 items-start py-1">
              <div className="space-y-1">
                <span className="text-[7.5px] font-sans uppercase tracking-widest text-[#8B4335] font-bold block">
                  ARCHITECTURE & SILENCE
                </span>
                <h4 className="text-xs font-bold leading-tight text-[#25231F]">
                  The tactile poetry of Vals quartzite.
                </h4>
                {/* Pull Quote */}
                <div className="pl-1.5 border-l-2 border-[#8B4335] text-[8px] italic text-[#6B6357] leading-snug">
                  “Light is the only material that requires no mortar.”
                </div>
                <p className="text-[7.5px] text-[#8C8274] font-sans leading-tight line-clamp-1">
                  By Helene Skov • 8 min read
                </p>
              </div>

              {/* Monograph Plate Mockup */}
              <div className="bg-[#F0ECE1] border border-[#D8CEBF] rounded p-1.5 space-y-1 shadow-xs flex flex-col items-center justify-center text-center">
                <div className="w-full h-11 bg-gradient-to-br from-[#E2DACB] to-[#CEC1AF] rounded flex items-center justify-center border border-[#D8CEBF]/50">
                  <span className="text-base font-serif italic text-[#8B4335]/70">№ 04</span>
                </div>
                <span className="text-[7px] font-sans tracking-widest uppercase text-[#8C8274]">
                  MONOGRAPH SERIE
                </span>
              </div>
            </div>

            {/* Bottom Colophon line */}
            <div className="flex items-center justify-between pt-1 border-t border-[#D8CEBF] text-[7.5px] font-sans text-[#8C8274]">
              <span>Printed on 120gsm Munken Pure</span>
              <span className="text-[#8B4335] font-semibold underline decoration-[#8B4335]/40">Read Monograph</span>
            </div>
          </div>
        )

      case 'precision-technical':
        return (
          <div className="h-44 w-full bg-[#0B0F14] text-slate-300 p-2.5 flex flex-col justify-between overflow-hidden font-mono select-none text-[9px] relative border border-[#1E293B] rounded-t-[4px]">
            {/* Cyberpunk grid background accent */}
            <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:8px_8px] opacity-40 pointer-events-none" />

            {/* Mini Terminal Bar */}
            <div className="relative flex items-center justify-between pb-1 border-b border-[#1E293B]">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[#38BDF8] font-bold text-[8px]">EDGE-SYS::NODE-04</span>
              </div>
              <span className="text-[7.5px] text-slate-500 font-semibold tracking-wider">
                UTC 14:32:01.04
              </span>
            </div>

            {/* Command & Waveform */}
            <div className="relative space-y-1.5 py-1">
              <div className="bg-[#121A22] border border-[#1E293B] rounded p-1 text-[8px] text-[#38BDF8]">
                <span className="text-emerald-400 font-bold">$</span> telemetry --stream --hz=120
              </div>

              {/* Glowing SVG Waveform */}
              <div className="h-10 bg-[#070B0E] border border-[#1E293B] rounded p-1 flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between text-[7px] text-slate-500">
                  <span>THROUGHPUT WAVEFORM</span>
                  <span className="text-emerald-400 font-bold">4.89k/s</span>
                </div>
                <svg className="w-full h-5" viewBox="0 0 100 24" preserveAspectRatio="none">
                  <path
                    d="M0,18 Q15,4 30,14 T60,8 T85,16 L100,6"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.8"
                    className="drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]"
                  />
                </svg>
              </div>

              {/* Monospace telemetry pill grid */}
              <div className="grid grid-cols-3 gap-1 text-[7.5px]">
                <div className="bg-[#121A22] border border-[#1E293B] p-1 rounded">
                  <span className="text-slate-500 block">LATENCY</span>
                  <span className="text-emerald-400 font-bold">11.4 ms</span>
                </div>
                <div className="bg-[#121A22] border border-[#1E293B] p-1 rounded">
                  <span className="text-slate-500 block">DROPS</span>
                  <span className="text-cyan-400 font-bold">0.00%</span>
                </div>
                <div className="bg-[#121A22] border border-[#1E293B] p-1 rounded">
                  <span className="text-slate-500 block">MEMORY</span>
                  <span className="text-amber-400 font-bold">24.2%</span>
                </div>
              </div>
            </div>

            {/* Bottom status */}
            <div className="relative flex items-center justify-between pt-1 border-t border-[#1E293B] text-[7.5px] text-slate-500">
              <span>STATUS: CLUSTER HEALTHY</span>
              <span className="text-[#38BDF8]">[STREAM ACTIVE]</span>
            </div>
          </div>
        )

      case 'expressive-creative':
        return (
          <div className="h-44 w-full bg-[#F3EFE0] text-[#16171A] p-2 flex flex-col justify-between overflow-hidden font-sans select-none relative border-2 border-[#16171A] shadow-[2px_2px_0px_#16171A] rounded-t-[4px]">
            {/* Marquee ticker banner */}
            <div className="bg-[#FFE600] border-b-2 border-[#16171A] -mx-2 -mt-2 px-2 py-0.5 flex items-center justify-between text-[7.5px] font-black uppercase tracking-wider text-[#16171A]">
              <span>★ SYNTHESIS FESTIVAL ’26 ★</span>
              <span>PARIS // TOKYO</span>
            </div>

            {/* Hero Section with Brutalist Badge */}
            <div className="space-y-1.5 py-1">
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="text-sm font-black leading-none uppercase tracking-tight text-[#16171A]">
                    DESIGN IS<br />RESISTANCE
                  </h4>
                  <span className="text-[7.5px] font-mono uppercase bg-[#16171A] text-white px-1 py-0.5 mt-1 inline-block">
                    AVANT-GARDE COHORT
                  </span>
                </div>

                {/* Tilted Sticker Badge */}
                <div className="rotate-[-6deg] bg-[#FF4800] text-white border-2 border-[#16171A] font-black text-[7.5px] px-1.5 py-1 uppercase shadow-[1.5px_1.5px_0px_#16171A]">
                  GRAND PRIX ✦
                </div>
              </div>

              {/* Perforated Ticket Stub Mockup */}
              <div className="bg-white border-2 border-[#16171A] p-1.5 rounded-none flex items-center justify-between shadow-[2px_2px_0px_#16171A]">
                <div>
                  <span className="text-[7px] font-mono text-slate-500 block">PASSCODE // VIP</span>
                  <span className="text-[9px] font-black uppercase text-[#16171A]">STAGE ZERO-01</span>
                </div>
                <div className="h-5 w-12 bg-[#16171A] text-[#FFE600] text-[7px] font-black flex items-center justify-center border border-[#16171A]">
                  ACCESS ↗
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between pt-1 border-t-2 border-[#16171A] text-[7.5px] font-bold uppercase">
              <span className="text-[#FF4800]">SOLD OUT IN 48H</span>
              <span className="underline decoration-2">VIEW EXHIBITION</span>
            </div>
          </div>
        )

      case 'calm-and-human':
        return (
          <div className="h-44 w-full bg-[#F5F8F5] text-[#203129] p-2.5 flex flex-col justify-between overflow-hidden font-sans select-none relative rounded-t-[10px] border border-[#D1E0D5]">
            {/* Calm Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#D1E0D5]">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#326F5C]" />
                <span className="font-semibold text-[9px] text-[#203129]">Haven Sanctuary</span>
              </div>
              <span className="text-[7.5px] font-medium bg-[#E8F1EB] text-[#326F5C] px-2 py-0.5 rounded-full">
                Care Space Active
              </span>
            </div>

            {/* Split Content: Wellness Gauge & Consultation Card */}
            <div className="grid grid-cols-[1.1fr_1fr] gap-2 items-center py-1">
              <div className="space-y-1">
                <span className="text-[7.5px] font-medium text-[#50665B] block">
                  Restorative Cadence
                </span>
                <h4 className="text-[11px] font-bold text-[#203129] leading-tight">
                  Gentle morning restoration.
                </h4>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="size-4 rounded-full bg-[#E8F1EB] text-[#326F5C] font-semibold text-[7px] flex items-center justify-center">
                    SL
                  </span>
                  <div className="text-[7.5px] text-[#50665B] leading-none">
                    <span className="font-semibold text-[#203129] block">Dr. Sarah Lin</span>
                    <span>10:30 AM Session</span>
                  </div>
                </div>
              </div>

              {/* Circular Gauge Card */}
              <div className="bg-white border border-[#D1E0D5] rounded-[8px] p-2 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="relative size-10 flex items-center justify-center">
                  <svg className="size-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#E8F1EB" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#326F5C"
                      strokeWidth="3"
                      strokeDasharray="88 100"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[9px] font-bold text-[#326F5C]">88%</span>
                </div>
                <span className="text-[7px] font-medium text-[#50665B] mt-0.5">Calm Score</span>
              </div>
            </div>

            {/* Pill chips */}
            <div className="flex items-center justify-between pt-1 border-t border-[#D1E0D5] text-[7.5px] text-[#50665B]">
              <span>🌿 Circadian Sync</span>
              <span className="text-[#326F5C] font-semibold">Continue Reset →</span>
            </div>
          </div>
        )

      case 'refined-luxury':
        return (
          <div className="h-44 w-full bg-[#F7F4EE] text-[#24211D] p-2.5 flex flex-col justify-between overflow-hidden font-serif select-none relative border border-[#D9D0C3] rounded-t-[4px]">
            {/* Masthead */}
            <div className="text-center border-b border-[#D9D0C3] pb-1.5">
              <span className="text-[7px] font-mono tracking-widest uppercase text-[#736A5E] block">
                PALAIS D’ORANGERIE • GENÈVE
              </span>
              <h4 className="text-[10px] uppercase tracking-wider font-light text-[#24211D]">
                Maison de Haute Facture
              </h4>
            </div>

            {/* Residence Showcase */}
            <div className="space-y-1.5 py-1 text-center">
              <span className="text-[7px] font-mono tracking-widest text-[#736A5E] uppercase block">
                PROPRIÉTÉ EXCLUSIVE // LAKE GENEVA
              </span>
              <h3 className="text-xs font-light tracking-wide text-[#24211D] uppercase">
                RESIDENCE BELLERIVE
              </h3>
              <p className="text-[7px] font-sans text-[#736A5E] line-clamp-1 italic max-w-xs mx-auto">
                Vals quartzite terraces overlooking the Jura mountain range.
              </p>

              {/* Architectural Specs Ribbon */}
              <div className="grid grid-cols-3 gap-1 border-y border-[#D9D0C3] py-1 text-[7.5px] bg-[#FAF8F3]">
                <div>
                  <span className="text-[6.5px] uppercase tracking-wider text-[#736A5E] block">SURFACE</span>
                  <strong className="font-serif text-[#24211D]">940 m²</strong>
                </div>
                <div>
                  <span className="text-[6.5px] uppercase tracking-wider text-[#736A5E] block">PARKLAND</span>
                  <strong className="font-serif text-[#24211D]">1.4 Ha</strong>
                </div>
                <div>
                  <span className="text-[6.5px] uppercase tracking-wider text-[#736A5E] block">VALUATION</span>
                  <strong className="font-serif text-[#24211D]">CHF 148k</strong>
                </div>
              </div>
            </div>

            {/* Bottom Confidential Protocol */}
            <div className="flex items-center justify-between pt-1 border-t border-[#D9D0C3] text-[7px] font-sans">
              <span className="italic text-[#736A5E]">Par invitation uniquement</span>
              <span className="text-[#24211D] font-serif font-bold uppercase tracking-wider">Protocol →</span>
            </div>
          </div>
        )
    }
  }

  const renderActiveShowcase = () => {
    switch (selectedFamily.id) {
      case 'structured-enterprise':
        return <StructuredEnterpriseShowcase />
      case 'editorial-craft':
        return <EditorialCraftShowcase />
      case 'precision-technical':
        return <PrecisionTechnicalShowcase />
      case 'expressive-creative':
        return <ExpressiveCreativeShowcase />
      case 'calm-and-human':
        return <CalmAndHumanShowcase />
      case 'refined-luxury':
        return <RefinedLuxuryShowcase />
      default:
        return <StructuredEnterpriseShowcase />
    }
  }

  const handleApply = () => {
    setIsSynthesized(true)
    onApplyBlueprint?.(generatedBlueprint)
  }

  return (
    <div className="space-y-6">
      {/* Top Bar / View Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-[#D5DFE7] rounded-[8px] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#E7EFF5] text-[#245E84] rounded-[6px]">
              <Palette className="size-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-bold text-[#17222D]">
              Template-Guided Generative Design System
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-[#E9EEF2] text-[#245E84] font-semibold rounded">
              v0.1.0 Reference
            </span>
          </div>
          <p className="mt-1 text-xs text-[#546575]">
            Select an art-directed Template Family to establish visual DNA & composition grammar. Canonical Project Context dictates functional screens.
          </p>
        </div>

        {hasGraph && (
          <div className="flex items-center gap-1 bg-[#E9EEF2] p-1 rounded-[6px] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveView('templates')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors ${
                activeView === 'templates'
                  ? 'bg-white text-[#245E84] shadow-xs'
                  : 'text-[#546575] hover:text-[#17222D]'
              }`}
            >
              <Palette className="size-3.5" aria-hidden="true" />
              Template Foundry
            </button>
            <button
              type="button"
              onClick={() => setActiveView('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors ${
                activeView === 'graph'
                  ? 'bg-white text-[#245E84] shadow-xs'
                  : 'text-[#546575] hover:text-[#17222D]'
              }`}
            >
              <Network className="size-3.5" aria-hidden="true" />
              Dependency Graph
            </button>
          </div>
        )}
      </div>

      {activeView === 'graph' && children ? (
        children
      ) : (
        <div className="space-y-6">
          {/* Template Family Card Deck */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#546575]">
                Available Master Design Families (6)
              </span>
              <span className="text-xs text-[#8898AA]">
                Click a family to inspect DNA & preview interactive reference UI
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {families.map((family) => {
                const isSelected = selectedId === family.id

                const getCardClasses = () => {
                  switch (family.id) {
                    case 'structured-enterprise':
                      return isSelected
                        ? 'bg-white border-blue-600 ring-2 ring-blue-500/25 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs'
                    case 'editorial-craft':
                      return isSelected
                        ? 'bg-[#FAF7F2] border-[#8B4335] ring-2 ring-[#8B4335]/25 shadow-md'
                        : 'bg-[#FAF8F5] border-[#D8CEBF] hover:border-[#8B4335]/70 hover:shadow-xs'
                    case 'precision-technical':
                      return isSelected
                        ? 'bg-[#0D1217] text-slate-100 border-[#38BDF8] ring-2 ring-cyan-500/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                        : 'bg-[#0F141C] text-slate-200 border-[#222E37] hover:border-[#38BDF8]/60 hover:shadow-xs'
                    case 'expressive-creative':
                      return isSelected
                        ? 'bg-[#FBF8EE] border-2 border-[#16171A] ring-2 ring-[#FF4800]/40 shadow-[4px_4px_0px_#16171A]'
                        : 'bg-[#FDFBF7] border-2 border-[#16171A] shadow-[2.5px_2.5px_0px_#16171A] hover:shadow-[4px_4px_0px_#FF4800]'
                    case 'calm-and-human':
                      return isSelected
                        ? 'bg-[#F9FAF7] rounded-2xl border-[#326F5C] ring-2 ring-[#326F5C]/25 shadow-md'
                        : 'bg-[#FAFCF9] rounded-2xl border-[#D1E0D5] hover:border-[#326F5C]/70 hover:shadow-xs'
                    case 'refined-luxury':
                      return isSelected
                        ? 'bg-[#FAF8F3] border-[#665144] ring-2 ring-[#665144]/25 shadow-md'
                        : 'bg-[#FAF7F2] border-[#DDD3C4] hover:border-[#665144]/70 hover:shadow-xs'
                    default:
                      return isSelected
                        ? 'bg-white border-[#245E84] ring-2 ring-[#245E84]/25 shadow-md'
                        : 'bg-white border-[#D5DFE7] hover:border-[#8898AA]'
                  }
                }

                return (
                  <button
                    key={family.id}
                    type="button"
                    onClick={() => handleSelect(family.id)}
                    className={`p-3.5 text-left rounded-[8px] border transition-all flex flex-col justify-between select-none ${getCardClasses()}`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm ${
                            family.id === 'editorial-craft' || family.id === 'refined-luxury'
                              ? 'font-serif font-bold text-base'
                              : family.id === 'precision-technical'
                              ? 'font-mono font-bold text-[#38BDF8]'
                              : family.id === 'expressive-creative'
                              ? 'font-black tracking-tight uppercase'
                              : family.id === 'calm-and-human'
                              ? 'font-semibold text-[#203129]'
                              : 'font-bold text-[#17222D]'
                          }`}
                        >
                          {family.name}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-[#E7EFF5] text-[#245E84] border-[#245E84]/30'
                              : family.id === 'precision-technical'
                              ? 'bg-[#16222F] text-[#38BDF8] border-[#38BDF8]/40'
                              : 'bg-[#E9F5F1] text-[#20755D] border-[#BFE4D8]'
                          }`}
                        >
                          Dribbble Template
                        </span>
                      </div>

                      {/* Dribbble-grade Website Template Thumbnail Preview */}
                      <div className="rounded-[6px] overflow-hidden shadow-xs border border-black/10">
                        {renderMiniPreview(family.id)}
                      </div>

                      <p
                        className={`text-xs line-clamp-2 leading-relaxed ${
                          family.id === 'precision-technical' ? 'text-slate-400' : 'text-[#546575]'
                        }`}
                      >
                        {family.thesis}
                      </p>
                    </div>

                    <div
                      className={`mt-3 pt-2.5 border-t flex items-center justify-between ${
                        family.id === 'precision-technical' ? 'border-[#222E37]' : 'border-slate-200/80'
                      }`}
                    >
                      {/* Color Palette dots */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-3.5 rounded-full border border-black/15 shadow-2xs"
                          style={{ backgroundColor: family.tokens.canvas }}
                          title="Canvas"
                        />
                        <span
                          className="size-3.5 rounded-full border border-black/15 shadow-2xs"
                          style={{ backgroundColor: family.tokens.accent }}
                          title="Accent"
                        />
                        <span
                          className="size-3.5 rounded-full border border-black/15 shadow-2xs"
                          style={{ backgroundColor: family.tokens.border }}
                          title="Border"
                        />
                      </div>

                      <span
                        className={`text-[10px] font-mono ${
                          family.id === 'precision-technical' ? 'text-[#38BDF8]' : 'text-[#546575]'
                        }`}
                      >
                        {family.mood.split(',')[0]}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Family Inspector & Action Band */}
          <div className="bg-white border border-[#D5DFE7] rounded-[8px] p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5DFE7] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#17222D]">
                    {selectedFamily.name}
                  </h3>
                  <span className="text-xs text-[#546575] font-mono">
                    [{selectedFamily.archetype}]
                  </span>
                </div>
                <p className="text-xs text-[#546575] mt-0.5 max-w-2xl">
                  {selectedFamily.thesis}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBlueprintModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#17222D] bg-[#F4F6F8] hover:bg-[#E9EEF2] border border-[#D5DFE7] rounded-[6px] transition-colors"
                >
                  <FileCode className="size-3.5 text-[#245E84]" />
                  Inspect Blueprint JSON
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245E84] hover:bg-[#1B4764] rounded-[6px] shadow-xs transition-colors"
                >
                  <Sparkles className="size-3.5" />
                  {isSynthesized ? 'Blueprint Approved & Locked' : 'Apply & Synthesize DESIGN.md'}
                </button>
              </div>
            </div>

            {/* Invariants & Characteristics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-[#17222D] flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#20755D]" />
                  Non-Negotiable Invariants
                </span>
                <ul className="text-[#546575] space-y-0.5 list-disc list-inside">
                  {selectedFamily.signatureMoves.slice(0, 3).map((move, i) => (
                    <li key={i} className="truncate" title={move}>
                      {move}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-[#17222D] flex items-center gap-1.5">
                  <Layers className="size-3.5 text-[#245E84]" />
                  Best Fit Domains
                </span>
                <p className="text-[#546575] line-clamp-2">
                  {selectedFamily.fit.join(', ')}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-[#17222D] flex items-center gap-1.5">
                  <Eye className="size-3.5 text-[#A05C08]" />
                  Watch-outs & Constraints
                </span>
                <p className="text-[#546575] line-clamp-2">
                  {selectedFamily.watchOuts.join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Reference Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#546575]">
                Live Reference UI Showcase
              </span>
              <span className="text-xs text-[#8898AA]">
                Interactive components with working sort, filters, and inspector drawer
              </span>
            </div>

            <div className="rounded-[8px] overflow-hidden">
              {renderActiveShowcase()}
            </div>
          </div>
        </div>
      )}

      {/* Blueprint Modal */}
      {showBlueprintModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#D5DFE7] rounded-[8px] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-4 border-b border-[#D5DFE7] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#17222D]">
                  Synthesized Design Blueprint (JSON Snapshot)
                </h3>
                <p className="text-xs text-[#546575]">
                  Single source of truth passed to DESIGN.md compiler and renderer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlueprintModal(false)}
                className="text-xs font-bold text-[#546575] hover:text-[#17222D] p-1"
              >
                Close [Esc]
              </button>
            </div>

            <pre className="p-4 overflow-auto flex-1 font-mono text-xs bg-[#F4F6F8] text-[#17222D] rounded-b-[8px]">
              {JSON.stringify(generatedBlueprint, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
