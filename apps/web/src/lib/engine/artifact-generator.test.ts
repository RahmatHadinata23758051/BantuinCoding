import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  PrdDocumentSchema,
  buildPrdGeneratorUserPrompt,
  PRD_GENERATOR_SYSTEM_PROMPT,
} from '@/lib/prompts/prd-generator'
import {
  SrsDocumentSchema,
  buildSrsGeneratorUserPrompt,
  SRS_GENERATOR_SYSTEM_PROMPT,
} from '@/lib/prompts/srs-generator'
import {
  ArchitectureDocumentSchema,
  buildArchitectureGeneratorUserPrompt,
  ARCHITECTURE_GENERATOR_SYSTEM_PROMPT,
} from '@/lib/prompts/architecture-generator'
import {
  DESIGN_GENERATOR_SYSTEM_PROMPT,
  DesignDocumentPayloadSchema,
  DesignDocumentSchema,
  buildDesignGeneratorUserPrompt,
} from '@/lib/prompts/design-generator'
import { generateDesignArtifactContent, validateDesignMarkdown } from '@/lib/engine/design-generator'
import { scanContentForSecrets } from '@/lib/export/export-service'
import {
  generateCoreArtifacts,
  scrubSampleSecrets,
  generateFallbackPrd,
  generateFallbackSrs,
  generateFallbackArchitecture,
  generateFallbackDesign,
} from '@/lib/engine/artifact-generator'

vi.mock('@repo/db', () => ({
  db: {
    project: { findFirst: vi.fn() },
    artifact: { upsert: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

vi.mock('@/lib/byok/session-store', () => ({ getProviderConfig: vi.fn() }))
vi.mock('@/lib/ai/provider', () => ({ createProvider: vi.fn() }))
vi.mock('@/lib/projects/project-service', () => ({ updateProject: vi.fn() }))

const VALID_DESIGN_MARKDOWN = `---
name: "Test Project Design System"
archetype: "Contemporary Institutional"
colors:
  canvas: "#F2EEE6"
  surface: "#FBF9F4"
  border: "#A8AEA2"
  ink-primary: "#20251F"
  ink-muted: "#5E665D"
  accent: "#8B4A2F"
typography:
  display: { fontFamily: "Source Serif 4" }
  headline: { fontFamily: "Source Serif 4" }
  body: { fontFamily: "Source Sans 3" }
  mono: { fontFamily: "IBM Plex Mono" }
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
iconography:
  library: "lucide-react"
  defaultStrokeWidth: 1.5
  sizes: { sm: "14px", md: "18px", lg: "24px" }
components:
  button: { radius: "4px", padding: "8px 16px" }
---
# DESIGN.md — Test Project

## 1. Design DNA
- **Visual thesis:** A field notebook for the primary workflow.
- **Material metaphor:** A stitched field notebook.
- **Rejected direction 1:** Generic SaaS cards — rejected because they hide the workflow.
- **Rejected direction 2:** Decorative dashboard — rejected because it adds noise.
- **Exactly three signature design moves:**
  1. **Composition:** Keep the task in one readable region.
  2. **Typography:** Use a deliberate editorial pairing.
  3. **Material / interaction:** Use crisp rules for state changes.

## 2. Color & Contrast System
Palette and contrast rules.

## 3. Typography & Rhythm
Type scale and rhythm.

## 4. Layout & Spatial System
Responsive layout rules.

## 5. Signature Screen Blueprints
- Only screens supported by the context receive blueprints.

## 6. Iconography & Interaction
Keyboard and pointer rules.

## 7. Implementation Tokens
\`\`\`css
:root { --color-canvas: #F2EEE6; --color-ink: #20251F; }
\`\`\`

## 8. Anti-Defaults & Acceptance Checklist
Acceptance criteria.
`

const makeDesignResponse = (markdown = VALID_DESIGN_MARKDOWN) => ({
  title: 'DESIGN.md',
  markdown_content: markdown,
})

describe('Artifact Generation Prompts & Schemas', () => {
  it('validates a valid PRD document object', () => {
    const result = PrdDocumentSchema.safeParse({
      title: 'PRD.md',
      product_summary: 'Summary',
      problem_statement: 'Problem',
      target_users: [{ role: 'Admin', description: 'Manages users' }],
      goals: ['Goal 1'],
      non_goals: ['Non Goal 1'],
      core_user_flows: [{ flow_name: 'Login', steps: ['Enter email', 'Click submit'] }],
      feature_roadmap: [{ phase: 'Phase 1', features: [{ id: 'F-1', title: 'Auth', description: 'User login', priority: 'HIGH' as const, acceptance_criteria: ['Login works'] }] }],
      markdown_content: '# PRD\n\nContent here',
    })
    expect(result.success).toBe(true)
  })

  it('validates a valid SRS document object', () => {
    const result = SrsDocumentSchema.safeParse({
      title: 'SRS.md',
      system_overview: 'Overview',
      actors: [{ name: 'User', description: 'End user' }],
      functional_requirements: [{ id: 'FR-001', title: 'Title', description: 'Desc', inputs: ['Email'], outputs: ['Token'], acceptance_criteria: ['Passes'] }],
      non_functional_requirements: [{ id: 'NFR-001', category: 'Security', requirement: 'BYOK', measurement: '0 leaks' }],
      data_requirements: [{ entity: 'User', fields: ['id', 'email'], description: 'User data' }],
      error_behavior: [{ scenario: '401', expected_handling: 'Redirect' }],
      markdown_content: '# SRS\n\nContent',
    })
    expect(result.success).toBe(true)
  })

  it('validates a valid Architecture document object', () => {
    const result = ArchitectureDocumentSchema.safeParse({
      title: 'ARCHITECTURE.md',
      system_overview: 'System Overview',
      stack: { frontend: 'Next.js 16', backend: 'Next.js App Router', database: 'PostgreSQL', styling: 'Tailwind CSS', infrastructure: 'Vercel' },
      components: [{ name: 'AuthService', responsibility: 'Auth', boundary: 'Server' }],
      data_flow: [{ flow_name: 'Login flow', description: 'Flow desc' }],
      security_architecture: ['BYOK Key isolation'],
      deployment_strategy: 'Vercel auto-deploy',
      system_graph: { nodes: [{ id: 'client', label: 'Web client', category: 'client', description: 'Browser entry point' }, { id: 'api', label: 'Project API', category: 'api', description: 'Request boundary' }], edges: [{ source: 'client', target: 'api', label: 'requests' }] },
      markdown_content: '# ARCHITECTURE\n\nContent',
    })
    expect(result.success).toBe(true)
  })

  it('validates a valid DESIGN document object', () => {
    expect(DesignDocumentSchema.safeParse(makeDesignResponse()).success).toBe(true)
  })

  it('rejects DESIGN markdown without required structure', () => {
    const result = DesignDocumentSchema.safeParse(makeDesignResponse('# DESIGN.md'))
    expect(result.success).toBe(false)
  })

  it('rejects DESIGN markdown without YAML front matter', () => {
    const noFrontMatter = VALID_DESIGN_MARKDOWN.replace(/^---[\s\S]*?---\r?\n/m, '')
    const result = DesignDocumentSchema.safeParse(makeDesignResponse(noFrontMatter))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('YAML front matter'))).toBe(true)
    }
  })

  it('rejects YAML front matter missing required keys', () => {
    const missingKey = VALID_DESIGN_MARKDOWN.replace(/iconography:[\s\S]*?(?=components:)/m, '')
    const result = DesignDocumentSchema.safeParse(makeDesignResponse(missingKey))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('iconography'))).toBe(true)
    }
  })

  it('builds an anti-slop design prompt with context integrity rules', () => {
    const promptPrd = buildPrdGeneratorUserPrompt('Acme', '{"name":"Acme"}')
    const promptSrs = buildSrsGeneratorUserPrompt('Acme', '{"name":"Acme"}')
    const promptArch = buildArchitectureGeneratorUserPrompt('Acme', '{"name":"Acme"}')
    const promptDesign = buildDesignGeneratorUserPrompt('Acme', '{"name":"Acme"}', 3)

    expect(promptPrd).toContain('Project Name: Acme')
    expect(promptSrs).toContain('Project Name: Acme')
    expect(promptArch).toContain('Project Name: Acme')
    expect(PRD_GENERATOR_SYSTEM_PROMPT).toContain('Principal Product Manager')
    expect(SRS_GENERATOR_SYSTEM_PROMPT).toContain('Lead Systems Architect')
    expect(ARCHITECTURE_GENERATOR_SYSTEM_PROMPT).toContain('Principal Software Architect')
    expect(ARCHITECTURE_GENERATOR_SYSTEM_PROMPT).toContain('fenced Mermaid flowchart')
    expect(ARCHITECTURE_GENERATOR_SYSTEM_PROMPT).toContain('same component ids and direction')
    expect(promptDesign).toContain('Name: Acme')
    expect(promptDesign).toContain('Canonical Context Version: 3')
    expect(promptDesign).toContain('<canonical_context>')
    expect(promptDesign).toContain('canonical_context')
    expect(promptDesign).toContain('Create screen blueprints only for screens supported by canonical_context')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('Cards, gradients, borders, shadows, containers, and varied corner shapes are available choices')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('Choose radius, borders, shadows, and elevation to fit the stated direction')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).not.toContain('Exactly THREE signature design moves')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).not.toContain('ZERO icon container slop')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).not.toContain('## 4. Layout & Surface Grammar')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('## 4. Layout & Spatial System')
    expect(promptDesign).not.toContain('rigid 14px/18px/24px sizes')
    expect(promptDesign).not.toContain('universal rounded-2xl')
    const referencedPrompt = buildDesignGeneratorUserPrompt(
      'Acme',
      '{"name":"Acme"}',
      3,
      { name: 'Plate · The Pass', dnaPrompt: 'Thermal tickets and restrained alert red.' },
    )
    expect(referencedPrompt).toContain('OPTIONAL VISUAL REFERENCE — DESIGN.md ONLY')
    expect(referencedPrompt).toContain('Thermal tickets and restrained alert red.')
    expect(referencedPrompt).toContain('Do not copy its product, screens, features, data, or interactions')
    expect(promptDesign).not.toContain('OPTIONAL VISUAL REFERENCE')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).not.toContain('styles.refero.design')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).not.toContain('saasframe.io')
  })
})

describe('Design generator validation', () => {
  it('accepts a structurally valid document without repair', async () => {
    const generateStructured = vi.fn().mockResolvedValue(makeDesignResponse())
    const provider = { type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured } as never

    await expect(generateDesignArtifactContent(provider, 'Acme', '{}', 1)).resolves.toBe(VALID_DESIGN_MARKDOWN)
    expect(generateStructured).toHaveBeenCalledTimes(1)
  })

  it('sends the selected visual reference only in the design prompt', async () => {
    const generateStructured = vi.fn().mockResolvedValue(makeDesignResponse())
    const provider = { type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured } as never

    await expect(generateDesignArtifactContent(provider, 'Acme', '{"name":"Acme"}', 2, 'plite'))
      .resolves.toBe(VALID_DESIGN_MARKDOWN)
    expect(generateStructured.mock.calls[0]?.[0]).toContain('OPTIONAL VISUAL REFERENCE — DESIGN.md ONLY')
    expect(generateStructured.mock.calls[0]?.[0]).toContain('Plate · The Pass')
    expect(generateStructured.mock.calls[0]?.[0]).toContain('Professional kitchen ticket rail aesthetic')
    expect(generateStructured.mock.calls[0]?.[0]).toContain('{"name":"Acme"}')
  })

  it('does not add visual-reference guidance when the model chooses', async () => {
    const generateStructured = vi.fn().mockResolvedValue(makeDesignResponse())
    const provider = { type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured } as never

    await generateDesignArtifactContent(provider, 'Acme', '{"name":"Acme"}', 2)
    expect(generateStructured.mock.calls[0]?.[0]).not.toContain('OPTIONAL VISUAL REFERENCE')
  })

  it('repairs a valid-schema response missing the top-level heading once', async () => {
    const invalid = VALID_DESIGN_MARKDOWN.replace('# DESIGN.md — Test Project', 'Design contract')
    const generateStructured = vi.fn()
      .mockResolvedValueOnce(makeDesignResponse(invalid))
      .mockResolvedValueOnce(makeDesignResponse())
    const provider = { type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured } as never

    await expect(generateDesignArtifactContent(provider, 'Acme', '{}', 1)).resolves.toBe(VALID_DESIGN_MARKDOWN)
    expect(generateStructured).toHaveBeenCalledTimes(2)
    expect(generateStructured.mock.calls[1]?.[0]).toContain('<draft_to_repair>')
    expect(generateStructured.mock.calls[1]?.[0]).toContain(invalid)
    expect(generateStructured.mock.calls[1]?.[0]).toContain('Missing top-level # DESIGN.md heading')
  })

  it('retains a substantive draft when repair fails', async () => {
    const invalid = VALID_DESIGN_MARKDOWN.replace('# DESIGN.md — Test Project', 'Design contract')
    const generateStructured = vi.fn()
      .mockResolvedValueOnce(makeDesignResponse(invalid))
      .mockRejectedValueOnce(new Error('provider unavailable'))
    const provider = { type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured } as never

    await expect(generateDesignArtifactContent(provider, 'Acme', '{}', 1)).resolves.toBe(invalid)
    expect(generateStructured).toHaveBeenCalledTimes(2)
  })

  it('reports strict structural and content violations', () => {
    expect(validateDesignMarkdown('')).toEqual(['Markdown content cannot be empty'])
    const violations = validateDesignMarkdown('# DESIGN.md\n\n## 1. Design DNA')
    expect(violations).toContain('Missing required heading: ## 2. Color & Contrast System')
    expect(violations).toContain('Missing meaningful CSS token block with :root custom properties')
    expect(violations).toContain('Missing conditional screen blueprint rule')
  })

  it('rejects headings inside CSS fences and empty CSS token blocks', () => {
    const fencedHeading = VALID_DESIGN_MARKDOWN.replace('## 8. Anti-Defaults & Acceptance Checklist', '```text\n## 8. Anti-Defaults & Acceptance Checklist\n```')
    expect(validateDesignMarkdown(fencedHeading)).toContain('Missing required heading: ## 8. Anti-Defaults & Acceptance Checklist')
    expect(validateDesignMarkdown(VALID_DESIGN_MARKDOWN.replace(/:root \{[^}]+\}/, ':root {}'))).toContain('Missing meaningful CSS token block with :root custom properties')
  })
})

describe('Artifact Generator Fallbacks', () => {
  it('generates fallback PRD markdown', () => {
    const md = generateFallbackPrd('Acme App', { summary: 'Sample app summary', goals: [{ value: 'Goal A' }] })
    expect(md).toContain('# PRD.md — Acme App')
    expect(md).toContain('Sample app summary')
    expect(md).toContain('Goal A')
  })

  it('generates fallback SRS markdown', () => {
    const md = generateFallbackSrs('Acme App', { functional_requirements: [{ id: 'FR-001', title: 'Login', description: 'User authentication' }] })
    expect(md).toContain('# SRS.md — Acme App')
    expect(md).toContain('FR-001: Login')
  })

  it('generates fallback Architecture markdown', () => {
    const md = generateFallbackArchitecture('Acme App', { stack_preferences: { frontend: { value: 'React 19' }, backend: { value: 'Node' }, database: { value: 'PostgreSQL' } } })
    expect(md).toContain('# ARCHITECTURE.md — Acme App')
    expect(md).toContain('React 19')
  })

  it('generates contextual fallback Design markdown without generic presets', () => {
    const md = generateFallbackDesign('Acme App', { design_direction: { value: 'Clean Minimalist Scandinavian' }, stack_preferences: { styling: { value: 'Tailwind CSS v4' } } })
    expect(DesignDocumentSchema.safeParse({ title: 'DESIGN.md', markdown_content: md }).success).toBe(true)
    expect(md).toContain('Clean Minimalist Scandinavian')
    expect(md).toContain('Tailwind CSS v4')
    expect(md).not.toContain('Luxury Split-Screen Auth')
    expect(md).not.toContain('Bento-Grid Dashboard')
    expect(md).not.toContain('Awwwards-grade')
  })

  it('adapts fallback Design archetype only from project evidence', () => {
    const devMd = generateFallbackDesign('Acme CLI', { summary: 'Developer CLI tool and API platform for cloud telemetry', classification: 'API_SERVICE' })
    expect(devMd).toContain('Not confirmed; choose from the project context before implementation.')
    expect(devMd).toContain('Developer CLI tool and API platform for cloud telemetry')

    const editorialMd = generateFallbackDesign('Acme Journal', { summary: 'Publishing newsletter and editorial archive' })
    expect(editorialMd).toContain('Not confirmed; choose from the project context before implementation.')
    expect(editorialMd).toContain('Publishing newsletter and editorial archive')

    const neoMd = generateFallbackDesign('Retro Site', { design_direction: { value: 'Vibrant Neo-Brutalism with bold borders' } })
    expect(neoMd).toContain('Vibrant Neo-Brutalism with bold borders')
  })

  it('does not invent authentication or data views when context is silent', () => {
    const md = generateFallbackDesign('Static Page', { summary: 'A single informational page for a local event' })
    expect(md).toContain('no screen blueprint is invented')
    expect(md).not.toContain('Authentication states')
    expect(md).not.toContain('Data views use')
  })

  it('includes only context-supported screen guidance', () => {
    const md = generateFallbackDesign('Ledger', { summary: 'Users sign in to review transaction records in a table' })
    expect(md).toContain('Authentication states are described only if present in the context.')
    expect(md).toContain('Data views use only project objects and density stated in the context.')
  })
})

describe('Generated sample secret sanitizer', () => {
  it('replaces dummy connection URLs and long hex secrets while preserving placeholders', () => {
    const content = ['DATABASE_URL="postgresql://pos_admin:secure_password@db-host:5432/resto_pos"', 'DIRECT_URL="postgresql://pos_admin:secure_password@db-host:5432/resto_pos"', 'NEXTAUTH_SECRET="4f9b8c2e6d1a5f7823e1b0c9a87d4e5f6123456789abcdef0123456789abcdef"', 'API_TOKEN=${API_TOKEN}'].join('\n')
    expect(scrubSampleSecrets(content)).toBe(['DATABASE_URL=""', 'DIRECT_URL=""', 'NEXTAUTH_SECRET=""', 'API_TOKEN=${API_TOKEN}'].join('\n'))
  })

  it('sanitizes quoted, unquoted, exported, and named sample values', () => {
    const content = ['export DATABASE_URL=postgresql://user:password@localhost:5432/db # local example', 'DATABASE_URL="postgresql://localhost:5432/db"', 'NEXTAUTH_SECRET="your-secret"', 'JWT_SECRET=placeholder', 'API_KEY=your_api_key_here', 'API_TOKEN=${API_TOKEN}', 'OTHER_SECRET=<set-me>'].join('\n')
    expect(scrubSampleSecrets(content)).toBe(['export DATABASE_URL="" # local example', 'DATABASE_URL=""', 'NEXTAUTH_SECRET=""', 'JWT_SECRET=""', 'API_KEY=""', 'API_TOKEN=${API_TOKEN}', 'OTHER_SECRET=<set-me>'].join('\n'))
  })

  it('leaves ambiguous credentials untouched so the final scanner can reject them', () => {
    const content = ['DATABASE_URL=postgresql://service:9f7d3a8c2b1e@production-db.example.net/app', 'API_KEY=production_live_value_unmasked'].join('\n')
    expect(scrubSampleSecrets(content)).toBe(content)
  })

  it('allows scrubbed sample content to pass strict scanner while blocking real secrets', () => {
    const generatedSample = ['# ARCHITECTURE.md', 'DATABASE_URL="postgresql://pos_admin:secure_password@db-host:5432/resto_pos"', 'NEXTAUTH_SECRET="your-secret-key"', 'JWT_SECRET="changeme"', 'API_TOKEN=${API_TOKEN}'].join('\n')
    const scrubbed = scrubSampleSecrets(generatedSample)
    expect(() => scanContentForSecrets(scrubbed, 'ARCHITECTURE.md')).not.toThrow()
    const genuineSecret = ['# ARCHITECTURE.md', 'API_KEY="sk-1234567890abcdef1234567890"'].join('\n')
    expect(() => scanContentForSecrets(scrubSampleSecrets(genuineSecret), 'ARCHITECTURE.md')).toThrow('SECURITY ALERT: Potential API key leakage detected in ARCHITECTURE.md')
  })
})

describe('Artifact Generator Engine — generateCoreArtifacts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)
    await expect(generateCoreArtifacts({ userId: 'u-1', projectId: 'p-invalid' })).rejects.toThrow('Project not found')
  })

  it('throws error if no current context exists', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [] } as never)
    await expect(generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('No Canonical Project Context found')
  })

  it('blocks core generation when no active BYOK session exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [{ id: 'ctx-1', version: 1, isCurrent: true, contentJson: '{"summary":"Test"}', artifactPlans: [] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce(null)
    await expect(generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow('No active AI provider session found')
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('supports single-artifact regeneration (e.g. PRD only)', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [{ id: 'ctx-1', version: 1, isCurrent: true, contentJson: '{"summary":"Test"}', artifactPlans: [] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockResolvedValue({ markdown_content: '# PRD' }) })
    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['PRD'] })
    expect(results).toHaveLength(1)
    expect(results[0]?.type).toBe('PRD')
    expect(db.artifact.upsert).toHaveBeenCalledTimes(1)
    expect(db.artifact.update).toHaveBeenCalledTimes(1)
  })

  it('supports DESIGN-only regeneration through the structured design generator', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [{ id: 'ctx-1', version: 4, isCurrent: true, contentJson: '{"design_direction":{"value":"Editorial","provenance":"confirmed"}}', artifactPlans: [{ type: 'DESIGN', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValueOnce(makeDesignResponse())
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })
    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['DESIGN'] })
    expect(results).toEqual([{ type: 'DESIGN', status: 'READY', path: 'DESIGN.md', content: VALID_DESIGN_MARKDOWN }])
    expect(generateStructured).toHaveBeenCalledWith(expect.stringContaining('Canonical Context Version: 4'), DesignDocumentPayloadSchema, expect.objectContaining({ system: DESIGN_GENERATOR_SYSTEM_PROMPT }))
    expect(db.artifact.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { projectId_type: { projectId: 'p-1', type: 'DESIGN' } } }))
  })

  it('uses only required core artifacts from the current plan', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [{ id: 'ctx-1', version: 1, contentJson: '{}', artifactPlans: [{ type: 'PRD', isRequired: true }, { type: 'AGENT', isRequired: true }, { type: 'BACKLOG', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockResolvedValue({ markdown_content: '# PRD' }) })
    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1' })
    expect(results.map((result) => result.type)).toEqual(['PRD'])
    expect(db.artifact.upsert).toHaveBeenCalledTimes(1)
  })

  it('includes required DESIGN in default plan-aware core generation', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [{ id: 'ctx-1', version: 2, contentJson: '{"summary":"Test"}', artifactPlans: [{ type: 'DESIGN', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'test-key' })
    const generateStructured = vi.fn().mockResolvedValue(makeDesignResponse())
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured })
    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1' })
    expect(results.map((result) => result.type)).toEqual(['DESIGN'])
    expect(db.artifact.upsert).toHaveBeenCalledTimes(1)
    expect(generateStructured).toHaveBeenCalledTimes(1)
  })

  it('uses the contextual fallback when design generation fails before validation', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [{ id: 'ctx-1', version: 1, isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'DESIGN', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockRejectedValueOnce(new Error('Provider unavailable')) })
    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['DESIGN'] })
    expect(results[0]).toEqual(expect.objectContaining({ type: 'DESIGN', status: 'READY', path: 'DESIGN.md' }))
    expect(results[0]?.content).toContain('# DESIGN.md')
    expect(db.artifact.update).toHaveBeenCalledWith(expect.objectContaining({ where: { projectId_type: { projectId: 'p-1', type: 'DESIGN' } }, data: expect.objectContaining({ status: 'READY' }) }))
  })

  it('marks DESIGN failed only when the fallback path itself cannot produce content', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [{ id: 'ctx-1', version: 1, isCurrent: true, contentJson: '{}', artifactPlans: [{ type: 'DESIGN', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockRejectedValueOnce(new Error('Provider unavailable')) })
    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['DESIGN'] })
    expect(results[0]?.status).toBe('READY')
  })

  it('persists the same-call architecture graph and removes invalid edges', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Graph Project', contexts: [{ id: 'ctx-1', version: 1, contentJson: '{}', artifactPlans: [{ type: 'ARCHITECTURE', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockResolvedValueOnce({ markdown_content: '# Architecture', system_graph: { nodes: [{ id: 'client', label: 'Client', category: 'client', description: 'Browser' }], edges: [{ source: 'client', target: 'missing', label: 'ignored' }] } }) })
    await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['ARCHITECTURE'] })
    const graphUpdate = vi.mocked(db.artifact.update).mock.calls.find(([call]) => call.where?.projectId_type?.type === 'SYSTEM_GRAPH')
    expect(graphUpdate?.[0]).toEqual(expect.objectContaining({ where: { projectId_type: { projectId: 'p-1', type: 'SYSTEM_GRAPH' } }, data: expect.objectContaining({ status: 'READY', content: JSON.stringify({ nodes: [{ id: 'client', label: 'Client', category: 'client', description: 'Browser' }], edges: [] }) }) }))
  })

  it('falls back to validated architecture components when provider omits graph data', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Fallback Graph Project', contexts: [{ id: 'ctx-1', version: 1, contentJson: '{}', artifactPlans: [{ type: 'ARCHITECTURE', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockResolvedValueOnce({ markdown_content: '# Architecture', components: [{ name: 'Web Client', responsibility: 'Browser UI', boundary: 'Client' }, { name: 'Project API', responsibility: 'Request handling', boundary: 'Server' }], data_flow: [{ flow_name: 'Browser requests API', description: 'Web Client sends requests to Project API' }] }) })
    await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['ARCHITECTURE'] })
    const graphUpdate = vi.mocked(db.artifact.update).mock.calls.find(([call]) => call.where?.projectId_type?.type === 'SYSTEM_GRAPH')
    expect(graphUpdate?.[0]?.data).toEqual(expect.objectContaining({ status: 'READY', content: JSON.stringify({ nodes: [{ id: 'web-client', label: 'Web Client', category: 'client', description: 'Browser UI' }, { id: 'project-api', label: 'Project API', category: 'api', description: 'Request handling' }], edges: [{ source: 'web-client', target: 'project-api', label: 'Browser requests API' }] }) }))
  })

  it('falls back to Markdown components and data flows when structured graph data is absent', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    const markdown = [
      '# Architecture',
      '## 3. System Component Breakdown',
      '### 3.1 Web Client',
      'Browser user interface.',
      '### 3.2 Backend Server',
      'Application server for API and domain logic.',
      '### 3.3 PostgreSQL Database',
      'Relational database persistence.',
      '## 4. Data Flow',
      '### 4.1 Authenticated Request',
      '1. The Web Client sends a request to the Backend Server.',
      '2. The Backend Server queries the PostgreSQL Database.',
    ].join('\n')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Markdown Graph Project', contexts: [{ id: 'ctx-1', version: 1, contentJson: '{}', artifactPlans: [{ type: 'ARCHITECTURE', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockResolvedValueOnce({ markdown_content: markdown }) })

    await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['ARCHITECTURE'] })

    const graphUpdate = vi.mocked(db.artifact.update).mock.calls.find(([call]) => call.where?.projectId_type?.type === 'SYSTEM_GRAPH')
    expect(graphUpdate?.[0]?.data).toEqual(expect.objectContaining({
      status: 'READY',
      content: JSON.stringify({
        nodes: [
          { id: 'web-client', label: 'Web Client', category: 'client', description: 'Browser user interface.' },
          { id: 'backend-server', label: 'Backend Server', category: 'service', description: 'Application server for API and domain logic.' },
          { id: 'postgresql-database', label: 'PostgreSQL Database', category: 'database', description: 'Relational database persistence.' },
        ],
        edges: [
          { source: 'web-client', target: 'backend-server', label: 'Authenticated Request' },
          { source: 'backend-server', target: 'postgresql-database', label: 'Authenticated Request' },
        ],
      }),
    }))
  })

  it('deletes system graph when no usable graph or components are present', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Empty Architecture Project', contexts: [{ id: 'ctx-1', version: 1, contentJson: '{}', artifactPlans: [{ type: 'ARCHITECTURE', isRequired: true }] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'model', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockResolvedValueOnce({ markdown_content: '# Architecture', components: [], data_flow: [] }) })
    await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['ARCHITECTURE'] })
    expect(db.artifact.delete).toHaveBeenCalledWith({ where: { projectId_type: { projectId: 'p-1', type: 'SYSTEM_GRAPH' } } })
  })

  it('retries only incomplete planned core artifacts', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    const mockProject = { id: 'p-1', userId: 'u-1', name: 'Retry Project', contexts: [{ id: 'ctx-1', version: 1, contentJson: '{}', artifactPlans: [{ type: 'PRD', isRequired: true }, { type: 'DESIGN', isRequired: true }, { type: 'BACKLOG', isRequired: true }] }], artifacts: [{ type: 'PRD', contextId: 'ctx-1', status: 'READY' }, { type: 'DESIGN', contextId: 'ctx-1', status: 'FAILED' }] } as never
    vi.mocked(db.project.findFirst).mockResolvedValue(mockProject)
    vi.mocked(getProviderConfig).mockReturnValue({ provider: 'ANTHROPIC', model: 'model', apiKey: 'test-key' })
    vi.mocked(createProvider).mockReturnValue({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockResolvedValueOnce(makeDesignResponse()) })
    const { regenerateFailedArtifacts } = await import('@/lib/engine/artifact-generator')
    const results = await regenerateFailedArtifacts({ userId: 'u-1', projectId: 'p-1' })
    expect(results[0]).toEqual(expect.objectContaining({ type: 'DESIGN', status: 'READY' }))
    expect(db.artifact.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { projectId_type: { projectId: 'p-1', type: 'DESIGN' } } }))
  })

  it('uses AI provider when BYOK session is active', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', name: 'Test Project', contexts: [{ id: 'ctx-1', version: 1, isCurrent: true, contentJson: '{"summary":"Test"}', artifactPlans: [] }] } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-test' })
    vi.mocked(createProvider).mockReturnValueOnce({ type: 'ANTHROPIC', testConnection: vi.fn(), generateStructured: vi.fn().mockResolvedValue({ markdown_content: '# AI Generated PRD Document' }) })
    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1', types: ['PRD'] })
    expect(results[0]?.status).toBe('READY')
    expect(results[0]?.content).toBe('# AI Generated PRD Document')
  })
})
