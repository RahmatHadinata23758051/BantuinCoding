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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {families.map((family) => {
                const isSelected = selectedId === family.id
                const isImplemented = family.id === 'structured-enterprise'

                return (
                  <button
                    key={family.id}
                    type="button"
                    onClick={() => handleSelect(family.id)}
                    className={`p-4 text-left rounded-[8px] border transition-all flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-white border-[#245E84] ring-2 ring-[#245E84]/20 shadow-sm'
                        : 'bg-white border-[#D5DFE7] hover:border-[#8898AA] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#17222D]">
                          {family.name}
                        </span>
                        {isImplemented ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E9F5F1] text-[#20755D] border border-[#BFE4D8]">
                            Active Reference UI
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F4F6F8] text-[#546575] border border-[#D5DFE7]">
                            Spec Draft
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-xs text-[#546575] line-clamp-2">
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

            {selectedFamily.id === 'structured-enterprise' ? (
              <div className="border border-[#D5DFE7] rounded-[8px] overflow-hidden shadow-sm">
                <StructuredEnterpriseShowcase />
              </div>
            ) : (
              <div className="bg-white border border-[#D5DFE7] rounded-[8px] p-12 text-center text-sm text-[#546575] space-y-3">
                <p className="font-semibold text-[#17222D]">
                  {selectedFamily.name} specification available in repository
                </p>
                <p className="text-xs max-w-md mx-auto text-[#8898AA]">
                  The master art-direction specification exists in{' '}
                  <code className="font-mono text-[#245E84]">
                    templates/design/design-{selectedFamily.id}.md
                  </code>
                  . Structured Enterprise is currently active as the primary reference UI.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedId('structured-enterprise')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#245E84] bg-[#E7EFF5] hover:bg-[#DCE7EF] rounded-[6px] transition-colors"
                >
                  View Structured Enterprise Reference UI
                </button>
              </div>
            )}
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
