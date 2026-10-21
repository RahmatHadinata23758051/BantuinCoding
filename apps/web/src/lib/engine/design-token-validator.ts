import type { ConsistencyIssue } from '@/lib/prompts/consistency-validator'
import { extractCssCustomProperties, isNonVisualDesign } from '@/lib/prompts/design-generator'

export { extractCssCustomProperties }

export interface RgbColor {
  r: number
  g: number
  b: number
}

/** Alpha requires background compositing, so only opaque hex is supported. */
export function parseHexColor(color: string): RgbColor | null {
  const hex = color.trim().replace(/^#/, '')
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null
  const expanded = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex
  return { r: parseInt(expanded.slice(0, 2), 16), g: parseInt(expanded.slice(2, 4), 16), b: parseInt(expanded.slice(4, 6), 16) }
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [red, green, blue] = [r, g, b].map((channel) => {
    const s = channel / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function calculateContrastRatio(color1: string, color2: string): number | null {
  const a = parseHexColor(color1)
  const b = parseHexColor(color2)
  if (!a || !b) return null
  const l1 = getRelativeLuminance(a.r, a.g, a.b)
  const l2 = getRelativeLuminance(b.r, b.g, b.b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/** ponytail: legacy flat YAML palette only; remove when stored legacy documents are retired. */
export function extractYamlColorTokens(markdown: string): Record<string, string> {
  const frontMatter = markdown.trim().match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
  const palette = frontMatter?.match(/^colors:[ \t]*\r?\n((?:[ \t]+[^\n]*(?:\r?\n|$)|\r?\n)*)/m)?.[1]
  return Object.fromEntries([...(palette ?? '').matchAll(/^[ \t]+([\w-]+):[ \t]*["']?(#[\da-z]+)["']?/gim)]
    .map(([, name, value]) => [name.toLowerCase(), value]))
}

/** CSS is authoritative; legacy YAML is read only when no CSS tokens exist. Findings remain advisory on export. */
export function validateDesignTokensAndContrast(markdown: string): ConsistencyIssue[] {
  if (isNonVisualDesign(markdown)) return []
  const tokens = extractCssCustomProperties(markdown)
  if (!tokens.size) {
    const aliases: Record<string, string> = { 'ink-primary': 'ink', 'ink-muted': 'muted', background: 'canvas' }
    for (const [name, value] of Object.entries(extractYamlColorTokens(markdown))) {
      tokens.set(`--color-${aliases[name] ?? name}`, value)
    }
  }
  const issues: ConsistencyIssue[] = []
  for (const name of ['canvas', 'surface', 'ink', 'muted', 'accent', 'on-accent', 'focus']) {
    const value = tokens.get(`--color-${name}`)
    if (value !== undefined && (!value.startsWith('#') || !parseHexColor(value))) {
      issues.push({
        severity: 'LOW',
        category: 'INVALID_DESIGN_SYSTEM',
        description: `Color token --color-${name} uses an unsupported value "${value}"; contrast cannot be verified.`,
        affected_documents: ['DESIGN.md'],
        recommendation: 'Use an opaque #RGB or #RRGGBB value for semantic colors; alpha, computed colors, and aliases need compositing before contrast can be verified.',
      })
    }
  }
  const pairs: Array<[string, string, number]> = [
    ['ink', 'canvas', 4.5], ['ink', 'surface', 4.5],
    ['muted', 'canvas', 4.5], ['muted', 'surface', 4.5],
    ['on-accent', 'accent', 4.5],
    ['focus', 'canvas', 3], ['focus', 'surface', 3],
  ]
  for (const [foreground, background, minimum] of pairs) {
    const a = tokens.get(`--color-${foreground}`)
    const b = tokens.get(`--color-${background}`)
    if (!a || !b) continue
    const ratio = calculateContrastRatio(a, b)
    if (ratio !== null && ratio < minimum) {
      issues.push({
        severity: ratio < 3 ? 'MEDIUM' : 'LOW',
        category: 'CONTRAST_WARNING',
        description: `Contrast for --color-${foreground} against --color-${background} is ${ratio.toFixed(2)}:1; requires at least ${minimum}:1.`,
        affected_documents: ['DESIGN.md'],
        recommendation: `Adjust --color-${foreground} or --color-${background} in the canonical CSS block to meet ${minimum}:1.`,
      })
    }
  }
  return issues
}
