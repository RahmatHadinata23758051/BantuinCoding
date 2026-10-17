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
          <div className="h-20 w-full bg-[#F4F6F8] border border-[#D5DFE7] rounded-[4px] p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-1 border-b border-[#D5DFE7]">
              <div className="h-2 w-16 bg-[#245E84] rounded-[2px]" />
              <div className="h-2 w-8 bg-[#20755D]/30 rounded-[2px]" />
            </div>
            <div className="grid grid-cols-[1fr_40px] gap-1.5 items-center">
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-[#D5DFE7] rounded-[1px]" />
                <div className="h-1.5 w-3/4 bg-[#D5DFE7] rounded-[1px]" />
                <div className="h-1.5 w-5/6 bg-[#D5DFE7] rounded-[1px]" />
              </div>
              <div className="h-9 bg-white border border-[#D5DFE7] rounded-[2px] p-1 flex flex-col justify-between">
                <div className="h-1 w-full bg-[#245E84]" />
                <div className="h-1 w-full bg-[#546575]/40" />
              </div>
            </div>
          </div>
        )

      case 'editorial-craft':
        return (
          <div className="h-20 w-full bg-[#FAF8F5] border border-[#CEC3B3] rounded-[4px] p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-1 border-b border-[#CEC3B3]">
              <div className="h-2.5 w-24 bg-[#25231F] rounded-[1px]" />
              <div className="h-2 w-6 bg-[#8B4335]/40 rounded-[1px]" />
            </div>
            <div className="grid grid-cols-[1fr_36px] gap-2 items-center">
              <div className="space-y-1 pl-1.5 border-l-2 border-[#8B4335]">
                <div className="h-1.5 w-full bg-[#CEC3B3]" />
                <div className="h-1.5 w-4/5 bg-[#CEC3B3]" />
              </div>
              <div className="h-9 bg-[#F4F0E7] border border-[#CEC3B3] rounded-[1px] p-1 flex flex-col justify-center items-center">
                <div className="h-2 w-4 bg-[#8B4335]" />
              </div>
            </div>
          </div>
        )

      case 'precision-technical':
        return (
          <div className="h-20 w-full bg-[#0E1216] border border-[#35424A] rounded-[4px] p-2 flex flex-col justify-between overflow-hidden font-mono">
            <div className="flex items-center justify-between pb-1 border-b border-[#35424A]">
              <div className="flex items-center gap-1">
                <div className="size-1.5 rounded-full bg-[#74BEA0]" />
                <div className="h-2 w-16 bg-[#58B3C2] rounded-[1px]" />
              </div>
              <div className="h-1.5 w-6 bg-[#35424A]" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <div className="h-1.5 w-full bg-[#222B31]" />
                <div className="h-1.5 w-3/4 bg-[#58B3C2]/40" />
              </div>
              <div className="h-8 w-12 bg-[#161C21] border border-[#35424A] rounded-[1px] flex flex-col items-center justify-center gap-1">
                <div className="h-1.5 w-8 bg-[#74BEA0]" />
                <div className="h-1 w-5 bg-[#35424A]" />
              </div>
            </div>
          </div>
        )

      case 'expressive-creative':
        return (
          <div className="h-20 w-full bg-[#F1EDDF] border-2 border-[#27282B] rounded-[4px] p-2 flex flex-col justify-between overflow-hidden shadow-[2px_2px_0px_#27282B]">
            <div className="flex items-center justify-between pb-1 border-b border-[#27282B]">
              <div className="h-2.5 w-20 bg-[#16171A] rounded-[1px]" />
              <div className="h-2 w-6 bg-[#E34B2F] rounded-[1px]" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-8 bg-[#FFFCF5] border border-[#27282B] p-1 flex flex-col justify-between shadow-[1px_1px_0px_#27282B]">
                <div className="h-1.5 w-3/4 bg-[#E34B2F]" />
                <div className="h-1 w-full bg-[#27282B]/30" />
              </div>
              <div className="h-8 bg-[#16171A] text-white p-1 flex flex-col justify-between">
                <div className="h-1.5 w-2/3 bg-white" />
                <div className="h-1 w-full bg-[#E34B2F]" />
              </div>
            </div>
          </div>
        )

      case 'calm-and-human':
        return (
          <div className="h-20 w-full bg-[#F5F7F3] border border-[#CDDCD1] rounded-[6px] p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-1 border-b border-[#CDDCD1]">
              <div className="h-2.5 w-20 bg-[#326F5C] rounded-full" />
              <div className="h-2 w-8 bg-[#E8F0EA] rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-[#E8F0EA] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#326F5C] h-full w-2/3 rounded-full" />
              </div>
              <div className="h-7 bg-white border border-[#CDDCD1] rounded-[6px] p-1.5 flex items-center gap-2">
                <div className="size-4 rounded-full bg-[#E8F0EA]" />
                <div className="h-1.5 w-20 bg-[#CDDCD1] rounded-full" />
              </div>
            </div>
          </div>
        )

      case 'refined-luxury':
        return (
          <div className="h-20 w-full bg-[#F6F2EA] border border-[#CFC4B7] rounded-[4px] p-2 flex flex-col justify-between overflow-hidden font-serif">
            <div className="flex items-center justify-between pb-1 border-b border-[#CFC4B7]">
              <div className="h-2.5 w-24 bg-[#24211D]" />
              <div className="h-1.5 w-8 bg-[#665144]" />
            </div>
            <div className="space-y-1.5 py-0.5">
              <div className="h-1 w-full bg-[#CFC4B7]" />
              <div className="grid grid-cols-3 gap-1">
                <div className="h-5 bg-[#FFFCF8] border border-[#CFC4B7] p-1 flex flex-col justify-center items-center">
                  <div className="h-1 w-4 bg-[#665144]" />
                </div>
                <div className="h-5 bg-[#FFFCF8] border border-[#CFC4B7] p-1 flex flex-col justify-center items-center">
                  <div className="h-1 w-4 bg-[#665144]" />
                </div>
                <div className="h-5 bg-[#FFFCF8] border border-[#CFC4B7] p-1 flex flex-col justify-center items-center">
                  <div className="h-1 w-4 bg-[#665144]" />
                </div>
              </div>
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

                return (
                  <button
                    key={family.id}
                    type="button"
                    onClick={() => handleSelect(family.id)}
                    className={`p-4 text-left rounded-[8px] border transition-all flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-white border-[#245E84] ring-2 ring-[#245E84]/25 shadow-md'
                        : 'bg-white border-[#D5DFE7] hover:border-[#8898AA] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#17222D]">
                          {family.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-[#E7EFF5] text-[#245E84] border-[#245E84]/30'
                              : 'bg-[#E9F5F1] text-[#20755D] border-[#BFE4D8]'
                          }`}
                        >
                          Live Preview
                        </span>
                      </div>

                      {/* Mini Visual DNA Preview Thumbnail */}
                      <div className="rounded-[4px] overflow-hidden shadow-xs border border-black/5">
                        {renderMiniPreview(family.id)}
                      </div>

                      <p className="text-xs text-[#546575] line-clamp-2 leading-relaxed">
                        {family.thesis}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#D5DFE7] flex items-center justify-between">
                      {/* Color Palette dots */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="size-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: family.tokens.canvas }}
                          title="Canvas"
                        />
                        <span
                          className="size-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: family.tokens.accent }}
                          title="Accent"
                        />
                        <span
                          className="size-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: family.tokens.border }}
                          title="Border"
                        />
                      </div>

                      <span className="text-[11px] font-mono text-[#546575]">
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
