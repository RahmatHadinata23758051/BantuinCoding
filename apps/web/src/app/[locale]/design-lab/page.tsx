'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Zap,
} from 'lucide-react'

import { THEMES, getTheme } from '@/lib/design-lab/themes'
import { TEMPLATES, getTemplate } from '@/lib/design-lab/templates'
import { themeToCssVars } from '@/lib/design-lab/css-vars'
import { recommend } from '@/lib/design-lab/recommend'
import type { Theme, Template } from '@/lib/design-lab/schemas'

// ─── ArtboardShell ───────────────────────────────────────────────────────────
// The artboard IS the paper surface — not a panel inside a panel.
// It sets CSS vars, then children render directly on the canvas background.

function ArtboardShell({
  label,
  width,
  theme,
  children,
}: {
  label: string
  width: number
  theme: Theme
  children: React.ReactNode
}) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme])
  const p = theme.palette
  const ty = theme.typography
  return (
    <div
      className="shrink-0 overflow-hidden"
      data-artboard
      data-theme={theme.id}
      data-grammar={theme.surface_grammar.separator}
      data-container-budget={theme.surface_grammar.max_visible_containers}
      style={{
        width,
        background: p.canvas,
        border: `1px solid ${p.border}`,
        ...cssVars,
      } as React.CSSProperties}
    >
      <div
        data-exempt="chrome"
        style={{
          borderBottom: `1px solid ${p.border}`,
          padding: '4px 12px',
          fontFamily: ty.monoFamily,
          fontSize: '9px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: p.ink_muted,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

// ─── Artboard 01: Foundation ─────────────────────────────────────────────────

function FoundationArtboard({ theme }: { theme: Theme }) {
  const p = theme.palette
  const ty = theme.typography
  const sp = theme.spacing
  const ra = theme.radius

  const paletteRoles: [string, string][] = [
    ['canvas', p.canvas],
    ['surface', p.surface],
    ['border', p.border],
    ['ink', p.ink],
    ['ink_muted', p.ink_muted],
    ['accent', p.accent],
    ['accent_fg', p.accent_fg],
    ...(p.signal ? [['signal', p.signal] as [string, string]] : []),
  ]

  const spacingEntries = Object.entries(sp) as [string, string][]
  const radiusEntries = [
    ['none', ra.none],
    ['sm', ra.sm],
    ['md', ra.md],
    ['lg', ra.lg],
  ]

  return (
    <ArtboardShell label={`01 / Foundation · ${theme.name}`} width={380} theme={theme}>
      <div className="space-y-5 p-5">
        {/* Typography */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Tipografi
          </p>
          <p style={{ fontFamily: ty.displayFamily, fontSize: ty.scale.display.fontSize, fontWeight: ty.scale.display.fontWeight, color: p.ink, lineHeight: ty.scale.display.lineHeight ?? '1.2', marginBottom: 4 }}>
            Sistem Desain
          </p>
          <p style={{ fontFamily: ty.bodyFamily, fontSize: ty.scale.body.fontSize, color: p.ink, lineHeight: '1.5', marginBottom: 2 }}>
            Pondasi tipografi, palet warna, dan ritme ruang antarmuka.
          </p>
          <p style={{ fontFamily: ty.monoFamily, fontSize: ty.scale.label.fontSize, letterSpacing: '0.04em', color: p.ink_muted }}>
            SYS-01 · TOKENS · VERIFIKASI AKTIF
          </p>
        </section>

        {/* Palette */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Palet · peran
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {paletteRoles.map(([role, hex]) => (
              <div key={role} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div data-exempt="swatch" style={{ width: 32, height: 32, background: hex, border: `1px solid ${p.border}` }} />
                <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted, textAlign: 'center' }}>{role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Signature moves */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Signature moves
          </p>
          {theme.signature_moves.map((sm, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${p.border}`, paddingBottom: 6, marginBottom: 6 }}>
              <p style={{ fontFamily: ty.bodyFamily, fontSize: '11px', fontWeight: 600, color: p.ink }}>{sm.move}</p>
              <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', color: p.ink_muted, marginTop: 2 }}>{sm.spec}</p>
            </div>
          ))}
        </section>

        {/* Spacing scale */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Skala spasi
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {spacingEntries.map(([key, val]) => {
              const px = parseInt(val)
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div data-exempt="sample-scale" style={{ width: px, height: px, background: p.accent, opacity: 0.7 }} />
                  <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>{val}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Radius scale */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Radius
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {radiusEntries.map(([key, val]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div data-exempt="sample-scale" style={{ width: 32, height: 32, borderRadius: val, background: p.canvas, border: `1px solid ${p.border}` }} />
                <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>{key}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Surface grammar sample */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Surface grammar · {theme.surface_grammar.separator}
          </p>
          {['Baris pertama', 'Baris kedua', 'Baris ketiga'].map((row, i, arr) => {
            const isBandOdd = i % 2 === 1
            const rowStyle: React.CSSProperties = (() => {
              switch (theme.surface_grammar.separator) {
                case 'rule':
                  return { padding: '6px 0', borderBottom: i < arr.length - 1 ? `1px solid ${p.border}` : undefined }
                case 'space':
                  return { padding: '6px 0', marginBottom: i < arr.length - 1 ? 6 : 0 }
                case 'band':
                  return { padding: '6px 8px', background: isBandOdd ? p.surface_subtle : p.canvas }
                case 'box':
                  return { padding: '6px 8px', border: `1px solid ${p.border}`, marginBottom: i < arr.length - 1 ? 6 : 0 }
                default:
                  return { padding: '6px 0' }
              }
            })()
            return (
              <div
                key={i}
                data-exempt="sample-grammar"
                style={{ ...rowStyle, fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink }}
              >
                {row}
              </div>
            )
          })}
        </section>
      </div>
    </ArtboardShell>
  )
}

// ─── Sidebar: Theme card ──────────────────────────────────────────────────────

function ThemeCard({ theme, selected, onClick }: { theme: Theme; selected: boolean; onClick: () => void }) {
  const p = theme.palette
  const ty = theme.typography
  const borderStyle = selected ? `2px solid ${p.accent}` : `1.5px solid ${p.border}`
  const bgStyle = selected ? p.surface : p.canvas

  const swatchRoles: (keyof typeof p)[] = ['canvas', 'accent', 'ink', 'border']

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden text-left"
      style={{ border: borderStyle, background: bgStyle }}
    >
      <div style={{ height: 64, background: p.canvas, padding: 6, position: 'relative' }}>
        <div style={{ height: 12, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 3 }}>
          <div style={{ width: 8, height: 8, background: p.accent }} />
          <div style={{ height: 3, width: 32, background: `${p.ink}33` }} />
          <div style={{ height: 3, width: 20, background: `${p.ink}18`, marginLeft: 'auto' }} />
        </div>
        <div style={{ marginTop: 4 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 10,
              borderBottom: theme.surface_grammar.separator === 'rule' ? `1px solid ${p.border}` : undefined,
              background: theme.surface_grammar.separator === 'band' && i % 2 === 0 ? p.surface_subtle : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 2px',
            }}>
              <div style={{ height: 3, width: 20, background: `${p.ink_muted}55` }} />
              <div style={{ height: 3, flex: 1, background: `${p.ink}22` }} />
              <div style={{ height: 3, width: 28, background: i === 1 ? `${p.accent}99` : `${p.ink}18` }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
          <span style={{ fontFamily: ty.bodyFamily, fontSize: '12px', fontWeight: 700, color: p.ink }}>{theme.name}</span>
          <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', letterSpacing: '0.05em', color: p.ink_muted, textTransform: 'uppercase', whiteSpace: 'nowrap', marginTop: 2 }}>
            {theme.archetype}
          </span>
        </div>
        <p style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, marginTop: 3, lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
          {theme.tagline}
        </p>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {swatchRoles.map((role) => (
            <div key={role} style={{ width: 12, height: 12, background: p[role] as string, border: `1px solid ${p.border}` }} />
          ))}
        </div>
      </div>
    </button>
  )
}

// ─── Sidebar: Template card ───────────────────────────────────────────────────

function TemplateCard({ tpl, theme, selected, onClick }: { tpl: Template; theme: Theme; selected: boolean; onClick: () => void }) {
  const p = theme.palette
  const ty = theme.typography
  const borderStyle = selected ? `2px solid ${p.accent}` : `1.5px solid ${p.border}`

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden text-left"
      style={{ border: borderStyle, background: selected ? p.surface : p.canvas }}
    >
      <div style={{ padding: '7px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <p style={{ fontFamily: ty.bodyFamily, fontSize: '11px', fontWeight: 700, color: p.ink }}>{tpl.name}</p>
          <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', letterSpacing: '0.04em', color: p.ink_muted, textTransform: 'uppercase' }}>
            {tpl.screen_type}
          </span>
        </div>
        <p style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, marginTop: 2 }}>{tpl.purpose}</p>
      </div>
    </button>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DesignLabPage() {
  const [sidebarTab, setSidebarTab] = useState<'tema' | 'template'>('tema')
  const [selectedThemeId, setSelectedThemeId] = useState<string>(THEMES[0].id)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState<'manual' | 'agent'>('manual')
  const [zoom, setZoom] = useState(90)
  const [tool, setTool] = useState<'pointer' | 'hand'>('pointer')

  const activeTheme = useMemo(() => getTheme(selectedThemeId), [selectedThemeId])
  const activeTemplate = useMemo(() => (selectedTemplateId ? getTemplate(selectedTemplateId) : undefined), [selectedTemplateId])

  const agentRec = useMemo(() => recommend({}), [])

  function applyAgent() {
    setSelectedThemeId(agentRec.themeId)
    setSelectedTemplateId(agentRec.templateId ?? null)
    setSelectionMode('agent')
  }

  const p = activeTheme.palette
  const ty = activeTheme.typography

  const labelColor = p.accent
  const displayName = activeTemplate ? `${activeTheme.name} · ${activeTemplate.name}` : activeTheme.name

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: p.surface_subtle }}>
      {/* ── Top bar ── */}
      <div className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-1 md:px-4" style={{ background: p.canvas, borderColor: p.border }}>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ fontSize: '11px', fontFamily: ty.bodyFamily, color: p.ink_muted }}
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <span style={{ color: p.border }}>/</span>
          <span style={{ fontSize: '11px', fontFamily: ty.bodyFamily, fontWeight: 600, color: p.ink }}>Design Lab</span>
        </div>

        <div className="hidden md:block" style={{ minWidth: 128, textAlign: 'right', border: `1px solid ${p.border}`, padding: '4px 10px', fontSize: '11px', fontFamily: ty.monoFamily, color: p.ink_muted, whiteSpace: 'nowrap' }}>
          Artboard Studio
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* ── Left toolbar ── */}
        <div className="hidden w-11 shrink-0 flex-col items-center gap-1 border-r py-3 md:flex" style={{ background: p.canvas, borderColor: p.border }}>
          <button
            type="button"
            onClick={() => setTool('pointer')}
            title="Select"
            className="flex size-8 items-center justify-center transition-colors"
            style={{
              background: tool === 'pointer' ? p.accent : 'transparent',
              color: tool === 'pointer' ? p.accent_fg : p.ink_muted,
            }}
          >
            <MousePointer2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('hand')}
            title="Pan"
            className="flex size-8 items-center justify-center transition-colors"
            style={{
              background: tool === 'hand' ? p.accent : 'transparent',
              color: tool === 'hand' ? p.accent_fg : p.ink_muted,
            }}
          >
            <Hand className="size-4" />
          </button>

          <div className="my-1 h-px w-6" style={{ background: p.border }} />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 10, 150))}
            title="Zoom in"
            className="flex size-8 items-center justify-center"
            style={{ color: p.ink_muted }}
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 10, 40))}
            title="Zoom out"
            className="flex size-8 items-center justify-center"
            style={{ color: p.ink_muted }}
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(90)}
            title="Fit to screen"
            className="flex size-8 items-center justify-center"
            style={{ color: p.ink_muted }}
          >
            <Maximize2 className="size-3.5" />
          </button>

          <div style={{ fontFamily: ty.monoFamily, fontSize: '9px', color: p.ink_muted, marginTop: 4 }}>{zoom}%</div>
        </div>

        {/* ── Canvas ── */}
        <div
          className="flex-1 overflow-auto"
          style={{ background: p.surface_subtle, cursor: tool === 'hand' ? 'grab' : 'default' }}
        >
          <div
            className="design-canvas-content flex min-h-full items-start gap-4 p-4 md:gap-8 md:p-10"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              width: `${100 * (100 / zoom)}%`,
            }}
          >
            <div className="flex flex-col gap-2">
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', fontWeight: 600, color: labelColor, letterSpacing: '0.04em' }}>01 / DESIGN FOUNDATION</span>
              <FoundationArtboard theme={activeTheme} />
            </div>

            <div className="flex flex-col gap-2">
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', fontWeight: 600, color: labelColor, letterSpacing: '0.04em' }}>
                02 / TEMPLATE WORKSPACE
              </span>
              <div
                className="shrink-0 flex flex-col items-center justify-center border border-dashed p-8 text-center"
                style={{
                  width: 480,
                  minHeight: 320,
                  borderColor: p.border,
                  background: p.canvas,
                }}
              >
                <p style={{ fontFamily: ty.monoFamily, fontSize: '10px', color: p.ink_muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Workspace Bersih
                </p>
                <p style={{ fontFamily: ty.bodyFamily, fontSize: '14px', fontWeight: 600, color: p.ink, marginTop: 6 }}>
                  Belum ada template aktif
                </p>
                <p style={{ fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink_muted, marginTop: 4, maxWidth: 320, lineHeight: 1.5 }}>
                  Semua template lama telah direset. Lingkungan Design Lab siap untuk memuat template baru sesuai arahan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div
          className="flex h-[42vh] w-full shrink-0 flex-col border-t md:h-auto md:w-72 md:border-l md:border-t-0"
          style={{ background: p.canvas, borderColor: p.border }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: p.border }}>
            <p style={{ fontFamily: ty.bodyFamily, fontSize: '12px', fontWeight: 700, color: p.ink }}>Pilih tampilan</p>
          </div>

          {/* Agent card */}
          <div className="mx-3 mt-3 p-3" style={{ border: `1px solid ${p.border}`, background: p.surface }}>
            <div className="flex items-start gap-2">
              <div
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center"
                style={{ background: p.accent, color: p.accent_fg }}
              >
                <Zap className="size-3" />
              </div>
              <div className="flex-1">
                <p style={{ fontFamily: ty.bodyFamily, fontSize: '11px', fontWeight: 700, color: p.ink }}>Biar Agent yang menentukan</p>
                <p style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, marginTop: 2, lineHeight: '1.4' }}>
                  Agent menentukan desain dari idemu secara otomatis.
                </p>
              </div>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="design-mode"
                checked={selectionMode === 'agent'}
                onChange={applyAgent}
                style={{ accentColor: p.accent }}
              />
              <span style={{ fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink_muted }}>Gunakan rekomendasi Agent</span>
            </label>
            {selectionMode === 'agent' && (
              <div style={{ marginTop: 8, padding: '6px 8px', background: p.canvas, border: `1px solid ${p.border}` }}>
                <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', color: p.ink_muted, letterSpacing: '0.04em' }}>ALASAN</p>
                {agentRec.reasons.map((r, i) => (
                  <p key={i} style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink, marginTop: 2 }}>{r}</p>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mx-3 mt-3 flex gap-0 border-b" style={{ borderColor: p.border }}>
            {(['tema', 'template'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSidebarTab(tab)}
                className="flex-1 py-2 transition-colors"
                style={{
                  fontFamily: ty.monoFamily,
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: sidebarTab === tab ? p.accent : p.ink_muted,
                  background: 'transparent',
                  textTransform: 'uppercase',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: sidebarTab === tab ? `2px solid ${p.accent}` : '2px solid transparent',
                }}
              >
                {tab === 'tema' ? `Tema ${THEMES.length}` : `Template ${TEMPLATES.length}`}
              </button>
            ))}
          </div>

          {/* Card list */}
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {sidebarTab === 'tema' ? (
              THEMES.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  selected={selectedThemeId === theme.id}
                  onClick={() => { setSelectedThemeId(theme.id); setSelectionMode('manual') }}
                />
              ))
            ) : TEMPLATES.length > 0 ? (
              TEMPLATES.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  theme={activeTheme}
                  selected={selectedTemplateId === tpl.id}
                  onClick={() => {
                    setSelectedTemplateId((prev) => (prev === tpl.id ? null : tpl.id))
                    setSelectionMode('manual')
                  }}
                />
              ))
            ) : (
              <div className="py-8 text-center" style={{ fontFamily: ty.bodyFamily, color: p.ink_muted, fontSize: '11px' }}>
                <p style={{ fontWeight: 600, color: p.ink }}>Belum ada template</p>
                <p className="mt-1 text-xs">Semua template lama telah direset.</p>
              </div>
            )}
          </div>

          {/* Sticky footer */}
          <div className="space-y-2 border-t px-3 py-3" style={{ borderColor: p.border }}>
            <div className="flex items-center justify-between gap-2">
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', color: p.ink_muted }}>Tampilan:</span>
              <span style={{ fontFamily: ty.bodyFamily, fontSize: '11px', fontWeight: 700, color: p.ink, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                {displayName}
              </span>
            </div>
            <button
              type="button"
              className="w-full py-2.5 transition-opacity hover:opacity-90"
              style={{
                background: p.accent,
                color: p.accent_fg,
                fontFamily: ty.monoFamily,
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: 'none',
              }}
            >
              Buat UI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
