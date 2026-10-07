import { describe, it, expect } from 'vitest'
import { generateFallbackPrd, generateFallbackSrs, generateFallbackArchitecture } from '@/lib/engine/artifact-generator'
import { generateFallbackAgentMd, generateFallbackRulesMd } from '@/lib/engine/agent-rules-generator'
import { internalCatalogFallback } from '@/lib/engine/skill-resolver'
import { validateBacklogDependencies } from '@/lib/engine/backlog-validator'
import { validateRuleBasedConsistency } from '@/lib/engine/consistency-validator'
import { validateZipPath, scanContentForSecrets, generateBootstrapReadme } from '@/lib/export/export-service'
import { sanitizeHtml } from '@/lib/artifacts/sanitizer'

describe('End-to-End Pipeline & Final Quality Control Suite', () => {
  it('executes complete document generation, resolution, dependency, and security validation', () => {
    // 1. Fallback Core Document Generation
    const prd = generateFallbackPrd('Acme SaaS App', {
      summary: 'A high-performance SaaS analytics platform.',
      goals: ['Real-time metrics', 'Multi-tenant isolation'],
      user_roles: ['Admin', 'Analyst'],
    })
    const srs = generateFallbackSrs('Acme SaaS App', {
      database: 'PostgreSQL',
      framework: 'Next.js App Router',
    })
    const arch = generateFallbackArchitecture('Acme SaaS App', {
      architecture_type: 'Monolith',
      frontend: 'Next.js App Router',
      backend: 'Node.js',
      database: 'PostgreSQL',
    })
    const agentMd = generateFallbackAgentMd('Acme SaaS App', 'CLAUDE_CODE')
    const rulesMd = generateFallbackRulesMd('Acme SaaS App')

    expect(prd).toContain('# PRD.md')
    expect(srs).toContain('# SRS.md')
    expect(arch).toContain('# ARCHITECTURE.md')
    expect(agentMd).toContain('# Agent.md — Operational Contract')
    expect(rulesMd).toContain('# Agent.md — Operational Rules')

    // 2. Skill Catalog Resolution
    expect(internalCatalogFallback.length).toBeGreaterThan(0)
    expect(internalCatalogFallback[0]?.source).toBe('skillsllm.com')

    // 3. Backlog Dependency Graph Validation & Readiness
    const samplePhases = [
      {
        name: 'Phase 1',
        order: 1,
        tasks: [
          {
            id: 'BK-001',
            title: 'Init',
            description: 'Init project',
            dependencies: [],
            acceptance_criteria: ['Done'],
            definition_of_done: 'Done',
            relevant_docs: [],
            recommended_skills: [],
          },
        ],
      },
    ]
    const backlogValidation = validateBacklogDependencies(samplePhases)
    expect(backlogValidation.isValid).toBe(true)
    expect(backlogValidation.errors.length).toBe(0)
    expect(backlogValidation.taskStatusMap['BK-001']).toBe('READY')

    // 4. Consistency Audit across Artifacts
    const artifacts = [
      { type: 'PRD', path: 'PRD.md', content: prd },
      { type: 'SRS', path: 'SRS.md', content: srs },
      { type: 'ARCHITECTURE', path: 'ARCHITECTURE.md', content: arch },
      { type: 'AGENT', path: 'Agent.md', content: agentMd },
      { type: 'RULES', path: 'RULES.md', content: rulesMd },
    ]
    const consistencyReport = validateRuleBasedConsistency(artifacts)
    expect(consistencyReport.score).toBeGreaterThanOrEqual(70)

    // 5. ZIP Export Safety & Secret Leakage Scans
    for (const art of artifacts) {
      expect(validateZipPath(art.path)).toBe(art.path)
      expect(() => scanContentForSecrets(art.content, art.path)).not.toThrow()
    }
    const readme = generateBootstrapReadme('Acme SaaS App', 'CLAUDE_CODE')
    expect(() => scanContentForSecrets(readme, 'README.md')).not.toThrow()

    // 6. Markdown HTML Sanitization (Prevent XSS/Script Injection)
    const dangerousHtml = '<div onclick="alert(1)">Text</div><script>console.log("bad")</script><iframe src="malicious.html"></iframe><a href="javascript:alert(1)">Link</a>'
    const safeHtml = sanitizeHtml(dangerousHtml)
    expect(safeHtml).not.toContain('<script>')
    expect(safeHtml).not.toContain('<iframe')
    expect(safeHtml).not.toContain('onclick=')
    expect(safeHtml).not.toContain('href="javascript:')
  })
})
