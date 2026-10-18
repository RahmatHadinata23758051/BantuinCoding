import { describe, expect, it } from 'vitest'
import {
  countContextItems,
  formatDate,
  formatLabel,
  formatStatus,
  getContextProvenanceCounts,
  getSectionPanelId,
  getSectionTabId,
  getSectionTabKey,
  hasContextData,
  isSensitiveContextValue,
  statusTone,
} from './helpers'

describe('Workspace helpers', () => {
  describe('getSectionTabKey', () => {
    it('handles design-system special casing', () => {
      expect(getSectionTabKey('design-system')).toBe('tabDesignSystem')
    })

    it('formats camelCase tab keys for other sections', () => {
      expect(getSectionTabKey('overview')).toBe('tabOverview')
      expect(getSectionTabKey('context')).toBe('tabContext')
      expect(getSectionTabKey('documents')).toBe('tabDocuments')
      expect(getSectionTabKey('backlog')).toBe('tabBacklog')
      expect(getSectionTabKey('export')).toBe('tabExport')
    })
  })

  describe('DOM IDs', () => {
    it('generates consistent panel and tab IDs', () => {
      expect(getSectionPanelId('overview')).toBe('workspace-panel-overview')
      expect(getSectionTabId('overview')).toBe('workspace-tab-overview')
      expect(getSectionPanelId('design-system')).toBe('workspace-panel-design-system')
      expect(getSectionTabId('design-system')).toBe('workspace-tab-design-system')
    })
  })

  describe('formatLabel', () => {
    it('converts camelCase and snake_case to title case', () => {
      expect(formatLabel('targetUsers')).toBe('Target Users')
      expect(formatLabel('functional_requirements')).toBe('Functional Requirements')
      expect(formatLabel('design-direction')).toBe('Design Direction')
    })
  })

  describe('formatStatus', () => {
    it('formats uppercase status to title case words', () => {
      expect(formatStatus('IN_PROGRESS')).toBe('In progress')
      expect(formatStatus('READY')).toBe('Ready')
      expect(formatStatus('GENERATION_FAILED')).toBe('Generation failed')
    })
  })

  describe('formatDate', () => {
    it('formats valid dates and returns null for invalid dates', () => {
      expect(formatDate('invalid-date', 'en')).toBeNull()
      const formatted = formatDate('2026-10-19T00:00:00.000Z', 'en')
      expect(formatted).toBe('Oct 19, 2026')
    })
  })

  describe('statusTone', () => {
    it('returns appropriate tone class for various statuses', () => {
      expect(statusTone('READY')).toContain('var(--workspace-mint-soft)')
      expect(statusTone('DONE')).toContain('var(--workspace-mint-soft)')
      expect(statusTone('EXPORTABLE')).toContain('var(--workspace-mint-soft)')
      expect(statusTone('IN_PROGRESS')).toContain('var(--workspace-blue-soft)')
      expect(statusTone('BLOCKED')).toContain('var(--workspace-yellow-soft)')
      expect(statusTone('FAILED')).toContain('var(--workspace-rose-soft)')
      expect(statusTone('UNKNOWN_STATUS')).toContain('bg-black/[0.04]')
    })
  })

  describe('hasContextData', () => {
    it('correctly checks presence of context keys', () => {
      expect(hasContextData(null)).toBe(false)
      expect(hasContextData({})).toBe(false)
      expect(hasContextData({ goals: ['Ship product'] })).toBe(true)
    })
  })

  describe('isSensitiveContextValue', () => {
    it('detects sensitive keys and token formats', () => {
      expect(isSensitiveContextValue('sk-ant-api03-1234567890abcdef')).toBe(true)
      expect(isSensitiveContextValue('Bearer my-access-token')).toBe(true)
      expect(isSensitiveContextValue('normal text')).toBe(false)
      expect(isSensitiveContextValue({ apiKey: 'secret-val' })).toBe(true)
      expect(isSensitiveContextValue({ userToken: 'some-token' })).toBe(true)
      expect(isSensitiveContextValue(['safe item', { password: '123' }])).toBe(true)
    })
  })

  describe('getContextProvenanceCounts', () => {
    it('aggregates provenance labels correctly', () => {
      const context = {
        goals: [
          { value: 'Build web app', provenance: 'confirmed' },
          { value: 'High performance', provenance: 'assumed' },
        ],
        non_goals: {
          mobileApp: { value: 'Native app', provenance: 'unknown' },
        },
      }
      const counts = getContextProvenanceCounts(context, ['goals', 'non_goals'])
      expect(counts).toEqual({
        confirmed: 1,
        assumed: 1,
        unknown: 1,
      })
    })
  })

  describe('countContextItems', () => {
    it('counts arrays, primitive values, and nested objects', () => {
      expect(countContextItems(null)).toBe(0)
      expect(countContextItems('')).toBe(0)
      expect(countContextItems(['a', 'b', 'c'])).toBe(3)
      expect(countContextItems('hello')).toBe(1)
      expect(countContextItems({ val: 'something', provenance: 'confirmed' })).toBe(1)
      expect(countContextItems({ a: 'one', b: 'two' })).toBe(2)
    })
  })
})
