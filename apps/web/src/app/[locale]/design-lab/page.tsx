'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Star,
  Zap,
} from 'lucide-react'

// ─── Theme definitions ────────────────────────────────────────────────────────

type ThemeId =
  | 'ramp'
  | 'raycast'
  | 'railway'
  | 'miro'
  | 'figma'

type TemplateId =
  | 'sales-crm'
  | 'marketing-dashboard'
  | 'dashboard-crm'
  | 'nuvio-support'
  | 'clean-modern'

interface ThemeDef {
  id: ThemeId
  name: string
  desc: string
  palette: string[]
  stars: number
  usageCount: number
  tokens: {
    canvas: string
    surface: string
    border: string
    text: string
    textMuted: string
    accent: string
    accentFg: string
    sidebar: string
  }
}

interface TemplateDef {
  id: TemplateId
  name: string
  category: string
  desc: string
  palette: string[]
}

const THEMES: ThemeDef[] = [
  {
    id: 'ramp',
    name: 'Ramp',
    desc: 'Dense financial-grade interface. High contrast tables, tight spacing, systematic green.',
    palette: ['#0A0A0A', '#1A1A1A', '#22C55E', '#FFFFFF'],
    stars: 4.9,
    usageCount: 83,
    tokens: {
      canvas: '#F7F7F5',
      surface: '#FFFFFF',
      border: '#E5E5E2',
      text: '#111111',
      textMuted: '#6B6B6B',
      accent: '#22C55E',
      accentFg: '#FFFFFF',
      sidebar: '#FAFAF8',
    },
  },
  {
    id: 'raycast',
    name: 'Raycast',
    desc: 'Dark command-palette aesthetic. High legibility, subtle blur surfaces, orange focal accent.',
    palette: ['#1C1C1E', '#2C2C2E', '#FF6363', '#F5F5F5'],
    stars: 4.8,
    usageCount: 61,
    tokens: {
      canvas: '#1C1C1E',
      surface: '#2C2C2E',
      border: '#3A3A3C',
      text: '#F5F5F7',
      textMuted: '#98989D',
      accent: '#FF6363',
      accentFg: '#FFFFFF',
      sidebar: '#242426',
    },
  },
  {
    id: 'railway',
    name: 'Railway',
    desc: 'Obsidian dark with violet-purple accents. Dev-tool precision, sharp edges, zero fluff.',
    palette: ['#0B0D0E', '#161819', '#7C3AED', '#A78BFA'],
    stars: 4.7,
    usageCount: 47,
    tokens: {
      canvas: '#0B0D0E',
      surface: '#161819',
      border: '#272A2D',
      text: '#EDEDED',
      textMuted: '#6B7280',
      accent: '#7C3AED',
      accentFg: '#FFFFFF',
      sidebar: '#111314',
    },
  },
  {
    id: 'miro',
    name: 'Miro',
    desc: 'Airy canvas with warm cream and yellow. Collaborative, open, breathing space.',
    palette: ['#F5F3EF', '#FFF9C4', '#FFD02F', '#1A1A1A'],
    stars: 4.6,
    usageCount: 39,
    tokens: {
      canvas: '#F9F8F5',
      surface: '#FFFFFF',
      border: '#E8E5DF',
      text: '#1A1A1A',
      textMuted: '#888580',
      accent: '#FFD02F',
      accentFg: '#1A1A1A',
      sidebar: '#F5F3EF',
    },
  },
  {
    id: 'figma',
    name: 'Figma',
    desc: 'Neutral cool grey system. Tool-first density, multi-pane layout, reliable for any app.',
    palette: ['#2C2C2C', '#3C3C3C', '#18A0FB', '#FFFFFF'],
    stars: 4.5,
    usageCount: 112,
    tokens: {
      canvas: '#F0F0F0',
      surface: '#FFFFFF',
      border: '#D9D9D9',
      text: '#1A1A1A',
      textMuted: '#6A6A6A',
      accent: '#18A0FB',
      accentFg: '#FFFFFF',
      sidebar: '#2C2C2C',
    },
  },
]

const TEMPLATES: TemplateDef[] = [
  {
    id: 'sales-crm',
    name: 'Sales CRM — Compact Ledger',
    category: 'CRM',
    desc: 'Pipeline view, deal cards, contact ledger',
    palette: ['#0F172A', '#1E293B', '#3B82F6', '#F8FAFC'],
  },
  {
    id: 'marketing-dashboard',
    name: 'Marketing Sales Dashboard',
    category: 'Analytics',
    desc: 'Revenue chart, campaign table, KPI rail',
    palette: ['#FAFAF9', '#FFFFFF', '#6366F1', '#1A1A1A'],
  },
  {
    id: 'dashboard-crm',
    name: 'Dashboard CRM',
    category: 'CRM',
    desc: 'Activity feed, contact tree, task queue',
    palette: ['#F7F6F3', '#FFFFFF', '#059669', '#111827'],
  },
  {
    id: 'nuvio-support',
    name: 'Nuvio Support Dashboard',
    category: 'Support',
    desc: 'Ticket list, SLA status, agent queue',
    palette: ['#18181B', '#27272A', '#A78BFA', '#FAFAFA'],
  },
  {
    id: 'clean-modern',
    name: 'Clean Modern Dashboard',
    category: 'General',
    desc: 'Stat grid, table, filter panel',
    palette: ['#F8FAFC', '#FFFFFF', '#0EA5E9', '#0F172A'],
  },
]

// ─── Artboard: Foundation tokens display ─────────────────────────────────────

function FoundationArtboard({ theme }: { theme: ThemeDef }) {
  const t = theme.tokens
  const isDark = t.canvas.startsWith('#0') || t.canvas.startsWith('#1') || t.canvas.startsWith('#2C')
  const panelBg = isDark ? t.surface : '#FFFFFF'
  const panelBorder = t.border

  return (
    <div
      className="shrink-0 overflow-hidden rounded-[6px] shadow-md"
      style={{ width: 360, border: `1px solid ${panelBorder}`, background: panelBg }}
    >
      {/* Artboard label */}
      <div
        className="px-4 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-widest"
        style={{ background: t.canvas, color: t.textMuted, borderBottom: `1px solid ${panelBorder}` }}
      >
        FOUNDATION / THEME TOKENS
      </div>

      <div className="space-y-5 p-5" style={{ background: panelBg }}>
        {/* Typography specimen */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Typography
          </p>
          <p className="text-2xl font-bold leading-tight" style={{ color: t.text }}>
            The quick brown
          </p>
          <p className="text-base" style={{ color: t.text }}>
            fox jumps over
          </p>
          <p className="text-sm font-light" style={{ color: t.textMuted }}>
            the lazy dog — 0123456789
          </p>
        </div>

        {/* Color Palette */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Color Palette
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[t.canvas, t.surface, t.accent, t.text, t.textMuted, t.border, '#22C55E', '#EF4444'].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="size-8 rounded-[4px] ring-1 ring-black/10" style={{ background: c }} />
                <span className="text-[8px] font-mono" style={{ color: t.textMuted }}>{c.slice(1, 7)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacing scale */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Spacing
          </p>
          <div className="flex items-end gap-2">
            {[4, 8, 12, 16, 24, 32].map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className="rounded-[2px]" style={{ width: s, height: s, background: t.accent, opacity: 0.7 }} />
                <span className="text-[8px] font-mono" style={{ color: t.textMuted }}>{s}px</span>
              </div>
            ))}
          </div>
        </div>

        {/* Border radius */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Border Radius
          </p>
          <div className="flex items-center gap-3">
            {[0, 4, 8, 16, 9999].map((r) => (
              <div
                key={r}
                className="size-8"
                style={{
                  borderRadius: r,
                  background: t.canvas,
                  border: `1px solid ${t.border}`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Artboard: Dashboard screen ───────────────────────────────────────────────

function DashboardArtboard({ theme }: { theme: ThemeDef }) {
  const t = theme.tokens
  const panelBorder = t.border

  const stats = [
    { label: 'Revenue', value: 'Rp 84.2M', delta: '+12%' },
    { label: 'Active Users', value: '3,847', delta: '+8%' },
    { label: 'Conversion', value: '4.71%', delta: '+0.4%' },
    { label: 'Tickets Open', value: '28', delta: '-6%' },
  ]

  const rows = [
    { name: 'Project Alpha', status: 'Active', progress: 78, owner: 'RH' },
    { name: 'Beta Launch', status: 'Review', progress: 55, owner: 'DL' },
    { name: 'Migration v3', status: 'Blocked', progress: 33, owner: 'AW' },
    { name: 'Infra Audit', status: 'Done', progress: 100, owner: 'SL' },
  ]

  return (
    <div
      className="shrink-0 overflow-hidden rounded-[6px] shadow-md"
      style={{ width: 520, border: `1px solid ${panelBorder}`, background: t.surface }}
    >
      {/* App topbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: t.canvas, borderBottom: `1px solid ${panelBorder}` }}
      >
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-[3px]" style={{ background: t.accent }} />
          <span className="text-[11px] font-bold" style={{ color: t.text }}>Workspace</span>
        </div>
        <div className="flex items-center gap-2">
          {['Dashboard', 'Projects', 'Reports'].map((nav) => (
            <span key={nav} className="text-[10px]" style={{ color: t.textMuted }}>{nav}</span>
          ))}
          <div className="size-5 rounded-full" style={{ background: t.accent, opacity: 0.9 }} />
        </div>
      </div>

      <div className="p-4 space-y-4" style={{ background: t.surface }}>
        {/* Stat rail */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[4px] p-3 space-y-1"
              style={{ background: t.canvas, border: `1px solid ${panelBorder}` }}
            >
              <p className="text-[9px] font-medium" style={{ color: t.textMuted }}>{s.label}</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: t.text }}>{s.value}</p>
              <p className="text-[9px] font-semibold" style={{ color: t.accent }}>{s.delta}</p>
            </div>
          ))}
        </div>

        {/* Mini chart placeholder */}
        <div
          className="rounded-[4px] p-3 space-y-2"
          style={{ background: t.canvas, border: `1px solid ${panelBorder}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold" style={{ color: t.text }}>Revenue Trend</span>
            <span className="text-[9px]" style={{ color: t.textMuted }}>Last 7 days</span>
          </div>
          <div className="flex items-end gap-1 h-10">
            {[40, 60, 45, 80, 65, 90, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${h}%`, background: t.accent, opacity: i === 5 ? 1 : 0.4 }}
              />
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-[4px] overflow-hidden"
          style={{ border: `1px solid ${panelBorder}` }}
        >
          <div
            className="grid grid-cols-4 px-3 py-1.5"
            style={{ background: t.canvas, borderBottom: `1px solid ${panelBorder}` }}
          >
            {['Project', 'Status', 'Progress', 'Owner'].map((h) => (
              <span key={h} className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>{h}</span>
            ))}
          </div>
          {rows.map((row, i) => (
            <div
              key={row.name}
              className="grid grid-cols-4 px-3 py-2 items-center"
              style={{
                background: i % 2 === 0 ? t.surface : t.canvas,
                borderBottom: i < rows.length - 1 ? `1px solid ${panelBorder}` : undefined,
              }}
            >
              <span className="text-[10px] font-medium" style={{ color: t.text }}>{row.name}</span>
              <span
                className="inline-block rounded-[3px] px-1.5 py-0.5 text-[8px] font-semibold w-fit"
                style={{
                  background: row.status === 'Active' ? `${t.accent}22` : row.status === 'Done' ? '#22C55E22' : '#EF444422',
                  color: row.status === 'Active' ? t.accent : row.status === 'Done' ? '#16A34A' : '#DC2626',
                }}
              >
                {row.status}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-1 flex-1 rounded-full" style={{ background: panelBorder }}>
                  <div className="h-full rounded-full" style={{ width: `${row.progress}%`, background: t.accent }} />
                </div>
                <span className="text-[8px] tabular-nums" style={{ color: t.textMuted }}>{row.progress}%</span>
              </div>
              <div className="size-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{ background: `${t.accent}33`, color: t.accent }}>
                {row.owner}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Artboard: Form / Detail screen ──────────────────────────────────────────

function FormArtboard({ theme }: { theme: ThemeDef }) {
  const t = theme.tokens
  const panelBorder = t.border

  return (
    <div
      className="shrink-0 overflow-hidden rounded-[6px] shadow-md"
      style={{ width: 320, border: `1px solid ${panelBorder}`, background: t.surface }}
    >
      <div
        className="px-4 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-widest"
        style={{ background: t.canvas, color: t.textMuted, borderBottom: `1px solid ${panelBorder}` }}
      >
        DETAIL / FORM SCREEN
      </div>

      <div className="p-4 space-y-3" style={{ background: t.surface }}>
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: t.text }}>New Project</p>
          <p className="text-[10px]" style={{ color: t.textMuted }}>Fill in the project details below</p>
        </div>

        {[
          { label: 'Project Name', value: 'Alpha Initiative' },
          { label: 'Owner', value: 'Rahmat Hadinata' },
          { label: 'Deadline', value: '2026-12-01' },
        ].map((field) => (
          <div key={field.label} className="space-y-1">
            <label className="text-[10px] font-semibold" style={{ color: t.text }}>{field.label}</label>
            <div
              className="rounded-[4px] px-3 py-2 text-[11px]"
              style={{ background: t.canvas, border: `1px solid ${panelBorder}`, color: t.text }}
            >
              {field.value}
            </div>
          </div>
        ))}

        <div className="space-y-1">
          <label className="text-[10px] font-semibold" style={{ color: t.text }}>Status</label>
          <div className="grid grid-cols-3 gap-1">
            {['Active', 'Review', 'Done'].map((s, i) => (
              <div
                key={s}
                className="rounded-[4px] py-1.5 text-center text-[10px] font-medium"
                style={{
                  background: i === 0 ? t.accent : t.canvas,
                  color: i === 0 ? t.accentFg : t.textMuted,
                  border: `1px solid ${i === 0 ? t.accent : panelBorder}`,
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-[4px] py-2 text-[11px] font-semibold mt-2"
          style={{ background: t.accent, color: t.accentFg }}
        >
          Create Project
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar theme card ───────────────────────────────────────────────────────

function ThemeCard({
  theme,
  selected,
  onClick,
}: {
  theme: ThemeDef
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-[8px] overflow-hidden transition-all duration-150"
      style={{
        border: selected ? '2px solid #7C3AED' : '1.5px solid #E4E4E7',
        background: selected ? '#F5F3FF' : '#FFFFFF',
        boxShadow: selected ? '0 0 0 3px #7C3AED22' : undefined,
      }}
    >
      {/* Mini mockup thumbnail */}
      <div className="h-16 relative overflow-hidden" style={{ background: theme.tokens.canvas }}>
        {/* Simulated app chrome */}
        <div
          className="absolute inset-x-0 top-0 h-4 flex items-center px-2 gap-1.5"
          style={{ background: theme.tokens.canvas, borderBottom: `1px solid ${theme.tokens.border}` }}
        >
          <div className="size-1.5 rounded-full" style={{ background: theme.tokens.accent }} />
          <div className="h-1.5 w-8 rounded-full" style={{ background: `${theme.tokens.textMuted}44` }} />
          <div className="h-1.5 w-6 rounded-full" style={{ background: `${theme.tokens.textMuted}22` }} />
        </div>
        {/* Simulated content grid */}
        <div className="absolute inset-x-2 top-6 bottom-1 grid grid-cols-3 gap-1">
          {[60, 40, 75].map((h, i) => (
            <div key={i} className="rounded-sm" style={{ background: i === 0 ? `${theme.tokens.accent}66` : `${theme.tokens.textMuted}22` }} />
          ))}
        </div>
      </div>

      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#111]">{theme.name}</span>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">GRATIS</span>
        </div>
        <p className="text-[10px] text-[#6B6B6B] leading-relaxed line-clamp-2">{theme.desc}</p>
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex gap-1">
            {theme.palette.map((c, i) => (
              <div key={i} className="size-3 rounded-full ring-1 ring-black/10" style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Star className="size-3 text-amber-400 fill-amber-400" />
            <span className="text-[9px] text-[#6B6B6B]">{theme.stars} · {theme.usageCount}x</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function TemplateCard({
  tpl,
  selected,
  onClick,
}: {
  tpl: TemplateDef
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-[8px] overflow-hidden transition-all duration-150"
      style={{
        border: selected ? '2px solid #7C3AED' : '1.5px solid #E4E4E7',
        background: selected ? '#F5F3FF' : '#FFFFFF',
      }}
    >
      {/* Mini thumbnail */}
      <div className="h-12 relative overflow-hidden" style={{ background: tpl.palette[0] }}>
        <div className="absolute inset-1 grid grid-cols-3 gap-1 opacity-60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-sm" style={{ background: tpl.palette[i] ?? '#fff' }} />
          ))}
        </div>
      </div>
      <div className="px-3 py-2 space-y-0.5">
        <p className="text-[11px] font-bold text-[#111]">{tpl.name}</p>
        <p className="text-[9px] text-[#6B6B6B]">{tpl.desc}</p>
      </div>
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DesignLabPage() {
  const [sidebarTab, setSidebarTab] = useState<'tema' | 'template'>('tema')
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>('ramp')
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | null>(null)
  const [zoom, setZoom] = useState(90)
  const [tool, setTool] = useState<'pointer' | 'hand'>('pointer')

  const activeTheme = THEMES.find((t) => t.id === selectedThemeId) ?? THEMES[0]

  const displayName = selectedTemplateId
    ? (TEMPLATES.find((t) => t.id === selectedTemplateId)?.name ?? activeTheme.name)
    : activeTheme.name

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAFAFA]">
      {/* ── Top bar ── */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#E4E4E7] bg-white px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B6B6B] hover:text-[#111] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <span className="text-[#D4D4D8]">/</span>
          <span className="text-[11px] font-semibold text-[#111]">Design Lab</span>
        </div>

        {/* Pill label */}
        <div className="rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-4 py-1.5 text-[11px] font-medium text-[#6B6B6B]">
          Preview tampilan · belum dibuat dari idemu
        </div>

        <div className="w-32" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left toolbar ── */}
        <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-[#E4E4E7] bg-white py-3">
          <button
            type="button"
            onClick={() => setTool('pointer')}
            title="Select"
            className={`flex size-8 items-center justify-center rounded-[6px] transition-colors ${
              tool === 'pointer' ? 'bg-[#7C3AED] text-white' : 'text-[#6B6B6B] hover:bg-[#F4F4F5]'
            }`}
          >
            <MousePointer2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('hand')}
            title="Pan"
            className={`flex size-8 items-center justify-center rounded-[6px] transition-colors ${
              tool === 'hand' ? 'bg-[#7C3AED] text-white' : 'text-[#6B6B6B] hover:bg-[#F4F4F5]'
            }`}
          >
            <Hand className="size-4" />
          </button>

          <div className="my-1 h-px w-6 bg-[#E4E4E7]" />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 10, 150))}
            title="Zoom in"
            className="flex size-8 items-center justify-center rounded-[6px] text-[#6B6B6B] hover:bg-[#F4F4F5] transition-colors"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 10, 40))}
            title="Zoom out"
            className="flex size-8 items-center justify-center rounded-[6px] text-[#6B6B6B] hover:bg-[#F4F4F5] transition-colors"
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(90)}
            title="Fit to screen"
            className="flex size-8 items-center justify-center rounded-[6px] text-[#6B6B6B] hover:bg-[#F4F4F5] transition-colors"
          >
            <Maximize2 className="size-3.5" />
          </button>

          <div className="mt-1 text-[9px] font-mono text-[#9CA3AF]">{zoom}%</div>
        </div>

        {/* ── Canvas area ── */}
        <div
          className="flex-1 overflow-auto"
          style={{
            background: '#EDEBF7',
            cursor: tool === 'hand' ? 'grab' : 'default',
          }}
        >
          {/* Artboards laid out horizontally */}
          <div
            className="flex min-h-full items-start gap-8 p-10"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              width: `${100 * (100 / zoom)}%`,
            }}
          >
            {/* Label above each artboard */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-[#7C3AED] font-semibold">
                01 / DESIGN FOUNDATION
              </span>
              <FoundationArtboard theme={activeTheme} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-[#7C3AED] font-semibold">
                02 / DASHBOARD SCREEN
              </span>
              <DashboardArtboard theme={activeTheme} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-[#7C3AED] font-semibold">
                03 / FORM & DETAIL
              </span>
              <FormArtboard theme={activeTheme} />
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div
          className="flex w-72 shrink-0 flex-col border-l border-[#E4E4E7] bg-white"
          style={{ boxShadow: '-2px 0 12px rgba(0,0,0,0.04)' }}
        >
          {/* Sidebar header */}
          <div className="border-b border-[#E4E4E7] px-4 py-3">
            <p className="text-xs font-bold text-[#111]">Pilih tampilan</p>
          </div>

          {/* Agent card */}
          <div className="mx-3 mt-3 rounded-[8px] border border-[#E4E4E7] bg-[#FAFAFA] p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-white">
                <Zap className="size-3" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-[#111]">Biar Agent yang menentukan</p>
                <p className="mt-0.5 text-[10px] text-[#6B6B6B] leading-relaxed">
                  Agent menentukan desain dari idemu secara otomatis.
                </p>
              </div>
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2">
              <input type="radio" name="design-mode" className="accent-[#7C3AED]" />
              <span className="text-[11px] text-[#6B6B6B]">Gunakan rekomendasi Agent</span>
            </label>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-[#E4E4E7] mx-3 mt-3">
            <button
              type="button"
              onClick={() => setSidebarTab('tema')}
              className={`flex-1 py-2 text-[11px] font-semibold transition-colors rounded-t-[4px] ${
                sidebarTab === 'tema'
                  ? 'border-b-2 border-[#7C3AED] text-[#7C3AED]'
                  : 'text-[#6B6B6B] hover:text-[#111]'
              }`}
            >
              Tema
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('template')}
              className={`flex-1 py-2 text-[11px] font-semibold transition-colors rounded-t-[4px] ${
                sidebarTab === 'template'
                  ? 'border-b-2 border-[#7C3AED] text-[#7C3AED]'
                  : 'text-[#6B6B6B] hover:text-[#111]'
              }`}
            >
              Template {TEMPLATES.length}
            </button>
          </div>

          {/* Scrollable card list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {sidebarTab === 'tema'
              ? THEMES.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    selected={selectedThemeId === theme.id && !selectedTemplateId}
                    onClick={() => {
                      setSelectedThemeId(theme.id)
                      setSelectedTemplateId(null)
                    }}
                  />
                ))
              : TEMPLATES.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    tpl={tpl}
                    selected={selectedTemplateId === tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                  />
                ))}
          </div>

          {/* Sticky footer */}
          <div className="border-t border-[#E4E4E7] px-3 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6B6B6B]">Tampilan:</span>
              <span className="text-[11px] font-bold text-[#111] truncate max-w-[140px]">{displayName}</span>
            </div>
            <button
              type="button"
              className="w-full rounded-[8px] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
            >
              Buat UI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
