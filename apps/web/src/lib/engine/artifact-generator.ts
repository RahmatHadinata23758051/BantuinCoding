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

export interface GenerateArtifactsOptions {
  userId: string
  projectId: string
  types?: ('PRD' | 'SRS' | 'ARCHITECTURE')[]
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
 * Generates PRD, SRS, Architecture documents consuming Canonical Project Context snapshot.
 */
export async function generateCoreArtifacts({
  userId,
  projectId,
  types = ['PRD', 'SRS', 'ARCHITECTURE'],
}: GenerateArtifactsOptions): Promise<GeneratedArtifactResult[]> {
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

  // Update project status to GENERATING
  await updateProject(userId, projectId, { status: 'GENERATING' })

  const parsedContext = JSON.parse(currentContextRecord.contentJson)
  const providerConfig = getProviderConfig(userId)
  const provider = providerConfig ? createProvider(providerConfig) : null

  const results: GeneratedArtifactResult[] = []

  for (const artifactType of types) {
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
        if (provider) {
          const userPrompt = buildPrdGeneratorUserPrompt(project.name, currentContextRecord.contentJson)
          const res = await provider.generateStructured(userPrompt, PrdDocumentSchema, {
            system: PRD_GENERATOR_SYSTEM_PROMPT,
            maxTokens: 4096,
            temperature: 0.2,
          })
          markdownContent = res.markdown_content
        } else {
          markdownContent = generateFallbackPrd(project.name, parsedContext)
        }
      } else if (artifactType === 'SRS') {
        if (provider) {
          const userPrompt = buildSrsGeneratorUserPrompt(project.name, currentContextRecord.contentJson)
          const res = await provider.generateStructured(userPrompt, SrsDocumentSchema, {
            system: SRS_GENERATOR_SYSTEM_PROMPT,
            maxTokens: 4096,
            temperature: 0.2,
          })
          markdownContent = res.markdown_content
        } else {
          markdownContent = generateFallbackSrs(project.name, parsedContext)
        }
      } else if (artifactType === 'ARCHITECTURE') {
        if (provider) {
          const userPrompt = buildArchitectureGeneratorUserPrompt(project.name, currentContextRecord.contentJson)
          const res = await provider.generateStructured(userPrompt, ArchitectureDocumentSchema, {
            system: ARCHITECTURE_GENERATOR_SYSTEM_PROMPT,
            maxTokens: 4096,
            temperature: 0.2,
          })
          markdownContent = res.markdown_content
        } else {
          markdownContent = generateFallbackArchitecture(project.name, parsedContext)
        }
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
