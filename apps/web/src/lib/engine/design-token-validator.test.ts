import { describe, it, expect } from 'vitest'
import {
  parseHexColor,
  getRelativeLuminance,
  calculateContrastRatio,
  extractYamlColorTokens,
  extractCssCustomProperties,
  validateDesignTokensAndContrast,
} from './design-token-validator'

const accessibleDesign = `# DESIGN.md
\`\`\`css
:root {
  --color-canvas: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-ink: #111827;
  --color-muted: #4B5563;
  --color-accent: #334155;
  --color-on-accent: #FFFFFF;
  --color-focus: #2563EB;
}
\`\`\``

describe('Design Token Validator — WCAG Math & Parsing', () => {
  it('parses opaque short and long hex colors', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHexColor('#000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(parseHexColor('111827')).toEqual({ r: 17, g: 24, b: 39 })
    expect(parseHexColor('#F5F5F5')).toEqual({ r: 245, g: 245, b: 245 })
  })

  it.each(['#zzz', '#12', '#12345', '#0008', '#00000080', 'rgb(0,0,0)', 'var(--color)', ''])('rejects unsupported color %s', (color) => {
    expect(parseHexColor(color)).toBeNull()
  })

  it('computes WCAG luminance and contrast without rounding the decision', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBe(0)
    expect(getRelativeLuminance(255, 255, 255)).toBe(1)
    expect(calculateContrastRatio('#FFFFFF', '#000000')).toBe(21)
    expect(calculateContrastRatio('#000000', '#FFFFFF')).toBe(21)
    expect(calculateContrastRatio('#FFFFFF', '#FFFFFF')).toBe(1)
    expect(calculateContrastRatio('#111827', '#FFFFFF')).toBeGreaterThan(15)
    expect(calculateContrastRatio('#INVALID', '#FFFFFF')).toBeNull()
    // This pair rounds to 4.50, but is below the required ratio.
    expect(calculateContrastRatio('#777777', '#FEFEFE')).toBeLessThan(4.5)
    const issues = validateDesignTokensAndContrast(accessibleDesign
      .replace('--color-canvas: #FFFFFF', '--color-canvas: #FEFEFE')
      .replace('--color-ink: #111827', '--color-ink: #777777'))
    expect(issues.some((issue) => issue.description.includes('--color-ink against --color-canvas'))).toBe(true)
  })
})

describe('Design Token Validator — Extraction', () => {
  it('extracts legacy flat YAML colors only from front matter', () => {
    const yaml = `---
colors:
  canvas: "#FFFFFF"
  surface: '#F9FAFB' # light grey
  ink-primary: "#111827"
typography:
  body: Inter
---
# DESIGN.md`
    expect(extractYamlColorTokens(yaml)).toEqual({ canvas: '#FFFFFF', surface: '#F9FAFB', 'ink-primary': '#111827' })
    expect(extractYamlColorTokens('# DESIGN.md\ncolors:\n  canvas: "#fff"\n')).toEqual({})
  })

  it('extracts only literal top-level CSS roots, ignoring comments, prose, and theme overrides', () => {
    const markdown = `:root { --prose: ignored; }
\`\`\`text
:root { --text-fence: ignored; }
\`\`\`
\`\`\`css
/* :root { --comment: ignored; } */
:root {
  --color-canvas: #fff; /* source */
  --font-body: system-ui, sans-serif;
}
[data-theme="dark"] { --color-canvas: #000; }
@media (prefers-color-scheme: dark) {
  :root { --nested: ignored; }
}
\`\`\``
    expect(Object.fromEntries(extractCssCustomProperties(markdown))).toEqual({
      '--color-canvas': '#fff', '--font-body': 'system-ui, sans-serif',
    })
  })

  it('supports tilde fences and CRLF', () => {
    expect(extractCssCustomProperties('~~~css\r\n:root { --color-canvas: #fff; }\r\n~~~').get('--color-canvas')).toBe('#fff')
  })
})

describe('Design Token Validator — Validation Logic', () => {
  it('accepts accessible CSS-only semantic colors', () => {
    expect(validateDesignTokensAndContrast(accessibleDesign)).toEqual([])
  })

  it.each([
    ['ink', '#AAAAAA', 'MEDIUM', '4.5'],
    ['muted', '#888888', 'LOW', '4.5'],
    ['on-accent', '#334155', 'MEDIUM', '4.5'],
    ['focus', '#CCCCCC', 'MEDIUM', '3'],
  ])('checks --color-%s with the correct threshold', (name, value, severity, minimum) => {
    const markdown = accessibleDesign.replace(new RegExp(`--color-${name}: #[\\da-f]+`, 'i'), `--color-${name}: ${value}`)
    const issue = validateDesignTokensAndContrast(markdown).find((item) => item.description.includes(`--color-${name} against`))
    expect(issue?.category).toBe('CONTRAST_WARNING')
    expect(issue?.severity).toBe(severity)
    expect(issue?.description).toContain(`requires at least ${minimum}:1`)
  })

  it.each(['#ZZZZZZ', '#12', '#11182780', '#0008', 'rgb(0,0,0)', 'var(--ink)', '111827'])('reports unverifiable semantic color %s instead of passing silently', (value) => {
    const issues = validateDesignTokensAndContrast(accessibleDesign.replace('--color-ink: #111827', `--color-ink: ${value}`))
    expect(issues.some((issue) => issue.category === 'INVALID_DESIGN_SYSTEM' && issue.description.includes('contrast cannot be verified'))).toBe(true)
  })

  it('uses CSS rather than stale YAML and emits no parity warnings', () => {
    const markdown = `---\ncolors:\n  canvas: "#000000"\n  ink-primary: "#000000"\n  accent: "#ZZZZZZ"\n---\n${accessibleDesign}`
    expect(validateDesignTokensAndContrast(markdown)).toEqual([])
    expect(validateDesignTokensAndContrast(`${markdown}\n`)).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'DESIGN_TOKEN_MISMATCH' }),
    ]))
  })

  it('still checks legacy YAML contrast when no CSS exists', () => {
    const issues = validateDesignTokensAndContrast('---\ncolors:\n  canvas: "#fff"\n  ink-primary: "#aaa"\n---\n# DESIGN.md')
    expect(issues.some((issue) => issue.category === 'CONTRAST_WARNING')).toBe(true)
  })

  it('does not mix missing CSS values with legacy YAML roles', () => {
    const markdown = '---\ncolors:\n  canvas: "#fff"\n---\n```css\n:root { --color-ink: #aaa; }\n```'
    expect(validateDesignTokensAndContrast(markdown)).toEqual([])
  })

  it('skips UI colors for nonvisual documents but not markers inside code examples', () => {
    expect(validateDesignTokensAndContrast('# DESIGN.md\nUI scope: none')).toEqual([])
    const markdown = `${accessibleDesign.replace('--color-ink: #111827', '--color-ink: #AAAAAA')}\n\n\`\`\`text\nUI scope: none\n\`\`\``
    expect(validateDesignTokensAndContrast(markdown).some((issue) => issue.category === 'CONTRAST_WARNING')).toBe(true)
  })
})
