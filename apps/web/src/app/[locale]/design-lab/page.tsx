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
import { CONTOH_CATATAN, CONTOH_SUMMARY } from '@/lib/design-lab/fixtures'
import { recommend } from '@/lib/design-lab/recommend'
import type { Theme, Template } from '@/lib/design-lab/schemas'

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
  const p = theme.palette
  const ty = theme.typography
  return (
    <div
      className="shrink-0 overflow-hidden"
      data-artboard
      data-theme={theme.id}
      style={{
        width,
        background: p.canvas,
        border: `1px solid ${p.border}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        ...cssVars,
      } as React.CSSProperties}
    >
      <div
        style={{
          borderBottom: `1px solid ${p.border}`,
          padding: '4px 12px',
          fontFamily: ty.monoFamily,
          fontSize: '9px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: p.ink_muted,
          textTransform: 'uppercase' as const,
          background: p.surface,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

// ─── StatusBadge — replaces the old rotated stamp ────────────────────────────

function StatusBadge({ label, color, bgColor, fontFamily }: { label: string; color: string; bgColor: string; fontFamily: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily,
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
        color,
        background: bgColor,
        border: `1px solid ${color}40`,
        borderRadius: '3px',
        padding: '2px 6px',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </span>
  )
}

// ─── Artboard 01: Foundation ─────────────────────────────────────────────────

function FoundationArtboard({ theme }: { theme: Theme }) {
  const p = theme.palette
  const ty = theme.typography
  const sp = theme.spacing
  const ra = theme.radius

  const paletteRoles: [string, string, string][] = [
    ['canvas', p.canvas, p.ink],
    ['surface', p.surface, p.ink],
    ['border', p.border, p.ink],
    ['ink', p.ink, p.canvas],
    ['ink_muted', p.ink_muted, p.canvas],
    ['accent', p.accent, p.accent_fg],
    ['signal', p.signal ?? p.ink, p.canvas],
  ]

  const radiusEntries: [string, string][] = [
    ['none', ra.none],
    ['sm', ra.sm],
    ['md', ra.md],
    ['lg', ra.lg],
  ]

  const spacingEntries = Object.entries(sp) as [string, string][]

  return (
    <ArtboardShell label={`01 / Foundation · ${theme.name}`} width={380} theme={theme}>
      <div className="space-y-5 p-5">

        {/* Typography scale */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 10 }}>
            Tipografi
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <p style={{ fontFamily: ty.displayFamily, fontSize: ty.scale.display.fontSize, fontWeight: ty.scale.display.fontWeight, color: p.ink, lineHeight: ty.scale.display.lineHeight ?? '1.2', margin: 0 }}>
                Pembukuan Kas
              </p>
              <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted, whiteSpace: 'nowrap' }}>Display · {ty.scale.display.fontSize}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <p style={{ fontFamily: ty.bodyFamily, fontSize: ty.scale.headline.fontSize, fontWeight: ty.scale.headline.fontWeight, color: p.ink, margin: 0 }}>
                Rekaman Transaksi
              </p>
              <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>Headline · {ty.scale.headline.fontSize}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <p style={{ fontFamily: ty.bodyFamily, fontSize: ty.scale.body.fontSize, color: p.ink, lineHeight: '1.5', margin: 0 }}>
                Debit, kredit, saldo akhir periode.
              </p>
              <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>Body · {ty.scale.body.fontSize}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <p style={{ fontFamily: ty.monoFamily, fontSize: ty.scale.label.fontSize, letterSpacing: '0.05em', color: p.ink_muted, margin: 0 }}>
                TRX-1042 · LABEL
              </p>
              <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>Label</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <p style={{ fontFamily: ty.monoFamily, fontSize: ty.scale.mono.fontSize, fontWeight: ty.scale.mono.fontWeight, fontVariantNumeric: 'tabular-nums', color: p.ink, margin: 0 }}>
                Rp 2.450.000,00
              </p>
              <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>Mono · tabular</span>
            </div>
          </div>
        </section>

        {/* Palette */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 10 }}>
            Palet warna
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {paletteRoles.map(([role, hex, fg]) => (
              <div key={role} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: hex,
                  border: `1px solid ${p.border}`,
                  borderRadius: ra.sm,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: ty.monoFamily, fontSize: '7px', color: fg, opacity: 0.7 }}>{hex.slice(1, 4)}</span>
                </div>
                <span style={{ fontFamily: ty.monoFamily, fontSize: '7px', color: p.ink_muted, textAlign: 'center', lineHeight: '1.2' }}>{role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Component primitives */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 10 }}>
            Komponen dasar
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <button type="button" style={{ padding: '6px 14px', background: p.accent, color: p.accent_fg, fontFamily: ty.monoFamily, fontSize: '11px', fontWeight: 600, border: 'none', borderRadius: ra.md, cursor: 'pointer', letterSpacing: '0.03em' }}>
              Primer
            </button>
            <button type="button" style={{ padding: '6px 14px', background: 'transparent', color: p.accent, fontFamily: ty.monoFamily, fontSize: '11px', fontWeight: 600, border: `1.5px solid ${p.accent}`, borderRadius: ra.md, cursor: 'pointer' }}>
              Sekunder
            </button>
            <button type="button" style={{ padding: '6px 14px', background: 'transparent', color: p.ink_muted, fontFamily: ty.monoFamily, fontSize: '11px', border: `1px solid ${p.border}`, borderRadius: ra.md, cursor: 'pointer' }}>
              Tersier
            </button>
          </div>

          {/* Status badges */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <StatusBadge label="TERVERIFIKASI" color={p.accent} bgColor={`${p.accent}18`} fontFamily={ty.monoFamily} />
            <StatusBadge label="PERLU TINJAUAN" color={p.signal ?? p.ink} bgColor={`${p.signal ?? p.ink}14`} fontFamily={ty.monoFamily} />
            <StatusBadge label="TERCATAT" color={p.ink_muted} bgColor={`${p.border}60`} fontFamily={ty.monoFamily} />
          </div>

          {/* Input */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 4 }}>
              Keterangan
            </label>
            <div style={{
              border: `1.5px solid ${p.border}`,
              borderRadius: ra.md,
              background: p.canvas,
              padding: '6px 10px',
              fontFamily: ty.bodyFamily,
              fontSize: '12px',
              color: p.ink,
            }}>
              Pembelian alat tulis kantor
            </div>
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

        {/* Spacing + radius */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
              Spasi
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              {spacingEntries.map(([key, val]) => {
                const px = parseInt(val)
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: px, height: px, background: p.accent, opacity: 0.6, borderRadius: ra.sm }} />
                    <span style={{ fontFamily: ty.monoFamily, fontSize: '7px', color: p.ink_muted }}>{val}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
              Radius
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {radiusEntries.map(([key, val]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 28, height: 28, borderRadius: val, background: p.canvas, border: `1.5px solid ${p.border}` }} />
                  <span style={{ fontFamily: ty.monoFamily, fontSize: '7px', color: p.ink_muted }}>{key}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </ArtboardShell>
  )
}

// ─── Artboard 02: List-table screen ──────────────────────────────────────────

function ListTableArtboard({ theme, template }: { theme: Theme; template: Template }) {
  const p = theme.palette
  const ty = theme.typography
  const ra = theme.radius
  const isBand = theme.surface_grammar.separator === 'band'

  const headers = ['Kode', 'Keterangan', 'Akun', 'Jumlah', 'Status']

  const signalColor = p.signal ?? p.ink

  function renderStatus(status: string) {
    switch (status) {
      case 'TERVERIFIKASI':
        return <StatusBadge label="Terverifikasi" color={p.accent} bgColor={`${p.accent}18`} fontFamily={ty.monoFamily} />
      case 'PERLU_TINJAUAN':
        return <StatusBadge label="Perlu Tinjauan" color={signalColor} bgColor={`${signalColor}14`} fontFamily={ty.monoFamily} />
      default:
        return <StatusBadge label="Tercatat" color={p.ink_muted} bgColor={`${p.border}60`} fontFamily={ty.monoFamily} />
    }
  }

  function rowBg(i: number) {
    if (isBand) return i % 2 === 0 ? p.canvas : p.surface_subtle
    return 'transparent'
  }

  const headerBorder = `2px solid ${p.border}`

  return (
    <ArtboardShell label={`02 / ${template.name.toUpperCase()}`} width={580} theme={theme}>
      {/* App topbar */}
      <div style={{ borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: p.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, background: p.accent, borderRadius: ra.sm }} />
          <span style={{ fontFamily: ty.bodyFamily, fontSize: '12px', fontWeight: 700, color: p.ink }}>Buku Kas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {['Jurnal', 'Laporan', 'Pengaturan'].map((n) => (
            <span key={n} style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted }}>{n}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Header slot */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ fontFamily: ty.displayFamily, fontSize: '16px', fontWeight: 600, color: p.ink, margin: 0 }}>{CONTOH_SUMMARY.label}</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              {[
                ['Debit', CONTOH_SUMMARY.totalDebit],
                ['Kredit', CONTOH_SUMMARY.totalKredit],
                ['Saldo', CONTOH_SUMMARY.saldoAkhir],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontFamily: ty.monoFamily, fontSize: '9px', color: p.ink_muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
                  <span style={{ fontFamily: ty.monoFamily, fontSize: '13px', fontVariantNumeric: 'tabular-nums', color: p.ink, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            flex: 1,
            border: `1.5px solid ${p.border}`,
            borderRadius: ra.md,
            background: p.canvas,
            display: 'flex',
            alignItems: 'center',
            padding: '6px 10px',
            gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: p.ink_muted, flexShrink: 0 }}>
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink_muted }}>Cari transaksi…</span>
          </div>
          <button type="button" style={{
            padding: '7px 12px',
            background: 'transparent',
            color: p.ink_muted,
            fontFamily: ty.monoFamily,
            fontSize: '10px',
            border: `1.5px solid ${p.border}`,
            borderRadius: ra.md,
            cursor: 'pointer',
            letterSpacing: '0.03em',
          }}>
            Filter
          </button>
          <button type="button" style={{
            padding: '7px 14px',
            background: p.accent,
            color: p.accent_fg,
            fontFamily: ty.monoFamily,
            fontSize: '10px',
            fontWeight: 700,
            border: 'none',
            borderRadius: ra.md,
            cursor: 'pointer',
            letterSpacing: '0.03em',
          }}>
            + Catat
          </button>
        </div>

        {/* Table */}
        <div style={{ border: `1px solid ${p.border}`, borderRadius: ra.md, overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 120px 100px 120px',
            background: p.surface,
            borderBottom: headerBorder,
            padding: '7px 12px',
            gap: 8,
          }}>
            {headers.map((h) => (
              <span key={h} style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.07em', color: p.ink_muted, textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {/* Data rows */}
          {CONTOH_CATATAN.map((row, i) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 120px 100px 120px',
                padding: '8px 12px',
                gap: 8,
                alignItems: 'center',
                background: rowBg(i),
                borderBottom: i < CONTOH_CATATAN.length - 1 ? `1px solid ${p.border}` : undefined,
              }}
            >
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', color: p.ink_muted, fontVariantNumeric: 'tabular-nums' }}>{row.code}</span>
              <span style={{ fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</span>
              <span style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.account}</span>
              <span style={{ fontFamily: ty.monoFamily, fontSize: '11px', color: row.direction === 'kredit' ? p.accent : p.ink, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {row.direction === 'kredit' ? '' : '−'}{row.amount}
              </span>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {renderStatus(row.status)}
              </span>
            </div>
          ))}

          {/* Summary row */}
          <div style={{
            borderTop: `2px solid ${p.border}`,
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: p.surface,
          }}>
            <span style={{ fontFamily: ty.monoFamily, fontSize: '9px', color: p.ink_muted }}>{CONTOH_SUMMARY.tercatatCount} catatan</span>
            <span style={{ fontFamily: ty.monoFamily, fontSize: '12px', fontVariantNumeric: 'tabular-nums', color: p.ink, fontWeight: 700 }}>
              Saldo · {CONTOH_SUMMARY.saldoAkhir}
            </span>
          </div>
        </div>
      </div>
    </ArtboardShell>
  )
}

// ─── Artboard 03: Form screen ─────────────────────────────────────────────────

function FormArtboard({ theme }: { theme: Theme }) {
  const p = theme.palette
  const ty = theme.typography
  const ra = theme.radius

  const fields = [
    { label: 'Kode Transaksi', value: 'TRX-1047', hint: 'Diisi otomatis' },
    { label: 'Keterangan', value: 'Biaya pengadaan alat tulis kantor' },
    { label: 'Akun', value: 'Beban Operasional' },
    { label: 'Jumlah (Rp)', value: '850.000' },
  ]

  const arahOptions = ['Debit', 'Kredit'] as const
  const [activeArah] = useState<'Debit' | 'Kredit'>('Debit')

  const statusOptions = ['Tercatat', 'Terverifikasi', 'Perlu Tinjauan'] as const
  const [activeStatus] = useState<string>('Tercatat')

  const inputStyle: React.CSSProperties = {
    border: `1.5px solid ${p.border}`,
    borderRadius: ra.md,
    background: p.canvas,
    padding: '7px 10px',
    fontFamily: ty.bodyFamily,
    fontSize: '12px',
    color: p.ink,
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <ArtboardShell label="03 / CATAT TRANSAKSI" width={320} theme={theme}>
      <div style={{ padding: '16px' }}>
        {/* Form header */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: ty.displayFamily, fontSize: '15px', fontWeight: 600, color: p.ink, margin: 0 }}>Catat Transaksi</p>
          <p style={{ fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink_muted, marginTop: 3 }}>Isi detail transaksi — contoh data</p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {fields.map((f) => (
            <div key={f.label}>
              <label style={{
                display: 'block',
                fontFamily: ty.monoFamily,
                fontSize: '9px',
                letterSpacing: '0.06em',
                color: p.ink_muted,
                textTransform: 'uppercase' as const,
                marginBottom: 4,
              }}>
                {f.label}
              </label>
              <div style={inputStyle}>{f.value}</div>
              {f.hint && (
                <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted, marginTop: 3, display: 'block' }}>{f.hint}</span>
              )}
            </div>
          ))}
        </div>

        {/* Arah transaksi — segmented control */}
        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block',
            fontFamily: ty.monoFamily,
            fontSize: '9px',
            letterSpacing: '0.06em',
            color: p.ink_muted,
            textTransform: 'uppercase' as const,
            marginBottom: 6,
          }}>
            Arah
          </label>
          <div style={{
            display: 'flex',
            border: `1.5px solid ${p.border}`,
            borderRadius: ra.md,
            overflow: 'hidden',
          }}>
            {arahOptions.map((opt) => {
              const isActive = opt === activeArah
              return (
                <button
                  key={opt}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    fontFamily: ty.monoFamily,
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? p.accent_fg : p.ink_muted,
                    background: isActive ? p.accent : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.03em',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        {/* Status awal — segmented control */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'block',
            fontFamily: ty.monoFamily,
            fontSize: '9px',
            letterSpacing: '0.06em',
            color: p.ink_muted,
            textTransform: 'uppercase' as const,
            marginBottom: 6,
          }}>
            Status awal
          </label>
          <div style={{
            display: 'flex',
            border: `1.5px solid ${p.border}`,
            borderRadius: ra.md,
            overflow: 'hidden',
          }}>
            {statusOptions.map((s) => {
              const isActive = s === activeStatus
              return (
                <button
                  key={s}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontFamily: ty.monoFamily,
                    fontSize: '9px',
                    letterSpacing: '0.03em',
                    color: isActive ? p.accent_fg : p.ink_muted,
                    fontWeight: isActive ? 700 : 400,
                    background: isActive ? p.accent : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Primary action */}
        <button
          type="button"
          style={{
            width: '100%',
            padding: '10px',
            background: p.accent,
            color: p.accent_fg,
            fontFamily: ty.monoFamily,
            fontSize: '12px',
            letterSpacing: '0.05em',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            border: 'none',
            borderRadius: ra.md,
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
  const ra = theme.radius
  const isBand = theme.surface_grammar.separator === 'band'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden text-left"
      style={{
        border: selected ? `2px solid ${p.accent}` : `1.5px solid ${p.border}`,
        background: selected ? p.surface : p.canvas,
        borderRadius: ra.md,
      }}
    >
      {/* Mini preview */}
      <div style={{ height: 60, background: p.canvas, padding: 6, overflow: 'hidden' }}>
        <div style={{ height: 11, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, background: p.accent, borderRadius: '2px' }} />
          <div style={{ height: 3, width: 32, background: `${p.ink}33`, borderRadius: '1px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 10,
              background: isBand && i % 2 === 0 ? p.surface_subtle : 'transparent',
              borderBottom: !isBand ? `1px solid ${p.border}` : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 2px',
            }}>
              <div style={{ height: 3, width: 18, background: `${p.ink_muted}55`, borderRadius: '1px' }} />
              <div style={{ height: 3, flex: 1, background: `${p.ink}22`, borderRadius: '1px' }} />
              <div style={{ height: 3, width: 24, background: i === 1 ? `${p.accent}80` : `${p.border}99`, borderRadius: '2px' }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 }}>
          <span style={{ fontFamily: ty.bodyFamily, fontSize: '12px', fontWeight: 700, color: p.ink }}>{theme.name}</span>
          <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', letterSpacing: '0.05em', color: p.ink_muted, textTransform: 'uppercase', whiteSpace: 'nowrap', marginTop: 2 }}>
            {theme.archetype}
          </span>
        </div>
        <p style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, marginTop: 3, lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
          {theme.tagline}
        </p>
        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
          {(['canvas', 'surface', 'accent', 'ink', 'border'] as const).map((role) => (
            <div key={role} style={{ width: 12, height: 12, background: p[role] as string, border: `1px solid ${p.border}`, borderRadius: '2px' }} />
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
  const ra = theme.radius

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden text-left"
      style={{
        border: selected ? `2px solid ${p.accent}` : `1.5px solid ${p.border}`,
        background: selected ? p.surface : p.canvas,
        borderRadius: ra.md,
      }}
    >
      {/* Mini slot diagram */}
      <div style={{ height: 60, background: p.canvas, padding: 6 }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 10, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ height: 4, width: 40, background: `${p.ink}55`, borderRadius: '1px' }} />
            <div style={{ height: 4, width: 20, background: `${p.accent}66`, marginLeft: 'auto', borderRadius: '2px' }} />
          </div>
          <div style={{ height: 8, display: 'flex', gap: 3, alignItems: 'center' }}>
            <div style={{ height: 5, flex: 1, background: `${p.border}80`, borderRadius: '2px' }} />
            <div style={{ height: 5, width: 16, background: `${p.border}66`, borderRadius: '2px' }} />
            <div style={{ height: 5, width: 16, background: p.accent, opacity: 0.5, borderRadius: '2px' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 6, display: 'flex', gap: 3, alignItems: 'center', borderBottom: `1px solid ${p.border}` }}>
                <div style={{ width: 14, height: 3, background: `${p.ink_muted}44`, borderRadius: '1px' }} />
                <div style={{ flex: 1, height: 3, background: `${p.ink}22`, borderRadius: '1px' }} />
                <div style={{ width: 20, height: 3, background: i === 0 ? `${p.accent}80` : `${p.border}80`, borderRadius: '2px' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '7px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <p style={{ fontFamily: ty.bodyFamily, fontSize: '11px', fontWeight: 700, color: p.ink, margin: 0 }}>{tpl.name}</p>
          <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', letterSpacing: '0.04em', color: p.ink_muted, textTransform: 'uppercase' }}>
            {tpl.screen_type}
          </span>
        </div>
        <p style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, marginTop: 2, lineHeight: '1.4' }}>{tpl.purpose}</p>
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
  const ra = activeTheme.radius

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

        <div className="hidden md:block" style={{ border: `1px solid ${p.border}`, borderRadius: ra.sm, padding: '4px 14px', fontSize: '11px', fontFamily: ty.monoFamily, color: p.ink_muted, whiteSpace: 'nowrap' }}>
          {activeTemplate
            ? `Preview · ${activeTemplate.name}`
            : 'Preview tampilan · belum dipilih'}
        </div>

        <div className="hidden md:block" style={{ width: 128 }} />
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
              borderRadius: ra.sm,
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
              borderRadius: ra.sm,
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
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', fontWeight: 600, color: p.accent, letterSpacing: '0.04em' }}>01 / DESIGN FOUNDATION</span>
              <FoundationArtboard theme={activeTheme} />
            </div>

            <div className="flex flex-col gap-2">
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', fontWeight: 600, color: p.accent, letterSpacing: '0.04em' }}>
                02 / {activeTemplate.name.toUpperCase()}
              </span>
              <ListTableArtboard theme={activeTheme} template={activeTemplate} />
            </div>

            <div className="flex flex-col gap-2">
              <span style={{ fontFamily: ty.monoFamily, fontSize: '10px', fontWeight: 600, color: p.accent, letterSpacing: '0.04em' }}>
                03 / CATAT TRANSAKSI
              </span>
              <FormArtboard theme={activeTheme} />
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
          <div className="mx-3 mt-3 p-3" style={{ border: `1px solid ${p.border}`, background: p.surface, borderRadius: ra.md }}>
            <div className="flex items-start gap-2">
              <div
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center"
                style={{ background: p.accent, color: p.accent_fg, borderRadius: ra.sm }}
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
              <div style={{ marginTop: 8, padding: '8px 10px', background: p.canvas, border: `1px solid ${p.border}`, borderRadius: ra.sm }}>
                <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', color: p.ink_muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Alasan</p>
                {agentRec.reasons.map((r, i) => (
                  <p key={i} style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink, marginTop: 3, lineHeight: '1.4' }}>{r}</p>
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
                borderRadius: ra.md,
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
