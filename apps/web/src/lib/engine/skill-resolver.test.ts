import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  SkillResolverOutputSchema,
  buildSkillResolverUserPrompt,
  SKILL_RESOLVER_SYSTEM_PROMPT,
} from '@/lib/prompts/skill-resolver'
import {
  resolveProjectSkills,
  generateSkillsMdContent,
  SkillsLLMCatalogAdapter,
  internalCatalogFallback,
} from '@/lib/engine/skill-resolver'

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: vi.fn(),
    },
    skillRecommendation: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    artifact: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock('@/lib/byok/session-store', () => ({
  getProviderConfig: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  createProvider: vi.fn(),
}))

describe('Skill Resolver Schema & Prompt', () => {
  it('validates a valid SkillResolverOutput object', () => {
    const validData = {
      skills: [
        {
          name: 'typescript-backend',
          source: 'skillsllm.com',
          purpose: 'Purpose text',
          trigger: 'Trigger text',
          applicable_phases: ['Phase 1'],
          applicable_task_types: ['backend'],
          installation_hint: 'npx test',
        },
      ],
      rationale: 'Tailored skills rationale',
      skills_md_content: '# SKILLS.md',
    }

    const result = SkillResolverOutputSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('builds user prompt containing context and catalog', () => {
    const prompt = buildSkillResolverUserPrompt(
      'Acme App',
      'SAAS',
      '{"summary":"Acme"}',
      '[{"name":"typescript-backend"}]',
    )
    expect(prompt).toContain('Project Name: Acme App')
    expect(prompt).toContain('Project Type: SAAS')
    expect(prompt).toContain('typescript-backend')
    expect(SKILL_RESOLVER_SYSTEM_PROMPT).toContain('Skill Specialist')
  })
})

describe('SkillsLLM Catalog Adapter & Fallback', () => {
  it('returns internal catalog fallback from adapter', async () => {
    const adapter = new SkillsLLMCatalogAdapter()
    const catalog = await adapter.fetchCatalog()
    expect(catalog.length).toBeGreaterThan(0)
    expect(catalog[0]?.name).toBe('typescript-backend')
  })

  it('generates formatted SKILLS.md markdown content', () => {
    const md = generateSkillsMdContent('Test Project', internalCatalogFallback)
    expect(md).toContain('# SKILLS.md — Recommended Agent Skills')
    expect(md).toContain('Test Project')
    expect(md).toContain('typescript-backend')
  })
})

describe('Skill Resolver Engine — resolveProjectSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if project not found', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null)

    await expect(
      resolveProjectSkills({ userId: 'u-1', projectId: 'p-invalid' }),
    ).rejects.toThrow('Project not found')
  })

  it('resolves skills using fallback when no provider config exists', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      classification: 'SAAS',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce(null)

    const result = await resolveProjectSkills({ userId: 'u-1', projectId: 'p-1' })

    expect(result.skills).toHaveLength(4)
    expect(db.skillRecommendation.deleteMany).toHaveBeenCalledWith({ where: { projectId: 'p-1' } })
    expect(db.skillRecommendation.create).toHaveBeenCalledTimes(4)
    expect(db.artifact.upsert).toHaveBeenCalledTimes(1)
  })

  it('uses AI provider when BYOK session is active', async () => {
    const { db } = await import('@repo/db')
    const { getProviderConfig } = await import('@/lib/byok/session-store')
    const { createProvider } = await import('@/lib/ai/provider')

    vi.mocked(db.project.findFirst).mockResolvedValueOnce({
      id: 'p-1',
      userId: 'u-1',
      name: 'Test Project',
      classification: 'SAAS',
      contexts: [{ id: 'ctx-1', isCurrent: true, contentJson: '{}' }],
    } as never)

    vi.mocked(getProviderConfig).mockReturnValueOnce({
      provider: 'ANTHROPIC',
      model: 'claude-sonnet-4-5',
      apiKey: 'sk-test',
    })

    const customOutput = {
      skills: [
        {
          name: 'custom-skill',
          source: 'skillsllm.com',
          purpose: 'Custom skill purpose',
          trigger: 'Custom trigger',
          applicable_phases: ['Phase 1'],
          applicable_task_types: ['custom'],
        },
      ],
      rationale: 'AI resolved custom skills',
      skills_md_content: '# AI SKILLS.md',
    }

    vi.mocked(createProvider).mockReturnValueOnce({
      type: 'ANTHROPIC',
      testConnection: vi.fn(),
      generateStructured: vi.fn().mockResolvedValue(customOutput),
    })

    const result = await resolveProjectSkills({ userId: 'u-1', projectId: 'p-1' })

    expect(result.rationale).toBe('AI resolved custom skills')
    expect(result.skills[0]?.name).toBe('custom-skill')
  })
})
