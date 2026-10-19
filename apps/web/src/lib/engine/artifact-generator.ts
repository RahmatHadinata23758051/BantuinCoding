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
  buildArchitectureSystemGraph,
  resolveArchitectureSystemGraph,
} from '@/lib/prompts/architecture-generator'
import { generateDesignArtifactContent } from '@/lib/engine/design-generator'
import { buildFallbackDesignMarkdown } from '@/lib/engine/fallback-design'
import { scanContentForSecrets } from '@/lib/export/export-service'
import { isValidVisualReferenceId } from '@/lib/visual-references/catalog'

const SAMPLE_VALUE_MARKERS = /(?:^|[-_ .])(?:dummy|example|placeholder|replace[-_ ]?me|change[-_ ]?me|changeme|sample|your|insert|set[-_ ]?me|todo)(?:$|[-_ .])/i
const SAMPLE_CREDENTIAL_MARKERS = /(?:^|[-_. ])(?:password|pass|secret|token|api[-_ ]?key|key|admin|user|root|postgres|mysql|mongo|mongodb|example|dummy|placeholder|changeme|test|demo)(?:$|[-_. ])/i
const SAMPLE_HOSTS = /^(?:localhost|127\.0\.0\.1|::1|0\.0\.0\.0|db|db-host|postgres|mysql|mongo|mongodb|database|host|server|my-db|mydb)$/i
const DATABASE_URL_VARIABLE = /^(?:[A-Z0-9_]*(?:DATABASE_URL|DIRECT_URL|DB_URL))$/i
const SENSITIVE_VARIABLE = /^(?:API_KEY|[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*)$/i
const DATABASE_URL_SCHEME = /^(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\//i

function isSafeUnresolvedPlaceholder(value: string): boolean {
  return value === '' || /^\$\{[^}\n]+\}$/.test(value) || /^<[^>\n]+>$/.test(value)
}

function hasGenuineApiKeyPattern(value: string): boolean {
  return (
    /sk-[a-zA-Z0-9]{20,}/i.test(value) ||
    /gsk_[a-zA-Z0-9]{20,}/i.test(value) ||
    /AIzaSy[a-zA-Z0-9_\-]{33}/i.test(value) ||
    /lin_api_[a-zA-Z0-9]{20,}/i.test(value) ||
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i.test(value) ||
    /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/.test(value)
  )
}

function isClearlySampleValue(value: string): boolean {
  const normalized = value.trim()
  return !isSafeUnresolvedPlaceholder(normalized) && (
    SAMPLE_VALUE_MARKERS.test(normalized) ||
    /^(?:password|pass|secret|token|api[-_ ]?key|key|value|xxx+)$/i.test(normalized)
  )
}

function isClearlySampleCredential(value: string): boolean {
  const normalized = value.trim()
  return isSafeUnresolvedPlaceholder(normalized) || SAMPLE_CREDENTIAL_MARKERS.test(normalized)
}

function isClearlySampleDatabaseUrl(value: string): boolean {
  if (!DATABASE_URL_SCHEME.test(value) || hasGenuineApiKeyPattern(value)) return false

  try {
    const url = new URL(value)
    const username = decodeURIComponent(url.username)
    const password = decodeURIComponent(url.password)
    const hasCredentials = Boolean(username || password)
    const isSampleHost = SAMPLE_HOSTS.test(url.hostname)

    return hasCredentials
      ? isClearlySampleCredential(username) || isClearlySampleCredential(password)
      : isSampleHost
  } catch {
    return false
  }
}

function isClearlySampleSecretValue(value: string): boolean {
  if (hasGenuineApiKeyPattern(value)) return false
  return isClearlySampleValue(value) || /^[a-f0-9]{32,}$/i.test(value)
}

/**
 * Replaces clearly dummy environment examples before the final secret scan.
 * Values that do not unambiguously look like examples remain untouched and
 * are rejected by the scanner instead of being silently hidden.
 * ponytail: line-based regex sanitizer handles conventional .env assignments; upgrade to AST/code-block parser if multi-line assignments appear.
 */
export function scrubSampleSecrets(markdown: string): string {
  return markdown.replace(
    /^(\s*(?:export\s+)?)([A-Z][A-Z0-9_]*)(\s*=\s*)(?:(\"|')([^\"'\n]*?)\4|([^\s#\n]+))(.*)$/gim,
    (line, prefix: string, variable: string, equals: string, _quote: string | undefined, quotedValue: string | undefined, unquotedValue: string | undefined, suffix: string) => {
      const value = (quotedValue ?? unquotedValue ?? '').trim()
      const shouldScrub = DATABASE_URL_VARIABLE.test(variable)
        ? isClearlySampleDatabaseUrl(value)
        : SENSITIVE_VARIABLE.test(variable) && isClearlySampleSecretValue(value)

      return shouldScrub ? `${prefix}${variable}${equals}\"\"${suffix}` : line
    },
  )
}

export interface GenerateArtifactsOptions {
  userId: string
  projectId: string
  types?: ('PRD' | 'SRS' | 'ARCHITECTURE' | 'DESIGN')[]
  visualReferenceId?: string
}

export interface GeneratedArtifactResult {
  id?: string
  type: string
  status: 'READY' | 'FAILED'
  path: string
  content: string
  updatedAt?: string
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
 * Produces contextual design tokens without inventing project screens.
 */
export function generateFallbackDesign(
  projectName: string,
  context: Record<string, unknown>,
): string {
  return buildFallbackDesignMarkdown(projectName, context)
}

/**
 * Generates PRD, SRS, Architecture, and Design documents from Canonical Project Context.
 */
export async function generateCoreArtifacts({
  userId,
  projectId,
  types,
  visualReferenceId,
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
  if (visualReferenceId && !isValidVisualReferenceId(visualReferenceId)) {
    throw new Error('Invalid visual reference')
  }

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

    if (artifactType === 'ARCHITECTURE') {
      await db.artifact.upsert({
        where: { projectId_type: { projectId, type: 'SYSTEM_GRAPH' } },
        update: { status: 'GENERATING', contextId: currentContextRecord.id, content: '' },
        create: {
          projectId,
          contextId: currentContextRecord.id,
          type: 'SYSTEM_GRAPH',
          path: '.system-graph.json',
          content: '',
          status: 'GENERATING',
        },
      })
    }

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

        const markdownGraph = resolveArchitectureSystemGraph(res.markdown_content, res)
        const effectiveGraph =
          res.system_graph && Array.isArray(res.system_graph.nodes) && res.system_graph.nodes.length > 0
            ? res.system_graph
            : markdownGraph ?? buildArchitectureSystemGraph(res)

        if (effectiveGraph && Array.isArray(effectiveGraph.nodes) && effectiveGraph.nodes.length > 0) {
          const nodeIds = new Set(effectiveGraph.nodes.map((n) => n.id))
          const validEdges = (effectiveGraph.edges || []).filter(
            (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
          )
          const sanitizedGraph = {
            nodes: effectiveGraph.nodes,
            edges: validEdges,
          }
          const graphJson = JSON.stringify(sanitizedGraph)
          await db.artifact.update({
            where: { projectId_type: { projectId, type: 'SYSTEM_GRAPH' } },
            data: {
              content: graphJson,
              status: 'READY',
              contextId: currentContextRecord.id,
              provider: providerConfig?.provider ?? 'FALLBACK',
              model: providerConfig?.model ?? 'BASELINE',
            },
          })
        } else {
          await db.artifact.delete({
            where: { projectId_type: { projectId, type: 'SYSTEM_GRAPH' } },
          })
        }
      } else if (artifactType === 'DESIGN') {
        markdownContent = await generateDesignArtifactContent(
          provider,
          project.name,
          currentContextRecord.contentJson,
          currentContextRecord.version,
          visualReferenceId,
        )
      }

      markdownContent = scrubSampleSecrets(markdownContent)
      scanContentForSecrets(markdownContent, path)

      const updatedArtifact = await db.artifact.update({
        where: { projectId_type: { projectId, type: artifactType } },
        data: {
          content: markdownContent,
          status: 'READY',
          provider: providerConfig?.provider ?? 'FALLBACK',
          model: providerConfig?.model ?? 'BASELINE',
        },
        select: {
          id: true,
          type: true,
          path: true,
          status: true,
          content: true,
          updatedAt: true,
        },
      })

      results.push({
        id: updatedArtifact?.id,
        type: artifactType,
        status: 'READY',
        path,
        content: markdownContent,
        updatedAt: updatedArtifact?.updatedAt ? updatedArtifact.updatedAt.toISOString() : undefined,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Generation failed'
      await db.artifact.update({
        where: { projectId_type: { projectId, type: artifactType } },
        data: { status: 'FAILED' },
      })
      if (artifactType === 'ARCHITECTURE') {
        await db.artifact.update({
          where: { projectId_type: { projectId, type: 'SYSTEM_GRAPH' } },
          data: { status: 'FAILED', content: '' },
        })
      }

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

  // Agent.md is handled by the dedicated generator; BACKLOG.md is a separate
  // pipeline stage and must not be regenerated by this core-document helper.

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
