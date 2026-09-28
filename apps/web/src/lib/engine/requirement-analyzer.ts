import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import {
  REQUIREMENT_ANALYZER_SYSTEM_PROMPT,
  RequirementAnalysisSchema,
  buildRequirementAnalysisUserPrompt,
  type RequirementAnalysisResult,
} from '@/lib/prompts/requirement-analyzer'
import { db } from '@repo/db'
import { persistRequirementAnalysis } from '@/lib/engine/analysis-store'
import { updateProject } from '@/lib/projects/project-service'

export interface AnalyzeRequirementOptions {
  userId: string
  projectId: string
  retryCount?: number
}

/**
 * Requirement Analyzer Service
 * Analyzes a project's rawIdea using the user's BYOK provider session.
 * Updates project state: DRAFT/CONFIGURED → ANALYZING → CONTEXT_READY (or GENERATION_FAILED on error).
 */
export async function analyzeProjectRequirements({
  userId,
  projectId,
  retryCount = 2,
}: AnalyzeRequirementOptions): Promise<RequirementAnalysisResult> {
  // 1. Get project
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // 2. Get active provider session
  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error(
      'No active AI provider session found. Please configure your API key in BYOK settings.',
    )
  }

  // 3. Transition status to ANALYZING. Fresh projects start at DRAFT,
  // so move through CONFIGURED using the domain state machine first.
  if (project.status === 'DRAFT') {
    await updateProject(userId, projectId, { status: 'CONFIGURED' })
  }
  await updateProject(userId, projectId, { status: 'ANALYZING' })

  // 4. Instantiate provider and generate structured output with retry
  const provider = createProvider(providerConfig)
  const userPrompt = buildRequirementAnalysisUserPrompt(
    project.name,
    project.rawIdea,
    project.classification,
    project.targetAgent,
  )

  let lastError: unknown = null

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const result = await provider.generateStructured(
        userPrompt,
        RequirementAnalysisSchema,
        {
          system: REQUIREMENT_ANALYZER_SYSTEM_PROMPT,
          maxTokens: 4096,
          temperature: 0.2,
        },
      )

      await persistRequirementAnalysis({ projectId, analysis: result })
      return result
    } catch (err) {
      lastError = err
      if (attempt < retryCount) {
        // Wait briefly before retry
        await new Promise((res) => setTimeout(res, 500 * attempt))
      }
    }
  }

  // If all retries failed, mark project status as GENERATION_FAILED
  await db.project.update({
    where: { id: projectId },
    data: { status: 'GENERATION_FAILED' },
  })

  const errorMessage =
    lastError instanceof Error ? lastError.message : String(lastError)
  throw new Error(`Requirement analysis failed after ${retryCount} attempts: ${errorMessage}`)
}
