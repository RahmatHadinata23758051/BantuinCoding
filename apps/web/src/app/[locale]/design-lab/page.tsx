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
  Layers,
  LayoutGrid,
} from 'lucide-react'
import { TemplateFamilySelector } from '@/app/components/TemplateFamilySelector'

import { THEMES, getTheme } from '@/lib/design-lab/themes'
import { TEMPLATES, getTemplate } from '@/lib/design-lab/templates'
import { themeToCssVars } from '@/lib/design-lab/css-vars'
import { CONTOH_CATATAN, CONTOH_SUMMARY } from '@/lib/design-lab/fixtures'
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
        // Paper edge: single hairline — the artboard frame, not a container
        border: `1px solid ${p.border}`,
        ...cssVars,
      } as React.CSSProperties}
    >
      {/* Artboard label bar — not a container, part of the artboard chrome */}
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

// ─── Stamp helper (signature move: attention status only) ─────────────────────
// Used exclusively for TERVERIFIKASI and PERLU_TINJAUAN.
// Box budget: stamps are explicitly excluded from the container count.

function StatusStamp({
  label,
  color,
  fontFamily,
}: {
  label: string
  color: string
  fontFamily: string
}) {
  return (
    <span
      data-exempt="stamp"
      style={{
        display: 'inline-block',
        fontFamily,
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color,
        // Double border: 2px solid + 1px outline with 1px gap = stamp effect
        border: `2px solid ${color}`,
        outline: `1px solid ${color}`,
        outlineOffset: '1px',
        background: 'transparent',
        padding: '1px 5px',
        transform: 'rotate(-2deg)',
        // ponytail: inline-block transform requires no table-cell parent
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

        {/* Typography — no container, just text on canvas */}
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

        {/* Palette — swatches are sample boxes, explicitly excluded from container budget */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Palet · peran
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {paletteRoles.map(([role, hex]) => (
              <div key={role} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {/* Swatch box — sample, excluded from container budget */}
                <div data-exempt="swatch" style={{ width: 32, height: 32, background: hex, border: `1px solid ${p.border}` }} />
                <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted, textAlign: 'center' }}>{role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Signature moves — no container wrapper, just ruled lines */}
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

        {/* Spacing scale — sample boxes, excluded from container budget */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Skala spasi
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {spacingEntries.map(([key, val]) => {
              const px = parseInt(val)
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {/* Sample spacing box — excluded from container budget */}
                  <div data-exempt="sample-scale" style={{ width: px, height: px, background: p.accent, opacity: 0.7 }} />
                  <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>{val}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Radius scale — sample boxes, excluded from container budget */}
        <section>
          <p style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.08em', color: p.ink_muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Radius
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {radiusEntries.map(([key, val]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {/* Sample radius box — excluded from container budget */}
                <div data-exempt="sample-scale" style={{ width: 32, height: 32, borderRadius: val, background: p.canvas, border: `1px solid ${p.border}` }} />
                <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted }}>{key}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Surface grammar sample — rendered with the actual theme grammar (fix #7) */}
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

// ─── Artboard 02: List-table screen (Daftar Catatan) ─────────────────────────
// Box budget for Ledger Kertas (rule grammar):
//   Container 1: primary filled "+" button (background ≠ parent) — 1 of 2 max
//   Container 2: saldo row has special border-top + double-bottom — not a box container
//   Stamps are excluded from budget
// nesting_depth = 0 → no container inside another container

function ListTableArtboard({ theme, template }: { theme: Theme; template: Template }) {
  const p = theme.palette
  const ty = theme.typography
  const grammar = theme.surface_grammar
  const sep = grammar.separator

  const headers = ['Kode', 'Keterangan', 'Akun', 'Jumlah', 'Status']

  const signalColor = p.signal ?? p.accent

  // Status rendering per grammar (fix #5)
  // rule/space/box: TERCATAT = plain text; TERVERIFIKASI/PERLU_TINJAUAN = stamp
  // band: all statuses as colored text (band grammar relies on row color, not stamps)
  function renderStatus(status: string) {
    if (sep === 'band') {
      // Instrumen band theme: status as colored text, no stamp
      switch (status) {
        case 'TERVERIFIKASI': return <span style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', color: p.accent, fontWeight: 600 }}>{status}</span>
        case 'PERLU_TINJAUAN': return <span style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', color: signalColor, fontWeight: 600 }}>{status}</span>
        default: return <span style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.04em', color: p.ink_muted }}>{status}</span>
      }
    }
    // rule / space / box → stamp for attention, plain text for normal
    switch (status) {
      case 'TERVERIFIKASI':
        return <StatusStamp label={status} color={p.accent} fontFamily={ty.monoFamily} />
      case 'PERLU_TINJAUAN':
        return <StatusStamp label={status} color={signalColor} fontFamily={ty.monoFamily} />
      default:
        // TERCATAT: plain text — no box, no chip (fix #5)
        return <span style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.04em', color: p.ink_muted }}>{status}</span>
    }
  }

  // Row separator per grammar (fix #1)
  function rowStyle(i: number): React.CSSProperties {
    switch (sep) {
      case 'rule':  return { borderBottom: `1px solid ${p.border}` }
      case 'space': return { marginBottom: '6px' }
      case 'band':  return { background: i % 2 === 0 ? p.canvas : p.surface_subtle }
      case 'box':   return { border: `2px solid ${p.ink}`, marginBottom: '4px' }
    }
  }

  // Header row bottom border per grammar
  const headerBorder = sep === 'rule'
    ? `3px double ${p.border}`   // signature move: double rule under header
    : sep === 'box'
    ? `2px solid ${p.ink}`
    : `1px solid ${p.border}`

  // Header background — only band/box get a fill; rule has no header fill (fix #1)
  const headerBg = sep === 'band' ? p.surface : sep === 'box' ? p.surface : 'transparent'

  return (
    <ArtboardShell label={`02 / ${template.name.toUpperCase()}`} width={580} theme={theme}>
      {/* App topbar */}
      <div style={{ borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
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

      <div style={{ padding: '12px 16px' }}>
        {/* Header slot — section title with double-rule below (rule grammar) or 1px border */}
        <div style={{ borderBottom: headerBorder, paddingBottom: 10, marginBottom: 10 }}>
          <p style={{ fontFamily: ty.displayFamily, fontSize: '16px', fontWeight: 600, color: p.ink }}>{CONTOH_SUMMARY.label}</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            {[
              ['Total Debit', CONTOH_SUMMARY.totalDebit],
              ['Total Kredit', CONTOH_SUMMARY.totalKredit],
              ['Saldo Akhir', CONTOH_SUMMARY.saldoAkhir],
            ].map(([k, v]) => (
              <span key={k} style={{ fontFamily: ty.monoFamily, fontSize: '11px', color: p.ink_muted }}>
                <span>{k}: </span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: p.ink, fontWeight: 600 }}>{v}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Toolbar slot — fix #2 (search = underline-only), fix #4 (FILTER = underlined text) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {/* Search: bottom-border only, transparent background (fix #2) */}
          <div style={{
            flex: 1,
            borderBottom: `1px solid ${p.border}`,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0',
          }}>
            <span style={{ fontFamily: ty.bodyFamily, fontSize: '11px', color: p.ink_muted }}>Cari transaksi…</span>
          </div>
          {/* Secondary action: underlined text, no box (fix #4) */}
          <button
            type="button"
            style={{
              fontFamily: ty.monoFamily,
              fontSize: '10px',
              letterSpacing: '0.04em',
              color: p.ink_muted,
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${p.ink_muted}`,
              padding: '0 0 1px 0',
              cursor: 'pointer',
            }}
          >
            FILTER
          </button>
          {/* Primary action: ONE filled button per screen (fix #4, container #1) */}
          <button
            type="button"
            style={{
              padding: '5px 10px',
              background: p.accent,
              fontFamily: ty.monoFamily,
              fontSize: '10px',
              color: p.accent_fg,
              letterSpacing: '0.04em',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + CATAT
          </button>
        </div>

        {/* Primary slot — table, NO outer border for rule grammar (fix #1) */}
        <div>
          {/* Column headers — no background for rule grammar (fix #1) */}
          <div
            data-grammar-row="header"
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 120px 100px 110px',
              background: headerBg,
              borderBottom: headerBorder,
              padding: '6px 0',
              gap: 8,
            }}>
            {headers.map((h) => (
              <span key={h} style={{ fontFamily: ty.monoFamily, fontSize: '9px', letterSpacing: '0.06em', color: p.ink_muted, textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {/* Data rows */}
          {CONTOH_CATATAN.map((row, i) => (
            <div
              key={row.id}
              data-grammar-row="body"
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 120px 100px 110px',
                padding: '7px 0',
                gap: 8,
                alignItems: 'center',
                ...rowStyle(i),
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

          {/* Closing saldo row — signature move: 2px top rule + 3px double bottom rule (fix #1) */}
          <div style={{
            borderTop: `2px solid ${p.border}`,
            borderBottom: `3px double ${p.border}`,
            padding: '6px 0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <span style={{ fontFamily: ty.monoFamily, fontSize: '11px', fontVariantNumeric: 'tabular-nums', color: p.ink, fontWeight: 700 }}>
              Saldo · {CONTOH_SUMMARY.saldoAkhir}
            </span>
          </div>
        </div>

        {/* Status slot */}
        <div style={{ marginTop: 8 }}>
          <span style={{ fontFamily: ty.monoFamily, fontSize: '9px', color: p.ink_muted }}>
            {CONTOH_SUMMARY.tercatatCount} catatan · {CONTOH_SUMMARY.label}
          </span>
        </div>
      </div>
    </ArtboardShell>
  )
}

// ─── Artboard 03: Form screen (add new entry) ────────────────────────────────
// Box budget for Ledger Kertas: 1 filled button = 1 container
// nesting_depth = 0 → no nested containers

function FormArtboard({ theme }: { theme: Theme }) {
  const p = theme.palette
  const ty = theme.typography
  const sep = theme.surface_grammar.separator

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

  // Input field style: bottom-border only, transparent bg — universal component
  // rule (fix #2), not grammar-dependent: an input is never a box in any theme.
  const fieldStyle: React.CSSProperties = {
    borderBottom: `2px solid ${p.border}`,
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    background: 'transparent',
    padding: '6px 0',
    fontFamily: ty.bodyFamily,
    fontSize: '12px',
    color: p.ink,
  }

  return (
    <ArtboardShell label="03 / CATAT TRANSAKSI" width={320} theme={theme}>
      <div style={{ padding: '14px 16px' }}>
        {/* Section header with double rule below (rule grammar) */}
        <div style={{
          borderBottom: sep === 'rule' ? `3px double ${p.border}` : `2px solid ${p.border}`,
          paddingBottom: 8,
          marginBottom: 12,
        }}>
          <p style={{ fontFamily: ty.displayFamily, fontSize: '14px', fontWeight: 600, color: p.ink }}>Catat Transaksi</p>
          <p style={{ fontFamily: ty.bodyFamily, fontSize: '10px', color: p.ink_muted, marginTop: 2 }}>Isi detail transaksi — contoh data</p>
        </div>

        {/* Fields — bottom-border only for rule grammar (fix #2) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sep === 'rule' ? 14 : 10, marginBottom: 12 }}>
          {fields.map((f) => (
            <div key={f.label}>
              <label style={{
                display: 'block',
                fontFamily: ty.monoFamily,
                fontSize: '9px',
                letterSpacing: '0.06em',
                color: p.ink_muted,
                textTransform: 'uppercase',
                marginBottom: 3,
              }}>
                {f.label}
              </label>
              <div style={fieldStyle}>{f.value}</div>
              {f.hint && (
                <span style={{ fontFamily: ty.monoFamily, fontSize: '8px', color: p.ink_muted, marginTop: 2, display: 'block' }}>{f.hint}</span>
              )}
            </div>
          ))}
        </div>

        {/* Arah transaksi — inline text toggle with active underline (fix #3) */}
        <div style={{ marginBottom: 12 }}>
          <label style={{
            display: 'block',
            fontFamily: ty.monoFamily,
            fontSize: '9px',
            letterSpacing: '0.06em',
            color: p.ink_muted,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Arah
          </label>
          <div style={{ display: 'flex', gap: 20 }}>
            {arahOptions.map((opt) => {
              const isActive = opt === activeArah
              return (
                <button
                  key={opt}
                  type="button"
                  style={{
                    fontFamily: ty.monoFamily,
                    fontSize: '11px',
                    letterSpacing: '0.04em',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? p.accent : p.ink_muted,
                    background: 'transparent',
                    border: 'none',
                    // Active gets thick underline, no box (fix #3)
                    borderBottom: isActive ? `3px solid ${p.accent}` : '3px solid transparent',
                    padding: '0 0 2px 0',
                    cursor: 'pointer',
                  }}
                >
                  {opt.toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Status awal — inline text toggle with active underline (fix #3) */}
        <div style={{ marginBottom: 14 }}>
          <label style={{
            display: 'block',
            fontFamily: ty.monoFamily,
            fontSize: '9px',
            letterSpacing: '0.06em',
            color: p.ink_muted,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Status awal
          </label>
          <div style={{ display: 'flex', gap: 16 }}>
            {statusOptions.map((s) => {
              const isActive = s === activeStatus
              return (
                <button
                  key={s}
                  type="button"
                  style={{
                    fontFamily: ty.monoFamily,
                    fontSize: '10px',
                    letterSpacing: '0.04em',
                    color: isActive ? p.accent : p.ink_muted,
                    fontWeight: isActive ? 700 : 400,
                    background: 'transparent',
                    border: 'none',
                    // Active underline — no box, no chip (fix #3)
                    borderBottom: isActive ? `2px solid ${p.accent}` : '2px solid transparent',
                    padding: '0 0 1px 0',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Primary action: ONE filled button per screen (fix #4, container #1) */}
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
        {/* Simulated rows using theme grammar */}
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
      {/* Mini slot diagram */}
      <div style={{ height: 64, background: p.canvas, padding: 6 }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ height: 10, borderBottom: `1px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ height: 4, width: 40, background: `${p.ink}55` }} />
            <div style={{ height: 4, width: 20, background: `${p.accent}66`, marginLeft: 'auto' }} />
          </div>
          <div style={{ height: 8, display: 'flex', gap: 3, alignItems: 'center' }}>
            <div style={{ height: 6, flex: 1, background: `${p.border}99` }} />
            <div style={{ height: 6, width: 18, background: `${p.border}66` }} />
            <div style={{ height: 6, width: 18, background: p.accent, opacity: 0.5 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 7, display: 'flex', gap: 3, alignItems: 'center', borderBottom: `1px solid ${p.border}` }}>
                <div style={{ width: 16, height: 3, background: `${p.ink_muted}44` }} />
                <div style={{ flex: 1, height: 3, background: `${p.ink}22` }} />
                <div style={{ width: 22, height: 3, background: i === 0 ? `${p.accent}99` : `${p.ink}18` }} />
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
  const [activeMode, setActiveMode] = useState<'foundry' | 'artboards'>('foundry')
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

        <nav aria-label="Design Lab views" className="order-3 flex w-full justify-center md:order-none md:w-auto">
          <div className="inline-flex rounded-md border p-0.5" style={{ borderColor: p.border, background: p.surface }}>
            <button
              type="button"
              aria-pressed={activeMode === 'foundry'}
              onClick={() => setActiveMode('foundry')}
              className="inline-flex min-h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 md:px-3"
              style={{
                background: activeMode === 'foundry' ? p.accent : 'transparent',
                color: activeMode === 'foundry' ? p.accent_fg : p.ink_muted,
              }}
            >
              <Layers className="size-3.5" aria-hidden="true" />
              Template Foundry
            </button>
            <button
              type="button"
              aria-pressed={activeMode === 'artboards'}
              onClick={() => setActiveMode('artboards')}
              className="inline-flex min-h-8 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 md:px-3"
              style={{
                background: activeMode === 'artboards' ? p.accent : 'transparent',
                color: activeMode === 'artboards' ? p.accent_fg : p.ink_muted,
              }}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              Artboard Studio
            </button>
          </div>
        </nav>

        <div className="hidden md:block" style={{ minWidth: 128, textAlign: 'right', border: `1px solid ${p.border}`, padding: '4px 10px', fontSize: '11px', fontFamily: ty.monoFamily, color: p.ink_muted, whiteSpace: 'nowrap' }}>
          {activeMode === 'foundry'
            ? 'Template Foundry'
            : activeTemplate
              ? `Preview · ${activeTemplate.name}`
              : 'Preview tampilan · belum dipilih'}
        </div>
      </div>

      {activeMode === 'foundry' ? (
        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <TemplateFamilySelector />
          </div>
        </main>
      ) : (
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* ── Left toolbar (desktop only: pan/zoom chrome is meaningless at 390px) ── */}
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
      )}
    </div>
  )
}
