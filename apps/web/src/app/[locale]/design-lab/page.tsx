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

interface ScreenSet {
  /** Artboard 02 label + topbar brand */
  heroLabel: string
  brand: string
  nav: string[]
  stats: { label: string; value: string; delta: string }[]
  chart: { title: string; caption: string; bars: number[] }
  table: { headers: string[]; rows: { cells: string[]; tone?: Tone }[] }
  feed?: { title: string; items: { tag: string; text: string; time: string }[] }
  form: {
    title: string
    subtitle: string
    fields: { label: string; value: string }[]
    segmented?: { options: string[]; active: number }
    submit: string
  }
}

const DEFAULT_SCREEN: ScreenSet = {
  heroLabel: 'Dashboard Screen',
  brand: 'Workspace',
  nav: ['Dashboard', 'Projects', 'Reports'],
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
    desc: 'Revenue chart, campaign table, KPI rail',
    palette: ['#FAFAF9', '#FFFFFF', '#6366F1', '#1A1A1A'],
    screen: {
      heroLabel: 'Marketing Sales Dashboard',
      brand: 'Campaign HQ',
      nav: ['Campaigns', 'Audience', 'Attribution'],
      stats: [
        { label: 'ROAS', value: '4.2x', delta: '+0.6x' },
        { label: 'Spend', value: 'Rp 62.8M', delta: '+9%' },
        { label: 'CTR', value: '2.9%', delta: '+0.3%' },
        { label: 'Leads', value: '1,204', delta: '+14%' },
      ],
      chart: { title: 'Spend vs Return', caption: 'Last 14 days', bars: [50, 65, 42, 88, 74, 60, 95] },
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
    desc: 'Activity feed, contact tree, task queue',
    palette: ['#F7F6F3', '#FFFFFF', '#059669', '#111827'],
    screen: {
      heroLabel: 'Contact Hub Overview',
      brand: 'Contact Hub',
      nav: ['Contacts', 'Tasks', 'Pipeline'],
      stats: [
        { label: 'Contacts', value: '8,412', delta: '+126' },
        { label: 'Tasks Due', value: '14', delta: '-5' },
        { label: 'Response', value: '2h 41m', delta: '-18m' },
        { label: 'Health', value: '91%', delta: '+2%' },
      ],
      chart: { title: 'Interaction Volume', caption: 'Touchpoints / day', bars: [45, 72, 58, 90, 66, 80, 70] },
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
    desc: 'Ticket list, SLA status, agent queue',
    palette: ['#18181B', '#27272A', '#A78BFA', '#FAFAFA'],
    screen: {
      heroLabel: 'Support Ticket Console',
      brand: 'Nuvio Support',
      nav: ['Tickets', 'Agents', 'SLA'],
      stats: [
        { label: 'Open Tickets', value: '132', delta: '-12' },
        { label: 'First Reply', value: '14m', delta: '-3m' },
        { label: 'CSAT', value: '4.7', delta: '+0.2' },
        { label: 'SLA Breach', value: '3', delta: '+1' },
      ],
      chart: { title: 'Ticket Inflow', caption: 'Created / resolved', bars: [70, 55, 85, 48, 92, 60, 74] },
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
    desc: 'Stat grid, table, filter panel',
    palette: ['#F8FAFC', '#FFFFFF', '#0EA5E9', '#0F172A'],
    screen: {
      heroLabel: 'General Overview',
      brand: 'Overview',
      nav: ['Home', 'Reports', 'Settings'],
      stats: [
        { label: 'Visits', value: '48.3K', delta: '+6%' },
        { label: 'Signups', value: '1,092', delta: '+11%' },
        { label: 'Retention', value: '64%', delta: '+1%' },
        { label: 'Errors', value: '0.4%', delta: '-0.2%' },
      ],
      chart: { title: 'Weekly Visits', caption: 'Mon – Sun', bars: [55, 68, 72, 64, 86, 78, 50] },
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
    case 'ok':
      return { fg: '#16A34A', bg: '#16A34A22' }
    case 'warn':
      return { fg: '#D97706', bg: '#D9770622' }
    case 'bad':
      return { fg: '#DC2626', bg: '#DC262622' }
    case 'accent':
      return { fg: t.accent, bg: `${t.accent}22` }
    default:
      return { fg: t.textMuted, bg: `${t.textMuted}22` }
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

// ─── Artboard 02: Dashboard (template-driven) ────────────────────────────────

function DashboardArtboard({ theme, screen }: { theme: ThemeDef; screen: ScreenSet }) {
  const t = theme.tokens
  const peak = Math.max(...screen.chart.bars)

  return (
    <ArtboardShell label={screen.heroLabel} width={520} theme={theme}>
      {/* App topbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: t.canvas, borderBottom: `1px solid ${t.border}` }}
      >
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

      <div className="space-y-4 p-4" style={{ background: t.surface }}>
        {/* Stat rail */}
        <div className="grid grid-cols-4 gap-2">
          {screen.stats.map((s) => (
            <div
              key={s.label}
              className="space-y-1 rounded-[4px] p-3"
              style={{ background: t.canvas, border: `1px solid ${t.border}` }}
            >
              <p className="text-[9px] font-medium" style={{ color: t.textMuted }}>{s.label}</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: t.text }}>{s.value}</p>
              <p className="text-[9px] font-semibold" style={{ color: t.accent }}>{s.delta}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div
          className="space-y-2 rounded-[4px] p-3"
          style={{ background: t.canvas, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold" style={{ color: t.text }}>{screen.chart.title}</span>
            <span className="text-[9px]" style={{ color: t.textMuted }}>{screen.chart.caption}</span>
          </div>
          <div className="flex h-10 items-end gap-1">
            {screen.chart.bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${h}%`, background: t.accent, opacity: h === peak ? 1 : 0.4 }}
              />
            ))}
          </div>
        </div>

        {/* Optional feed block */}
        {screen.feed && (
          <div
            className="rounded-[4px] p-3"
            style={{ background: t.canvas, border: `1px solid ${t.border}` }}
          >
            <p className="mb-2 text-[10px] font-semibold" style={{ color: t.text }}>{screen.feed.title}</p>
            <div className="space-y-1.5">
              {screen.feed.items.map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <span
                    className="rounded-[3px] px-1.5 py-0.5 font-mono text-[8px] font-bold"
                    style={{ background: `${t.accent}22`, color: t.accent }}
                  >
                    {item.tag}
                  </span>
                  <span className="flex-1 truncate text-[10px]" style={{ color: t.text }}>{item.text}</span>
                  <span className="font-mono text-[9px]" style={{ color: t.textMuted }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-[4px]" style={{ border: `1px solid ${t.border}` }}>
          <div
            className="grid grid-cols-4 px-3 py-1.5"
            style={{ background: t.canvas, borderBottom: `1px solid ${t.border}` }}
          >
            {screen.table.headers.map((h) => (
              <span key={h} className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                {h}
              </span>
            ))}
          </div>
          {screen.table.rows.map((row, i) => {
            const c = toneColor(row.tone, t)
            return (
              <div
                key={`${row.cells[0]}-${i}`}
                className="grid grid-cols-4 items-center px-3 py-2"
                style={{
                  background: i % 2 === 0 ? t.surface : t.canvas,
                  borderBottom: i < screen.table.rows.length - 1 ? `1px solid ${t.border}` : undefined,
                }}
              >
                <span className="truncate text-[10px] font-medium" style={{ color: t.text }}>{row.cells[0]}</span>
                <span
                  className="w-fit rounded-[3px] px-1.5 py-0.5 text-[8px] font-semibold"
                  style={{ background: c.bg, color: c.fg }}
                >
                  {row.cells[1]}
                </span>
                <span className="text-[10px] tabular-nums" style={{ color: t.textMuted }}>{row.cells[2]}</span>
                <span className="text-[10px] font-semibold" style={{ color: t.accent }}>{row.cells[3]}</span>
              </div>
            )
          })}
        </div>
      </div>
    </ArtboardShell>
  )
}

// ─── Artboard 03: Form (template-driven) ─────────────────────────────────────

function FormArtboard({ theme, screen }: { theme: ThemeDef; screen: ScreenSet }) {
  const t = theme.tokens
  const f = screen.form

  return (
    <ArtboardShell label={f.title} width={320} theme={theme}>
      <div className="space-y-3 p-4" style={{ background: t.surface }}>
        <div>
          <p className="mb-1 text-xs font-semibold" style={{ color: t.text }}>{f.title}</p>
          <p className="text-[10px]" style={{ color: t.textMuted }}>{f.subtitle}</p>
        </div>

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

function TemplateCard({ tpl, selected, onClick }: { tpl: TemplateDef; selected: boolean; onClick: () => void }) {
  const s = tpl.screen
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
      {/* Miniature of the real screen structure: stat row + chart + table */}
      <div className="relative h-16 overflow-hidden p-1.5" style={{ background: tpl.palette[0] }}>
        <div className="flex gap-1">
          {s.stats.slice(0, 4).map((st, i) => (
            <div key={i} className="h-3 flex-1 rounded-[2px]" style={{ background: i === 0 ? tpl.palette[2] : `${tpl.palette[3]}33` }} />
          ))}
        </div>
        <div className="mt-1 flex h-5 items-end gap-0.5">
          {s.chart.bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-[1px]"
              style={{ height: `${h}%`, background: tpl.palette[2], opacity: h === Math.max(...s.chart.bars) ? 1 : 0.45 }}
            />
          ))}
        </div>
        <div className="mt-1 space-y-0.5">
          {s.table.rows.slice(0, 3).map((_, i) => (
            <div key={i} className="flex gap-1">
              <div className="h-1.5 w-1/2 rounded-full" style={{ background: `${tpl.palette[3]}44` }} />
              <div className="h-1.5 w-1/4 rounded-full" style={{ background: `${tpl.palette[3]}22` }} />
            </div>
          ))}
        </div>
      </div>

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