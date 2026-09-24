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
  generateCoreArtifacts,
  generateFallbackPrd,
  generateFallbackSrs,
  generateFallbackArchitecture,
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

  it('builds prompt containing project name and context', () => {
    const promptPrd = buildPrdGeneratorUserPrompt('Acme', '{"name":"Acme"}')
    const promptSrs = buildSrsGeneratorUserPrompt('Acme', '{"name":"Acme"}')
    const promptArch = buildArchitectureGeneratorUserPrompt('Acme', '{"name":"Acme"}')

    expect(promptPrd).toContain('Project Name: Acme')
    expect(promptSrs).toContain('Project Name: Acme')
    expect(promptArch).toContain('Project Name: Acme')
    expect(PRD_GENERATOR_SYSTEM_PROMPT).toContain('Principal Product Manager')
    expect(SRS_GENERATOR_SYSTEM_PROMPT).toContain('Lead Systems Architect')
    expect(ARCHITECTURE_GENERATOR_SYSTEM_PROMPT).toContain('Principal Software Architect')
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

  it('generates 3 core artifacts using fallback when no provider config exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{"summary":"Test"}' }],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    const results = await generateCoreArtifacts({ userId: 'u-1', projectId: 'p-1' })

    expect(results).toHaveLength(3)
    expect(results.map((r) => r.type)).toEqual(['PRD', 'SRS', 'ARCHITECTURE'])
    expect(results.every((r) => r.status === 'READY')).toBe(true)
    expect(db.artifact.upsert).toHaveBeenCalledTimes(3)
    expect(db.artifact.update).toHaveBeenCalledTimes(3)
  })

  it('supports single-artifact regeneration (e.g. PRD only)', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{"summary":"Test"}' }],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

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

  it('uses AI provider when BYOK session is active', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{"summary":"Test"}' }],
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
