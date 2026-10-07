import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import { updateProject } from '@/lib/projects/project-service'
import {
  PRD_GENERATOR_SYSTEM_PROMPT,
  PrdDocumentSchema,
  buildPrdGeneratorUserPrompt,
} from '@/lib/prompts/prd-generator'
import {
  ARCHITECTURE_GENERATOR_SYSTEM_PROMPT,
  ArchitectureDocumentSchema,
  buildArchitectureGeneratorUserPrompt,
} from '@/lib/prompts/architecture-generator'
import { generateDesignArtifactContent } from '@/lib/engine/design-generator'

export interface GenerateArtifactsOptions {
  userId: string
  projectId: string
  types?: ('PRD' | 'SRS' | 'ARCHITECTURE' | 'DESIGN')[]
}

export interface GeneratedArtifactResult {
  type: string
  status: 'READY' | 'FAILED'
  path: string
  content: string
  error?: string
}

/**
 * Fallback generator for PRD when AI is not configured or fails.
 */
export function generateFallbackPrd(projectName: string, context: Record<string, unknown>): string {
  const summary = (context.summary as string) || 'Project description'
  const goals = Array.isArray(context.goals)
    ? context.goals.map((g) => (typeof g === 'object' && g.value ? g.value : String(g))).join('\n- ')
    : 'Complete project development'

  return `# PRD.md — ${projectName}

## 1. Product Summary
${summary}

## 2. Goals
- ${goals}

## 3. Core Requirements
Generated from canonical project context snapshot.

## 4. Status
Baseline fallback document generated automatically.
`
}

/**
 * Fallback generator for SRS when AI is not configured or fails.
 */
export function generateFallbackSrs(projectName: string, context: Record<string, unknown>): string {
  const reqs = Array.isArray(context.functional_requirements)
    ? context.functional_requirements
        .map(
          (fr: { id?: string; title?: string; description?: string }) =>
            `### ${fr.id || 'FR'}: ${fr.title || 'Requirement'}\n${fr.description || ''}`,
        )
        .join('\n\n')
    : 'Standard functional requirements'

  return `# SRS.md — ${projectName}

## 1. System Overview
Software Requirements Specification for ${projectName}.

## 2. Functional Requirements
${reqs}

## 3. Non-Functional Requirements
- Security: BYOK API keys in memory only
- Code Quality: Strict TypeScript and zero lint errors
`
}

/**
 * Fallback generator for Architecture when AI is not configured or fails.
 */
export function generateFallbackArchitecture(
  projectName: string,
  context: Record<string, unknown>,
): string {
  const stackObj = (context.stack_preferences as Record<string, { value?: string }>) || {}
  const frontend = stackObj.frontend?.value || 'Next.js'
  const backend = stackObj.backend?.value || 'Next.js App Router'
  const database = stackObj.database?.value || 'PostgreSQL + Prisma'

  return `# ARCHITECTURE.md — ${projectName}

## 1. System Architecture Overview
Modular monolith architecture for ${projectName}.

## 2. Technology Stack
- **Frontend:** ${frontend}
- **Backend:** ${backend}
- **Database:** ${database}

## 3. Key Constraints
- Session-scoped BYOK key storage
- Single-artifact regeneration without touching others
`
}

/**
 * Fallback generator for Design when AI is not configured or fails.
 * Produces clean, domain-appropriate design tokens with anti-slop rules.
 */
/**
 * Fallback generator for Design when AI is not configured or fails.
 * Produces clean, domain-appropriate design tokens with anti-slop rules
 * anchored in curated references (styles.refero.design, saasframe.io, mobbin.com, land-book.com).
 */
export function generateFallbackDesign(
  projectName: string,
  context: Record<string, unknown>,
): string {
  const summary = String(context.summary || '').toLowerCase()
  const classification = String(context.classification || '').toLowerCase()
  const designDir = String((context.design_direction as { value?: string })?.value || '')
  const styling = (context.stack_preferences as Record<string, { value?: string }>)?.styling?.value || 'Tailwind CSS'

  // Dynamic Archetype deduction
  const dirLower = designDir.toLowerCase()
  const isExplicitNeoBrutalist = dirLower.includes('neo-brutal') || dirLower.includes('comic')
  const isDevTools = summary.includes('cli') || summary.includes('api') || summary.includes('developer') || classification.includes('api_service')
  const isFintech = summary.includes('finance') || summary.includes('billing') || summary.includes('accounting') || summary.includes('payment')
  const isEditorial = summary.includes('blog') || summary.includes('cms') || summary.includes('publishing') || summary.includes('newsletter')
  const isHealth = summary.includes('health') || summary.includes('clinic') || summary.includes('medical') || summary.includes('wellness')

  let archetypeName = 'Modern Enterprise SaaS & Corporate Crisp'
  let benchmarkCitation = 'styles.refero.design Clean SaaS + saasframe.io data tables + Stripe UI'
  let primaryColor = '#2563EB'
  let canvasColor = '#F8FAFC'
  let surfaceColor = '#FFFFFF'
  let headingFont = 'Plus Jakarta Sans'
  let bodyFont = 'Inter'

  if (isExplicitNeoBrutalist) {
    archetypeName = 'Neo-Brutalist Utility'
    benchmarkCitation = 'Gumroad + Retro Pop'
    primaryColor = '#FFD84D'
    canvasColor = '#F7F0DF'
    surfaceColor = '#FFF9EC'
    headingFont = 'Space Grotesk'
  } else if (isDevTools) {
    archetypeName = 'Precision DevTools & Dark Monolith'
    benchmarkCitation = 'mobbin.com (Linear, Raycast, Supabase) + godly.website'
    primaryColor = '#06B6D4'
    canvasColor = '#08090A'
    surfaceColor = '#111318'
    headingFont = 'Geist Sans'
    bodyFont = 'JetBrains Mono'
  } else if (isFintech) {
    archetypeName = 'High-Density Fintech & Data Engine'
    benchmarkCitation = 'tremor.so + saasframe.io (Mercury, Stripe Dashboard)'
    primaryColor = '#10B981'
    canvasColor = '#F9FAFB'
    surfaceColor = '#FFFFFF'
    headingFont = 'Inter'
    bodyFont = 'Inter'
  } else if (isEditorial) {
    archetypeName = 'Warm Editorial & Literary Craft'
    benchmarkCitation = 'minimal.gallery + mobbin.com (Notion, Readwise) + land-book.com'
    primaryColor = '#78350F'
    canvasColor = '#FBFBFA'
    surfaceColor = '#FFFFFF'
    headingFont = 'Instrument Serif'
    bodyFont = 'Instrument Sans'
  } else if (isHealth) {
    archetypeName = 'Calm HealthTech & Bio-Clean'
    benchmarkCitation = 'styles.refero.design Soft & Subtle + health benchmarks'
    primaryColor = '#0D9488'
    canvasColor = '#F0FDF4'
    surfaceColor = '#FFFFFF'
    headingFont = 'Plus Jakarta Sans'
    bodyFont = 'Inter'
  }

  const effectiveTheme = designDir || archetypeName

  return `# DESIGN.md — ${projectName}

## 1. Visual Direction & Design Thesis
- **Primary Design Archetype:** ${archetypeName}
- **Benchmark Citations:** ${benchmarkCitation}
- **Theme & Direction:** ${effectiveTheme}
- **Styling Architecture:** ${styling}
- **Aesthetic Principles:** Awwwards-grade intentional layout, Dribbble UI polish, fluid Anime.js micro-interactions.

## 2. Brand Identity: Logo & Favicon Assets

### 2.1 Primary Logo (Vector Lockup)
\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 40" fill="none" width="180" height="40">
  <rect x="2" y="4" width="32" height="32" rx="8" fill="${primaryColor}" />
  <path d="M12 20L18 26L28 14" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <text x="44" y="26" font-family="'${headingFont}', sans-serif" font-size="18" font-weight="800" fill="#0F172A" letter-spacing="-0.03em">${projectName}</text>
</svg>
\`\`\`

### 2.2 Adaptive Favicon (SVG for Dark/Light Mode)
\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <style>
    :root { --bg: ${primaryColor}; --fg: #FFFFFF; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: ${primaryColor}; --fg: #FFFFFF; }
    }
  </style>
  <rect width="32" height="32" rx="8" fill="var(--bg)" />
  <path d="M9 16L14 21L23 11" stroke="var(--fg)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>
\`\`\`

## 3. Color System (60-30-10 Rule)
- **Canvas / Background (60%):** ${canvasColor}
- **Surfaces & Cards (30%):** ${surfaceColor} with 1px subtle border (#E2E8F0)
- **Brand Primary Accent (10%):** ${primaryColor}
- **Text Primary:** Slate Deep (#0F172A)
- **Text Muted:** Slate Medium (#64748B)
- **Semantic Accents:** Success (#10B981), Warning (#F59E0B), Danger (#EF4444)

## 4. Typography Hierarchy (Google Fonts)
- **Primary / Heading Font:** ${headingFont}
- **Body / Interface Font:** ${bodyFont}
- **Code / Technical Font:** JetBrains Mono
- **Scale Tokens:**
  - Display: \`3.5rem\` (line-height: \`1.1\`, tracking: \`-0.04em\`, bold)
  - H1: \`2.25rem\` (line-height: \`1.2\`, tracking: \`-0.03em\`, bold)
  - H2: \`1.75rem\` (line-height: \`1.25\`, tracking: \`-0.02em\`, bold)
  - H3: \`1.25rem\` (line-height: \`1.3\`, font-weight: \`700\`)
  - Body: \`1rem\` (line-height: \`1.5\`, font-weight: \`400;500\`)
  - Caption / Micro: \`0.75rem\` (tracking: \`0.05em\`, font-weight: \`600\`)

## 5. Signature Experience: Luxury Split-Screen Auth (Login / Register)
*PROHIBITED: Generic centered white box on gray background (bare Laravel default).*
- **Layout Architecture:** Fullscreen split layout (\`grid grid-cols-1 lg:grid-cols-12 min-h-screen\`).
  - **Showcase Column (7 cols):** Rich ambient gradient backdrop, headline with ${headingFont}, live social proof pill (\`★ 4.9/5 satisfaction\`), floating operational KPI card with subtle backdrop blur (\`backdrop-blur-md\`).
  - **Auth Form Column (5 cols):** Dedicated brand header with SVG logo, crisp inputs with subtle 1px border and glowing focus ring (\`focus:ring-2 focus:ring-primary/20 focus:border-primary\`), password visibility toggle with Lucide icon, social OAuth pill buttons with 1px border hover lift, primary button with tactile press feedback (\`active:scale-[0.98]\`).

## 6. Signature Experience: Bento-Grid Dashboard & Data Tables
- **Dashboard Grid:** 12-column responsive layout with 4 distinct card hierarchy tiles (Hero Metric, Live Stream, KPI Cards, Workflow Queue).
- **Data Table:** Toolbar with search + faceted chips + density toggle, sortable sticky headers, status pills with micro-dots, pagination.

## 7. Iconography & Visual Assets
- **Library:** Lucide Icons (stroke: \`1.75px\`, default optical size: \`20px\`)
- **Rules:** Strictly zero random emojis as UI icons; zero cheesy 3D stickers.

## 8. Motion & Micro-Interactions (Anime.js Fluid Curves)
- **Easing:** \`cubic-bezier(0.16, 1, 0.3, 1)\`
- **Button Hover / Press:** \`-1px\` subtle translateY on hover; \`scale(0.98)\` active press compression.
- **Card Hover:** Subtle elevation shadow transition with \`border-primary/40\` tint.
- **Accessibility:** Mandatory \`prefers-reduced-motion\` media query disabling transitions.

## 9. Anti-AI-Slop Rejection Checklist
- NO generic purple/neon-blue gradients on dark backgrounds
- NO decorative glassmorphic blur blobs with zero functional purpose
- NO fake dashboard metrics or placeholder charts
- NO unstyled component library defaults
`
}

/**
 * Generates PRD, SRS, Architecture, and Design documents from Canonical Project Context.
 */
export async function generateCoreArtifacts({
  userId,
  projectId,
  types,
}: GenerateArtifactsOptions): Promise<GeneratedArtifactResult[]> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
        include: {
          artifactPlans: true,
        },
      },
    },
  })

  if (!project) throw new Error('Project not found')

  const currentContextRecord = project.contexts[0]
  if (!currentContextRecord) {
    throw new Error('No Canonical Project Context found. Generate context first.')
  }

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  const provider = createProvider(providerConfig)
  const generatedTypes = types ?? currentContextRecord.artifactPlans
    .filter((item) => item.isRequired)
    .map((item) => item.type)
    .filter((type): type is 'PRD' | 'SRS' | 'ARCHITECTURE' | 'DESIGN' =>
      ['PRD', 'SRS', 'ARCHITECTURE', 'DESIGN'].includes(type),
    )
    .filter((type, index, all) => all.indexOf(type) === index)

  const plannedCoreTypes = new Set(currentContextRecord.artifactPlans.map((item) => item.type))
  const unplannedExplicitTypes = (types ?? []).filter((type) => !plannedCoreTypes.has(type))
  if (unplannedExplicitTypes.length > 0 && plannedCoreTypes.size > 0) {
    throw new Error(`Artifact type is not part of the current plan: ${unplannedExplicitTypes.join(', ')}`)
  }

  if (generatedTypes.length === 0) {
    throw new Error('No core artifacts are required by the current project plan.')
  }

  // Update project status to GENERATING only after BYOK is confirmed.
  await updateProject(userId, projectId, { status: 'GENERATING' })

  const results: GeneratedArtifactResult[] = []

  for (const artifactType of generatedTypes) {
    const path = `${artifactType}.md`

    // Set artifact state to GENERATING
    await db.artifact.upsert({
      where: { projectId_type: { projectId, type: artifactType } },
      update: { status: 'GENERATING', contextId: currentContextRecord.id },
      create: {
        projectId,
        contextId: currentContextRecord.id,
        type: artifactType,
        path,
        content: '',
        status: 'GENERATING',
      },
    })

    try {
      let markdownContent = ''

      if (artifactType === 'PRD') {
        const userPrompt = buildPrdGeneratorUserPrompt(project.name, currentContextRecord.contentJson)
        const res = await provider.generateStructured(userPrompt, PrdDocumentSchema, {
          system: PRD_GENERATOR_SYSTEM_PROMPT,
          maxTokens: 32000,
          temperature: 0.2,
        })
        markdownContent = res.markdown_content
      } else if (artifactType === 'ARCHITECTURE') {
        const userPrompt = buildArchitectureGeneratorUserPrompt(project.name, currentContextRecord.contentJson)
        const res = await provider.generateStructured(userPrompt, ArchitectureDocumentSchema, {
          system: ARCHITECTURE_GENERATOR_SYSTEM_PROMPT,
          maxTokens: 32000,
          temperature: 0.2,
        })
        markdownContent = res.markdown_content
      } else if (artifactType === 'DESIGN') {
        markdownContent = await generateDesignArtifactContent(
          provider,
          project.name,
          currentContextRecord.contentJson,
          currentContextRecord.version,
        )
      }

      await db.artifact.update({
        where: { projectId_type: { projectId, type: artifactType } },
        data: {
          content: markdownContent,
          status: 'READY',
          provider: providerConfig?.provider ?? 'FALLBACK',
          model: providerConfig?.model ?? 'BASELINE',
        },
      })

      results.push({
        type: artifactType,
        status: 'READY',
        path,
        content: markdownContent,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Generation failed'
      await db.artifact.update({
        where: { projectId_type: { projectId, type: artifactType } },
        data: { status: 'FAILED' },
      })

      results.push({
        type: artifactType,
        status: 'FAILED',
        path,
        content: '',
        error: errorMsg,
      })
    }
  }

  // If all generated artifacts succeeded or failed, update overall project state
  const hasFailed = results.some((r) => r.status === 'FAILED')
  const finalStatus = hasFailed ? 'GENERATION_FAILED' : 'GENERATING' // remains GENERATING until rest of docs or READY
  await updateProject(userId, projectId, { status: finalStatus })

  return results
}

/**
 * Regenerates ONLY incomplete/failed/stuck artifacts for the project.
 * Skips all artifacts that are already READY or MODIFIED for current context.
 */
export async function regenerateFailedArtifacts({
  userId,
  projectId,
}: {
  userId: string
  projectId: string
}): Promise<GeneratedArtifactResult[]> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
        include: {
          artifactPlans: { where: { isRequired: true } },
        },
      },
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')
  const currentContext = project.contexts[0]
  if (!currentContext) throw new Error('No Canonical Project Context found.')

  const readyOrModified = new Set(
    project.artifacts
      .filter((a) => a.contextId === currentContext.id && (a.status === 'READY' || a.status === 'MODIFIED'))
      .map((a) => a.type),
  )

  const coreCandidateTypes = ['PRD', 'SRS', 'ARCHITECTURE', 'DESIGN'] as const
  const requiredPlanTypes = new Set(
    currentContext.artifactPlans
      .filter((plan) => plan.isRequired)
      .map((plan) => plan.type),
  )

  const typesToGenerate = coreCandidateTypes.filter((type) =>
    requiredPlanTypes.has(type) && !readyOrModified.has(type),
  )

  if (typesToGenerate.length === 0 && requiredPlanTypes.size > 0) {
    return []
  }

  if (typesToGenerate.length === 0 && requiredPlanTypes.size === 0) {
    throw new Error('No core artifacts are required by the current project plan.')
  }

  /*
    Explicit plan membership is required here as well as in generateCoreArtifacts.
    This prevents failed-artifact retries from silently recreating unplanned docs.
  */
  const plannedTypes = new Set(typesToGenerate)
  if (plannedTypes.size === 0) return []

  /* Keep the cast local because the candidate tuple is narrower than the public option. */
  const retryTypes = typesToGenerate
    .filter((type): type is 'PRD' | 'SRS' | 'ARCHITECTURE' | 'DESIGN' => plannedTypes.has(type))

  if (retryTypes.length === 0) return []

  return generateCoreArtifacts({
    userId,
    projectId,
    types: retryTypes,
  })
}
