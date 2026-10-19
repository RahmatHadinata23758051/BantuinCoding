import { describe, it, expect } from 'vitest'
import {
  parseHexColor,
  getRelativeLuminance,
  calculateContrastRatio,
  extractYamlColorTokens,
  extractCssCustomProperties,
  validateDesignTokensAndContrast,
} from './design-token-validator'

describe('Design Token Validator — WCAG Math & Parsing', () => {
  it('parses valid 3-digit and 6-digit hex colors with and without hash', () => {
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseHexColor('#000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(parseHexColor('111827')).toEqual({ r: 17, g: 24, b: 39 })
    expect(parseHexColor('#F5F5F5')).toEqual({ r: 245, g: 245, b: 245 })
  })

  it('safely rejects malformed or non-hex color strings without throwing', () => {
    expect(parseHexColor('#zzz')).toBeNull()
    expect(parseHexColor('#12')).toBeNull()
    expect(parseHexColor('#12345')).toBeNull()
    expect(parseHexColor('rgb(0,0,0)')).toBeNull()
    expect(parseHexColor('var(--color)')).toBeNull()
    expect(parseHexColor('')).toBeNull()
  })

  it('computes exact relative luminance bounds for black and white', () => {
    expect(getRelativeLuminance(0, 0, 0)).toBe(0)
    expect(getRelativeLuminance(255, 255, 255)).toBe(1)
  })

  it('calculates contrast ratios matching standard WCAG 2.1 specifications', () => {
    // Black and white is 21:1
    expect(calculateContrastRatio('#FFFFFF', '#000000')).toBe(21)
    expect(calculateContrastRatio('#000000', '#FFFFFF')).toBe(21)

    // Identical colors are 1:1
    expect(calculateContrastRatio('#FFFFFF', '#FFFFFF')).toBe(1)

    // Typical accessible dark text on white
    const darkOnWhite = calculateContrastRatio('#111827', '#FFFFFF')
    expect(darkOnWhite).toBeGreaterThan(15)

    // Low contrast grey on white
    const lightGreyOnWhite = calculateContrastRatio('#CCCCCC', '#FFFFFF')
    expect(lightGreyOnWhite).toBeLessThan(2)

    // Returns null for invalid color
    expect(calculateContrastRatio('#INVALID', '#FFFFFF')).toBeNull()
  })
})

describe('Design Token Validator — Extraction', () => {
  const sampleMarkdown = `---
name: "Acme Design System"
archetype: "Modern Clean"
colors:
  canvas: "#FFFFFF"
  surface: "#F9FAFB" # light grey
  border: "#E5E7EB"
  ink-primary: '#111827'
  ink-muted: "#6B7280"
  accent: "#2563EB"
typography:
  body: { fontFamily: "Inter" }
rounded:
  sm: "4px"
spacing:
  sm: "8px"
iconography:
  library: "lucide-react"
---
# DESIGN.md

## 7. Implementation Tokens
\`\`\`css
:root {
  --color-canvas: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-border: #E5E7EB;
  --color-ink: #111827;
  --color-muted: #6B7280;
  --color-accent: #2563EB;
}
\`\`\`
`

  it('extracts color tokens from YAML front matter', () => {
    const tokens = extractYamlColorTokens(sampleMarkdown)
    expect(tokens['canvas']).toBe('#FFFFFF')
    expect(tokens['surface']).toBe('#F9FAFB')
    expect(tokens['border']).toBe('#E5E7EB')
    expect(tokens['ink-primary']).toBe('#111827')
    expect(tokens['ink-muted']).toBe('#6B7280')
    expect(tokens['accent']).toBe('#2563EB')
  })

  it('extracts CSS custom properties from :root block', () => {
    const props = extractCssCustomProperties(sampleMarkdown)
    expect(props.get('--color-canvas')).toBe('#FFFFFF')
    expect(props.get('--color-ink')).toBe('#111827')
    expect(props.get('--color-accent')).toBe('#2563EB')
  })
})

describe('Design Token Validator — Validation Logic', () => {
  it('passes cleanly for accessible, synchronized design tokens', () => {
    const validMarkdown = `---
name: "Clean"
colors:
  canvas: "#FFFFFF"
  surface: "#F5F5F5"
  border: "#D1D5DB"
  ink-primary: "#111827"
  ink-muted: "#4B5563"
  accent: "#334155"
typography:
  body: { fontFamily: "Inter" }
rounded:
  sm: "4px"
spacing:
  sm: "8px"
iconography:
  library: "lucide-react"
---
# DESIGN.md
\`\`\`css
:root {
  --color-canvas: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-border: #D1D5DB;
  --color-ink: #111827;
  --color-muted: #4B5563;
  --color-accent: #334155;
}
\`\`\`
`
    const issues = validateDesignTokensAndContrast(validMarkdown)
    expect(issues).toHaveLength(0)
  })

  it('emits an advisory contrast warning when normal text fails WCAG AA (4.5:1)', () => {
    const lowContrastMarkdown = `---
name: "Failing Contrast"
colors:
  canvas: "#FFFFFF"
  surface: "#FFFFFF"
  border: "#EEEEEE"
  ink-primary: "#AAAAAA" # ~2.3:1 contrast against white
  ink-muted: "#CCCCCC"
  accent: "#EEEEEE"
---
# DESIGN.md
`
    const issues = validateDesignTokensAndContrast(lowContrastMarkdown)
    const contrastIssue = issues.find((i) => i.category === 'CONTRAST_WARNING' && i.description.includes('primary text'))
    expect(contrastIssue).toBeDefined()
    expect(contrastIssue?.severity).toBe('MEDIUM')
    expect(contrastIssue?.description).toContain('WCAG AA requires at least 4.5:1')
  })

  it('emits an advisory contrast warning when muted text is below 3:1', () => {
    const lowMutedMarkdown = `---
name: "Low Muted"
colors:
  canvas: "#FFFFFF"
  surface: "#FFFFFF"
  border: "#EEEEEE"
  ink-primary: "#111827" # good
  ink-muted: "#DDDDDD" # ~1.3:1 contrast against white (< 3:1)
  accent: "#334155"
---
# DESIGN.md
`
    const issues = validateDesignTokensAndContrast(lowMutedMarkdown)
    const mutedIssue = issues.find((i) => i.category === 'CONTRAST_WARNING' && i.description.includes('muted text'))
    expect(mutedIssue).toBeDefined()
    expect(mutedIssue?.severity).toBe('LOW')
    expect(mutedIssue?.description).toContain('target at least 3:1')
  })

  it('reports unparseable hex formats gracefully as advisory warnings', () => {
    const malformedMarkdown = `---
name: "Malformed"
colors:
  canvas: "#ZZZZZZ"
  surface: "#12"
  ink-primary: "#111827"
---
# DESIGN.md
`
    const issues = validateDesignTokensAndContrast(malformedMarkdown)
    expect(issues.some((i) => i.category === 'INVALID_DESIGN_SYSTEM' && i.description.includes('#ZZZZZZ'))).toBe(true)
    expect(issues.some((i) => i.category === 'INVALID_DESIGN_SYSTEM' && i.description.includes('#12'))).toBe(true)
  })

  it('detects missing CSS custom properties when :root block is present', () => {
    const missingCssMarkdown = `---
name: "Missing CSS"
colors:
  canvas: "#FFFFFF"
  surface: "#F5F5F5"
  border: "#D1D5DB"
  ink-primary: "#111827"
  accent: "#FF0000"
---
# DESIGN.md
\`\`\`css
:root {
  --color-canvas: #FFFFFF;
  --color-ink: #111827;
}
\`\`\`
`
    const issues = validateDesignTokensAndContrast(missingCssMarkdown)
    const missingAccent = issues.find((i) => i.category === 'DESIGN_TOKEN_MISMATCH' && i.description.includes('accent'))
    expect(missingAccent).toBeDefined()
  })

  it('detects value mismatch between YAML token and CSS custom property', () => {
    const mismatchMarkdown = `---
name: "Mismatch"
colors:
  canvas: "#FFFFFF"
  surface: "#F5F5F5"
  border: "#D1D5DB"
  accent: "#334155"
  ink-primary: "#111827"
---
# DESIGN.md
\`\`\`css
:root {
  --color-canvas: #000000; /* Mismatch with #FFFFFF */
  --color-surface: #F5F5F5;
  --color-border: #D1D5DB;
  --color-accent: #334155;
  --color-ink: #111827;
}
\`\`\`
`
    const issues = validateDesignTokensAndContrast(mismatchMarkdown)
    const mismatchIssue = issues.find((i) => i.category === 'DESIGN_TOKEN_MISMATCH' && i.description.includes('canvas'))
    expect(mismatchIssue).toBeDefined()
    expect(mismatchIssue?.description).toContain('YAML specifies "#FFFFFF" but CSS property --color-canvas is "#000000"')
  })
})
