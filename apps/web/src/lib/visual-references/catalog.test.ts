import { describe, expect, it } from 'vitest'
import {
  VISUAL_REFERENCES,
  getVisualReference,
  isValidVisualReferenceId,
} from './catalog'

describe('visual-references catalog', () => {
  it('includes all registered visual references', () => {
    const ids = VISUAL_REFERENCES.map((ref) => ref.id)
    expect(ids).toContain('notion')
    expect(ids).toContain('launchdarkly')
    expect(ids).toContain('plate')
    expect(ids).toContain('plite')
    expect(ids).toContain('ui')
  })

  it('keeps plate and plite distinct in identity, naming, and preview paths', () => {
    const plate = getVisualReference('plate')
    const plite = getVisualReference('plite')

    expect(plate).toBeDefined()
    expect(plite).toBeDefined()
    expect(plate?.id).not.toBe(plite?.id)
    expect(plate?.name).not.toBe(plite?.name)
    expect(plate?.previewUrl).toBe('/visual-references/plate/index.html')
    expect(plite?.previewUrl).toBe('/visual-references/plite/index.html')
    expect(plate?.dnaPrompt).not.toBe(plite?.dnaPrompt)
  })

  it('correctly validates reference IDs', () => {
    expect(isValidVisualReferenceId('notion')).toBe(true)
    expect(isValidVisualReferenceId('plite')).toBe(true)
    expect(isValidVisualReferenceId('plate')).toBe(true)
    expect(isValidVisualReferenceId('invalid-ref')).toBe(false)
    expect(isValidVisualReferenceId('')).toBe(false)
  })

  it('returns reference item with required properties', () => {
    for (const item of VISUAL_REFERENCES) {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.tagline).toBeTruthy()
      expect(item.description).toBeTruthy()
      expect(item.previewUrl).toMatch(/^\/visual-references\/.+\/index\.html$/)
      expect(item.dnaPrompt).toBeTruthy()
      expect(item.accentColor).toMatch(/^#[0-9a-fA-F]{3,8}$/)
      expect(item.surfaceColor).toMatch(/^#[0-9a-fA-F]{3,8}$/)
      expect(item.canvasColor).toMatch(/^#[0-9a-fA-F]{3,8}$/)
    }
  })
})
