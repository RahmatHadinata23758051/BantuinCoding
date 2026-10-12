import { describe, expect, it } from 'vitest'
import { parseProjectBrief } from './brief-parser'

describe('parseProjectBrief', () => {
  it('keeps an unstructured landing-page brief as paragraphs', () => {
    const result = parseProjectBrief('A landing page for a local bakery.\n\nIt should explain the menu and make ordering easy.')

    expect(result.paragraphs).toHaveLength(2)
    expect(result.lead).toContain('local bakery')
    expect(result.features).toEqual([])
    expect(result.pageStructure).toEqual([])
  })

  it('extracts explicit sections from a CRUD brief without inventing details', () => {
    const result = parseProjectBrief(
      'A small inventory app for a retail team.\n\nFeatures:\n- Add products\n- Track stock\n\nTarget audience: store managers',
    )

    expect(result.features).toEqual([{ title: 'Add products' }, { title: 'Track stock' }])
    expect(result.audience).toEqual(['store managers'])
    expect(result.pageStructure).toEqual([])
  })

  it('extracts service sections from an API brief', () => {
    const result = parseProjectBrief(
      'An API for synchronizing invoices between internal systems.\n\nSections: Authentication; Invoice sync; Webhooks\n\nIncluded: typed JSON responses\n\nOut of scope: admin dashboard',
    )

    expect(result.pageStructure).toEqual(['Authentication', 'Invoice sync', 'Webhooks'])
    expect(result.scope).toEqual({
      included: ['typed JSON responses'],
      excluded: ['admin dashboard'],
    })
  })

  it('splits single-newline prose into separate paragraphs', () => {
    const result = parseProjectBrief('A project for a small team.\nIt should keep the workflow easy to scan.\nThe first release stays focused.')

    expect(result.paragraphs).toEqual([
      'A project for a small team.',
      'It should keep the workflow easy to scan.',
      'The first release stays focused.',
    ])
  })

  it('preserves labeled sections and bullet lists across single newlines', () => {
    const result = parseProjectBrief('A small inventory app.\nFeatures:\n- Add products\n- Track stock')

    expect(result.paragraphs).toEqual(['A small inventory app.', 'Features:\n- Add products\n- Track stock'])
    expect(result.features).toEqual([{ title: 'Add products' }, { title: 'Track stock' }])
  })

  it('prefers structured context over text-derived sections', () => {
    const result = parseProjectBrief('A plain brief.\n\nFeatures: Invented text', {
      summary: 'Confirmed summary',
      functional_requirements: [{ value: 'Persist records' }],
      target_audience: ['Operations team'],
    })

    expect(result.lead).toBe('Confirmed summary')
    expect(result.features).toEqual([{ title: 'Persist records' }])
    expect(result.audience).toEqual(['Operations team'])
  })
})
