'use client'

import React, { useState } from 'react'
import {
  BookOpen,
  Bookmark,
  Share2,
  Clock,
  Calendar,
  ArrowRight,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react'

export type EditorialArchetypeId = 'longform-essay' | 'anthology-index' | 'print-order'

export function EditorialCraftShowcase() {
  const [activeArchetype, setActiveArchetype] = useState<EditorialArchetypeId>('longform-essay')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const [orderSubmitted, setOrderSubmitted] = useState(false)

  const archetypes: { id: EditorialArchetypeId; label: string; desc: string }[] = [
    {
      id: 'longform-essay',
      label: 'Curated Longform Essay',
      desc: 'Narrative reading layout with asymmetric margins, pull-quote, and footnote ledger',
    },
    {
      id: 'anthology-index',
      label: 'Anthology & Monograph Index',
      desc: 'Asymmetric editorial grid with hairline borders, issue tags, and archival metadata',
    },
    {
      id: 'print-order',
      label: 'Bespoke Print Voucher',
      desc: 'Restrained, bookplate-inspired order slip with live calculation',
    },
  ]

  const articles = [
    {
      id: 'art-01',
      issue: 'N° 48',
      title: 'The Architecture of Quietude: How Monastic Rhythms Shape Contemporary Work',
      author: 'Elena Rostova',
      date: 'Autumn 2026',
      readTime: '12 min',
      category: 'Spatial Design',
      excerpt: 'Modern knowledge work inherits its relentless continuous hours from Victorian factories rather than from human cognitive endurance. Monastic intervals offer an alternative grammar.',
    },
    {
      id: 'art-02',
      issue: 'N° 47',
      title: 'Typographic Memory: Wood Types of the Venetian Laguna',
      author: 'Matteo Bellini',
      date: 'Late Summer 2026',
      readTime: '8 min',
      category: 'Print Heritage',
      excerpt: 'Documenting the water-damaged pear-wood letterpress matrices recovered from the floodplains of Dorsoduro.',
    },
    {
      id: 'art-03',
      issue: 'N° 46',
      title: 'Conversations with the Silent Cooper: Crafting Oak Vats in Alsace',
      author: 'Jean-Luc Vaneck',
      date: 'Mid Summer 2026',
      readTime: '16 min',
      category: 'Material Culture',
      excerpt: 'Why oak aged under open rain for thirty-six months yields a tension that kiln drying can never simulate.',
    },
  ]

  return (
    <div className="bg-[#FAF8F5] text-[#25231F] border border-[#CEC3B3] rounded-[8px] overflow-hidden shadow-xs">
      {/* Editorial Control Toolbar */}
      <div className="bg-[#F4F0E7] border-b border-[#CEC3B3] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-serif italic text-sm font-bold text-[#8B4335]">
            Editorial Craft
          </span>
          <span className="text-[#CEC3B3]">/</span>
          <span className="text-xs font-mono uppercase tracking-wider text-[#675F55]">
            Live Art Direction
          </span>
        </div>

        {/* Archetype switcher */}
        <div className="flex items-center gap-1 bg-[#E7DED0] p-1 rounded-[6px]">
          {archetypes.map((arch) => (
            <button
              key={arch.id}
              type="button"
              onClick={() => setActiveArchetype(arch.id)}
              className={`px-3 py-1.5 text-xs rounded-[4px] transition-all font-medium ${
                activeArchetype === arch.id
                  ? 'bg-[#FCFAF5] text-[#25231F] shadow-xs'
                  : 'text-[#675F55] hover:text-[#25231F]'
              }`}
            >
              {arch.label}
            </button>
          ))}
        </div>

        {/* Viewport switch */}
        <div className="flex items-center gap-1 bg-[#E7DED0] p-1 rounded-[6px]">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-[4px] ${
              viewport === 'desktop'
                ? 'bg-[#FCFAF5] text-[#8B4335] shadow-xs'
                : 'text-[#675F55]'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-[4px] ${
              viewport === 'tablet'
                ? 'bg-[#FCFAF5] text-[#8B4335] shadow-xs'
                : 'text-[#675F55]'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-[4px] ${
              viewport === 'mobile'
                ? 'bg-[#FCFAF5] text-[#8B4335] shadow-xs'
                : 'text-[#675F55]'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas with Viewport simulation */}
      <div className="p-4 sm:p-6 lg:p-8 bg-[#EDE7DC] flex justify-center overflow-x-auto min-h-[550px]">
        <div
          className={`bg-[#FCFAF5] transition-all duration-300 border border-[#CEC3B3] shadow-md ${
            viewport === 'desktop'
              ? 'w-full max-w-5xl'
              : viewport === 'tablet'
              ? 'w-[768px]'
              : 'w-[375px]'
          } rounded-[6px] overflow-hidden`}
        >
          {/* Masthead */}
          <header className="border-b border-[#CEC3B3] px-6 py-4 bg-[#FAF7F0] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8B4335] block">
                The Nordic Review of Applied Thought • Quarterly Vol. IV
              </span>
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#25231F] mt-0.5">
                KRAFT & REFLEKSJON
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#675F55]">
              <span className="hidden sm:inline font-mono">Published in Oslo & Kyoto</span>
              <button
                type="button"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-1.5 border rounded-[4px] transition-colors ${
                  isBookmarked
                    ? 'border-[#8B4335] bg-[#8B4335] text-white'
                    : 'border-[#CEC3B3] hover:bg-[#F4F0E7] text-[#675F55]'
                }`}
                title="Save to Reading Desk"
              >
                <Bookmark className="size-3.5" />
              </button>
            </div>
          </header>

          {/* Archetype Screen 1: Longform Essay */}
          {activeArchetype === 'longform-essay' && (
            <article className="p-6 sm:p-10 space-y-8">
              {/* Header meta */}
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="flex items-center gap-3 text-xs text-[#8B4335] font-mono uppercase tracking-wider">
                  <span>Vol. 48 // Spatial Design</span>
                  <span>•</span>
                  <span>14 min read</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#25231F] leading-tight">
                  The Architecture of Quietude: How Monastic Spatial Rhythms Shape Modern Work
                </h2>
                <div className="pt-2 flex items-center justify-between text-xs text-[#675F55] border-b border-[#CEC3B3] pb-4">
                  <p>
                    By <strong className="text-[#25231F]">Elena Rostova</strong> • Photography by Marcus Thorne
                  </p>
                  <span className="font-mono text-[11px]">Draught 3.2</span>
                </div>
              </div>

              {/* Asymmetric layout with reading column & margin pull-note */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8 max-w-3xl mx-auto">
                <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#25231F]">
                  <p className="first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-2.5 first-letter:text-[#8B4335]">
                    In 1142, the Cistercian abbey of Fontenay set its cloister walkway exactly three paces wider than two men walking abreast. This was not an architectural indulgence; it was an acoustic device. When monks walked in contemplative silence, the stone vaulted ceiling absorbed lateral chatter while preserving the cadence of footsteps against the granite flagstones.
                  </p>

                  {/* Pull Quote */}
                  <div className="my-6 p-4 sm:p-6 border-l-2 border-[#8B4335] bg-[#F4F0E7] rounded-r-[4px]">
                    <blockquote className="font-serif text-base sm:text-lg italic text-[#25231F] leading-snug">
                      “We do not suffer from an absence of physical space; we suffer from the total abolition of intervals between competing demands.”
                    </blockquote>
                    <span className="block mt-2 text-xs font-mono text-[#675F55] uppercase tracking-wider">
                      — Abbess Hildegard von Bingen, Epistolae XLII
                    </span>
                  </div>

                  <p>
                    Contemporary software workspace designers have attempted to resolve attention fragmentation through acoustic felt booths and glass phone kiosks. Yet these remain reactionary bandages upon open floorplans. The Cistercian model suggests something far more fundamental: sequence must precede accessibility.
                  </p>

                  <div className="p-3 bg-[#FAF7F0] border border-[#CEC3B3] rounded-[4px] text-xs space-y-1 mt-6">
                    <span className="font-serif font-bold text-[#8B4335] block">Archival Citation</span>
                    <p className="text-[#675F55]">
                      Manuscript Cod. Sang. 1092, St. Gall Library. Translated from original medieval Latin by Dr. Hiroshi Tanaka, Kyoto Institute of Typography.
                    </p>
                  </div>
                </div>

                {/* Marginalia Note */}
                <aside className="border-t lg:border-t-0 lg:border-l border-[#CEC3B3] pt-4 lg:pt-0 lg:pl-6 space-y-4 text-xs">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8B4335] block">
                      Annotation 01
                    </span>
                    <p className="text-[#675F55] mt-1 leading-normal font-serif italic">
                      The Fontenay cloister dimensions: 36.4 meters north gallery, limestone quarry 4km east.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F4F0E7] rounded-[4px] border border-[#CEC3B3]">
                    <span className="font-bold text-[#25231F] block text-[11px]">Reading Companion</span>
                    <p className="text-[11px] text-[#675F55] mt-1">
                      Printed on 110gsm Munken Pure Cream with sewn linen binding.
                    </p>
                  </div>
                </aside>
              </div>
            </article>
          )}

          {/* Archetype Screen 2: Anthology Index */}
          {activeArchetype === 'anthology-index' && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Category selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CEC3B3] pb-4">
                <div className="flex items-center gap-2">
                  {['All', 'Spatial Design', 'Print Heritage', 'Material Culture'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 text-xs rounded-[4px] border transition-colors ${
                        selectedTag === tag
                          ? 'border-[#8B4335] bg-[#8B4335] text-white'
                          : 'border-[#CEC3B3] bg-[#FCFAF5] text-[#675F55] hover:bg-[#F4F0E7]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-mono text-[#675F55]">3 Essays Published</span>
              </div>

              {/* Editorial Item List */}
              <div className="divide-y divide-[#CEC3B3] border-y border-[#CEC3B3]">
                {articles
                  .filter((a) => selectedTag === 'All' || a.category === selectedTag)
                  .map((article) => (
                    <div
                      key={article.id}
                      className="py-5 grid grid-cols-1 md:grid-cols-[80px_1fr_140px] gap-4 items-baseline hover:bg-[#FBF9F5] p-3 transition-colors"
                    >
                      <span className="font-mono text-xs font-bold text-[#8B4335]">
                        {article.issue}
                      </span>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-[#675F55]">
                          {article.category}
                        </span>
                        <h3 className="font-serif text-lg font-bold text-[#25231F] leading-snug">
                          {article.title}
                        </h3>
                        <p className="text-xs text-[#675F55] leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                      <div className="text-right text-xs text-[#675F55] space-y-1">
                        <span className="block font-medium text-[#25231F]">{article.author}</span>
                        <span className="block font-mono text-[11px]">{article.readTime}</span>
                        <button
                          type="button"
                          onClick={() => setActiveArchetype('longform-essay')}
                          className="inline-flex items-center gap-1 text-[11px] text-[#8B4335] font-semibold hover:underline mt-1"
                        >
                          Read Text <ArrowRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Archetype Screen 3: Print Voucher */}
          {activeArchetype === 'print-order' && (
            <div className="p-6 sm:p-10 max-w-xl mx-auto space-y-6">
              <div className="border border-[#CEC3B3] bg-[#FAF7F0] p-6 rounded-[6px] space-y-4 shadow-xs">
                <div className="border-b border-[#CEC3B3] pb-3 text-center">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#8B4335]">
                    Limited Monograph Inscription
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#25231F] mt-1">
                    Nordic Quarterly — Autumn Volume
                  </h3>
                  <p className="text-xs text-[#675F55] mt-0.5">
                    Edition of 500 numbered copies • Printed letterpress on Fedrigoni paper
                  </p>
                </div>

                {orderSubmitted ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="size-10 rounded-full bg-[#EBF4EE] text-[#346D53] mx-auto flex items-center justify-center">
                      <Check className="size-5" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#25231F]">
                      Colophon Inscription Recorded
                    </h4>
                    <p className="text-xs text-[#675F55] max-w-xs mx-auto">
                      Copy N° 184 has been reserved for your library. Dispatched via courier with wax seal.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOrderSubmitted(false)}
                      className="mt-3 text-xs text-[#8B4335] underline"
                    >
                      Configure Another Copy
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setOrderSubmitted(true)
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label className="font-serif font-bold text-[#25231F] block mb-1">
                        Patron Library Name / Inscription Recipient
                      </label>
                      <input
                        type="text"
                        defaultValue="Atelier de Scribe • Rahmat Hadinata"
                        required
                        className="w-full p-2.5 bg-white border border-[#CEC3B3] rounded-[4px] text-xs text-[#25231F] focus:outline-none focus:border-[#8B4335]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-serif font-bold text-[#25231F] block mb-1">
                          Cover Linen Fabric
                        </label>
                        <select className="w-full p-2.5 bg-white border border-[#CEC3B3] rounded-[4px] text-xs text-[#25231F] focus:outline-none focus:border-[#8B4335]">
                          <option>Terracotta Rust Linen</option>
                          <option>Raw Unbleached Flax</option>
                          <option>Forest Pine Bookcloth</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-serif font-bold text-[#25231F] block mb-1">
                          Delivery Method
                        </label>
                        <select className="w-full p-2.5 bg-white border border-[#CEC3B3] rounded-[4px] text-xs text-[#25231F] focus:outline-none focus:border-[#8B4335]">
                          <option>Archival Postal Crate ($18)</option>
                          <option>Courier Direct ($35)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#CEC3B3] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#675F55] block">Total Subscription:</span>
                        <strong className="font-serif text-base text-[#25231F]">$68.00 USD</strong>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#8B4335] hover:bg-[#72362A] text-white font-medium rounded-[4px] transition-colors shadow-xs"
                      >
                        Authorize Commission
                      </button>
                    </div>
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
