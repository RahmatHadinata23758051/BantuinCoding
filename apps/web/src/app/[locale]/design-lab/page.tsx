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

// ─── Theme definitions (drives COLOR only) ───────────────────────────────────

type ThemeId = 'ramp' | 'raycast' | 'railway' | 'miro' | 'figma'

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
  }
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
    },
  },
  {
    id: 'raycast',
    name: 'Raycast',
    desc: 'Dark command-palette aesthetic. High legibility, subtle surfaces, orange focal accent.',
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
    },
  },
  {
    id: 'railway',
    name: 'Railway',
    desc: 'Obsidian dark with violet accents. Dev-tool precision, sharp edges, zero fluff.',
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
    },
  },
]

// ─── Screen data shape: template drives STRUCTURE & CONTENT ──────────────────

type Tone = 'ok' | 'warn' | 'bad' | 'accent' | 'muted'

/**
 * Composition primitives — the DESIGN of a screen, not its data.
 * A template is a `layout` (ordered blocks, each with a rendering variant),
 * which is what actually makes two templates look different rather than
 * merely say different things.
 */
type Block =
  | { k: 'kpi'; variant: 'rail' | 'inline' | 'tiles' | 'stack' }
  | { k: 'chart'; variant: 'bars' | 'line' | 'donut' | 'spark' }
  | { k: 'list'; variant: 'ledger' | 'rows' | 'cards' | 'airy' }
  | { k: 'feed' }
  | { k: 'split'; ratio?: '2:1' | '1:1'; left: Block[]; right: Block[] }

interface ScreenSet {
  /** Artboard 02 label + topbar brand */
  heroLabel: string
  brand: string
  nav: string[]
  /** Screen composition, top to bottom */
  layout: Block[]
  stats: { label: string; value: string; delta: string }[]
  chart: { title: string; caption: string; bars: number[] }
  table: { headers: string[]; rows: { cells: string[]; tone?: Tone }[] }
  feed?: { title: string; items: { tag: string; text: string; time: string }[] }
  form: {
    title: string
    subtitle: string
    /** 'stack' = single column; 'inline' = two-column field grid */
    variant?: 'stack' | 'inline'
    fields: { label: string; value: string }[]
    segmented?: { options: string[]; active: number }
    submit: string
  }
}

const DEFAULT_SCREEN: ScreenSet = {
  heroLabel: 'Dashboard Screen',
  brand: 'Workspace',
  nav: ['Dashboard', 'Projects', 'Reports'],
  layout: [
    { k: 'kpi', variant: 'rail' },
    { k: 'chart', variant: 'bars' },
    { k: 'list', variant: 'ledger' },
  ],
  stats: [
    { label: 'Revenue', value: 'Rp 84.2M', delta: '+12%' },
    { label: 'Active Users', value: '3,847', delta: '+8%' },
    { label: 'Conversion', value: '4.71%', delta: '+0.4%' },
    { label: 'Tickets Open', value: '28', delta: '-6%' },
  ],
  chart: { title: 'Revenue Trend', caption: 'Last 7 days', bars: [40, 60, 45, 80, 65, 90, 75] },
  table: {
    headers: ['Project', 'Status', 'Progress', 'Owner'],
    rows: [
      { cells: ['Project Alpha', 'Active', '78%', 'RH'], tone: 'accent' },
      { cells: ['Beta Launch', 'Review', '55%', 'DL'], tone: 'warn' },
      { cells: ['Migration v3', 'Blocked', '33%', 'AW'], tone: 'bad' },
      { cells: ['Infra Audit', 'Done', '100%', 'SL'], tone: 'ok' },
    ],
  },
  form: {
    title: 'New Project',
    subtitle: 'Fill in the project details below',
    fields: [
      { label: 'Project Name', value: 'Alpha Initiative' },
      { label: 'Owner', value: 'Rahmat Hadinata' },
      { label: 'Deadline', value: '2026-12-01' },
    ],
    segmented: { options: ['Active', 'Review', 'Done'], active: 0 },
    submit: 'Create Project',
  },
}

// ─── Template definitions (drives LAYOUT & CONTENT) ──────────────────────────

type TemplateId =
  | 'sales-crm'
  | 'marketing-dashboard'
  | 'dashboard-crm'
  | 'nuvio-support'
  | 'clean-modern'

interface TemplateDef {
  id: TemplateId
  name: string
  category: string
  desc: string
  palette: string[]
  screen: ScreenSet
}

const TEMPLATES: TemplateDef[] = [
  {
    id: 'sales-crm',
    name: 'Sales CRM — Compact Ledger',
    category: 'CRM',
    desc: 'Pipeline view, deal cards, contact ledger',
    palette: ['#0F172A', '#1E293B', '#3B82F6', '#F8FAFC'],
    screen: {
      heroLabel: 'Compact Deal Ledger',
      brand: 'Deals Ledger',
      nav: ['Pipeline', 'Contacts', 'Reports'],
      layout: [
        { k: 'kpi', variant: 'rail' },
        { k: 'chart', variant: 'bars' },
        { k: 'feed' },
        { k: 'list', variant: 'ledger' },
      ],
      stats: [
        { label: 'Deal Value', value: 'Rp 1.24M', delta: '+18%' },
        { label: 'Win Rate', value: '34%', delta: '+3%' },
        { label: 'Avg Cycle', value: '21d', delta: '-4d' },
        { label: 'Open Deals', value: '46', delta: '+9' },
      ],
      chart: { title: 'Pipeline Velocity', caption: 'Won / week', bars: [35, 55, 48, 70, 62, 88, 96] },
      table: {
        headers: ['Deal', 'Stage', 'Value', 'Owner'],
        rows: [
          { cells: ['Nusantara Cloud', 'Negotiation', 'Rp 420M', 'RH'], tone: 'accent' },
          { cells: ['Garuda Fintech', 'Proposal', 'Rp 310M', 'MI'], tone: 'warn' },
          { cells: ['Sentra Retail', 'Qualified', 'Rp 185M', 'DL'], tone: 'muted' },
          { cells: ['Bumi Logistics', 'Closed Won', 'Rp 330M', 'AW'], tone: 'ok' },
        ],
      },
      feed: {
        title: 'Recent Activity',
        items: [
          { tag: 'CALL', text: 'Discovery call — Nusantara Cloud', time: '2h' },
          { tag: 'EMAIL', text: 'Proposal sent to Garuda Fintech', time: '5h' },
          { tag: 'WON', text: 'Bumi Logistics signed Rp 330M', time: '1d' },
        ],
      },
      form: {
        title: 'New Deal',
        subtitle: 'Log a deal into the active pipeline',
        fields: [
          { label: 'Deal Name', value: 'Sentra Retail Expansion' },
          { label: 'Company', value: 'Sentra Retail Tbk' },
          { label: 'Value (Rp)', value: '185,000,000' },
        ],
        segmented: { options: ['Qualified', 'Proposal', 'Won'], active: 1 },
        submit: 'Save Deal',
      },
    },
  },
  {
    id: 'marketing-dashboard',
    name: 'Marketing Sales Dashboard',
    category: 'Analytics',
    desc: 'Chart-first analytics, line graph, campaign rows',
    palette: ['#FAFAF9', '#FFFFFF', '#6366F1', '#1A1A1A'],
    screen: {
      heroLabel: 'Marketing Sales Dashboard',
      brand: 'Campaign HQ',
      nav: ['Campaigns', 'Audience', 'Attribution'],
      // Chart FIRST, followed by 2 large KPI tiles, then campaigns
      layout: [
        { k: 'chart', variant: 'line' },
        { k: 'kpi', variant: 'tiles' },
        { k: 'list', variant: 'rows' },
      ],
      stats: [
        { label: 'ROAS', value: '4.2x', delta: '+0.6x' },
        { label: 'Spend', value: 'Rp 62.8M', delta: '+9%' },
        { label: 'CTR', value: '2.9%', delta: '+0.3%' },
        { label: 'Leads', value: '1,204', delta: '+14%' },
      ],
      chart: { title: 'Spend vs Return (ROAS)', caption: 'Last 14 days · Smooth curve', bars: [20, 35, 28, 60, 48, 85, 92] },
      table: {
        headers: ['Campaign', 'Channel', 'Status', 'CTR'],
        rows: [
          { cells: ['Ramadan Push', 'Meta Ads', 'Active', '3.4%'], tone: 'ok' },
          { cells: ['Brand Film', 'YouTube', 'Active', '2.1%'], tone: 'ok' },
          { cells: ['Retarget Q4', 'Google', 'Paused', '1.2%'], tone: 'warn' },
          { cells: ['Creator Collab', 'TikTok', 'Draft', '—'], tone: 'muted' },
        ],
      },
      feed: {
        title: 'Attribution Feed',
        items: [
          { tag: 'CONV', text: 'Ramadan Push → 142 signups', time: '1h' },
          { tag: 'SPEND', text: 'Daily budget cap hit — Meta', time: '3h' },
          { tag: 'AUDIT', text: 'Creative #7 underperforming', time: '6h' },
        ],
      },
      form: {
        title: 'New Campaign',
        subtitle: 'Configure channel, budget and flight dates',
        variant: 'inline',
        fields: [
          { label: 'Campaign Name', value: 'Independence Day Blast' },
          { label: 'Channel', value: 'Meta Ads + YouTube' },
          { label: 'Budget (Rp)', value: '25,000,000' },
        ],
        segmented: { options: ['Draft', 'Scheduled', 'Live'], active: 1 },
        submit: 'Launch Campaign',
      },
    },
  },
  {
    id: 'dashboard-crm',
    name: 'Dashboard CRM',
    category: 'CRM',
    desc: 'Split layout: contact tree alongside live feed',
    palette: ['#F7F6F3', '#FFFFFF', '#059669', '#111827'],
    screen: {
      heroLabel: 'Contact Hub Overview',
      brand: 'Contact Hub',
      nav: ['Contacts', 'Tasks', 'Pipeline'],
      // Split layout: 2:1 column with chart/list on left, full feed on right
      layout: [
        { k: 'kpi', variant: 'inline' },
        {
          k: 'split',
          ratio: '2:1',
          left: [
            { k: 'chart', variant: 'bars' },
            { k: 'list', variant: 'cards' },
          ],
          right: [{ k: 'feed' }],
        },
      ],
      stats: [
        { label: 'Contacts', value: '8,412', delta: '+126' },
        { label: 'Tasks Due', value: '14', delta: '-5' },
        { label: 'Response', value: '2h 41m', delta: '-18m' },
        { label: 'Health', value: '91%', delta: '+2%' },
      ],
      chart: { title: 'Touchpoint Volume', caption: 'Interactions / day', bars: [45, 72, 58, 90, 66, 80, 70] },
      table: {
        headers: ['Contact', 'Last Touch', 'Status', 'Owner'],
        rows: [
          { cells: ['Dewi Anggraini', '12m ago', 'Hot', 'RH'], tone: 'accent' },
          { cells: ['Budi Santoso', '3h ago', 'Warm', 'SL'], tone: 'warn' },
          { cells: ['Citra Lestari', '2d ago', 'Cold', 'DL'], tone: 'muted' },
          { cells: ['Eko Prasetyo', '30m ago', 'Replied', 'MI'], tone: 'ok' },
        ],
      },
      feed: {
        title: 'Activity Feed',
        items: [
          { tag: 'NOTE', text: 'Dewi asked for enterprise pricing', time: '12m' },
          { tag: 'TASK', text: 'Follow up with Citra Lestari', time: '2h' },
          { tag: 'MEET', text: 'Demo scheduled — Eko Prasetyo', time: '4h' },
          { tag: 'CALL', text: 'Call wrap with Sentra Retail', time: '5h' },
        ],
      },
      form: {
        title: 'Add Contact',
        subtitle: 'Create a contact record in your workspace',
        fields: [
          { label: 'Full Name', value: 'Rahmat Hadinata' },
          { label: 'Email', value: 'rahmat@nusantara.id' },
          { label: 'Company', value: 'Nusantara Digital' },
        ],
        segmented: { options: ['Lead', 'MQL', 'SQL'], active: 1 },
        submit: 'Add Contact',
      },
    },
  },
  {
    id: 'nuvio-support',
    name: 'Nuvio Support Dashboard',
    category: 'Support',
    desc: 'Donut breakdown, urgent ticket cards, agent stack',
    palette: ['#18181B', '#27272A', '#A78BFA', '#FAFAFA'],
    screen: {
      heroLabel: 'Support Ticket Console',
      brand: 'Nuvio Support',
      nav: ['Tickets', 'Agents', 'SLA'],
      // Donut chart + ticket cards instead of table
      layout: [
        { k: 'kpi', variant: 'stack' },
        { k: 'chart', variant: 'donut' },
        { k: 'list', variant: 'cards' },
        { k: 'feed' },
      ],
      stats: [
        { label: 'Open Tickets', value: '132', delta: '-12' },
        { label: 'First Reply', value: '14m', delta: '-3m' },
        { label: 'CSAT', value: '4.7', delta: '+0.2' },
        { label: 'SLA Breach', value: '3', delta: '+1' },
      ],
      chart: { title: 'Ticket Distribution by Priority', caption: 'Urgent · High · Normal · Low', bars: [45, 30, 15, 10] },
      table: {
        headers: ['Ticket', 'Priority', 'SLA', 'Agent'],
        rows: [
          { cells: ['#8412 Checkout 500', 'Urgent', '12m left', 'MI'], tone: 'bad' },
          { cells: ['#8409 Billing mismatch', 'High', '1h 20m', 'SL'], tone: 'warn' },
          { cells: ['#8401 How to export?', 'Normal', '4h 05m', 'DL'], tone: 'muted' },
          { cells: ['#8397 Feature request', 'Low', 'Met', 'RH'], tone: 'ok' },
        ],
      },
      feed: {
        title: 'Agent Queue',
        items: [
          { tag: 'P1', text: 'Checkout 500 — escalated to backend', time: 'now' },
          { tag: 'P2', text: 'Billing thread awaiting customer', time: '18m' },
          { tag: 'AUTO', text: '12 tickets auto-closed by rule', time: '1h' },
        ],
      },
      form: {
        title: 'New Ticket',
        subtitle: 'Create a ticket manually on behalf of a customer',
        fields: [
          { label: 'Subject', value: 'Payment failed on checkout' },
          { label: 'Requester', value: 'customer@toko.id' },
          { label: 'Priority', value: 'Urgent (P1)' },
        ],
        segmented: { options: ['Open', 'Pending', 'Solved'], active: 0 },
        submit: 'Create Ticket',
      },
    },
  },
  {
    id: 'clean-modern',
    name: 'Clean Modern Dashboard',
    category: 'General',
    desc: 'Minimal airy layout, sparkline trend, inline metrics',
    palette: ['#F8FAFC', '#FFFFFF', '#0EA5E9', '#0F172A'],
    screen: {
      heroLabel: 'General Overview',
      brand: 'Overview',
      nav: ['Home', 'Reports', 'Settings'],
      // Minimal airy: inline KPIs, sparkline, airy table (no feed, no cards)
      layout: [
        { k: 'kpi', variant: 'inline' },
        { k: 'chart', variant: 'spark' },
        { k: 'list', variant: 'airy' },
      ],
      stats: [
        { label: 'Visits', value: '48.3K', delta: '+6%' },
        { label: 'Signups', value: '1,092', delta: '+11%' },
        { label: 'Retention', value: '64%', delta: '+1%' },
        { label: 'Errors', value: '0.4%', delta: '-0.2%' },
      ],
      chart: { title: 'Traffic Sparkline', caption: '7-day momentum', bars: [30, 45, 60, 52, 75, 88, 95] },
      table: {
        headers: ['Item', 'Status', 'Owner', 'Updated'],
        rows: [
          { cells: ['Landing v2', 'Live', 'RH', '2m'], tone: 'ok' },
          { cells: ['Pricing page', 'Review', 'DL', '1h'], tone: 'warn' },
          { cells: ['Docs refresh', 'Draft', 'SL', '1d'], tone: 'muted' },
          { cells: ['Blog: Launch', 'Scheduled', 'MI', '3h'], tone: 'accent' },
        ],
      },
      form: {
        title: 'New Task',
        subtitle: 'Assign a task with a clear owner and due date',
        fields: [
          { label: 'Task', value: 'Ship pricing page copy' },
          { label: 'Assignee', value: 'Dewi Lestari' },
          { label: 'Due', value: '2026-10-24' },
        ],
        segmented: { options: ['To Do', 'Doing', 'Done'], active: 1 },
        submit: 'Create Task',
      },
    },
  },
]

// ─── Shared render helpers ───────────────────────────────────────────────────

function toneColor(tone: Tone | undefined, t: ThemeDef['tokens']) {
  switch (tone) {
    case 'ok':    return { fg: '#16A34A', bg: '#16A34A22' }
    case 'warn':  return { fg: '#D97706', bg: '#D9770622' }
    case 'bad':   return { fg: '#DC2626', bg: '#DC262622' }
    case 'accent': return { fg: t.accent, bg: `${t.accent}22` }
    default:      return { fg: t.textMuted, bg: `${t.textMuted}22` }
  }
}

function ArtboardShell({
  label,
  width,
  theme,
  children,
}: {
  label: string
  width: number
  theme: ThemeDef
  children: React.ReactNode
}) {
  const t = theme.tokens
  return (
    <div
      className="shrink-0 overflow-hidden rounded-[6px] shadow-md"
      style={{ width, border: `1px solid ${t.border}`, background: t.surface }}
    >
      <div
        className="px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
        style={{ background: t.canvas, color: t.textMuted, borderBottom: `1px solid ${t.border}` }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

// ─── Artboard 01: Foundation (theme-driven) ──────────────────────────────────

function FoundationArtboard({ theme }: { theme: ThemeDef }) {
  const t = theme.tokens
  return (
    <ArtboardShell label="Foundation / Theme Tokens" width={360} theme={theme}>
      <div className="space-y-5 p-5" style={{ background: t.surface }}>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Typography
          </p>
          <p className="text-2xl font-bold leading-tight" style={{ color: t.text }}>The quick brown</p>
          <p className="text-base" style={{ color: t.text }}>fox jumps over</p>
          <p className="text-sm font-light" style={{ color: t.textMuted }}>the lazy dog — 0123456789</p>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Color Palette
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[t.canvas, t.surface, t.accent, t.text, t.textMuted, t.border, '#22C55E', '#EF4444'].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="size-8 rounded-[4px] ring-1 ring-black/10" style={{ background: c }} />
                <span className="font-mono text-[8px]" style={{ color: t.textMuted }}>{c.slice(1, 7)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Spacing
          </p>
          <div className="flex items-end gap-2">
            {[4, 8, 12, 16, 24, 32].map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className="rounded-[2px]" style={{ width: s, height: s, background: t.accent, opacity: 0.7 }} />
                <span className="font-mono text-[8px]" style={{ color: t.textMuted }}>{s}px</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Border Radius
          </p>
          <div className="flex items-center gap-3">
            {[0, 4, 8, 16, 9999].map((r) => (
              <div
                key={r}
                className="size-8"
                style={{ borderRadius: r, background: t.canvas, border: `1px solid ${t.border}` }}
              />
            ))}
          </div>
        </div>
      </div>
    </ArtboardShell>
  )
}

// ─── Block renderers — each renders ONE structural block ─────────────────────

/** KPI variants: rail (4-col tight), inline (borderless row), tiles (2 large hero cards), stack (vertical list) */
function KpiBlock({ variant, stats, theme }: { variant: 'rail' | 'inline' | 'tiles' | 'stack'; stats: ScreenSet['stats']; theme: ThemeDef }) {
  const t = theme.tokens
  if (variant === 'rail') {
    return (
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="space-y-1 rounded-[4px] p-3" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
            <p className="text-[9px] font-medium" style={{ color: t.textMuted }}>{s.label}</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: t.text }}>{s.value}</p>
            <p className="text-[9px] font-semibold" style={{ color: t.accent }}>{s.delta}</p>
          </div>
        ))}
      </div>
    )
  }
  if (variant === 'inline') {
    return (
      <div className="flex gap-6 border-b pb-3" style={{ borderColor: t.border }}>
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums" style={{ color: t.text }}>{s.value}</span>
            <span className="text-[9px]" style={{ color: t.textMuted }}>{s.label}</span>
            <span className="text-[9px] font-semibold" style={{ color: t.accent }}>{s.delta}</span>
          </div>
        ))}
      </div>
    )
  }
  if (variant === 'tiles') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {stats.slice(0, 2).map((s) => (
          <div key={s.label} className="rounded-[6px] p-4" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
            <p className="text-[10px] font-medium mb-1" style={{ color: t.textMuted }}>{s.label}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: t.text }}>{s.value}</p>
            <p className="text-[10px] font-semibold mt-1" style={{ color: t.accent }}>{s.delta} vs last period</p>
          </div>
        ))}
      </div>
    )
  }
  // stack: vertical dense list
  return (
    <div className="space-y-1.5">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center justify-between rounded-[4px] px-3 py-2" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
          <span className="text-[10px]" style={{ color: t.textMuted }}>{s.label}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tabular-nums" style={{ color: t.text }}>{s.value}</span>
            <span className="text-[9px] font-semibold w-10 text-right" style={{ color: t.accent }}>{s.delta}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Chart variants: bars (classic bar), line (smooth area), donut (priority ring), spark (minimal sparkline) */
function ChartBlock({ variant, chart, theme }: { variant: 'bars' | 'line' | 'donut' | 'spark'; chart: ScreenSet['chart']; theme: ThemeDef }) {
  const t = theme.tokens
  const peak = Math.max(...chart.bars)

  if (variant === 'bars') {
    return (
      <div className="space-y-2 rounded-[4px] p-3" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold" style={{ color: t.text }}>{chart.title}</span>
          <span className="text-[9px]" style={{ color: t.textMuted }}>{chart.caption}</span>
        </div>
        <div className="flex h-14 items-end gap-1">
          {chart.bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: t.accent, opacity: h === peak ? 1 : 0.35 }} />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'line') {
    const w = 460; const h = 64; const pts = chart.bars
    const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
    const ys = pts.map((v) => h - (v / 100) * (h - 8))
    const d = xs.map((x, i) => (i === 0 ? `M${x},${ys[i]}` : `C${xs[i-1]+30},${ys[i-1]} ${x-30},${ys[i]} ${x},${ys[i]}`)).join(' ')
    const area = `${d} L${w},${h} L0,${h} Z`
    return (
      <div className="rounded-[4px] p-3" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold" style={{ color: t.text }}>{chart.title}</span>
          <span className="text-[9px]" style={{ color: t.textMuted }}>{chart.caption}</span>
        </div>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 64 }}>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.accent} stopOpacity="0.25" />
              <stop offset="100%" stopColor={t.accent} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#lg)" />
          <path d={d} fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Last point dot */}
          <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3" fill={t.accent} />
        </svg>
      </div>
    )
  }

  if (variant === 'donut') {
    // bars[0..3] = Urgent, High, Normal, Low percentages
    const slices = [
      { label: 'Urgent', pct: chart.bars[0] ?? 45, color: '#DC2626' },
      { label: 'High',   pct: chart.bars[1] ?? 30, color: '#D97706' },
      { label: 'Normal', pct: chart.bars[2] ?? 15, color: t.accent },
      { label: 'Low',    pct: chart.bars[3] ?? 10, color: t.textMuted },
    ]
    const total = slices.reduce((a, s) => a + s.pct, 0)
    const cx = 50; const cy = 50; const r = 38; const ri = 24
    let angle = -90
    const paths = slices.map((s) => {
      const sweep = (s.pct / total) * 360
      const rad = (a: number) => (a * Math.PI) / 180
      const x1 = cx + r * Math.cos(rad(angle))
      const y1 = cy + r * Math.sin(rad(angle))
      const x2 = cx + r * Math.cos(rad(angle + sweep))
      const y2 = cy + r * Math.sin(rad(angle + sweep))
      const xi1 = cx + ri * Math.cos(rad(angle))
      const yi1 = cy + ri * Math.sin(rad(angle))
      const xi2 = cx + ri * Math.cos(rad(angle + sweep))
      const yi2 = cy + ri * Math.sin(rad(angle + sweep))
      const large = sweep > 180 ? 1 : 0
      const path = `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${ri},${ri} 0 ${large},0 ${xi1},${yi1} Z`
      angle += sweep
      return { ...s, path }
    })
    return (
      <div className="rounded-[4px] p-3" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold" style={{ color: t.text }}>{chart.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 100" style={{ width: 80, height: 80, flexShrink: 0 }}>
            {paths.map((p) => <path key={p.label} d={p.path} fill={p.color} />)}
          </svg>
          <div className="space-y-1.5">
            {slices.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="size-2 rounded-full" style={{ background: s.color }} />
                <span className="text-[10px]" style={{ color: t.textMuted }}>{s.label}</span>
                <span className="font-mono text-[10px] font-bold ml-auto" style={{ color: t.text }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // spark: thin minimal sparkline with trend arrow
  const w = 460; const h = 32; const pts = chart.bars
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
  const ys = pts.map((v) => h - (v / 100) * (h - 4))
  const d = xs.map((x, i) => (i === 0 ? `M${x},${ys[i]}` : `L${x},${ys[i]}`)).join(' ')
  const trend = pts[pts.length - 1] > pts[0]
  return (
    <div className="flex items-center gap-3 rounded-[4px] px-3 py-2" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px]" style={{ color: t.textMuted }}>{chart.title}</span>
          <span className="text-[9px] font-semibold" style={{ color: trend ? '#16A34A' : '#DC2626' }}>{trend ? '↑' : '↓'} {chart.caption}</span>
        </div>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 32 }}>
          <path d={d} fill="none" stroke={t.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      </div>
    </div>
  )
}

/** List variants: ledger (dense 4-col bordered), rows (comfortable rows with colored status pill), cards (ticket/contact card per row), airy (spacious row with dividers only) */
function ListBlock({ variant, table, theme }: { variant: 'ledger' | 'rows' | 'cards' | 'airy'; table: ScreenSet['table']; theme: ThemeDef }) {
  const t = theme.tokens
  if (variant === 'ledger') {
    return (
      <div className="overflow-hidden rounded-[4px]" style={{ border: `1px solid ${t.border}` }}>
        <div className="grid grid-cols-4 px-3 py-1.5" style={{ background: t.canvas, borderBottom: `1px solid ${t.border}` }}>
          {table.headers.map((h) => (
            <span key={h} className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>{h}</span>
          ))}
        </div>
        {table.rows.map((row, i) => {
          const c = toneColor(row.tone, t)
          return (
            <div key={`${row.cells[0]}-${i}`} className="grid grid-cols-4 items-center px-3 py-2" style={{
              background: i % 2 === 0 ? t.surface : t.canvas,
              borderBottom: i < table.rows.length - 1 ? `1px solid ${t.border}` : undefined,
            }}>
              <span className="truncate text-[10px] font-medium" style={{ color: t.text }}>{row.cells[0]}</span>
              <span className="w-fit rounded-[3px] px-1.5 py-0.5 text-[8px] font-semibold" style={{ background: c.bg, color: c.fg }}>{row.cells[1]}</span>
              <span className="text-[10px] tabular-nums" style={{ color: t.textMuted }}>{row.cells[2]}</span>
              <span className="text-[10px] font-semibold" style={{ color: t.accent }}>{row.cells[3]}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (variant === 'rows') {
    return (
      <div className="space-y-1.5">
        {table.headers.length > 0 && (
          <div className="flex gap-3 px-1 pb-1" style={{ borderBottom: `1px solid ${t.border}` }}>
            {table.headers.map((h, i) => (
              <span key={h} className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted, flex: i === 0 ? 2 : 1 }}>{h}</span>
            ))}
          </div>
        )}
        {table.rows.map((row, i) => {
          const c = toneColor(row.tone, t)
          return (
            <div key={`${row.cells[0]}-${i}`} className="flex items-center gap-3 rounded-[4px] px-3 py-2.5" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
              <span className="text-[11px] font-medium flex-[2]" style={{ color: t.text }}>{row.cells[0]}</span>
              <span className="text-[10px] flex-1" style={{ color: t.textMuted }}>{row.cells[1]}</span>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ background: c.bg, color: c.fg }}>{row.cells[2]}</span>
              <span className="text-[10px] font-bold flex-1 text-right" style={{ color: t.text }}>{row.cells[3]}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className="space-y-2">
        {table.rows.map((row, i) => {
          const c = toneColor(row.tone, t)
          return (
            <div key={`${row.cells[0]}-${i}`} className="flex items-center gap-3 rounded-[6px] p-3" style={{ background: t.canvas, border: `2px solid ${c.bg}`, borderLeft: `3px solid ${c.fg}` }}>
              <div className="flex-1">
                <p className="text-[11px] font-semibold" style={{ color: t.text }}>{row.cells[0]}</p>
                <p className="text-[9px] mt-0.5" style={{ color: t.textMuted }}>{row.cells[1]}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold" style={{ color: c.fg }}>{row.cells[2]}</p>
                <p className="text-[9px]" style={{ color: t.textMuted }}>{row.cells[3]}</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // airy: large divider-only rows
  return (
    <div>
      {table.rows.map((row, i) => {
        const c = toneColor(row.tone, t)
        return (
          <div key={`${row.cells[0]}-${i}`} className="flex items-center gap-4 py-3 px-1" style={{ borderBottom: `1px solid ${t.border}` }}>
            <div className="size-1.5 rounded-full" style={{ background: c.fg }} />
            <span className="text-[12px] font-medium flex-1" style={{ color: t.text }}>{row.cells[0]}</span>
            <span className="text-[10px]" style={{ color: t.textMuted }}>{row.cells[1]}</span>
            <span className="text-[10px]" style={{ color: t.textMuted }}>{row.cells[2]}</span>
            <span className="text-[10px] font-semibold" style={{ color: t.accent }}>{row.cells[3]}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Feed block — always the same structure, rendered when the template includes one */
function FeedBlock({ feed, theme }: { feed: NonNullable<ScreenSet['feed']>; theme: ThemeDef }) {
  const t = theme.tokens
  return (
    <div className="rounded-[4px] p-3" style={{ background: t.canvas, border: `1px solid ${t.border}` }}>
      <p className="mb-2 text-[10px] font-semibold" style={{ color: t.text }}>{feed.title}</p>
      <div className="space-y-1.5">
        {feed.items.map((item) => (
          <div key={item.text} className="flex items-center gap-2">
            <span className="rounded-[3px] px-1.5 py-0.5 font-mono text-[8px] font-bold" style={{ background: `${t.accent}22`, color: t.accent }}>
              {item.tag}
            </span>
            <span className="flex-1 truncate text-[10px]" style={{ color: t.text }}>{item.text}</span>
            <span className="font-mono text-[9px]" style={{ color: t.textMuted }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Artboard 02: Dashboard — layout-driven compositor ───────────────────────

function DashboardArtboard({ theme, screen }: { theme: ThemeDef; screen: ScreenSet }) {
  const t = theme.tokens

  function renderBlock(block: Block, idx: number): React.ReactNode {
    switch (block.k) {
      case 'kpi':
        return <KpiBlock key={idx} variant={block.variant} stats={screen.stats} theme={theme} />
      case 'chart':
        return <ChartBlock key={idx} variant={block.variant} chart={screen.chart} theme={theme} />
      case 'list':
        return <ListBlock key={idx} variant={block.variant} table={screen.table} theme={theme} />
      case 'feed':
        return screen.feed ? <FeedBlock key={idx} feed={screen.feed} theme={theme} /> : null
      case 'split': {
        const ratio = block.ratio ?? '2:1'
        const [lw, rw] = ratio === '1:1' ? ['flex-1', 'flex-1'] : ['flex-[2]', 'flex-1']
        return (
          <div key={idx} className="flex gap-3">
            <div className={`${lw} space-y-3`}>
              {block.left.map((b, i) => renderBlock(b, i))}
            </div>
            <div className={`${rw} space-y-3`}>
              {block.right.map((b, i) => renderBlock(b, i))}
            </div>
          </div>
        )
      }
    }
  }

  return (
    <ArtboardShell label={screen.heroLabel} width={560} theme={theme}>
      {/* App topbar */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: t.canvas, borderBottom: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-[3px]" style={{ background: t.accent }} />
          <span className="text-[11px] font-bold" style={{ color: t.text }}>{screen.brand}</span>
        </div>
        <div className="flex items-center gap-2">
          {screen.nav.map((nav) => (
            <span key={nav} className="text-[10px]" style={{ color: t.textMuted }}>{nav}</span>
          ))}
          <div className="size-5 rounded-full" style={{ background: t.accent, opacity: 0.9 }} />
        </div>
      </div>

      <div className="space-y-3 p-4" style={{ background: t.surface }}>
        {screen.layout.map((block, i) => renderBlock(block, i))}
      </div>
    </ArtboardShell>
  )
}

// ─── Artboard 03: Form (template-driven) ─────────────────────────────────────

function FormArtboard({ theme, screen }: { theme: ThemeDef; screen: ScreenSet }) {
  const t = theme.tokens
  const f = screen.form
  const inline = f.variant === 'inline'

  return (
    <ArtboardShell label={f.title} width={inline ? 380 : 320} theme={theme}>
      <div className="space-y-3 p-4" style={{ background: t.surface }}>
        <div>
          <p className="mb-1 text-xs font-semibold" style={{ color: t.text }}>{f.title}</p>
          <p className="text-[10px]" style={{ color: t.textMuted }}>{f.subtitle}</p>
        </div>

        <div className={inline ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
          {f.fields.map((field) => (
            <div key={field.label} className="space-y-1">
              <label className="text-[10px] font-semibold" style={{ color: t.text }}>{field.label}</label>
              <div
                className="rounded-[4px] px-3 py-2 text-[11px]"
                style={{ background: t.canvas, border: `1px solid ${t.border}`, color: t.text }}
              >
                {field.value}
              </div>
            </div>
          ))}
        </div>

        {f.segmented && (
          <div className="space-y-1">
            <label className="text-[10px] font-semibold" style={{ color: t.text }}>Status</label>
            <div className="grid grid-cols-3 gap-1">
              {f.segmented.options.map((s, i) => (
                <div
                  key={s}
                  className="rounded-[4px] py-1.5 text-center text-[10px] font-medium"
                  style={{
                    background: i === f.segmented!.active ? t.accent : t.canvas,
                    color: i === f.segmented!.active ? t.accentFg : t.textMuted,
                    border: `1px solid ${i === f.segmented!.active ? t.accent : t.border}`,
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className="mt-2 w-full rounded-[4px] py-2 text-[11px] font-semibold"
          style={{ background: t.accent, color: t.accentFg }}
        >
          {f.submit}
        </button>
      </div>
    </ArtboardShell>
  )
}

// ─── Sidebar cards ───────────────────────────────────────────────────────────

function ThemeCard({ theme, selected, onClick }: { theme: ThemeDef; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-[8px] text-left transition-all duration-150"
      style={{
        border: selected ? '2px solid #7C3AED' : '1.5px solid #E4E4E7',
        background: selected ? '#F5F3FF' : '#FFFFFF',
        boxShadow: selected ? '0 0 0 3px #7C3AED22' : undefined,
      }}
    >
      <div className="relative h-16 overflow-hidden" style={{ background: theme.tokens.canvas }}>
        <div
          className="absolute inset-x-0 top-0 flex h-4 items-center gap-1.5 px-2"
          style={{ background: theme.tokens.canvas, borderBottom: `1px solid ${theme.tokens.border}` }}
        >
          <div className="size-1.5 rounded-full" style={{ background: theme.tokens.accent }} />
          <div className="h-1.5 w-8 rounded-full" style={{ background: `${theme.tokens.textMuted}44` }} />
          <div className="h-1.5 w-6 rounded-full" style={{ background: `${theme.tokens.textMuted}22` }} />
        </div>
        <div className="absolute inset-x-2 top-6 bottom-1 grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{ background: i === 0 ? `${theme.tokens.accent}66` : `${theme.tokens.textMuted}22` }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#111]">{theme.name}</span>
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">GRATIS</span>
        </div>
        <p className="text-[10px] leading-relaxed text-[#6B6B6B] line-clamp-2">{theme.desc}</p>
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex gap-1">
            {theme.palette.map((c, i) => (
              <div key={i} className="size-3 rounded-full ring-1 ring-black/10" style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="text-[9px] text-[#6B6B6B]">{theme.stars} · {theme.usageCount}x</span>
          </div>
        </div>
      </div>
    </button>
  )
}

/** Sidebar thumbnail: mirrors the template's real block composition, so the
 *  card you pick looks like the screen you get. */
function TemplateThumb({ tpl }: { tpl: TemplateDef }) {
  const [bg, , accent, ink] = tpl.palette
  const bars = tpl.screen.chart.bars
  const peak = Math.max(...bars)
  const dim = (a: number) => `${ink}${a}`
  const blockCount = tpl.screen.layout.length

  function mini(block: Block, key: number, dense = false): React.ReactNode {
    const h = dense ? 9 : 14
    switch (block.k) {
      case 'kpi':
        if (block.variant === 'tiles')
          return (
            <div key={key} className="grid grid-cols-2 gap-0.5" style={{ height: h + 3 }}>
              {tpl.screen.stats.slice(0, 4).map((_, i) => (
                <div key={i} className="flex items-center gap-0.5 border px-0.5" style={{ borderColor: dim(0x22), background: `${ink}08` }}>
                  <div className="h-1 w-1/3 rounded-full" style={{ background: dim(0x33) }} />
                  <div className="h-1 flex-1 rounded-full" style={{ background: i === 0 ? accent : dim(0x55) }} />
                </div>
              ))}
            </div>
          )
        if (block.variant === 'stack')
          return (
            <div key={key} className="flex flex-col justify-between" style={{ height: h + 2 }}>
              {tpl.screen.stats.slice(0, 3).map((_, i) => (
                <div key={i} className="flex items-center gap-1 border-b pb-px" style={{ borderColor: dim(0x22) }}>
                  <div className="h-1 w-1/3 rounded-full" style={{ background: dim(0x44) }} />
                  <div className="h-1 w-1/4 rounded-full" style={{ background: i === 0 ? accent : dim(0x33) }} />
                  <div className="ml-auto h-1 w-1/6 rounded-full" style={{ background: dim(0x22) }} />
                </div>
              ))}
            </div>
          )
        return (
          <div key={key} className={`flex ${block.variant === 'rail' ? 'divide-x' : 'gap-1'}`} style={{ height: h }}>
            {tpl.screen.stats.slice(0, 4).map((_, i) => (
              <div key={i} className="flex flex-1 items-center gap-0.5 px-0.5" style={{ borderColor: dim(0x22) }}>
                {block.variant === 'inline' && <div className="size-1 rounded-full" style={{ background: i === 0 ? accent : dim(0x33) }} />}
                <div className="h-1 flex-1 rounded-full" style={{ background: i === 0 ? accent : dim(0x44) }} />
              </div>
            ))}
          </div>
        )
      case 'chart':
        if (block.variant === 'donut')
          return (
            <div key={key} className="flex items-center gap-1" style={{ height: h }}>
              <div className="size-3.5 rounded-full" style={{ background: `conic-gradient(${accent} 0 45%, #DC2626 45% 75%, #D97706 75% 90%, ${dim(0x44)} 90%)` }} />
              <div className="flex-1 space-y-0.5">
                <div className="h-1 w-2/3 rounded-full" style={{ background: dim(0x44) }} />
                <div className="h-1 w-1/3 rounded-full" style={{ background: dim(0x22) }} />
              </div>
            </div>
          )
        if (block.variant === 'line')
          return (
            <div key={key} style={{ height: h }}>
              <svg width="100%" height={h} viewBox="0 0 100 14" preserveAspectRatio="none">
                <path
                  d={bars.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (bars.length - 1)) * 100},${14 - (v / 100) * 12}`).join(' ')}
                  fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"
                />
              </svg>
            </div>
          )
        if (block.variant === 'spark')
          return (
            <div key={key} className="flex items-center gap-1" style={{ height: h }}>
              <div className="h-px flex-1" style={{ background: dim(0x33) }} />
              <svg width="60%" height={h} viewBox="0 0 100 14" preserveAspectRatio="none">
                <path
                  d={bars.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (bars.length - 1)) * 100},${14 - (v / 100) * 12}`).join(' ')}
                  fill="none" stroke={accent} strokeWidth="1.5" opacity="0.8"
                />
              </svg>
            </div>
          )
        return (
          <div key={key} className="flex items-end gap-0.5" style={{ height: h }}>
            {bars.map((v, i) => (
              <div key={i} className="flex-1 rounded-[1px]" style={{ height: `${v}%`, background: accent, opacity: v === peak ? 1 : 0.4 }} />
            ))}
          </div>
        )
      case 'list': {
        const rows = tpl.screen.table.rows.slice(0, block.variant === 'airy' ? 2 : 3)
        return (
          <div key={key} className="space-y-0.5">
            {rows.map((_, i) => (
              <div key={i} className="flex items-center gap-1" style={{ height: dense ? 4 : 5 }}>
                {block.variant === 'cards' && <div className="h-full w-0.5 rounded-full" style={{ background: accent }} />}
                {block.variant === 'airy' && <div className="size-1 rounded-full" style={{ background: dim(0x55) }} />}
                <div className="h-full flex-1 rounded-full" style={{ background: block.variant === 'airy' ? dim(0x22) : dim(0x44) }} />
                <div className="h-full w-1/4 rounded-full" style={{ background: dim(0x22) }} />
              </div>
            ))}
          </div>
        )
      }
      case 'feed':
        return (
          <div key={key} className="space-y-0.5">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-1" style={{ height: dense ? 4 : 5 }}>
                <div className="h-full w-1/4 rounded-full" style={{ background: `${accent}66` }} />
                <div className="h-full flex-1 rounded-full" style={{ background: dim(0x33) }} />
              </div>
            ))}
          </div>
        )
      case 'split':
        return (
          <div key={key} className="flex gap-1">
            <div className="flex-[2] space-y-0.5">{block.left.map((b, i) => mini(b, i, true))}</div>
            <div className="flex-1 space-y-0.5">{block.right.map((b, i) => mini(b, i, true))}</div>
          </div>
        )
    }
  }

  return (
    <div className="relative overflow-hidden p-1.5" style={{ background: bg, height: 74 }}>
      {/* brand bar */}
      <div className="mb-1 flex items-center gap-1">
        <div className="size-1.5 rounded-[1px]" style={{ background: accent }} />
        <div className="h-1 w-6 rounded-full" style={{ background: dim(0x55) }} />
        <div className="ml-auto h-1 w-3 rounded-full" style={{ background: dim(0x33) }} />
        <div className="h-1 w-3 rounded-full" style={{ background: dim(0x33) }} />
      </div>
      <div className={`space-y-1 ${blockCount > 3 ? 'scale-y-90 origin-top' : ''}`}>
        {tpl.screen.layout.map((b, i) => mini(b, i))}
      </div>
    </div>
  )
}

function TemplateCard({ tpl, selected, onClick }: { tpl: TemplateDef; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-[8px] text-left transition-all duration-150"
      style={{
        border: selected ? '2px solid #7C3AED' : '1.5px solid #E4E4E7',
        background: selected ? '#F5F3FF' : '#FFFFFF',
      }}
    >
      <TemplateThumb tpl={tpl} />

      <div className="space-y-0.5 px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-[#111]">{tpl.name}</p>
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[8px] font-bold text-violet-700">
            {tpl.category}
          </span>
        </div>
        <p className="text-[9px] text-[#6B6B6B]">{tpl.desc}</p>
      </div>
    </button>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DesignLabPage() {
  const [sidebarTab, setSidebarTab] = useState<'tema' | 'template'>('tema')
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>('ramp')
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | null>(null)
  const [zoom, setZoom] = useState(90)
  const [tool, setTool] = useState<'pointer' | 'hand'>('pointer')

  const activeTheme = THEMES.find((t) => t.id === selectedThemeId) ?? THEMES[0]
  const activeTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) ?? null
  const screen = activeTemplate?.screen ?? DEFAULT_SCREEN

  const displayName = activeTemplate ? activeTemplate.name : `Konsep · ${activeTheme.name}`

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAFAFA]">
      {/* ── Top bar ── */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#E4E4E7] bg-white px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B6B6B] transition-colors hover:text-[#111]"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <span className="text-[#D4D4D8]">/</span>
          <span className="text-[11px] font-semibold text-[#111]">Design Lab</span>
        </div>

        <div className="rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-4 py-1.5 text-[11px] font-medium text-[#6B6B6B]">
          {activeTemplate
            ? `Preview tampilan · ${activeTemplate.name}`
            : 'Preview tampilan · belum dibuat dari idemu'}
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
            className="flex size-8 items-center justify-center rounded-[6px] text-[#6B6B6B] transition-colors hover:bg-[#F4F4F5]"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 10, 40))}
            title="Zoom out"
            className="flex size-8 items-center justify-center rounded-[6px] text-[#6B6B6B] transition-colors hover:bg-[#F4F4F5]"
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(90)}
            title="Fit to screen"
            className="flex size-8 items-center justify-center rounded-[6px] text-[#6B6B6B] transition-colors hover:bg-[#F4F4F5]"
          >
            <Maximize2 className="size-3.5" />
          </button>

          <div className="mt-1 font-mono text-[9px] text-[#9CA3AF]">{zoom}%</div>
        </div>

        {/* ── Canvas ── */}
        <div
          className="flex-1 overflow-auto"
          style={{ background: '#EDEBF7', cursor: tool === 'hand' ? 'grab' : 'default' }}
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
              <span className="font-mono text-[10px] font-semibold text-[#7C3AED]">01 / DESIGN FOUNDATION</span>
              <FoundationArtboard theme={activeTheme} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-semibold text-[#7C3AED]">
                02 / {screen.heroLabel.toUpperCase()}
              </span>
              <DashboardArtboard theme={activeTheme} screen={screen} />
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] font-semibold text-[#7C3AED]">
                03 / {screen.form.title.toUpperCase()}
              </span>
              <FormArtboard theme={activeTheme} screen={screen} />
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div
          className="flex w-72 shrink-0 flex-col border-l border-[#E4E4E7] bg-white"
          style={{ boxShadow: '-2px 0 12px rgba(0,0,0,0.04)' }}
        >
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
                <p className="mt-0.5 text-[10px] leading-relaxed text-[#6B6B6B]">
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
          <div className="mx-3 mt-3 flex gap-0 border-b border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => setSidebarTab('tema')}
              className={`flex-1 rounded-t-[4px] py-2 text-[11px] font-semibold transition-colors ${
                sidebarTab === 'tema' ? 'border-b-2 border-[#7C3AED] text-[#7C3AED]' : 'text-[#6B6B6B] hover:text-[#111]'
              }`}
            >
              Tema
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('template')}
              className={`flex-1 rounded-t-[4px] py-2 text-[11px] font-semibold transition-colors ${
                sidebarTab === 'template'
                  ? 'border-b-2 border-[#7C3AED] text-[#7C3AED]'
                  : 'text-[#6B6B6B] hover:text-[#111]'
              }`}
            >
              Template {TEMPLATES.length}
            </button>
          </div>

          {/* Card list */}
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {sidebarTab === 'tema'
              ? THEMES.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    selected={selectedThemeId === theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                  />
                ))
              : TEMPLATES.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    tpl={tpl}
                    selected={selectedTemplateId === tpl.id}
                    onClick={() =>
                      setSelectedTemplateId((prev) => (prev === tpl.id ? null : tpl.id))
                    }
                  />
                ))}
          </div>

          {/* Sticky footer */}
          <div className="space-y-2 border-t border-[#E4E4E7] px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#6B6B6B]">Tampilan:</span>
              <span className="max-w-[170px] truncate text-right text-[11px] font-bold text-[#111]">
                {displayName}
              </span>
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