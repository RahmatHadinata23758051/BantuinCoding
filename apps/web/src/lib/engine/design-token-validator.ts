import type { ConsistencyIssue } from '@/lib/prompts/consistency-validator'
import { extractYamlFrontMatter } from '@/lib/prompts/design-generator'

// ============================================================
// Deterministic Design Token & WCAG Contrast Validator (BK-036)
// Zero external dependencies (stdlib-only).
// ============================================================

export interface RgbColor {
  r: number
  g: number
  b: number
}

/**
 * Parses 3 or 6 character hex colors. Alpha channels are intentionally
 * unsupported because contrast depends on the composited background.
 */
export function parseHexColor(color: string): RgbColor | null {
  if (typeof color !== 'string') return null
  const cleaned = color.trim().replace(/^#/, '')

  // 3-digit hex: #RGB -> #RRGGBB
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = parseInt(cleaned[0]! + cleaned[0]!, 16)
    const g = parseInt(cleaned[1]! + cleaned[1]!, 16)
    const b = parseInt(cleaned[2]! + cleaned[2]!, 16)
    return { r, g, b }
  }

  // 4-digit hex with alpha: #RGBA -> ignore alpha for baseline RGB
  if (/^[0-9a-fA-F]{4}$/.test(cleaned)) {
    const r = parseInt(cleaned[0]! + cleaned[0]!, 16)
    const g = parseInt(cleaned[1]! + cleaned[1]!, 16)
    const b = parseInt(cleaned[2]! + cleaned[2]!, 16)
    return { r, g, b }
  }

  // 6-digit hex: #RRGGBB
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16)
    const g = parseInt(cleaned.slice(2, 4), 16)
    const b = parseInt(cleaned.slice(4, 6), 16)
    return { r, g, b }
  }

  // 8-digit hex with alpha: #RRGGBBAA -> ignore alpha for baseline RGB
  if (/^[0-9a-fA-F]{8}$/.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16)
    const g = parseInt(cleaned.slice(2, 4), 16)
    const b = parseInt(cleaned.slice(4, 6), 16)
    return { r, g, b }
  }

  return null
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB channel.
 */
function channelLuminance(channel: number): number {
  const s = channel / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/**
 * Calculates WCAG 2.1 relative luminance for an RGB color.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  )
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 * Returns a value between 1 and 21, or null if either color is unparseable.
 */
export function calculateContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = parseHexColor(color1)
  const rgb2 = parseHexColor(color2)
  if (!rgb1 || !rgb2) return null

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  const ratio = (lighter + 0.05) / (darker + 0.05)
  return Math.round(ratio * 100) / 100
}

/**
 * Extracts key-value color mappings from YAML front matter `colors:` block.
 */
export function extractYamlColorTokens(markdown: string): Record<string, string> {
  const frontMatter = extractYamlFrontMatter(markdown.trim())
  if (!frontMatter) return {}

  const colors: Record<string, string> = {}
  const lines = frontMatter.split(/\r?\n/)
  let inColors = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    // Detect `colors:` section
    if (/^colors\s*:/i.test(trimmed)) {
      inColors = true
      continue
    }

    // Exit when hitting another top-level key
    if (inColors && /^[a-zA-Z0-9_-]+\s*:/i.test(line) && !/^\s+/.test(line)) {
      break
    }

    if (inColors) {
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex === -1) continue
      const key = trimmed.slice(0, colonIndex).trim().toLowerCase().replace(/^["']|["']$/g, '')
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) continue

      let val = trimmed.slice(colonIndex + 1).trim()
      if (val.startsWith('"')) {
        const endQuote = val.indexOf('"', 1)
        val = endQuote !== -1 ? val.slice(1, endQuote) : val.slice(1)
      } else if (val.startsWith("'")) {
        const endQuote = val.indexOf("'", 1)
        val = endQuote !== -1 ? val.slice(1, endQuote) : val.slice(1)
      } else {
        val = val.replace(/\s+#.*$/, '').trim()
      }

      colors[key] = val.trim()
    }
  }

  return colors
}

/**
 * Extracts custom properties defined in `:root { ... }` inside CSS code blocks.
 */
export function extractCssCustomProperties(markdown: string): Map<string, string> {
  const properties = new Map<string, string>()
  const cssBlocks = [...markdown.matchAll(/```css\s*([\s\S]*?)```/gi)]

  for (const block of cssBlocks) {
    const cssContent = block[1] || ''
    const rootBlocks = [...cssContent.matchAll(/:root\s*\{([\s\S]*?)\}/gi)]
    for (const root of rootBlocks) {
      const rules = root[1] || ''
      const cleanedRules = rules.replace(/\/\*[\s\S]*?\*\//g, '')
      const declarations = cleanedRules.split(';')
      for (const decl of declarations) {
        const colonIndex = decl.indexOf(':')
        if (colonIndex === -1) continue
        const prop = decl.slice(0, colonIndex).trim()
        const value = decl.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '').trim()
        if (prop.startsWith('--')) {
          properties.set(prop.toLowerCase(), value)
        }
      }
    }
  }

  return properties
}

function findMatchingCssProperty(
  yamlKey: string,
  cssProps: Map<string, string>,
): { property: string; value: string } | null {
  const normalizedKey = yamlKey.toLowerCase().replace(/[-_]/g, '')

  const candidateNames = [
    `--color-${yamlKey.toLowerCase()}`,
    `--${yamlKey.toLowerCase()}`,
  ]

  // Role aliases
  if (yamlKey === 'canvas') {
    candidateNames.push('--color-canvas', '--canvas', '--color-bg', '--bg', '--background', '--color-background')
  } else if (yamlKey === 'surface') {
    candidateNames.push('--color-surface', '--surface', '--surface-color', '--card', '--color-card')
  } else if (yamlKey === 'border') {
    candidateNames.push('--color-border', '--border', '--border-color')
  } else if (yamlKey === 'accent') {
    candidateNames.push('--color-accent', '--accent', '--accent-color')
  } else if (yamlKey === 'ink-primary' || yamlKey === 'ink' || yamlKey === 'ink_primary') {
    candidateNames.push('--color-ink', '--ink', '--color-ink-primary', '--ink-primary', '--color-text', '--text', '--foreground')
  } else if (yamlKey === 'ink-muted' || yamlKey === 'muted' || yamlKey === 'ink_muted') {
    candidateNames.push('--color-muted', '--muted', '--color-ink-muted', '--ink-muted', '--color-text-muted')
  }

  for (const name of candidateNames) {
    if (cssProps.has(name)) {
      return { property: name, value: cssProps.get(name)! }
    }
  }

  // Substring match on normalized name
  for (const [prop, val] of cssProps.entries()) {
    const normalizedProp = prop.replace(/^--color-|^--/, '').replace(/[-_]/g, '')
    if (normalizedProp === normalizedKey) {
      return { property: prop, value: val }
    }
  }

  return null
}

/**
 * Validates DESIGN.md colors against WCAG 2.1 contrast rules and verifies
 * token parity between YAML front matter and CSS :root custom properties.
 * All reported issues are non-blocking advisory warnings (severity: LOW or MEDIUM).
 */
export function validateDesignTokensAndContrast(markdown: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = []
  const yamlColors = extractYamlColorTokens(markdown)
  const colorKeys = Object.keys(yamlColors)

  if (colorKeys.length === 0) return issues

  // 1. Check for unparseable hex values in YAML
  for (const [key, val] of Object.entries(yamlColors)) {
    if (val.startsWith('#') && !parseHexColor(val)) {
      issues.push({
        severity: 'LOW',
        category: 'INVALID_DESIGN_SYSTEM',
        description: `Color token "${key}" has an unparseable hex value "${val}".`,
        affected_documents: ['DESIGN.md'],
        recommendation: `Specify colors using a valid hex format like #FFFFFF or #111827.`,
      })
    }
  }

  // 2. Identify color roles for contrast validation
  const canvasVal =
    yamlColors['canvas'] ||
    yamlColors['background'] ||
    yamlColors['bg'] ||
    null

  const surfaceVal =
    yamlColors['surface'] ||
    yamlColors['card'] ||
    null

  const inkPrimaryVal =
    yamlColors['ink-primary'] ||
    yamlColors['ink_primary'] ||
    yamlColors['inkprimary'] ||
    yamlColors['ink'] ||
    yamlColors['text'] ||
    yamlColors['foreground'] ||
    null

  const inkMutedVal =
    yamlColors['ink-muted'] ||
    yamlColors['ink_muted'] ||
    yamlColors['inkmuted'] ||
    yamlColors['muted'] ||
    yamlColors['text-muted'] ||
    null

  const backgroundColors: Array<{ name: string; value: string }> = []
  if (canvasVal && parseHexColor(canvasVal)) backgroundColors.push({ name: 'canvas', value: canvasVal })
  if (surfaceVal && parseHexColor(surfaceVal)) backgroundColors.push({ name: 'surface', value: surfaceVal })

  // Evaluate normal text contrast (target >= 4.5:1)
  if (inkPrimaryVal && parseHexColor(inkPrimaryVal)) {
    for (const bg of backgroundColors) {
      const ratio = calculateContrastRatio(inkPrimaryVal, bg.value)
      if (ratio !== null && ratio < 4.5) {
        issues.push({
          severity: ratio < 3.0 ? 'MEDIUM' : 'LOW',
          category: 'CONTRAST_WARNING',
          description: `Normal text contrast between primary text (${inkPrimaryVal}) and ${bg.name} (${bg.value}) is ${ratio}:1 (WCAG AA requires at least 4.5:1).`,
          affected_documents: ['DESIGN.md'],
          recommendation: `Adjust primary text or ${bg.name} color in DESIGN.md to achieve at least 4.5:1 contrast ratio.`,
        })
      }
    }
  }

  // Evaluate muted text contrast (target >= 3:1 for essential UI indicators / secondary text)
  if (inkMutedVal && parseHexColor(inkMutedVal)) {
    for (const bg of backgroundColors) {
      const ratio = calculateContrastRatio(inkMutedVal, bg.value)
      if (ratio !== null && ratio < 3.0) {
        issues.push({
          severity: 'LOW',
          category: 'CONTRAST_WARNING',
          description: `Secondary text contrast between muted text (${inkMutedVal}) and ${bg.name} (${bg.value}) is ${ratio}:1 (target at least 3:1 for accessible UI indicators).`,
          affected_documents: ['DESIGN.md'],
          recommendation: `Adjust muted text color in DESIGN.md to maintain at least 3:1 contrast against ${bg.name}.`,
        })
      }
    }
  }

  // 3. Verify parity with CSS :root custom properties
  const cssProps = extractCssCustomProperties(markdown)
  if (cssProps.size > 0) {
    const keyTokensToCheck = ['canvas', 'surface', 'border', 'accent']
    if (yamlColors['ink-primary'] || yamlColors['ink']) keyTokensToCheck.push(yamlColors['ink-primary'] ? 'ink-primary' : 'ink')
    if (yamlColors['ink-muted'] || yamlColors['muted']) keyTokensToCheck.push(yamlColors['ink-muted'] ? 'ink-muted' : 'muted')

    for (const key of keyTokensToCheck) {
      const yamlVal = yamlColors[key]
      if (!yamlVal) continue

      const match = findMatchingCssProperty(key, cssProps)
      if (!match) {
        issues.push({
          severity: 'LOW',
          category: 'DESIGN_TOKEN_MISMATCH',
          description: `YAML color token "${key}" has no corresponding custom property in the :root CSS block.`,
          affected_documents: ['DESIGN.md'],
          recommendation: `Add --color-${key} or --${key} to the :root CSS block matching the YAML front matter token.`,
        })
      } else {
        // Value parity check if both are hex
        const yamlRgb = parseHexColor(yamlVal)
        const cssRgb = parseHexColor(match.value)
        if (yamlRgb && cssRgb) {
          const isSame =
            yamlRgb.r === cssRgb.r &&
            yamlRgb.g === cssRgb.g &&
            yamlRgb.b === cssRgb.b
          if (!isSame) {
            issues.push({
              severity: 'LOW',
              category: 'DESIGN_TOKEN_MISMATCH',
              description: `Color value mismatch for "${key}": YAML specifies "${yamlVal}" but CSS property ${match.property} is "${match.value}".`,
              affected_documents: ['DESIGN.md'],
              recommendation: `Align color values between YAML front matter ("${yamlVal}") and CSS custom property (${match.property}: "${match.value}").`,
            })
          }
        }
      }
    }
  }

  return issues
}
