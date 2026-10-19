import type { Theme } from './schemas'

/**
 * Map a Theme into CSS custom properties.
 * Pure + serializable-friendly: preview components must never hardcode
 * colors/fonts, they read these vars instead.
 */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const { palette: p, typography: t, spacing: s, radius: r, elevation: e } = theme
  return {
    '--theme-canvas': p.canvas,
    '--theme-surface': p.surface,
    '--theme-surface-subtle': p.surface_subtle,
    '--theme-border': p.border,
    '--theme-ink': p.ink,
    '--theme-ink-muted': p.ink_muted,
    '--theme-accent': p.accent,
    '--theme-accent-fg': p.accent_fg,
    ...(p.signal ? { '--theme-signal': p.signal } : {}),

    '--theme-font-display': t.displayFamily,
    '--theme-font-body': t.bodyFamily,
    '--theme-font-mono': t.monoFamily,

    '--theme-space-xs': s.xs,
    '--theme-space-sm': s.sm,
    '--theme-space-md': s.md,
    '--theme-space-lg': s.lg,
    '--theme-space-xl': s.xl,

    '--theme-radius-sm': r.sm,
    '--theme-radius-md': r.md,
    '--theme-radius-lg': r.lg,

    '--theme-elevation-base': e.base,
    '--theme-elevation-raised': e.raised,
  }
}
