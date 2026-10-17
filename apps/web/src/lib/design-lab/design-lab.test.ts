import { describe, it, expect } from 'vitest'
import { THEMES } from './themes'
import { TEMPLATES } from './templates'
import { ThemeSchema, TemplateSchema } from './schemas'
import { contrastRatio, hexToHsl, hueDistance } from './contrast'
import { recommend } from './recommend'

const BANNED_FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Arial',
  'Helvetica',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
  'Plus Jakarta Sans',
  'Manrope',
  'DM Sans',
  'Space Grotesk',
  'Satoshi',
  'Geist',
]

const BANNED_BRANDS = ['Ramp', 'Raycast', 'Railway', 'Nuvio', 'Miro', 'Figma']

const BANNED_HEX_EXACT = ['#2563EB', '#2563eb', '#000000', '#FFFFFF', '#000', '#FFF']

// Hue 245–310 is banned (purple/indigo/violet)
function isHueBanned(hex: string): boolean {
  const { h } = hexToHsl(hex)
  return h >= 245 && h <= 310
}

describe('Themes — schema validity', () => {
  it('every theme passes Zod schema', () => {
    for (const theme of THEMES) {
      expect(() => ThemeSchema.parse(theme)).not.toThrow()
    }
  })

  it('every theme has exactly 3 signature moves', () => {
    for (const theme of THEMES) {
      expect(theme.signature_moves).toHaveLength(3)
    }
  })

  it('theme IDs are unique', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('Themes — palette constraints', () => {
  for (const theme of THEMES) {
    it(`${theme.id}: no banned exact hex`, () => {
      const values = Object.values(theme.palette)
      for (const hex of values) {
        expect(BANNED_HEX_EXACT).not.toContain(hex)
      }
    })

    it(`${theme.id}: no banned hue range (245–310) on palette`, () => {
      const values = Object.values(theme.palette).filter(Boolean) as string[]
      for (const hex of values) {
        expect(isHueBanned(hex)).toBe(false)
      }
    })

    it(`${theme.id}: ink on canvas >= 4.5:1 contrast`, () => {
      const ratio = contrastRatio(theme.palette.ink, theme.palette.canvas)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it(`${theme.id}: ink_muted on canvas >= 4.5:1 contrast`, () => {
      const ratio = contrastRatio(theme.palette.ink_muted, theme.palette.canvas)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it(`${theme.id}: accent_fg on accent >= 4.5:1 contrast`, () => {
      const ratio = contrastRatio(theme.palette.accent_fg, theme.palette.accent)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  }
})

describe('Themes — font constraints', () => {
  for (const theme of THEMES) {
    it(`${theme.id}: no banned font families in typography`, () => {
      const allFontStrings = [
        theme.typography.displayFamily,
        theme.typography.bodyFamily,
        theme.typography.monoFamily,
        ...Object.values(theme.typography.scale).map((s) => s.fontFamily),
      ]
      for (const fontStr of allFontStrings) {
        for (const banned of BANNED_FONT_FAMILIES) {
          expect(fontStr).not.toContain(banned)
        }
      }
    })
  }
})

describe('Themes — no brand names', () => {
  it('no banned brand strings in any theme', () => {
    const serialized = JSON.stringify(THEMES)
    for (const brand of BANNED_BRANDS) {
      expect(serialized).not.toContain(brand)
    }
  })
})

describe('Themes — accent hue separation', () => {
  it('accent hues differ >= 40 degrees between all theme pairs', () => {
    for (let i = 0; i < THEMES.length; i++) {
      for (let j = i + 1; j < THEMES.length; j++) {
        const hA = hexToHsl(THEMES[i].palette.accent).h
        const hB = hexToHsl(THEMES[j].palette.accent).h
        const dist = hueDistance(hA, hB)
        expect(dist, `${THEMES[i].id} vs ${THEMES[j].id}`).toBeGreaterThanOrEqual(40)
      }
    }
  })
})

describe('Templates — schema validity', () => {
  it('every template passes Zod schema', () => {
    for (const tpl of TEMPLATES) {
      expect(() => TemplateSchema.parse(tpl)).not.toThrow()
    }
  })

  it('template IDs are unique', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every template has grammar_variants for all 4 separators', () => {
    const separators = ['rule', 'space', 'band', 'box'] as const
    for (const tpl of TEMPLATES) {
      for (const sep of separators) {
        expect(tpl.grammar_variants[sep], `${tpl.id} missing ${sep} variant`).toBeDefined()
      }
    }
  })

  it('grammar_variants have distinct rowClass values per template', () => {
    for (const tpl of TEMPLATES) {
      const classes = Object.values(tpl.grammar_variants).map((v) => v.rowClass)
      const unique = new Set(classes)
      expect(unique.size, `${tpl.id} grammar variants should be visually distinct`).toBe(classes.length)
    }
  })

  it('no banned brand strings in any template', () => {
    const serialized = JSON.stringify(TEMPLATES)
    for (const brand of BANNED_BRANDS) {
      expect(serialized).not.toContain(brand)
    }
  })
})

describe('Recommendation', () => {
  it('returns a result with valid themeId and templateId', () => {
    const result = recommend({})
    const themeIds = THEMES.map((t) => t.id)
    const templateIds = TEMPLATES.map((t) => t.id)
    expect(themeIds).toContain(result.themeId)
    expect(templateIds).toContain(result.templateId)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('data-dense context picks list-table template', () => {
    const result = recommend({ dataDense: true, ideaSnippet: 'catatan buku kas harian' })
    expect(result.templateId).toBe('daftar-catatan')
  })
})

describe('Contrast utility', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000001', '#FEFEFE')).toBeGreaterThan(20)
  })

  it('identical colors have contrast 1.0', () => {
    expect(contrastRatio('#888888', '#888888')).toBe(1)
  })
})
