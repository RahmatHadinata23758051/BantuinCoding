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
  DesignDocumentSchema,
  buildDesignGeneratorUserPrompt,
  DESIGN_GENERATOR_SYSTEM_PROMPT,
} from '@/lib/prompts/design-generator'
import {
  generateCoreArtifacts,
  generateFallbackPrd,
  generateFallbackSrs,
  generateFallbackArchitecture,
  generateFallbackDesign,
} from '@/lib/engine/artifact-generator'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
    artifact: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

vi.mock('@/lib/projects/project-service', () => ({
  updateProject: vi.fn(),
}))

describe('Artifact Generation Prompts & Schemas', () => {
  it('validates a valid PRD document object', () => {
    const prdData = {
      title: 'PRD.md',
      product_summary: 'Summary',
      problem_statement: 'Problem',
      target_users: [{ role: 'Admin', description: 'Manages users' }],
      goals: ['Goal 1'],
      non_goals: ['Non Goal 1'],
      core_user_flows: [{ flow_name: 'Login', steps: ['Enter email', 'Click submit'] }],
      feature_roadmap: [
        {
          phase: 'Phase 1',
          features: [
            {
              id: 'F-1',
              title: 'Auth',
              description: 'User login',
              priority: 'HIGH' as const,
              acceptance_criteria: ['Login works'],
            },
          ],
        },
      ],
      markdown_content: '# PRD\n\nContent here',
    }
    const result = PrdDocumentSchema.safeParse(prdData)
    expect(result.success).toBe(true)
  })

  it('validates a valid SRS document object', () => {
    const srsData = {
      title: 'SRS.md',
      system_overview: 'Overview',
      actors: [{ name: 'User', description: 'End user' }],
      functional_requirements: [
        {
          id: 'FR-001',
          title: 'Title',
          description: 'Desc',
          inputs: ['Email'],
          outputs: ['Token'],
          acceptance_criteria: ['Passes'],
        },
      ],
      non_functional_requirements: [
        {
          id: 'NFR-001',
          category: 'Security',
          requirement: 'BYOK',
          measurement: '0 leaks',
        },
      ],
      data_requirements: [{ entity: 'User', fields: ['id', 'email'], description: 'User data' }],
      error_behavior: [{ scenario: '401', expected_handling: 'Redirect' }],
      markdown_content: '# SRS\n\nContent',
    }
    const result = SrsDocumentSchema.safeParse(srsData)
    expect(result.success).toBe(true)
  })

  it('validates a valid Architecture document object', () => {
    const archData = {
      title: 'ARCHITECTURE.md',
      system_overview: 'System Overview',
      stack: {
        frontend: 'Next.js 16',
        backend: 'Next.js App Router',
        database: 'PostgreSQL',
        styling: 'Tailwind CSS',
        infrastructure: 'Vercel',
      },
      components: [{ name: 'AuthService', responsibility: 'Auth', boundary: 'Server' }],
      data_flow: [{ flow_name: 'Login flow', description: 'Flow desc' }],
      security_architecture: ['BYOK Key isolation'],
      deployment_strategy: 'Vercel auto-deploy',
      markdown_content: '# ARCHITECTURE\n\nContent',
    }
    const result = ArchitectureDocumentSchema.safeParse(archData)
    expect(result.success).toBe(true)
  })

  it('validates a valid DESIGN document object', () => {
    const designData = {
      title: 'DESIGN.md',
      meta: {
        generatedAt: '2026-09-28T00:00:00.000Z',
        contextVersion: 3,
        provenance: { design_direction: 'confirmed' as const },
      },
      designSystem: {
        colorPalette: [
          { name: 'Paper', role: 'canvas', hex: '#F7F0DF', usage: 'Primary app surface' },
        ],
        typography: {
          scale: 'Editorial modular scale',
          fontFamilies: { heading: 'Geist Sans', body: 'Geist Sans', mono: 'Geist Mono' },
          hierarchy: ['Display masthead', 'Panel heading'],
        },
        spacing: { baseUnit: '4px', scale: ['4px', '8px'], rules: ['Use compact ledger spacing'] },
        borders: { width: '2px', radius: '4px', tokens: ['border: 2px solid #151515'] },
        shadows: [{ elevation: 'default', token: '5px 5px 0 #151515', usage: 'Primary panels' }],
        motion: {
          reducedMotion: true,
          durations: ['120ms'],
          easings: ['ease-out'],
          rules: ['Motion communicates state changes only'],
        },
        components: [
          { name: 'Button', variants: ['primary'], states: ['default', 'focus'], a11yNotes: 'Visible focus ring' },
        ],
        composition: {
          grid: 'Asymmetric editorial grid',
          asymmetry: 'One action panel anchors the page',
          density: 'Information dense',
          rules: ['Current step always visible'],
        },
        tokens: {
          cssVariables: { '--color-paper': '#F7F0DF' },
          tailwindConfig: { colors: { paper: '#F7F0DF' } },
        },
      },
      applicationDesign: {
        pages: [{ route: '/', purpose: 'Landing', keyComponents: ['Pipeline strip'], responsiveBehavior: 'Stack panels on mobile' }],
        userFlows: [{ name: 'Create project', steps: ['Enter idea'], entryPoints: ['/'], exitPoints: ['/workspace'] }],
        responsiveBreakpoints: [{ name: 'mobile', width: '320px', layoutShifts: ['Single column'] }],
        accessibility: {
          wcagLevel: 'AA',
          colorContrast: 'Minimum 4.5:1',
          keyboardNavigation: 'All actions reachable by keyboard',
          screenReader: 'Landmarks and labels required',
        },
        internationalization: { rtlSupport: false, fontFallbacks: ['system-ui'], textExpansion: 'Allow 30% expansion' },
      },
      implementationGuidance: {
        cssArchitecture: 'Tailwind tokens backed by CSS variables',
        componentLibrary: 'Local primitives',
        themingStrategy: 'Warm-paper light theme',
        darkMode: 'Not required for MVP',
        performanceBudget: [{ metric: 'LCP', target: '<2.5s' }],
      },
      pipelineStrip: { stages: ['IDEA', 'CLARIFY', 'CONTEXT', 'GENERATE', 'REVIEW', 'EXPORT'], variant: 'default' as const },
      markdown_content: '# DESIGN.md\n\nProject-specific visual contract',
    }

    const result = DesignDocumentSchema.safeParse(designData)
    expect(result.success).toBe(true)
  })

  it('builds prompt containing project name and context', () => {
    const promptPrd = buildPrdGeneratorUserPrompt('Acme', '{"name":"Acme"}')
    const promptSrs = buildSrsGeneratorUserPrompt('Acme', '{"name":"Acme"}')
    const promptArch = buildArchitectureGeneratorUserPrompt('Acme', '{"name":"Acme"}')
    const promptDesign = buildDesignGeneratorUserPrompt('Acme', '{"name":"Acme"}', 3)

    expect(promptPrd).toContain('Project Name: Acme')
    expect(promptSrs).toContain('Project Name: Acme')
    expect(promptArch).toContain('Project Name: Acme')
    expect(promptDesign).toContain('Project Name: Acme')
    expect(promptDesign).toContain('Canonical Context Version: 3')
    expect(promptDesign).toContain('DESIGN BRIEF & INSTRUCTIONS')
    expect(promptDesign).toContain('styles.refero.design')
    expect(promptDesign).toContain('saasframe.io')
    expect(promptDesign).toContain('land-book.com')
    expect(promptDesign).toContain('mobbin.com')
    expect(PRD_GENERATOR_SYSTEM_PROMPT).toContain('Principal Product Manager')
    expect(SRS_GENERATOR_SYSTEM_PROMPT).toContain('Lead Systems Architect')
    expect(ARCHITECTURE_GENERATOR_SYSTEM_PROMPT).toContain('Principal Software Architect')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('styles.refero.design')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('saasframe.io')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('land-book.com')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('mobbin.com')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('godly.website')
    expect(DESIGN_GENERATOR_SYSTEM_PROMPT).toContain('sole visual authority')
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
    const md = generateFallbackSrs('Acme App', {
      functional_requirements: [{ id: 'FR-001', title: 'Login', description: 'User authentication' }],
    })
    expect(md).toContain('# SRS.md — Acme App')
    expect(md).toContain('FR-001: Login')
  })

  it('generates fallback Architecture markdown', () => {
    const md = generateFallbackArchitecture('Acme App', {
      stack_preferences: {
        frontend: { value: 'React 19' },
        backend: { value: 'Node' },
        database: { value: 'PostgreSQL' },
      },
    })
    expect(md).toContain('# ARCHITECTURE.md — Acme App')
    expect(md).toContain('React 19')
  })

  it('generates fallback Design markdown with bespoke design tokens', () => {
    const md = generateFallbackDesign('Acme App', {
      design_direction: { value: 'Clean Minimalist Scandinavian' },
      stack_preferences: { styling: { value: 'Tailwind CSS v4' } },
    })
    expect(md).toContain('# DESIGN.md — Acme App')
    expect(md).toContain('Clean Minimalist Scandinavian')
    expect(md).toContain('Tailwind CSS v4')
    expect(md).toContain('Plus Jakarta Sans')
    expect(md).toContain('Lucide Icons')
    expect(md).toContain('Awwwards-grade')
    expect(md).toContain('Primary Logo (Vector Lockup)')
    expect(md).toContain('Adaptive Favicon')
    expect(md).toContain('Luxury Split-Screen Auth')
    expect(md).toContain('Bento-Grid Dashboard')
  })

  it('adapts fallback Design archetype based on project domain', () => {
    // DevTools project
    const devMd = generateFallbackDesign('Acme CLI', {
      summary: 'Developer CLI tool and API platform for cloud telemetry',
      classification: 'API_SERVICE',
    })
    expect(devMd).toContain('Precision DevTools & Dark Monolith')
    expect(devMd).toContain('JetBrains Mono')
    expect(devMd).toContain('#06B6D4')

    // Fintech project
    const finMd = generateFallbackDesign('Acme Pay', {
      summary: 'Invoicing and billing management platform for businesses',
      classification: 'SAAS',
    })
    expect(finMd).toContain('High-Density Fintech & Data Engine')
    expect(finMd).toContain('#10B981')

    // Only Neo-Brutalist if explicitly requested
    const neoMd = generateFallbackDesign('Retro Site', {
      design_direction: { value: 'Vibrant Neo-Brutalism with bold borders' },
    })
    expect(neoMd).toContain('Neo-Brutalist Utility')
    expect(neoMd).toContain('#F7F0DF')
  })
})

describe('Artifact Generator Engine — generateCoreArtifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      generateCoreArtifacts({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('throws error if no current context exists', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [],
    } as never)

    await expect(
      generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No Canonical Project Context found')
  })

  it('blocks core generation when no active BYOK session exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'ctx-1',
          version: 1,
          isCurrent: true,
          contentJson: '{"summary":"Test"}',
          artifactPlans: [],
        },
      ],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    await expect(
      generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1' }),
    ).rejects.toThrow('No active AI provider session found')
    expect(db.artifact.upsert).not.toHaveBeenCalled()
  })

  it('supports single-artifact regeneration (e.g. PRD only)', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'ctx-1',
          version: 1,
          isCurrent: true,
          contentJson: '{"summary":"Test"}',
          artifactPlans: [],
        },
      ],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'test-key',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue({ markdown_content: '# PRD' }),
    })

    const results = await generateCoreArtifacts({
      userId: 'u-1',
      projectId: 'p-1',
      types: ['PRD'],
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.type).toBe('PRD')
    expect(db.artifact.upsert).toHaveBeenCalledTimes(1)
    expect(db.artifact.update).toHaveBeenCalledTimes(1)
  })

  it('supports DESIGN-only regeneration through the structured design generator', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'ctx-1',
          version: 4,
          isCurrent: true,
          contentJson: '{"design_direction":{"value":"Editorial","provenance":"confirmed"}}',
          artifactPlans: [{ type: 'DESIGN', isRequired: true }],
        },
      ],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'test-key',
    })
    const generateStructured = vi.fn().mockResolvedValueOnce({
      markdown_content: '# DESIGN.md — Test Project',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured,
    })

    const results = await generateCoreArtifacts({
      userId: 'u-1',
      projectId: 'p-1',
      types: ['DESIGN'],
    })

    expect(results).toEqual([
      {
        type: 'DESIGN',
        status: 'READY',
        path: 'DESIGN.md',
        content: '# DESIGN.md — Test Project',
      },
    ])
    expect(generateStructured).toHaveBeenCalledWith(
      expect.stringContaining('Canonical Context Version: 4'),
      DesignDocumentSchema,
      expect.objectContaining({ system: DESIGN_GENERATOR_SYSTEM_PROMPT }),
    )
    expect(db.artifact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId_type: { projectId: 'p-1', type: 'DESIGN' } },
      }),
    )
  })

  it('includes required DESIGN in default plan-aware core generation', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'ctx-1',
          version: 2,
          isCurrent: true,
          contentJson: '{"summary":"Test"}',
          artifactPlans: [{ type: 'DESIGN', isRequired: true }],
        },
      ],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'test-key',
    })
    const generateStructured = vi.fn().mockResolvedValue({ markdown_content: '# Document' })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured,
    })

    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1' })

    expect(results.map((result) => result.type)).toEqual([
      'PRD',
      'SRS',
      'DESIGN',
      'ARCHITECTURE',
    ])
    expect(db.artifact.upsert).toHaveBeenCalledTimes(4)
    expect(generateStructured).toHaveBeenCalledTimes(4)
  })

  it('marks only the DESIGN artifact failed when design generation fails', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'ctx-1',
          version: 1,
          isCurrent: true,
          contentJson: '{}',
          artifactPlans: [{ type: 'DESIGN', isRequired: true }],
        },
      ],
    } as never)
    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'test-key',
    })
    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockRejectedValueOnce(new Error('Provider unavailable')),
    })

    const results = await generateCoreArtifacts({
      userId: 'u-1',
      projectId: 'p-1',
      types: ['DESIGN'],
    })

    expect(results[0]).toEqual(
      expect.objectContaining({ type: 'DESIGN', status: 'FAILED', error: 'Provider unavailable' }),
    )
    expect(db.artifact.update).toHaveBeenCalledWith({
      where: { projectId_type: { projectId: 'p-1', type: 'DESIGN' } },
      data: { status: 'FAILED' },
    })
  })

  it('uses AI provider when BYOK session is active', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [
        {
          id: 'ctx-1',
          version: 1,
          isCurrent: true,
          contentJson: '{"summary":"Test"}',
          artifactPlans: [],
        },
      ],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const mockAiResponse = {
      markdown_content: '# AI Generated PRD Document',
    }

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue(mockAiResponse),
    })

    const results = await generateCoreArtifacts({
      userId: 'u-1',
      projectId: 'p-1',
      types: ['PRD'],
    })

    expect(results[0]?.status).toBe('READY')
    expect(results[0]?.content).toBe('# AI Generated PRD Document')
  })
})
