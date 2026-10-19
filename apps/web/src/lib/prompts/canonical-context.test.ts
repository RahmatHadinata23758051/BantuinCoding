import { describe, expect, it } from 'vitest'
import { buildAuthoritativeContextBlock } from './canonical-context'
import { buildPrdGeneratorUserPrompt } from './prd-generator'
import { buildSrsGeneratorUserPrompt } from './srs-generator'
import { buildArchitectureGeneratorUserPrompt } from './architecture-generator'
import { buildDesignGeneratorUserPrompt } from './design-generator'
import { buildAgentRulesGeneratorUserPrompt } from './agent-rules-generator'
import { buildBacklogGeneratorUserPrompt } from './backlog-generator'
import { buildConsistencyValidatorUserPrompt } from './consistency-validator'

describe('buildAuthoritativeContextBlock (BK-035)', () => {
  it('handles empty or malformed input gracefully without throwing', () => {
    const fromNull = buildAuthoritativeContextBlock(null as unknown as string)
    expect(fromNull).toContain('AUTHORITATIVE CANONICAL DECISIONS')
    expect(fromNull).toContain('Context data not available')

    const fromInvalidJson = buildAuthoritativeContextBlock('not-json-content')
    expect(fromInvalidJson).toContain('AUTHORITATIVE CANONICAL DECISIONS')
  })

  it('preserves confirmed vs assumed vs unknown provenance accurately from JSON string', () => {
    const contextJson = JSON.stringify({
      project_name: 'MoneyTrack',
      summary: 'Personal finance tracker',
      stack_preferences: {
        frontend: { value: 'Next.js 16', provenance: 'confirmed' },
        backend: { value: 'Next.js App Router', provenance: 'confirmed' },
        database: { value: 'PostgreSQL', provenance: 'assumed' },
        styling: { value: 'Tailwind CSS', provenance: 'unknown' },
      },
      deployment_target: { value: 'Vercel', provenance: 'confirmed' },
      design_direction: { value: 'Dense Financial Workspace', provenance: 'assumed' },
      confirmed_decisions: [
        { value: 'BYOK API keys in volatile memory only', provenance: 'confirmed' },
        { value: 'Zero external cloud storage dependencies', provenance: 'confirmed' },
      ],
      technical_constraints: [
        { value: 'Must run on Node 20 LTS', provenance: 'confirmed' },
      ],
      core_entities: [
        { name: 'Transaction', fields: ['id', 'amount', 'date', 'category'] },
        { name: 'Account', fields: ['id', 'name', 'balance'] },
      ],
      functional_requirements: [
        { id: 'FR-001', title: 'Manual transaction entry', provenance: 'confirmed' },
        { id: 'FR-002', title: 'CSV export', provenance: 'assumed' },
      ],
      assumptions: [
        { value: 'Single user desktop application', provenance: 'assumed' },
      ],
      open_questions: [
        { value: 'Should recurring transactions be scheduled locally?', provenance: 'unknown' },
      ],
    })

    const block = buildAuthoritativeContextBlock(contextJson)

    expect(block).toContain('FRONTEND: Next.js 16 [CONFIRMED]')
    expect(block).toContain('BACKEND: Next.js App Router [CONFIRMED]')
    expect(block).toContain('DATABASE: PostgreSQL [ASSUMED]')
    expect(block).toContain('STYLING: Tailwind CSS [UNKNOWN]')
    expect(block).toContain('DEPLOYMENT: Vercel [CONFIRMED]')
    expect(block).toContain('DESIGN DIRECTION: Dense Financial Workspace [ASSUMED]')
    expect(block).toContain('BYOK API keys in volatile memory only [CONFIRMED]')
    expect(block).toContain('Must run on Node 20 LTS [CONFIRMED]')
    expect(block).toContain('Transaction: fields [id, amount, date, category]')
    expect(block).toContain('FR-001: Manual transaction entry [CONFIRMED]')
    expect(block).toContain('FR-002: CSV export [ASSUMED]')
    expect(block).toContain('Single user desktop application')
    expect(block).toContain('Should recurring transactions be scheduled locally?')
  })

  it('works identically when passed a parsed object', () => {
    const contextObj = {
      project_name: 'TestApp',
      stack_preferences: {
        frontend: { value: 'React', provenance: 'confirmed' },
        backend: { value: 'Express', provenance: 'assumed' },
        database: { value: 'SQLite', provenance: 'confirmed' },
        styling: { value: 'CSS Modules', provenance: 'assumed' },
      },
    }

    const block = buildAuthoritativeContextBlock(contextObj)
    expect(block).toContain('FRONTEND: React [CONFIRMED]')
    expect(block).toContain('DATABASE: SQLite [CONFIRMED]')
    expect(block).toContain('BACKEND: Express [ASSUMED]')
  })

  it('injects authoritative block into all core prompt builders consistently', () => {
    const contextJson = JSON.stringify({
      stack_preferences: {
        database: { value: 'PostgreSQL', provenance: 'confirmed' },
      },
      confirmed_decisions: [{ value: 'No third-party trackers', provenance: 'confirmed' }],
    })

    const prdPrompt = buildPrdGeneratorUserPrompt('App', contextJson)
    expect(prdPrompt).toContain('DATABASE: PostgreSQL [CONFIRMED]')
    expect(prdPrompt).toContain('No third-party trackers [CONFIRMED]')

    const srsPrompt = buildSrsGeneratorUserPrompt('App', contextJson)
    expect(srsPrompt).toContain('DATABASE: PostgreSQL [CONFIRMED]')

    const archPrompt = buildArchitectureGeneratorUserPrompt('App', contextJson)
    expect(archPrompt).toContain('DATABASE: PostgreSQL [CONFIRMED]')

    const designPrompt = buildDesignGeneratorUserPrompt('App', contextJson, 1)
    expect(designPrompt).toContain('DATABASE: PostgreSQL [CONFIRMED]')

    const agentPrompt = buildAgentRulesGeneratorUserPrompt('App', contextJson)
    expect(agentPrompt).toContain('DATABASE: PostgreSQL [CONFIRMED]')

    const backlogPrompt = buildBacklogGeneratorUserPrompt('App', contextJson, 'prd', 'srs', 'arch')
    expect(backlogPrompt).toContain('DATABASE: PostgreSQL [CONFIRMED]')

    const consistencyPrompt = buildConsistencyValidatorUserPrompt('App', '[]', contextJson)
    expect(consistencyPrompt).toContain('DATABASE: PostgreSQL [CONFIRMED]')
  })
})
