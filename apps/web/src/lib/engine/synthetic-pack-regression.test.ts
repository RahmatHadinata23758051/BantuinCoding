import { describe, expect, it, vi } from 'vitest'
import {
  auditProjectConsistency,
  validateRuleBasedConsistency,
} from '@/lib/engine/consistency-validator'
import {
  ConsistencyReportSchema,
  isBlockerIssue,
  type ConsistencyIssue,
} from '@/lib/prompts/consistency-validator'
import {
  validateExportPreflight,
  validateZipPath,
  scanContentForSecrets,
} from '@/lib/export/preflight'
import { validateDesignTokensAndContrast } from '@/lib/engine/design-token-validator'
import { validateArtifactIntegrity } from '@/lib/engine/artifact-integrity'
import {
  getProjectReadiness,
  recomputeProjectReadiness,
} from '@/lib/projects/readiness-service'

const dbMock = vi.hoisted(() => ({
  project: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@repo/db', () => ({ db: dbMock }))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

/**
 * Valid 8-section architecture skeleton required by artifact integrity checks.
 */
const VALID_ARCHITECTURE_SKELETON = Array.from(
  { length: 8 },
  (_, index) => `## ${index + 1}. Section ${index + 1}\nArchitecture specification section ${index + 1}.`,
).join('\n\n')

/**
 * Valid accessible CSS tokens for DESIGN.md
 */
const VALID_ACCESSIBLE_DESIGN = `# DESIGN.md — Synthetic Pack
UI scope: web application

\`\`\`css
:root {
  --color-canvas: #FFFFFF;
  --color-surface: #F8F9FA;
  --color-ink: #111827;
  --color-muted: #4B5563;
  --color-accent: #2563EB;
  --color-on-accent: #FFFFFF;
  --color-focus: #1D4ED8;
  --font-body: system-ui, sans-serif;
  --space-unit: 8px;
}
\`\`\`

## Direction & Decisions
Clean and accessible design system.

## Composition & Responsive Behavior
Responsive layout.

## Components & States
Buttons, cards, inputs.

## Accessibility & Interaction
High contrast and visible focus.

## Implementation Boundaries
Preserve confirmed requirements.
`

function buildSyntheticPack(overrides: Partial<Record<'PRD' | 'ARCHITECTURE' | 'DESIGN' | 'AGENT' | 'BACKLOG', string>> = {}): Array<{ type: string; path: string; content: string }> {
  return [
    {
      type: 'PRD',
      path: 'PRD.md',
      content: overrides.PRD ?? `# PRD.md — Synthetic Pack\n\n## 1. Product Summary\nSynthetic test project.\n\n## 2. Requirements\n- FR-01: User registration and authentication.\n- FR-02: Core transactional workflow.`,
    },
    {
      type: 'ARCHITECTURE',
      path: 'ARCHITECTURE.md',
      content: overrides.ARCHITECTURE ?? `# ARCHITECTURE.md — Synthetic Pack\n\n${VALID_ARCHITECTURE_SKELETON}\n\nFrontend: React\nBackend: Node.js\nDatabase: PostgreSQL`,
    },
    {
      type: 'DESIGN',
      path: 'DESIGN.md',
      content: overrides.DESIGN ?? VALID_ACCESSIBLE_DESIGN,
    },
    {
      type: 'AGENT',
      path: 'Agent.md',
      content: overrides.AGENT ?? `# Agent.md — Operational Contract\n\n## Documentation Precedence\nPRD.md -> ARCHITECTURE.md -> DESIGN.md -> Agent.md -> BACKLOG.md\nDESIGN.md is the visual and interaction authority.`,
    },
    {
      type: 'BACKLOG',
      path: 'BACKLOG.md',
      content: overrides.BACKLOG ?? `# BACKLOG.md — Phased Backlog\n\n### BK-001 — Initialize Repository\n**Relevant Docs:** PRD.md, ARCHITECTURE.md, DESIGN.md, Agent.md\n**Acceptance Criteria:**\n- Monorepo initialized.\n**Definition of Done:**\n- Tested with project test runner.`,
    },
  ]
}

describe('BK-042: Synthetic Document-Pack Regression Coverage', () => {
  describe('Complete Consistent Baseline Fixture', () => {
    it('verifies a complete consistent synthetic pack passes all deterministic consistency checks', () => {
      const pack = buildSyntheticPack()
      const contextJson = JSON.stringify({
        stack_preferences: {
          frontend: { value: 'React', provenance: 'confirmed' },
          backend: { value: 'Node.js', provenance: 'confirmed' },
          database: { value: 'PostgreSQL', provenance: 'confirmed' },
        },
      })

      const report = validateRuleBasedConsistency(pack, contextJson)
      expect(report.isConsistent).toBe(true)
      expect(report.blocksExport).toBe(false)
      expect(report.issues).toEqual([])
      expect(report.score).toBe(100)
    })

    it('verifies the complete consistent synthetic pack passes export preflight validation', () => {
      const pack = buildSyntheticPack()
      const project = {
        name: 'Synthetic Pack',
        contexts: [
          {
            id: 'ctx-current',
            artifactPlans: pack.map((artifact) => ({ type: artifact.type })),
          },
        ],
        artifacts: pack.map((artifact) => ({
          type: artifact.type,
          path: artifact.path,
          content: artifact.content,
          status: 'READY',
          contextId: 'ctx-current',
        })),
      }

      const exportable = validateExportPreflight(project)
      expect(exportable).toHaveLength(5)
      expect(exportable.map((artifact) => artifact.type).sort()).toEqual([
        'AGENT',
        'ARCHITECTURE',
        'BACKLOG',
        'DESIGN',
        'PRD',
      ])
    })

    it('verifies auditProjectConsistency audits the complete synthetic pack in deterministic-only mode', async () => {
      const pack = buildSyntheticPack()
      dbMock.project.findFirst.mockResolvedValueOnce({
        name: 'Synthetic Pack',
        contexts: [
          {
            id: 'ctx-current',
            isCurrent: true,
            contentJson: JSON.stringify({
              stack_preferences: {
                frontend: { value: 'React', provenance: 'confirmed' },
                backend: { value: 'Node.js', provenance: 'confirmed' },
                database: { value: 'PostgreSQL', provenance: 'confirmed' },
              },
            }),
            artifactPlans: pack.map((artifact) => ({ type: artifact.type, path: artifact.path, isRequired: true })),
          },
        ],
        artifacts: pack.map((artifact) => ({
          contextId: 'ctx-current',
          type: artifact.type,
          path: artifact.path,
          content: artifact.content,
          status: 'READY',
        })),
      })

      const report = await auditProjectConsistency({ userId: 'u-1', projectId: 'p-1' })
      expect(report.isConsistent).toBe(true)
      expect(report.blocksExport).toBe(false)
      expect(report.auditMode).toBe('deterministic-only')
      expect(report.issues).toEqual([])
    })
  })

  describe('BookNest Scenario Matrix: 9 Conflict Categories', () => {
    it('Scenario 1 [Rounding disagreement]: classifies as advisory warning with source evidence and actionable resolution', () => {
      // In-memory conflict: PRD specifies round-half-up to 2 decimals, Architecture stores raw floats
      const pack = buildSyntheticPack({
        PRD: `# PRD\n\n### FR-01 Financial Calculation\nTax calculations must be rounded half-up to exactly 2 decimal places before persistence.`,
        ARCHITECTURE: `# ARCHITECTURE\n\n${VALID_ARCHITECTURE_SKELETON}\n\n### Data Storage\nStore raw unrounded floating-point numbers in numeric columns; perform rounding only at display time.`,
      })

      // The app has no deterministic arithmetic parser for arbitrary rounding text;
      // deterministic rule-based checks do not invent a blocker.
      const deterministicReport = validateRuleBasedConsistency(pack)
      expect(deterministicReport.blocksExport).toBe(false)

      // When reported by an auditor (AI or structured report), it is classified as an advisory WARNING.
      const advisoryReport = ConsistencyReportSchema.parse({
        isConsistent: true,
        score: 90,
        issues: [
          {
            severity: 'MEDIUM',
            category: 'MISSING_SPEC',
            description: 'PRD mandates half-up 2-decimal rounding before persistence, but ARCHITECTURE specifies storing raw unrounded floats.',
            affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
            recommendation: 'Align rounding rules: decide whether rounding occurs prior to database persistence or at presentation time.',
          },
        ],
        summary: 'Rounding policy discrepancy identified for user review.',
      })

      expect(advisoryReport.blocksExport).toBe(false)
      expect(advisoryReport.issues[0]?.classification).toBe('WARNING')
      expect(advisoryReport.issues[0]?.affected_documents).toEqual(['PRD.md', 'ARCHITECTURE.md'])
      expect(advisoryReport.issues[0]?.recommendation).toContain('Align rounding rules')
    })

    it('Scenario 2 [Derived vs editable status]: classifies as advisory warning requiring user judgment', () => {
      const pack = buildSyntheticPack({
        PRD: `# PRD\n\n### FR-02 Order State Machine\nOrder status is strictly derived from verified transaction and shipment webhooks; it is read-only.`,
        ARCHITECTURE: `# ARCHITECTURE\n\n${VALID_ARCHITECTURE_SKELETON}\n\n### Operations API\nPUT /api/orders/:id/status allows support administrators to directly override and update order status.`,
      })

      const deterministicReport = validateRuleBasedConsistency(pack)
      expect(deterministicReport.blocksExport).toBe(false)

      const semanticReport = ConsistencyReportSchema.parse({
        isConsistent: true,
        score: 88,
        issues: [
          {
            severity: 'MEDIUM',
            category: 'MISSING_SPEC',
            description: 'PRD defines order status as strictly derived and read-only, but ARCHITECTURE exposes a mutable status endpoint.',
            affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
            recommendation: 'Clarify whether administrative override is an authorized requirement or an architectural discrepancy.',
          },
        ],
        summary: 'Status mutability conflict flagged for review.',
      })

      expect(semanticReport.blocksExport).toBe(false)
      expect(semanticReport.issues[0]?.classification).toBe('WARNING')
      expect(semanticReport.issues[0]?.affected_documents).toEqual(['PRD.md', 'ARCHITECTURE.md'])
      expect(semanticReport.issues[0]?.recommendation).toContain('Clarify whether administrative override is an authorized requirement')
    })

    it('Scenario 3 [Incompatible payload/performance constraints]: classifies as advisory review scenario without blocking export', () => {
      const pack = buildSyntheticPack({
        PRD: `# PRD\n\n### NFR-03 Export Payload\nFull catalog export payload must remain under 2MB for low-bandwidth mobile devices.`,
        ARCHITECTURE: `# ARCHITECTURE\n\n${VALID_ARCHITECTURE_SKELETON}\n\n### Export Endpoint\nGET /catalog/export returns uncompressed JSON including full transaction logs up to 50MB.`,
      })

      const deterministicReport = validateRuleBasedConsistency(pack)
      expect(deterministicReport.blocksExport).toBe(false)

      const performanceIssue: ConsistencyIssue = {
        severity: 'MEDIUM',
        category: 'MISSING_SPEC',
        description: 'PRD sets a 2MB mobile payload limit, while ARCHITECTURE permits uncompressed exports up to 50MB.',
        affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
        recommendation: 'Specify gzip compression or paginated chunk downloads in ARCHITECTURE.md to meet the PRD constraint.',
      }

      const report = ConsistencyReportSchema.parse({
        isConsistent: true,
        score: 85,
        issues: [performanceIssue],
        summary: 'Performance constraint discrepancy flagged.',
      })

      expect(report.blocksExport).toBe(false)
      expect(report.issues[0]?.classification).toBe('WARNING')
      expect(report.issues[0]?.recommendation).toContain('Specify gzip compression or paginated chunk downloads')
    })

    it('Scenario 4 [Export shape and name]: distinguishes advisory text naming from deterministic path traversal blockers', () => {
      // 4a: Text naming disagreement between PRD and README is advisory
      const pack = buildSyntheticPack({
        PRD: `# PRD\n\n### FR-04 Export Artifact\nExport bundle name is "booknest-archive.zip".`,
      })
      const textReport = validateRuleBasedConsistency(pack)
      expect(textReport.blocksExport).toBe(false)

      // 4b: Path traversal or absolute path is a deterministic blocker in export preflight
      expect(() => validateZipPath('../booknest-archive.zip')).toThrow('Path traversal security risk')
      expect(() => validateZipPath('C:/booknest-archive.zip')).toThrow('Absolute path drive letter')
      expect(() => validateZipPath('subfolder/../../root.zip')).toThrow('Path traversal security risk')
      expect(validateZipPath('exports/booknest-archive.zip')).toBe('exports/booknest-archive.zip')
    })

    it('Scenario 5 [Unknown document references]: blocks export deterministically and reports exact missing path', () => {
      const pack = buildSyntheticPack({
        BACKLOG: `# BACKLOG.md\n\n### BK-010 Implementation\n**Relevant Docs:** PRD.md, NON_EXISTENT_SPEC.md, DATABASE.md`,
      })

      const report = validateRuleBasedConsistency(pack)
      expect(report.isConsistent).toBe(false)
      expect(report.blocksExport).toBe(true)

      const blockers = report.issues.filter((issue) => issue.classification === 'BLOCKER')
      expect(blockers.length).toBeGreaterThanOrEqual(1)
      expect(blockers).toContainEqual(
        expect.objectContaining({
          category: 'INVALID_BACKLOG_DOC_REF',
          classification: 'BLOCKER',
          affected_documents: ['BACKLOG.md', 'NON_EXISTENT_SPEC.md'],
          recommendation: expect.stringContaining('Remove the reference or include the planned document'),
        }),
      )
    })

    it('Scenario 6 [Database schema and stack mismatch]: distinguishes confirmed stack blockers from unconfirmed text warnings', () => {
      // 6a: Contradiction against confirmed canonical context is a deterministic BLOCKER
      const confirmedContext = JSON.stringify({
        stack_preferences: {
          database: { value: 'PostgreSQL', provenance: 'confirmed' },
        },
      })
      const conflictingPack = buildSyntheticPack({
        ARCHITECTURE: `# ARCHITECTURE.md\n\n${VALID_ARCHITECTURE_SKELETON}\n\nDatabase: SQLite`,
      })
      const confirmedReport = validateRuleBasedConsistency(conflictingPack, confirmedContext)

      expect(confirmedReport.isConsistent).toBe(false)
      expect(confirmedReport.blocksExport).toBe(true)
      expect(confirmedReport.issues).toContainEqual(
        expect.objectContaining({
          category: 'DATABASE_MISMATCH',
          classification: 'BLOCKER',
          affected_documents: ['ARCHITECTURE.md'],
          recommendation: expect.stringContaining('match confirmed project context'),
        }),
      )

      // 6b: Unconfirmed textual mention between PRD (MongoDB) and Architecture (PostgreSQL) is an advisory WARNING
      const unconfirmedPack = buildSyntheticPack({
        PRD: `# PRD\n\nDatabase: MongoDB`,
        ARCHITECTURE: `# ARCHITECTURE.md\n\n${VALID_ARCHITECTURE_SKELETON}\n\nDatabase: PostgreSQL`,
      })
      const unconfirmedReport = validateRuleBasedConsistency(unconfirmedPack)
      expect(unconfirmedReport.blocksExport).toBe(false)
      expect(unconfirmedReport.issues).toContainEqual(
        expect.objectContaining({
          category: 'DATABASE_MISMATCH',
          classification: 'WARNING',
          affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
          recommendation: expect.stringContaining('Align database technology'),
        }),
      )
    })

    it('Scenario 7 [Auth and CSRF assumptions]: classifies as advisory warning with actionable alignment recommendation', () => {
      const pack = buildSyntheticPack({
        PRD: `# PRD\n\n### FR-07 Security\nAuthentication uses secure HttpOnly session cookies with CSRF token verification on all mutation requests.`,
        ARCHITECTURE: `# ARCHITECTURE\n\n${VALID_ARCHITECTURE_SKELETON}\n\n### Authentication\nStateless JWT bearer tokens in the Authorization header; no CSRF token protection is implemented.`,
      })

      const deterministicReport = validateRuleBasedConsistency(pack)
      expect(deterministicReport.blocksExport).toBe(false)

      const authIssue: ConsistencyIssue = {
        severity: 'MEDIUM',
        category: 'AUTH_MISMATCH',
        description: 'PRD assumes cookie-based sessions with CSRF protection, whereas ARCHITECTURE specifies bearer JWTs without CSRF.',
        affected_documents: ['PRD.md', 'ARCHITECTURE.md'],
        recommendation: 'Decide on cookie session vs bearer token strategy and align CSRF protection accordingly.',
      }

      const report = ConsistencyReportSchema.parse({
        isConsistent: true,
        score: 85,
        issues: [authIssue],
        summary: 'Authentication strategy requires reconciliation.',
      })

      expect(report.blocksExport).toBe(false)
      expect(report.issues[0]?.classification).toBe('WARNING')
      expect(report.issues[0]?.affected_documents).toEqual(['PRD.md', 'ARCHITECTURE.md'])
      expect(report.issues[0]?.recommendation).toContain('Decide on cookie session vs bearer token strategy')
      expect(isBlockerIssue(report.issues[0]!)).toBe(false)
    })

    it('Scenario 8 [Unavailable DoD tools]: classifies ungrounded tools as advisory without blocking export', () => {
      // Backlog contains ungrounded DoD tool not confirmed in project stack
      const pack = buildSyntheticPack({
        BACKLOG: `# BACKLOG.md\n\n### BK-005 Accessibility Audit\n**Relevant Docs:** PRD.md, DESIGN.md\n**Definition of Done:**\n- Run axe-core CLI automated scan and ensure zero critical accessibility violations.`,
      })

      const report = validateRuleBasedConsistency(pack)
      expect(report.blocksExport).toBe(false)

      const toolIssue: ConsistencyIssue = {
        severity: 'LOW',
        category: 'MISSING_SPEC',
        description: 'BACKLOG task BK-005 specifies axe-core CLI, which is not declared in ARCHITECTURE or confirmed stack.',
        affected_documents: ['BACKLOG.md', 'ARCHITECTURE.md'],
        recommendation: 'Ensure axe-core is included in the project tooling plan, or rely on available standard verification instructions.',
      }

      const schemaReport = ConsistencyReportSchema.parse({
        isConsistent: true,
        score: 95,
        issues: [toolIssue],
        summary: 'Tooling reference advisory note.',
      })

      expect(schemaReport.blocksExport).toBe(false)
      expect(schemaReport.issues[0]?.classification).toBe('WARNING')
      expect(schemaReport.issues[0]?.recommendation).toContain('rely on available standard verification instructions')
      expect(isBlockerIssue(schemaReport.issues[0]!)).toBe(false)
    })

    it('Scenario 9 [Design-token and measurement disagreement]: blocks missing tokens deterministically, keeps contrast advisory', () => {
      // 9a: Missing CSS :root token block in visual DESIGN.md is a deterministic BLOCKER
      const invalidDesignPack = buildSyntheticPack({
        DESIGN: `# DESIGN.md — Visual Project\n\n## Direction\nNo CSS root token block present.`,
      })
      const structuralReport = validateRuleBasedConsistency(invalidDesignPack)
      expect(structuralReport.issues.some((issue) =>
        issue.category === 'INVALID_DESIGN_SYSTEM' && issue.description.includes('CSS :root token block'),
      )).toBe(true)

      // 9b: Low contrast ratio (4.48:1 < 4.5:1) is an advisory WARNING
      const lowContrastDesign = `# DESIGN.md\n\`\`\`css\n:root {\n  --color-canvas: #FFFFFF;\n  --color-surface: #F5F5F5;\n  --color-ink: #111827;\n  --color-muted: #767676;\n  --color-accent: #334155;\n  --color-on-accent: #FFFFFF;\n  --color-focus: #2563EB;\n}\n\`\`\``
      const contrastIssues = validateDesignTokensAndContrast(lowContrastDesign)
      expect(contrastIssues.some((issue) => issue.category === 'CONTRAST_WARNING')).toBe(true)
      expect(contrastIssues.every((issue) => !isBlockerIssue(issue))).toBe(true)
    })
  })

  describe('Security & Secret Scanning Invariants', () => {
    it('blocks simulated API keys and passwords deterministically without leaking secrets in reports', () => {
      const secretPack = buildSyntheticPack({
        ARCHITECTURE: `# ARCHITECTURE.md\n\n${VALID_ARCHITECTURE_SKELETON}\n\nDATABASE_URL="postgresql://synthetic_user:synthetic_password@db-host.internal:5432/synthetic_db"`,
      })

      const report = validateRuleBasedConsistency(secretPack)
      expect(report.isConsistent).toBe(false)
      expect(report.blocksExport).toBe(true)
      expect(report.issues).toContainEqual(
        expect.objectContaining({
          category: 'SECRET_LEAKAGE',
          severity: 'HIGH',
          affected_documents: ['ARCHITECTURE.md'],
        }),
      )

      // Critical security check: the raw secret string must never be reflected in the report JSON
      const serialized = JSON.stringify(report)
      expect(serialized).not.toContain('synthetic_password')

      // Also verify that preflight secret scanner throws
      expect(() => scanContentForSecrets(secretPack[1]!.content, 'ARCHITECTURE.md')).toThrow('SECURITY ALERT')
    })

    it('allows empty and environment placeholder credentials during validation and preflight', () => {
      const placeholderPack = buildSyntheticPack({
        ARCHITECTURE: `# ARCHITECTURE.md\n\n${VALID_ARCHITECTURE_SKELETON}\n\nDATABASE_URL=""\nNEXTAUTH_SECRET=\${NEXTAUTH_SECRET}`,
      })

      const report = validateRuleBasedConsistency(placeholderPack)
      expect(report.isConsistent).toBe(true)
      expect(report.blocksExport).toBe(false)
      expect(report.issues.filter((issue) => issue.category === 'SECRET_LEAKAGE')).toHaveLength(0)

      expect(() => scanContentForSecrets(placeholderPack[1]!.content, 'ARCHITECTURE.md')).not.toThrow()
    })
  })

  describe('Structural Integrity Across Artifacts', () => {
    it('blocks a truncated architecture document missing required sections', () => {
      const truncatedPack = buildSyntheticPack({
        ARCHITECTURE: `## 1. Overview\n## 2. Stack\n## 3. Components\n## 4. Data Flow\n### 4.1 Sync\n### 4.2 Webhook\nTruncated content.`,
      })

      const integrityIssues = validateArtifactIntegrity('ARCHITECTURE', truncatedPack[1]!.content)
      expect(integrityIssues.length).toBeGreaterThan(0)
      expect(integrityIssues[0]).toContain('Missing required section 5 of 8')
    })
  })

  describe('Synthetic Pack Readiness & Export Gate Transition', () => {
    it('verifies deterministic confirmed database conflict blocks export in consistency validation', () => {
      const pack = buildSyntheticPack({
        ARCHITECTURE: `# ARCHITECTURE.md\n\n${VALID_ARCHITECTURE_SKELETON}\n\nDatabase: SQLite`,
      })
      const contextJson = JSON.stringify({
        stack_preferences: { database: { value: 'PostgreSQL', provenance: 'confirmed' } },
      })
      const report = validateRuleBasedConsistency(pack, contextJson)
      expect(report.isConsistent).toBe(false)
      expect(report.blocksExport).toBe(true)
      expect(report.issues.some((issue) => issue.category === 'DATABASE_MISMATCH' && issue.classification === 'BLOCKER')).toBe(true)
    })

    it('verifies the complete synthetic pack reaches isReady true with zero missing or blocking types', async () => {
      const pack = buildSyntheticPack()
      dbMock.project.findFirst.mockResolvedValueOnce({
        status: 'GENERATING',
        contexts: [
          {
            id: 'ctx-current',
            isCurrent: true,
            artifactPlans: pack.map((artifact) => ({ type: artifact.type, isRequired: true })),
          },
        ],
        artifacts: pack.map((artifact) => ({
          type: artifact.type,
          path: artifact.path,
          content: artifact.content,
          status: 'READY',
          contextId: 'ctx-current',
        })),
      })

      const readiness = await getProjectReadiness('u-test', 'p-test')
      expect(readiness.isReady).toBe(true)
      expect(readiness.missingTypes).toEqual([])
      expect(readiness.blockingTypes).toEqual([])
      expect(readiness.requiredTypes.sort()).toEqual([
        'AGENT',
        'ARCHITECTURE',
        'BACKLOG',
        'DESIGN',
        'PRD',
      ])
    })

    it('blocks readiness when a synthetic pack artifact has a stale contextId or malformed structure', async () => {
      const pack = buildSyntheticPack()
      dbMock.project.findFirst.mockResolvedValueOnce({
        status: 'GENERATING',
        contexts: [
          {
            id: 'ctx-current',
            isCurrent: true,
            artifactPlans: pack.map((artifact) => ({ type: artifact.type, isRequired: true })),
          },
        ],
        artifacts: pack.map((artifact) => ({
          type: artifact.type,
          path: artifact.path,
          content: artifact.type === 'ARCHITECTURE' ? '## 1. Truncated' : artifact.content,
          status: 'READY',
          contextId: artifact.type === 'PRD' ? 'ctx-stale-old' : 'ctx-current',
        })),
      })

      const readiness = await getProjectReadiness('u-test', 'p-test')
      expect(readiness.isReady).toBe(false)
      expect(readiness.blockingTypes).toContain('PRD')
      expect(readiness.blockingTypes).toContain('ARCHITECTURE')
    })

    it('demotes EXPORTABLE to READY when an unready state occurs in the synthetic pack', async () => {
      dbMock.project.findFirst
        .mockResolvedValueOnce({ status: 'EXPORTABLE' })
        .mockResolvedValueOnce({
          status: 'EXPORTABLE',
          contexts: [
            {
              id: 'ctx-current',
              isCurrent: true,
              artifactPlans: [{ type: 'PRD', isRequired: true }],
            },
          ],
          artifacts: [
            {
              type: 'PRD',
              path: 'PRD.md',
              content: '# PRD',
              status: 'OUTDATED',
              contextId: 'ctx-current',
            },
          ],
        })
        .mockResolvedValueOnce({ status: 'EXPORTABLE' })
      dbMock.project.update.mockResolvedValueOnce({ status: 'READY' })

      await recomputeProjectReadiness('u-test', 'p-test')

      expect(dbMock.project.update).toHaveBeenCalledWith({
        where: { id: 'p-test' },
        data: { status: 'READY' },
      })
    })
  })

  describe('Historical Runtime Caveat', () => {
    it('explicitly records that historical BookNest runtime performance claims remain unverified and require disposable project testing', () => {
      // In-memory regression fixtures verify code logic and export gates, not historical wall-clock numbers.
      const regressionContext = {
        task: 'BK-042',
        reproductionStatus: 'synthetic-in-memory',
        originalProjectStatus: 'deleted',
        runtimeNumbersVerified: false,
        methodology: 'Requires newly generated disposable project with explicit timing/memory measurements.',
      }

      expect(regressionContext.runtimeNumbersVerified).toBe(false)
      expect(regressionContext.originalProjectStatus).toBe('deleted')
    })
  })
})
