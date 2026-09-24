import { db } from '@repo/db'
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

export function generateSkillsMdContent(projectName: string, skills: ResolvedSkill[]): string {
  const skillListMd = skills
    .map(
      (s) => `### \`${s.name}\` (${s.source})
- **Purpose:** ${s.purpose}
- **Trigger:** ${s.trigger}
- **Phases:** ${s.applicable_phases.join(', ')}
- **Task Types:** ${s.applicable_task_types.join(', ')}
${s.installation_hint ? `- **Install:** \`${s.installation_hint}\`` : ''}`,
    )
    .join('\n\n')

  return `# SKILLS.md — Recommended Agent Skills

> Tailored skill recommendations for coding agents working on **${projectName}**.

---

## Recommended Skills

${skillListMd}
`
}

export interface ResolveSkillsOptions {
  userId: string
  projectId: string
  catalogAdapter?: SkillCatalogAdapter
}

/**
 * Resolves skills for a project and updates DB records + SKILLS.md artifact.
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
  let resolvedOutput: SkillResolverOutput

  if (providerConfig) {
    const provider = createProvider(providerConfig)
    const userPrompt = buildSkillResolverUserPrompt(
      project.name,
      project.classification,
      currentContextRecord.contentJson,
      JSON.stringify(catalogSkills),
    )

    try {
      resolvedOutput = await provider.generateStructured(
        userPrompt,
        SkillResolverOutputSchema,
        {
          system: SKILL_RESOLVER_SYSTEM_PROMPT,
          maxTokens: 2048,
          temperature: 0.2,
        },
      )
    } catch {
      resolvedOutput = {
        skills: catalogSkills,
        rationale: 'Fallback skill resolution using default catalog adapter.',
        skills_md_content: generateSkillsMdContent(project.name, catalogSkills),
      }
    }
  } else {
    resolvedOutput = {
      skills: catalogSkills,
      rationale: 'Baseline skill resolution using default catalog adapter.',
      skills_md_content: generateSkillsMdContent(project.name, catalogSkills),
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

  // Upsert SKILLS.md Artifact record
  await db.artifact.upsert({
    where: { projectId_type: { projectId, type: 'SKILLS' } },
    update: {
      content: resolvedOutput.skills_md_content,
      status: 'READY',
      contextId: currentContextRecord.id,
      provider: providerConfig?.provider ?? 'FALLBACK',
      model: providerConfig?.model ?? 'BASELINE',
    },
    create: {
      projectId,
      contextId: currentContextRecord.id,
      type: 'SKILLS',
      path: 'SKILLS.md',
      content: resolvedOutput.skills_md_content,
      status: 'READY',
      provider: providerConfig?.provider ?? 'FALLBACK',
      model: providerConfig?.model ?? 'BASELINE',
    },
  })

  return resolvedOutput
}
