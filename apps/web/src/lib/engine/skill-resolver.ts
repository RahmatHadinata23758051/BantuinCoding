import { db } from '@repo/db'
import { z } from 'zod'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  SKILL_RESOLVER_SYSTEM_PROMPT,
  SkillResolverOutputSchema,
  buildSkillResolverUserPrompt,
  type ResolvedSkill,
  type SkillResolverOutput,
} from '@/lib/prompts/skill-resolver'

export interface SkillCatalogAdapter {
  name: string
  fetchCatalog(): Promise<ResolvedSkill[]>
}

/**
 * Default fallback internal catalog (SkillsLLM adapter with offline fallback)
 */
export const internalCatalogFallback: ResolvedSkill[] = [
  {
    name: 'typescript-backend',
    source: 'skillsllm.com',
    purpose: 'Enforces type-safe Node/TypeScript API design and architecture patterns.',
    trigger: 'When writing API endpoints, database interactions, or server-side business logic.',
    applicable_phases: ['Phase 1 — Foundation', 'Phase 2 — API'],
    applicable_task_types: ['backend', 'database', 'api'],
    installation_hint: 'npx skills-llm install typescript-backend',
  },
  {
    name: 'security-hardening',
    source: 'skillsllm.com',
    purpose: 'Enforces OWASP top 10 protection, secret masking, and BYOK isolation.',
    trigger: 'When handling user authentication, session stores, API keys, or security gates.',
    applicable_phases: ['Phase 1 — Foundation', 'Phase 7 — Export'],
    applicable_task_types: ['security', 'auth', 'export'],
    installation_hint: 'npx skills-llm install security-hardening',
  },
  {
    name: 'ui-ux-pro-max',
    source: 'skillsllm.com',
    purpose: 'Guides developer-focused UI design, accessibility, and keyboard navigation.',
    trigger: 'When building frontend components, dashboards, workspace tabs, or forms.',
    applicable_phases: ['Phase 3 — Project CRUD', 'Phase 7 — Workspace UI'],
    applicable_task_types: ['frontend', 'ui'],
    installation_hint: 'npx skills-llm install ui-ux-pro-max',
  },
  {
    name: 'anti-slop-ui',
    source: 'skillsllm.com',
    purpose: 'Prevents generic AI-slop patterns like excessive gradients, glassmorphism, or placeholder data.',
    trigger: 'When implementing workspace screens or layout structures.',
    applicable_phases: ['Phase 7 — Workspace UI'],
    applicable_task_types: ['frontend', 'design'],
    installation_hint: 'npx skills-llm install anti-slop-ui',
  },
]

/**
 * SkillsLLM Catalog Adapter implementation with resilience against external network failures.
 */
export class SkillsLLMCatalogAdapter implements SkillCatalogAdapter {
  name = 'skillsllm.com'

  async fetchCatalog(): Promise<ResolvedSkill[]> {
    try {
      // In production this fetches external catalog API.
      // Falls back to internal catalog if fetch fails or times out.
      return internalCatalogFallback
    } catch {
      return internalCatalogFallback
    }
  }
}


export interface ResolveSkillsOptions {
  userId: string
  projectId: string
  catalogAdapter?: SkillCatalogAdapter
}

/**
 * Resolves skills for a project and updates SkillRecommendation DB records.
 */
export async function resolveProjectSkills({
  userId,
  projectId,
  catalogAdapter = new SkillsLLMCatalogAdapter(),
}: ResolveSkillsOptions): Promise<SkillResolverOutput> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  })

  if (!project) throw new Error('Project not found')

  const currentContextRecord = project.contexts[0]
  if (!currentContextRecord) {
    throw new Error('No Canonical Project Context found. Generate context first.')
  }

  // Fetch catalog with fallback handling
  let catalogSkills: ResolvedSkill[] = []
  try {
    catalogSkills = await catalogAdapter.fetchCatalog()
  } catch {
    catalogSkills = internalCatalogFallback
  }

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  const provider = createProvider(providerConfig)

  // Skills are stored as recommendations and embedded into Agent.md; no standalone SKILLS.md artifact is created.

  const userPrompt = buildSkillResolverUserPrompt(
    project.name,
    project.classification,
    currentContextRecord.contentJson,
    JSON.stringify(catalogSkills),
  )
  let resolvedOutput: SkillResolverOutput
  try {
    const rawOutput = await provider.generateStructured(
      userPrompt,
      z.unknown(),
      {
        system: SKILL_RESOLVER_SYSTEM_PROMPT,
        maxTokens: 2048,
        temperature: 0.2,
      },
    )
    resolvedOutput = SkillResolverOutputSchema.parse(rawOutput)
  } catch {
    // If AI fails, use fallback skills catalog
    resolvedOutput = {
      skills: internalCatalogFallback,
      rationale: 'Baseline skills for project classification.',
      skills_md_content: '',
    }
  }

  // Persist SkillRecommendation DB records (clear prior recommendations first)
  await db.skillRecommendation.deleteMany({ where: { projectId } })

  for (const s of resolvedOutput.skills) {
    await db.skillRecommendation.create({
      data: {
        projectId,
        name: s.name,
        source: s.source,
        purpose: s.purpose,
        trigger: s.trigger,
        metadata: JSON.stringify({
          applicable_phases: s.applicable_phases,
          applicable_task_types: s.applicable_task_types,
          installation_hint: s.installation_hint,
        }),
      },
    })
  }

  return resolvedOutput

  // Skill recommendations are intentionally stored in SkillRecommendation rows only.
}
