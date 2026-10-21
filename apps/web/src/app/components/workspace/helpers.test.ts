import { describe, expect, it } from 'vitest'
import {
  countContextItems,
  formatDate,
  formatLabel,
  formatStatus,
  getContextProvenanceCounts,
  getDocumentReadiness,
  getExportBlockedReason,
  getSectionPanelId,
  getSectionTabId,
  getSectionTabKey,
  hasContextData,
  isSensitiveContextValue,
  shouldShowDesignSystemGraph,
  statusTone,
} from './helpers'

describe('Workspace helpers', () => {
  describe('shouldShowDesignSystemGraph', () => {
    const graph = {
      nodes: [
        { id: 'web', label: 'Web', category: 'ui' as const, description: 'User interface' },
        { id: 'api', label: 'API', category: 'api' as const, description: 'Application API' },
      ],
      edges: [{ source: 'web', target: 'api', label: 'Requests' }],
    }

    it('shows the graph for a non-simple project with connected components', () => {
      expect(shouldShowDesignSystemGraph(graph, 'SAAS')).toBe(true)
    })

    it('hides the graph when it is missing or has fewer than two nodes', () => {
      expect(shouldShowDesignSystemGraph(null, 'SAAS')).toBe(false)
      expect(shouldShowDesignSystemGraph({ nodes: [graph.nodes[0]], edges: graph.edges }, 'SAAS')).toBe(false)
    })

    it('hides graphs with empty, self-referential, or invalid relationships', () => {
      expect(shouldShowDesignSystemGraph({ ...graph, edges: [] }, 'SAAS')).toBe(false)
      expect(shouldShowDesignSystemGraph({ ...graph, edges: [{ source: 'web', target: 'web' }] }, 'SAAS')).toBe(false)
      expect(shouldShowDesignSystemGraph({ ...graph, edges: [{ source: 'web', target: 'missing' }] }, 'SAAS')).toBe(false)
    })

    it.each(['LANDING_PAGE', 'STATIC_SITE'])('hides simple classification %s', (classification) => {
      expect(shouldShowDesignSystemGraph(graph, classification)).toBe(false)
    })

    it('hides the graph when classification is unknown', () => {
      expect(shouldShowDesignSystemGraph(graph, null)).toBe(false)
    })
  })

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

  describe('getDocumentReadiness', () => {
    it('correctly reports partial readiness with missing planned documents', () => {
      const result = getDocumentReadiness({
        requiredArtifactTypes: ['PRD', 'ARCHITECTURE', 'AGENT', 'BACKLOG', 'DESIGN'],
        artifacts: [
          { type: 'PRD', status: 'READY' },
          { type: 'AGENT', status: 'READY' },
          { type: 'BACKLOG', status: 'READY' },
        ],
        plannedDocuments: [
          { id: 'PRD', type: 'PRD', filename: 'PRD.md', status: 'READY' },
          { id: 'ARCHITECTURE', type: 'ARCHITECTURE', filename: 'ARCHITECTURE.md', status: 'WAITING' },
          { id: 'DESIGN', type: 'DESIGN', filename: 'DESIGN.md', status: 'WAITING' },
          { id: 'AGENT', type: 'AGENT', filename: 'Agent.md', status: 'READY' },
          { id: 'BACKLOG', type: 'BACKLOG', filename: 'BACKLOG.md', status: 'READY' },
        ],
      })

      expect(result.readyCount).toBe(3)
      expect(result.totalCount).toBe(5)
      expect(result.attentionCount).toBe(2)
      expect(result.retryableCount).toBe(2) // ARCHITECTURE & DESIGN
      expect(result.pendingDocuments).toHaveLength(2)
      expect(result.pendingDocuments.map((d) => d.type)).toEqual(['ARCHITECTURE', 'DESIGN'])
    })

    it('correctly reports a complete required pack', () => {
      const result = getDocumentReadiness({
        requiredArtifactTypes: ['PRD', 'AGENT', 'BACKLOG'],
        artifacts: [
          { type: 'PRD', status: 'READY' },
          { type: 'AGENT', status: 'READY' },
          { type: 'BACKLOG', status: 'MODIFIED' },
        ],
        plannedDocuments: [
          { id: 'PRD', type: 'PRD', filename: 'PRD.md', status: 'READY' },
          { id: 'AGENT', type: 'AGENT', filename: 'Agent.md', status: 'READY' },
          { id: 'BACKLOG', type: 'BACKLOG', filename: 'BACKLOG.md', status: 'MODIFIED' },
        ],
      })

      expect(result.readyCount).toBe(3)
      expect(result.totalCount).toBe(3)
      expect(result.attentionCount).toBe(0)
      expect(result.retryableCount).toBe(0)
      expect(result.pendingDocuments).toHaveLength(0)
    })

    it('does not inflate required totalCount with optional extra artifacts', () => {
      const result = getDocumentReadiness({
        requiredArtifactTypes: ['PRD', 'AGENT'],
        artifacts: [
          { type: 'PRD', status: 'READY' },
          { type: 'AGENT', status: 'READY' },
          { type: 'CUSTOM_DOC', status: 'READY' },
        ],
        plannedDocuments: [
          { id: 'PRD', type: 'PRD', filename: 'PRD.md', status: 'READY' },
          { id: 'AGENT', type: 'AGENT', filename: 'Agent.md', status: 'READY' },
        ],
      })

      expect(result.readyCount).toBe(2)
      expect(result.totalCount).toBe(2)
      expect(result.attentionCount).toBe(0)
    })

    it('distinguishes failed existing artifacts from missing pending documents', () => {
      const result = getDocumentReadiness({
        requiredArtifactTypes: ['PRD', 'ARCHITECTURE', 'AGENT'],
        artifacts: [
          { type: 'PRD', status: 'READY' },
          { type: 'ARCHITECTURE', status: 'FAILED' },
        ],
        plannedDocuments: [
          { id: 'PRD', type: 'PRD', filename: 'PRD.md', status: 'READY' },
          { id: 'ARCHITECTURE', type: 'ARCHITECTURE', filename: 'ARCHITECTURE.md', status: 'FAILED' },
          { id: 'AGENT', type: 'AGENT', filename: 'Agent.md', status: 'WAITING' },
        ],
      })

      expect(result.readyCount).toBe(1)
      expect(result.totalCount).toBe(3)
      expect(result.attentionCount).toBe(2)
      // Only AGENT is pending (has no artifact); ARCHITECTURE has a failed artifact
      expect(result.pendingDocuments).toHaveLength(1)
      expect(result.pendingDocuments[0].type).toBe('AGENT')
      expect(result.retryableCount).toBe(2) // ARCHITECTURE (failed) + AGENT (missing)
    })

    it('does not include SRS in retryableCount', () => {
      const result = getDocumentReadiness({
        requiredArtifactTypes: ['PRD', 'SRS'],
        artifacts: [],
        plannedDocuments: [
          { id: 'PRD', type: 'PRD', filename: 'PRD.md', status: 'WAITING' },
          { id: 'SRS', type: 'SRS', filename: 'SRS.md', status: 'WAITING' },
        ],
      })

      expect(result.retryableCount).toBe(1) // only PRD, not SRS
      expect(result.pendingDocuments).toHaveLength(2)
    })

    it('falls back gracefully when requiredArtifactTypes is empty', () => {
      const result = getDocumentReadiness({
        requiredArtifactTypes: [],
        artifacts: [
          { type: 'PRD', status: 'READY' },
          { type: 'AGENT', status: 'FAILED' },
        ],
        plannedDocuments: [],
      })

      expect(result.readyCount).toBe(1)
      expect(result.totalCount).toBe(2)
      expect(result.attentionCount).toBe(1)
      expect(result.pendingDocuments).toHaveLength(0)
    })
  })

  describe('getExportBlockedReason', () => {
    it('returns null when export is allowed', () => {
      expect(
        getExportBlockedReason({
          canExport: true,
          hasAnyReadyArtifacts: true,
          readyRequiredCount: 5,
          totalRequiredCount: 5,
          projectStatus: 'READY',
        }),
      ).toBeNull()
    })

    it('returns no-documents when zero ready artifacts exist', () => {
      expect(
        getExportBlockedReason({
          canExport: false,
          hasAnyReadyArtifacts: false,
          readyRequiredCount: 0,
          totalRequiredCount: 5,
          projectStatus: 'READY',
        }),
      ).toBe('no-documents')
    })

    it('returns incomplete-pack when some required artifacts are missing', () => {
      expect(
        getExportBlockedReason({
          canExport: false,
          hasAnyReadyArtifacts: true,
          readyRequiredCount: 3,
          totalRequiredCount: 5,
          projectStatus: 'READY',
        }),
      ).toBe('incomplete-pack')
    })

    it('returns project-not-ready when all required documents are ready but project status blocks export', () => {
      expect(
        getExportBlockedReason({
          canExport: false,
          hasAnyReadyArtifacts: true,
          readyRequiredCount: 5,
          totalRequiredCount: 5,
          projectStatus: 'GENERATING',
        }),
      ).toBe('project-not-ready')
    })
  })
})
