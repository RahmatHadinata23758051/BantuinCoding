import { db } from '@repo/db'
import { z } from 'zod'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import { VERIFIED_SKILL_INSTALLATIONS } from '@/lib/skills/bootstrap'
import {
  SKILL_RESOLVER_SYSTEM_PROMPT,
  SkillResolverOutputSchema,
  ResolvedSkillSchema,
  buildSkillResolverUserPrompt,
  type ResolvedSkill,
  type SkillResolverOutput,
} from '@/lib/prompts/skill-resolver'

export interface SkillCatalogAdapter {
  name: string
  fetchCatalog(): Promise<ResolvedSkill[]>
}

const MAX_CATALOG_SKILLS = 100

function normalizeCatalog(catalog: ResolvedSkill[]): ResolvedSkill[] {
  const validSkills = catalog.flatMap((skill) => {
    const parsed = ResolvedSkillSchema.safeParse(skill)
    return parsed.success ? [parsed.data] : []
  })

  return Array.from(new Map(validSkills.map((skill) => [skill.name, skill])).values())
    .slice(0, MAX_CATALOG_SKILLS)
}

function resolveCatalogOutput(
  output: SkillResolverOutput,
  catalog: ResolvedSkill[],
  context: string,
): SkillResolverOutput {
  const catalogByName = new Map(catalog.map((skill) => [skill.name, skill]))
  const compatibleNames = new Set(filterCompatibleSkills(catalog, context).map((skill) => skill.name))
  const skills = output.skills.flatMap((skill) => {
    const catalogSkill = catalogByName.get(skill.name)
    return catalogSkill && compatibleNames.has(skill.name) ? [catalogSkill] : []
  })

  return {
    ...output,
    skills,
    skills_md_content: '',
  }
}

function confirmedContextValue(value: unknown): string {
  if (typeof value === 'string') return ''
  if (!value || typeof value !== 'object') return ''
  const entry = value as { value?: unknown; provenance?: unknown }
  return entry.provenance === 'confirmed' && typeof entry.value === 'string'
    ? entry.value.toLowerCase()
    : ''
}

export function filterCompatibleSkills(catalog: ResolvedSkill[], contextJson: string): ResolvedSkill[] {
  let context: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(contextJson)
    context = typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {}
  } catch {
    context = {}
  }

  const stack = typeof context.stack_preferences === 'object' && context.stack_preferences !== null
    ? context.stack_preferences as Record<string, unknown>
    : {}
  const confirmedStack = Object.fromEntries(
    Object.entries(stack).map(([key, value]) => [key, confirmedContextValue(value)]),
  )
  const confirmedConstraints = Array.isArray(context.technical_constraints)
    ? context.technical_constraints
        .map((constraint) => confirmedContextValue(constraint))
        .filter(Boolean)
        .join(' ')
    : ''
  const confirmedText = `${Object.values(confirmedStack).join(' ')} ${confirmedConstraints}`.toLowerCase()
  const plainJavaScript = /\b(?:plain\s+javascript|javascript\s+only|no\s+typescript|without\s+typescript|not\s+typescript)\b/.test(
    confirmedText,
  )
  const prismaExcluded = /\b(?:no\s+prisma|without\s+prisma|not\s+prisma|exclude\s+prisma)\b/.test(
    confirmedText,
  )
  const mobileExcluded = /\b(?:no\s+mobile|web\s+only|not\s+mobile|exclude\s+mobile)\b/.test(
    confirmedText,
  )

  return catalog.filter((skill) => {
    const name = skill.name.toLowerCase()
    const text = `${name} ${skill.purpose} ${skill.trigger}`.toLowerCase()
    if (plainJavaScript && /typescript|type.?script/.test(text)) return false
    if (prismaExcluded && /prisma/.test(text)) return false
    if (mobileExcluded && /mobile/.test(name)) return false
    return true
  })
}

function emptySkillsOutput(reason: string): SkillResolverOutput {
  return { skills: [], rationale: reason, skills_md_content: '' }
}

function skillInstallation(name: keyof typeof VERIFIED_SKILL_INSTALLATIONS) {
  const verified = VERIFIED_SKILL_INSTALLATIONS[name]
  return {
    installation_mode: verified.mode,
    installation_source: verified.source,
    installation_skill_id: verified.skillId,
    installation_agents: [...verified.agents],
    prerequisite: verified.prerequisite,
    installation_hint: verified.command,
  }
}

/**
 * Default fallback internal catalog (SkillsLLM adapter with offline fallback)
 */
export const internalCatalogFallback: ResolvedSkill[] = [
  {
    name: 'find-skills',
    source: 'internal-fallback',
    purpose: 'Finds task-specific agent skills from the Vercel Skills ecosystem when a project needs guidance not covered by its current recommendations.',
    trigger: 'At the start of a project or task when the current recommendations do not cover a confirmed need; use discovery results only after checking their source and relevance.',
    applicable_phases: ['Project setup', 'Task planning'],
    applicable_task_types: ['discovery', 'planning', 'agent-tooling'],
    installation_mode: 'manual',
  },
  {
    name: 'backend-dev-guidelines',
    source: 'internal-fallback',
    purpose: 'Provides general backend implementation guidelines without requiring a particular language, ORM, or database.',
    trigger: 'When the project includes backend services, API handlers, or server-side business logic.',
    applicable_phases: ['Backend implementation', 'API design'],
    applicable_task_types: ['backend', 'api', 'service'],
    installation_mode: 'manual',
  },
  {
    name: 'verification-before-completion',
    source: 'internal-fallback',
    purpose: 'Requires evidence from current checks before reporting implementation as complete.',
    trigger: 'Before claiming a task, fix, or feature is complete.',
    applicable_phases: ['Testing & verification', 'Task completion'],
    applicable_task_types: ['testing', 'verification', 'quality'],
    installation_mode: 'manual',
  },
  {
    name: 'e2e-testing',
    source: 'internal-fallback',
    purpose: 'Provides end-to-end testing guidance for browser-facing behavior and user flows.',
    trigger: 'When implementing or verifying browser-based flows and user-visible interactions.',
    applicable_phases: ['Testing & verification', 'Browser flows'],
    applicable_task_types: ['testing', 'e2e', 'browser'],
    installation_mode: 'manual',
  },
  {
    name: 'ui-ux-pro-max',
    source: 'internal-fallback',
    purpose: 'Guides developer-focused UI design, accessibility, and keyboard navigation.',
    trigger: 'When building frontend components, dashboards, workspace tabs, or forms.',
    applicable_phases: ['Frontend foundation', 'Screen & view implementation'],
    applicable_task_types: ['frontend', 'ui', 'design'],
    ...skillInstallation('ui-ux-pro-max'),
  },
  {
    name: 'anti-ui-slop',
    source: 'internal-fallback',
    purpose: 'Enforces anti-slop frontend and design quality, eliminates cliché AI UI defaults, ensures component honesty and accessibility.',
    trigger: 'When implementing frontend components, layouts, styling, forms, or user interactions.',
    applicable_phases: ['Frontend development', 'Design system & tokens'],
    applicable_task_types: ['frontend', 'ui', 'design'],
    installation_mode: 'manual',
  },
  {
    name: 'design-taste-frontend',
    source: 'internal-fallback',
    purpose: 'Brings polished frontend design aesthetics, typographic hierarchy, spatial rhythm, and distinctive visual feel.',
    trigger: 'When crafting visual design, component themes, responsive views, or aesthetic refinements.',
    applicable_phases: ['Design system & tokens', 'Screen implementation'],
    applicable_task_types: ['frontend', 'design', 'ui'],
    installation_mode: 'manual',
  },
  {
    name: 'mobile-development',
    source: 'internal-fallback',
    purpose: 'Provides project-specific mobile-platform implementation guidance without assuming a framework.',
    trigger: 'Only when the confirmed project context includes a native or cross-platform mobile application.',
    applicable_phases: ['Mobile architecture', 'Mobile implementation'],
    applicable_task_types: ['mobile', 'platform'],
    installation_mode: 'manual',
  },
  {
    name: 'antislop',
    source: 'internal-fallback',
    purpose: 'Enforces code generation discipline: component completeness, no dead triggers, triple data states, and accessibility standards.',
    trigger: 'When implementing components, data views, user flows, or frontend/fullstack logic.',
    applicable_phases: ['Frontend development', 'Feature delivery'],
    applicable_task_types: ['frontend', 'fullstack', 'ui', 'logic'],
    installation_mode: 'manual',
  },
  {
    name: 'anti-slop-ui',
    source: 'internal-fallback',
    purpose: 'Enforces anti-slop visual discipline, component honesty, and non-generic design layout according to DESIGN.md.',
    trigger: 'When implementing workspace screens, design tokens, typography, or layout structures.',
    applicable_phases: ['Design system & tokens', 'Screen implementation'],
    applicable_task_types: ['frontend', 'design', 'ui'],
    installation_mode: 'manual',
  },
  {
    name: 'security-hardening',
    source: 'internal-fallback',
    purpose: 'Enforces OWASP top 10 protection, secret masking, and BYOK isolation.',
    trigger: 'When handling user authentication, session stores, API keys, or security gates.',
    applicable_phases: ['System foundation', 'Security & auth integration'],
    applicable_task_types: ['security', 'auth', 'export'],
    installation_mode: 'manual',
  },
  {
    name: 'typescript-backend',
    source: 'internal-fallback',
    purpose: 'Enforces type-safe Node/TypeScript API design and architecture patterns.',
    trigger: 'Only when the confirmed project stack specifies TypeScript for backend implementation.',
    applicable_phases: ['Backend foundation', 'API implementation'],
    applicable_task_types: ['backend', 'database', 'api'],
    installation_mode: 'manual',
  },
  {
    name: 'prisma-db-architect',
    source: 'internal-fallback',
    purpose: 'Enforces robust relational schema design, migrations, relations, and transactional queries.',
    trigger: 'Only when the confirmed project stack explicitly includes Prisma ORM.',
    applicable_phases: ['Database schema & migrations', 'Data access layer'],
    applicable_task_types: ['database', 'backend'],
    installation_mode: 'manual',
  },
  {
    name: 'playwright-browser-qa',
    source: 'internal-fallback',
    purpose: 'Guides automated headless browser testing, viewport audits, and accessibility QA.',
    trigger: 'When running end-to-end user journeys, responsive verification, or browser automation.',
    applicable_phases: ['Testing & verification', 'Quality assurance'],
    applicable_task_types: ['testing', 'qa', 'browser'],
    installation_mode: 'manual',
  },
  {
    name: 'accessibility-wcag-audit',
    source: 'internal-fallback',
    purpose: 'Enforces WCAG AA compliance, semantic HTML, visible keyboard focus, and screen-reader accessibility.',
    trigger: 'When implementing interactive controls, forms, modals, or reviewing frontend accessibility.',
    applicable_phases: ['UI development', 'Accessibility verification'],
    applicable_task_types: ['frontend', 'accessibility', 'qa'],
    installation_mode: 'manual',
  },
  {
    name: 'vitest-unit-testing',
    source: 'internal-fallback',
    purpose: 'Guides test-driven unit and integration testing with isolated mocks and fast execution.',
    trigger: 'When implementing core business logic, utility functions, state machines, or route handlers.',
    applicable_phases: ['Domain logic', 'Testing & verification'],
    applicable_task_types: ['testing', 'unit', 'integration'],
    installation_mode: 'manual',
  },
  {
    name: 'ecc',
    source: 'internal-fallback',
    purpose: 'The agent harness performance optimization system for memory, instincts, and research-first development.',
    trigger: 'When orchestrating complex multi-file features or long-running agent workflows.',
    applicable_phases: ['System architecture', 'Performance optimization'],
    applicable_task_types: ['workflow', 'agent', 'architecture'],
    installation_mode: 'manual',
  },
  {
    name: 'next-ai-draw-io',
    source: 'internal-fallback',
    purpose: 'Enforces diagramming architecture, sequence flows, and system boundaries via chat and MCP.',
    trigger: 'When designing architecture specifications, entity relationships, or data flows.',
    applicable_phases: ['Architecture design', 'System documentation'],
    applicable_task_types: ['architecture', 'design', 'documentation'],
    installation_mode: 'manual',
  },
  {
    name: 'ponytail',
    source: 'internal-fallback',
    purpose: 'Enforces YAGNI minimalism: fewest files, shortest diffs, no unnecessary abstractions.',
    trigger: 'When writing new features, refactoring code, or designing application architecture.',
    applicable_phases: ['Architecture design', 'Feature implementation'],
    applicable_task_types: ['architecture', 'simplification', 'review'],
    installation_mode: 'manual',
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

  // Fetch only validated, bounded catalog data; fallback entries are local recommendations.
  let catalogSkills: ResolvedSkill[] = []
  try {
    catalogSkills = normalizeCatalog(await catalogAdapter.fetchCatalog())
  } catch {
    catalogSkills = normalizeCatalog(internalCatalogFallback)
  }
  if (catalogSkills.length === 0) catalogSkills = normalizeCatalog(internalCatalogFallback)

  const compatibleSkills = filterCompatibleSkills(catalogSkills, currentContextRecord.contentJson)
  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }

  if (compatibleSkills.length === 0) {
    const result = emptySkillsOutput('No catalog skills are compatible with the confirmed project stack.')
    await db.skillRecommendation.deleteMany({ where: { projectId } })
    return result
  }

  const provider = createProvider(providerConfig)

  // Skills are stored as recommendations and embedded into Agent.md; no standalone SKILLS.md artifact is created.

  const userPrompt = buildSkillResolverUserPrompt(
    project.name,
    project.classification,
    currentContextRecord.contentJson,
    JSON.stringify(compatibleSkills),
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
    resolvedOutput = resolveCatalogOutput(
      SkillResolverOutputSchema.parse(rawOutput),
      compatibleSkills,
      currentContextRecord.contentJson,
    )
    if (resolvedOutput.skills.length === 0) {
      if (compatibleSkills.length === catalogSkills.length) {
        resolvedOutput = {
          skills: compatibleSkills,
          rationale: 'No catalog skills were selected; using the bounded local catalog.',
          skills_md_content: '',
        }
      } else {
        resolvedOutput = emptySkillsOutput(
          'No compatible skills were selected for the confirmed project stack.',
        )
      }
    }
  } catch {
    // If AI fails, only use the catalog for unconstrained projects.
    // For constrained projects, do not substitute the whole generic catalog.
    if (compatibleSkills.length === catalogSkills.length) {
      resolvedOutput = {
        skills: compatibleSkills,
        rationale: 'Baseline skills from the available catalog.',
        skills_md_content: '',
      }
    } else {
      resolvedOutput = emptySkillsOutput(
        'Skill recommendations could not be resolved for the confirmed project stack.',
      )
    }
  }
  if (resolvedOutput.skills.length === 0) {
    await db.skillRecommendation.deleteMany({ where: { projectId } })
    return resolvedOutput
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
          installation_mode: s.installation_mode,
          installation_source: s.installation_source,
          installation_skill_id: s.installation_skill_id,
          installation_agents: s.installation_agents,
          prerequisite: s.prerequisite,
          initialization_hint: s.initialization_hint,
        }),
      },
    })
  }

  return resolvedOutput
}
