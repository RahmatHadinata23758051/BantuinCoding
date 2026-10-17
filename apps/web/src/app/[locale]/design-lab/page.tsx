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
import { themeToCssVars, grammarStyle } from '@/lib/design-lab/css-vars'
import { CONTOH_CATATAN, CONTOH_SUMMARY } from '@/lib/design-lab/fixtures'
import { recommend } from '@/lib/design-lab/recommend'
import type { Theme, Template } from '@/lib/design-lab/schemas'

// ─── Token shortcuts ─────────────────────────────────────────────────────────

function tv(theme: Theme, key: keyof Theme['palette']): string {
  return theme.palette[key] as string
}

// ─── ArtboardShell ───────────────────────────────────────────────────────────

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
  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{
        width,
        border: `2px solid ${tv(theme, 'border')}`,
        background: tv(theme, 'surface'),
        borderRadius: theme.radius.sm,
        boxShadow: theme.elevation.raised,
        ...cssVars,
      } as React.CSSProperties}
    >
      <div
        className="px-4 py-2"
        style={{
          background: tv(theme, 'canvas'),
          borderBottom: `1px solid ${tv(theme, 'border')}`,
          fontFamily: theme.typography.monoFamily,
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.06em',
          color: tv(theme, 'ink_muted'),
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
    <ArtboardShell label="01 / Foundation · Ledger Kertas" width={380} theme={theme}>
      <div className="space-y-5 p-5" style={{ background: p.surface }}>

        {/* Typography */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Tipografi
          </p>
          <p style={{ fontFamily: ty.displayFamily, fontSize: ty.scale.display.fontSize, fontWeight: ty.scale.display.fontWeight, color: p.ink, lineHeight: ty.scale.display.lineHeight ?? '1.2', marginBottom: 4 }}>
            Pembukuan Kas
          </p>
          <p style={{ fontFamily: ty.bodyFamily, fontSize: ty.scale.body.fontSize, color: p.ink, lineHeight: '1.5', marginBottom: 2 }}>
            Rekaman transaksi harian — debit, kredit, saldo akhir.
          </p>
          <p style={{ fontFamily: ty.monoFamily, fontSize: ty.scale.label.fontSize, letterSpacing: '0.04em', color: p.ink_muted }}>
            TRX-1042 · Rp 2.450.000 · TERVERIFIKASI
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
                <div style={{ width: 32, height: 32, background: hex, border: `1px solid ${p.border}` }} />
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
                  <div style={{ width: px, height: px, background: p.accent, opacity: 0.7 }} />
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
                <div style={{ width: 32, height: 32, borderRadius: val, background: p.canvas, border: `1px solid ${p.border}` }} />
                <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>{key}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Grammar surface demo */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Surface grammar · rule
          </p>
          <div style={{ background: p.canvas, border: `1px solid ${p.border}` }}>
            {['Baris pertama', 'Baris kedua', 'Baris ketiga'].map((row, i) => (
              <div key={i} style={{
                padding: '6px 12px',
                borderBottom: i < 2 ? `1px solid ${p.border}` : undefined,
                fontFamily: ty.bodyFamily,
                fontSize: '11px',
                color: p.ink,
              }}>
                {row}
              </div>
            ))}
          </div>
        </section>
      </div>
    </ArtboardShell>
  )
}

// ─── Artboard 02: List-table screen (Daftar Catatan) ─────────────────────────

function ListTableArtboard({ theme, template }: { theme: Theme; template: Template }) {
  const p = theme.palette
  const ty = theme.typography
  const grammar = theme.surface_grammar
  const gs = grammarStyle(grammar.separator)

  const headers = ['Kode', 'Keterangan', 'Akun', 'Jumlah', 'Status']

  // Signal tones derived only from theme tokens (no hardcoded colors)
  const signalColor = p.signal ?? p.accent
  function statusStyle(status: string): React.CSSProperties {
    switch (status) {
      case 'TERVERIFIKASI': return { color: p.accent, background: `${p.accent}11`, border: `1px solid ${p.accent}55` }
      case 'TERCATAT':      return { color: p.ink_muted, background: p.surface_subtle, border: `1px solid ${p.border}` }
      case 'PERLU_TINJAUAN': return { color: signalColor, background: `${signalColor}11`, border: `1px solid ${signalColor}55` }
      default: return { color: p.ink_muted }
    }
  }

  // Row separator per grammar
  function rowBorder(i: number): React.CSSProperties {
    switch (grammar.separator) {
      case 'rule':  return { borderBottom: gs.rowSeparator }
      case 'space': return { marginBottom: '6px' }
      case 'band':  return { background: i % 2 === 0 ? p.canvas : p.surface_subtle }
      case 'box':   return { border: gs.groupBorder, marginBottom: '4px' }
    }
  }

  return (
    <ArtboardShell label={`02 / ${template.name.toUpperCase()}`} width={580} theme={theme}>
      {/* App topbar */}
      <div style={{ background: p.canvas, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, background: p.accent }} />
          <span style={{ fontFamily: ty.bodyFamily, fontSize: '12px', fontWeight: 700, color: p.ink }}>Buku Kas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {['Jurnal', 'Laporan', 'Pengaturan'].map((n) => (
            <span key={n} style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted }}>{n}</span>
          ))}
        </div>
      </div>

      <div style={{ background: p.surface, padding: '12px 16px' }}>
        {/* Header slot */}
        <div style={{ borderBottom: grammar.separator === 'rule' ? `2px solid ${p.border}` : `1px solid ${p.border}`, paddingBottom: 10, marginBottom: 10 }}>
          <p style={{ fontFamily: ty.displayFamily, fontSize: '16px', fontWeight: 600, color: p.ink }}>{CONTOH_SUMMARY.label}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            {[
              ['Total Debit', CONTOH_SUMMARY.totalDebit],
              ['Total Kredit', CONTOH_SUMMARY.totalKredit],
              ['Saldo Akhir', CONTOH_SUMMARY.saldoAkhir],
            ].map(([k, v]) => (
              <span key={k} style={{ fontFamily: ty.monoFamily, fontSize: '11px', color: p.ink_muted }}>
                <span style={{ color: p.ink_muted }}>{k}: </span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: p.ink, fontWeight: 600 }}>{v}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Toolbar slot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 28, background: p.canvas, border: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
            <span style={{ fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink_muted }}>Cari transaksi…</span>
          </div>
          <div style={{ padding: '5px 10px', background: p.canvas, border: `1px solid ${p.border}`, fontFamily: ty.monoFamily, fontSize: '10px', color: p.ink_muted, letterSpacing: '0.04em' }}>FILTER</div>
          <div style={{ padding: '5px 10px', background: p.accent, fontFamily: ty.monoFamily, fontSize: '10px', color: p.accent_fg, letterSpacing: '0.04em', fontWeight: 600 }}>+ CATAT</div>
        </div>

        {/* Primary slot — table */}
        <div style={{ border: grammar.separator === 'box' ? `2px solid ${p.ink}` : `1px solid ${p.border}` }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px 110px', background: p.canvas, borderBottom: `${grammar.separator === 'rule' ? '2px' : '1px'} solid ${p.border}`, padding: '6px 12px', gap: 8 }}>
            {headers.map((h) => (
              <span key={h} style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', color: p.ink_muted, textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {/* Data rows */}
          {CONTOH_CATATAN.map((row, i) => (
            <div key={row.id} style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 120px 100px 110px',
              padding: '7px 12px',
              gap: 8,
              alignItems: 'center',
              ...rowBorder(i),
            }}>
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', color: p.ink_muted, fontVariantNumeric: 'tabular-nums' }}>{row.code}</span>
              <span style={{ fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</span>
              <span style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.account}</span>
              <span style={{ fontFamily: ty.monoFamily, fontSize: '11px', color: row.direction === 'kredit' ? p.accent : p.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {row.direction === 'kredit' ? '' : '-'}{row.amount}
              </span>
              <span style={{
                fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', fontWeight: 600,
                padding: '2px 6px', textTransform: 'uppercase',
                ...statusStyle(row.status),
              }}>
                {row.status}
              </span>
            </div>
          ))}
          {/* Closing double-rule (signature move) */}
          <div style={{ borderTop: `3px double ${p.border}`, padding: '6px 12px', display: 'flex', justifyContent: 'flex-end', background: p.canvas }}>
            <span style={{ fontFamily: ty.monoFamily, fontSize: '11px', fontVariantNumeric: 'tabular-nums', color: p.ink, fontWeight: 700 }}>
              Saldo · {CONTOH_SUMMARY.saldoAkhir}
            </span>
          </div>
        </div>

        {/* Status slot */}
        <div style={{ marginTop: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontFamily: ty.monoFamily, fontSize: '9px', color: p.ink_muted }}>
            {CONTOH_SUMMARY.tercatatCount} catatan · {CONTOH_SUMMARY.label}
          </span>
        </div>
      </div>
    </ArtboardShell>
  )
}

// ─── Artboard 03: Form screen (add new entry) ────────────────────────────────

function FormArtboard({ theme }: { theme: Theme }) {
  const p = theme.palette
  const ty = theme.typography

  const fields = [
    { label: 'Kode Transaksi', value: 'TRX-1047', hint: 'Diisi otomatis' },
    { label: 'Keterangan', value: 'Biaya pengadaan alat tulis kantor' },
    { label: 'Akun', value: 'Beban Operasional' },
    { label: 'Jumlah (Rp)', value: '850.000' },
  ]

  const statusOptions = ['Tercatat', 'Terverifikasi', 'Perlu Tinjauan']

  return (
    <ArtboardShell label="03 / CATAT TRANSAKSI" width={320} theme={theme}>
      <div style={{ background: p.surface, padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ borderBottom: `2px solid ${p.border}`, paddingBottom: 8, marginBottom: 12 }}>
          <p style={{ fontFamily: ty.displayFamily, fontSize: '14px', fontWeight: 600, color: p.ink }}>Catat Transaksi</p>
          <p style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, marginTop: 2 }}>Isi detail transaksi — contoh data</p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
          {fields.map((f) => (
            <div key={f.label}>
              <label style={{ display: 'block', fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 3 }}>
                {f.label}
              </label>
              <div style={{ background: p.canvas, border: `1px solid ${p.border}`, padding: '6px 10px', fontFamily: ty.bodyFamily, fontSize: '12px', color: p.ink }}>
                {f.value}
              </div>
              {f.hint && (
                <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted, marginTop: 2, display: 'block' }}>{f.hint}</span>
              )}
            </div>
          ))}
        </div>

        {/* Arah transaksi */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 6 }}>
            Arah
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {['Debit', 'Kredit'].map((opt, i) => (
              <div key={opt} style={{
                padding: '6px',
                textAlign: 'center',
                fontFamily: ty.monoFamily,
                fontSize: '10px',
                letterSpacing: '0.04em',
                border: `1px solid ${i === 0 ? p.accent : p.border}`,
                background: i === 0 ? p.accent : p.canvas,
                color: i === 0 ? p.accent_fg : p.ink_muted,
              }}>
                {opt.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Status stamp options */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 6 }}>
            Status awal
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {statusOptions.map((s, i) => (
              <div key={s} style={{
                padding: '3px 7px',
                fontFamily: ty.monoFamily,
                fontSize: '9px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                border: `1px solid ${i === 0 ? p.accent : p.border}`,
                background: i === 0 ? `${p.accent}11` : p.canvas,
                color: i === 0 ? p.accent : p.ink_muted,
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          style={{
            width: '100%',
            padding: '9px',
            background: p.accent,
            color: p.accent_fg,
            fontFamily: ty.monoFamily,
            fontSize: '11px',
            letterSpacing: '0.06em',
            fontWeight: 700,
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Simpan Catatan
        </button>
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

  // Mini palette swatches from the theme palette
  const swatchRoles: (keyof typeof p)[] = ['canvas', 'accent', 'ink', 'border']

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden text-left"
      style={{ border: borderStyle, background: bgStyle }}
    >
      {/* Theme mini-preview */}
      <div style={{ height: 64, background: p.canvas, padding: 6, position: 'relative' }}>
        {/* Simulated topbar rule */}
        <div style={{ height: 12, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 3 }}>
          <div style={{ width: 8, height: 8, background: p.accent }} />
          <div style={{ height: 3, width: 32, background: `${p.ink}33` }} />
          <div style={{ height: 3, width: 20, background: `${p.ink}18`, marginLeft: 'auto' }} />
        </div>
        {/* Simulated table rows (rule grammar) */}
        <div style={{ marginTop: 4 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 10, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 4, padding: '0 2px' }}>
              <div style={{ height: 3, width: 20, background: `${p.ink_muted}55` }} />
              <div style={{ height: 3, flex: 1, background: `${p.ink}22` }} />
              <div style={{ height: 3, width: 28, background: i === 1 ? `${p.accent}99` : `${p.ink}18`, fontVariantNumeric: 'tabular-nums' }} />
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
      {/* Mini slot diagram */}
      <div style={{ height: 64, background: p.canvas, padding: 6 }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* header slot */}
          <div style={{ height: 10, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ height: 4, width: 40, background: `${p.ink}55` }} />
            <div style={{ height: 4, width: 20, background: `${p.accent}66`, marginLeft: 'auto' }} />
          </div>
          {/* toolbar slot */}
          <div style={{ height: 8, display: 'flex', gap: 3, alignItems: 'center' }}>
            <div style={{ height: 6, flex: 1, background: `${p.border}99` }} />
            <div style={{ height: 6, width: 18, background: `${p.border}66` }} />
            <div style={{ height: 6, width: 18, background: p.accent, opacity: 0.5 }} />
          </div>
          {/* primary slot (table rows) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 7, display: 'flex', gap: 3, alignItems: 'center', borderBottom: `1px solid ${p.border}` }}>
                <div style={{ width: 16, height: 3, background: `${p.ink_muted}44` }} />
                <div style={{ flex: 1, height: 3, background: `${p.ink}22` }} />
                <div style={{ width: 22, height: 3, background: i === 0 ? `${p.accent}99` : `${p.ink}18`, fontVariantNumeric: 'tabular-nums' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(TEMPLATES[0].id)
  const [selectionMode, setSelectionMode] = useState<'manual' | 'agent'>('manual')
  const [zoom, setZoom] = useState(90)
  const [tool, setTool] = useState<'pointer' | 'hand'>('pointer')

  const activeTheme = useMemo(() => getTheme(selectedThemeId), [selectedThemeId])
  const activeTemplate = useMemo(() => (selectedTemplateId ? getTemplate(selectedTemplateId) : TEMPLATES[0]), [selectedTemplateId])

  const agentRec = useMemo(() => recommend({}), [])

  function applyAgent() {
    setSelectedThemeId(agentRec.themeId)
    setSelectedTemplateId(agentRec.templateId)
    setSelectionMode('agent')
  }

  const p = activeTheme.palette
  const ty = activeTheme.typography

  // Canvas label accent — use theme ink, not purple
  const labelColor = p.accent

  const displayName = activeTemplate ? `${activeTheme.name} · ${activeTemplate.name}` : activeTheme.name

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: p.surface_subtle }}>
      {/* ── Top bar ── */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-4" style={{ background: p.canvas, borderColor: p.border }}>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 transition-colors"
            style={{ fontSize: '11px', fontFamily: ty.bodyFamily, color: p.ink_muted }}
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <span style={{ color: p.border }}>/</span>
          <span style={{ fontSize: '11px', fontFamily: ty.bodyFamily, fontWeight: 600, color: p.ink }}>Design Lab</span>
        </div>

        <div style={{ border: `1px solid ${p.border}`, padding: '4px 14px', fontSize: '11px', fontFamily: ty.monoFamily, color: p.ink_muted }}>
          {activeTemplate
            ? `Preview · ${activeTemplate.name}`
            : 'Preview tampilan · belum dipilih'}
        </div>

        <div style={{ width: 128 }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left toolbar ── */}
        <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r py-3" style={{ background: p.canvas, borderColor: p.border }}>
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
            className="flex min-h-full items-start gap-8 p-10"
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
                02 / {activeTemplate.name.toUpperCase()}
              </span>
              <ListTableArtboard theme={activeTheme} template={activeTemplate} />
            </div>

            <div className="flex flex-col gap-2">
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', fontWeight: 600, color: labelColor, letterSpacing: '0.04em' }}>
                03 / CATAT TRANSAKSI
              </span>
              <FormArtboard theme={activeTheme} />
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div
          className="flex w-72 shrink-0 flex-col border-l"
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
                  borderBottom: sidebarTab === tab ? `2px solid ${p.accent}` : '2px solid transparent',
                  background: 'transparent',
                  textTransform: 'uppercase',
                }}
              >
                {tab === 'tema' ? `Tema ${THEMES.length}` : `Template ${TEMPLATES.length}`}
              </button>
            ))}
          </div>

          {/* Card list */}
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {sidebarTab === 'tema'
              ? THEMES.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    selected={selectedThemeId === theme.id}
                    onClick={() => { setSelectedThemeId(theme.id); setSelectionMode('manual') }}
                  />
                ))
              : TEMPLATES.map((tpl) => (
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
                ))}
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
