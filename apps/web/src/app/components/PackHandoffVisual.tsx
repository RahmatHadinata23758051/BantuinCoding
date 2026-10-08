import type { CSSProperties, ReactNode } from 'react'

export interface PackHandoffVisualLabels {
  ariaLabel?: string
  packageLabel?: string
  packageMeta?: string
  documentLabel?: string
  documentMeta?: string
  handoffLabel?: string
  handoffMeta?: string
  connectorLabel?: string
}

export interface PackHandoffVisualProps {
  labels?: PackHandoffVisualLabels
  className?: string
}

const defaultLabels: Required<PackHandoffVisualLabels> = {
  ariaLabel: 'Project pack handoff from generated package to coding agent documents',
  packageLabel: 'SPEC PACK',
  packageMeta: 'PRD · DESIGN · BACKLOG',
  documentLabel: 'DOCUMENTS',
  documentMeta: 'READABLE · READY',
  handoffLabel: 'CODING AGENT',
  handoffMeta: 'NEXT STEP',
  connectorLabel: 'moves into',
}

function Stage({
  accent,
  children,
  label,
  meta,
}: {
  accent: string
  children: ReactNode
  label: string
  meta: string
}) {
  return (
    <div className="pack-handoff__stage">
      <div className="pack-handoff__sheet" style={{ '--pack-accent': accent } as CSSProperties}>
        <div className="pack-handoff__sheet-mark" aria-hidden="true">
          {children}
        </div>
        <div>
          <strong>{label}</strong>
          <span>{meta}</span>
        </div>
      </div>
    </div>
  )
}

export function PackHandoffVisual({ labels, className }: PackHandoffVisualProps) {
  const copy = { ...defaultLabels, ...labels }

  return (
    <figure className={`pack-handoff${className ? ` ${className}` : ''}`} aria-label={copy.ariaLabel}>
      <div className="pack-handoff__track">
        <Stage accent="var(--cobalt)" label={copy.packageLabel} meta={copy.packageMeta}>
          <span />
          <span />
          <span />
        </Stage>
        <div className="pack-handoff__connector" aria-hidden="true">
          <span className="pack-handoff__connector-line" />
          <span className="pack-handoff__connector-arrow">→</span>
          <span className="pack-handoff__connector-copy">{copy.connectorLabel}</span>
        </div>
        <Stage accent="var(--electric-yellow)" label={copy.documentLabel} meta={copy.documentMeta}>
          <span />
          <span />
          <span />
        </Stage>
        <div className="pack-handoff__connector" aria-hidden="true">
          <span className="pack-handoff__connector-line" />
          <span className="pack-handoff__connector-arrow">→</span>
          <span className="pack-handoff__connector-copy">{copy.connectorLabel}</span>
        </div>
        <Stage accent="var(--mint)" label={copy.handoffLabel} meta={copy.handoffMeta}>
          <span />
          <span />
          <span />
        </Stage>
      </div>
      <style>{`
        .pack-handoff { width: 100%; color: var(--ink, #151515); }
        .pack-handoff__track { display: flex; align-items: center; justify-content: center; gap: clamp(.4rem, 2vw, 1.25rem); }
        .pack-handoff__stage { flex: 1 1 0; min-width: 0; max-width: 13rem; }
        .pack-handoff__sheet { display: flex; align-items: center; gap: .75rem; min-height: 5.5rem; padding: .9rem; border: 1px solid rgba(0,0,0,.08); border-radius: 12px; background: var(--paper-raised, #fff); transform: rotate(-1.2deg); }
        .pack-handoff__stage:nth-of-type(3) .pack-handoff__sheet { transform: rotate(1.2deg); }
        .pack-handoff__sheet-mark { display: grid; flex: 0 0 2.8rem; gap: 4px; padding: .55rem .45rem; border: 1px solid rgba(0,0,0,.08); border-radius: 8px; background: var(--pack-accent); }
        .pack-handoff__sheet-mark span { display: block; height: 3px; background: var(--ink, #111); }
        .pack-handoff__sheet-mark span:nth-child(2) { width: 75%; }
        .pack-handoff__sheet-mark span:nth-child(3) { width: 50%; }
        .pack-handoff__sheet strong, .pack-handoff__sheet span { display: block; }
        .pack-handoff__sheet strong { font: 700 .72rem/1.1 var(--font-geist-mono, ui-monospace), monospace; letter-spacing: .04em; }
        .pack-handoff__sheet div + div span { margin-top: .35rem; color: var(--paper-muted, #615d59); font: 600 .63rem/1.2 var(--font-geist-mono, ui-monospace), monospace; }
        .pack-handoff__connector { position: relative; display: flex; flex: 0 0 clamp(2.2rem, 7vw, 4.5rem); align-items: center; justify-content: center; color: var(--paper-muted, #615d59); }
        .pack-handoff__connector-line { width: 100%; border-top: 1px solid rgba(0,0,0,.18); }
        .pack-handoff__connector-arrow { position: absolute; right: -2px; padding-left: .2rem; background: var(--paper, #f6f5f4); font: 700 1.15rem/1 var(--font-geist-mono, ui-monospace), monospace; }
        .pack-handoff__connector-copy { position: absolute; top: calc(50% + .7rem); white-space: nowrap; font: 600 .58rem/1 var(--font-geist-mono, ui-monospace), monospace; text-transform: uppercase; }
        @media (max-width: 640px) {
          .pack-handoff__track { flex-direction: column; align-items: stretch; gap: .7rem; }
          .pack-handoff__stage { max-width: none; }
          .pack-handoff__sheet { min-height: 4.6rem; }
          .pack-handoff__connector { flex-basis: 1.5rem; min-height: 1.5rem; }
          .pack-handoff__connector-line { width: 0; height: 100%; border-top: 0; border-left: 2px solid var(--ink, #151515); }
          .pack-handoff__connector-arrow { right: auto; bottom: -3px; padding: .1rem 0 0; transform: rotate(90deg); }
          .pack-handoff__connector-copy { top: 50%; left: calc(50% + 1.1rem); transform: translateY(-50%); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .pack-handoff__stage:first-child .pack-handoff__sheet { animation: pack-handoff-settle 4s ease-in-out infinite; }
          @keyframes pack-handoff-settle { 0%, 100% { transform: rotate(-1.2deg) translateY(0); } 50% { transform: rotate(-1.2deg) translateY(-3px); } }
        }
      `}</style>
    </figure>
  )
}
