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
  SRS_GENERATOR_SYSTEM_PROMPT,
  SrsDocumentSchema,
  buildSrsGeneratorUserPrompt,
} from '@/lib/prompts/srs-generator'
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
export function generateFallbackDesign(
  projectName: string,
  context: Record<string, unknown>,
): string {
  const designDir = (context.design_direction as { value?: string })?.value || 'Modern Clean Minimal'
  const styling = (context.stack_preferences as Record<string, { value?: string }>)?.styling?.value || 'Tailwind CSS'

  return `# DESIGN.md — ${projectName}

## 1. Visual Direction & Design Thesis
- **Theme & Direction:** ${designDir}
- **Styling Architecture:** ${styling}
- **Benchmark Standards:** Awwwards-grade intentional layout, Dribbble UI polish, fluid Anime.js micro-interactions.

## 2. Color System (60-30-10 Rule)
- **Canvas / Background (60%):** Slate Clean Light (#F8FAFC)
- **Surfaces & Cards (30%):** Pure White (#FFFFFF) with 1px border (#E2E8F0)
- **Brand Primary Accent (10%):** Deep Indigo (#4F46E5)
- **Text Primary:** Slate Deep (#0F172A)
- **Text Muted:** Slate Medium (#64748B)
- **Semantic Accents:** Success (#10B981), Warning (#F59E0B), Danger (#EF4444)

## 3. Typography Hierarchy
- **Heading Font:** Plus Jakarta Sans (Google Fonts)
- **Body Font:** Inter (Google Fonts)
- **Code / Technical:** JetBrains Mono
- **Scale:** Display 3.5rem (bold), H1 2.25rem, H2 1.75rem, H3 1.25rem, Body 1rem, Caption 0.875rem.

## 4. Iconography & Assets
- **Library:** Lucide Icons (stroke: 1.75px, default optical size: 20px)
- **Rules:** Strictly zero random emojis as UI icons; zero cheesy 3D stickers.

## 5. Motion & Micro-Interactions (Anime.js Fluid Curves)
- **Easing:** cubic-bezier(0.16, 1, 0.3, 1)
- **Hover:** -1px subtle transform with soft ambient shadow
- **Active / Press:** 0.98 scale compression
- **Accessibility:** Mandatory prefers-reduced-motion fallback

## 6. Anti-AI-Slop Rejection Checklist
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
  const generatedTypes = types ?? [
    'PRD',
    'SRS',
    ...(currentContextRecord.artifactPlans.some(
      (item) => item.type === 'DESIGN' && item.isRequired,
    )
      ? (['DESIGN'] as const)
      : []),
    'ARCHITECTURE',
  ]

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
          maxTokens: 4096,
          temperature: 0.2,
        })
        markdownContent = res.markdown_content
      } else if (artifactType === 'SRS') {
        const userPrompt = buildSrsGeneratorUserPrompt(project.name, currentContextRecord.contentJson)
        const res = await provider.generateStructured(userPrompt, SrsDocumentSchema, {
          system: SRS_GENERATOR_SYSTEM_PROMPT,
          maxTokens: 4096,
          temperature: 0.2,
        })
        markdownContent = res.markdown_content
      } else if (artifactType === 'ARCHITECTURE') {
        const userPrompt = buildArchitectureGeneratorUserPrompt(project.name, currentContextRecord.contentJson)
        const res = await provider.generateStructured(userPrompt, ArchitectureDocumentSchema, {
          system: ARCHITECTURE_GENERATOR_SYSTEM_PROMPT,
          maxTokens: 4096,
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

  const requiredPlanTypes = new Set(currentContext.artifactPlans.map((p) => p.type))
  const coreCandidateTypes = ['PRD', 'SRS', 'ARCHITECTURE', 'DESIGN'] as const

  const typesToGenerate = coreCandidateTypes.filter((type) => {
    // Include if required by plan (or default core) and not already READY/MODIFIED
    const isRequired = type === 'DESIGN' ? requiredPlanTypes.has('DESIGN') : true
    return isRequired && !readyOrModified.has(type)
  })

  if (typesToGenerate.length === 0) {
    return []
  }

  return generateCoreArtifacts({
    userId,
    projectId,
    types: typesToGenerate as ('PRD' | 'SRS' | 'ARCHITECTURE' | 'DESIGN')[],
  })
}
