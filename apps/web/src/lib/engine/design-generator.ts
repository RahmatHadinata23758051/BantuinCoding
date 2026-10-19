import type { AIProvider } from '@/lib/ai/provider'
import {
  DESIGN_GENERATOR_SYSTEM_PROMPT,
  DesignDocumentPayloadSchema,
  buildDesignGeneratorUserPrompt,
  validateDesignStructure,
} from '@/lib/prompts/design-generator'
import { buildFallbackDesignMarkdown } from '@/lib/engine/fallback-design'
import { getVisualReference, isValidVisualReferenceId } from '@/lib/visual-references/catalog'

const DESIGN_GENERATION_OPTIONS = {
  system: DESIGN_GENERATOR_SYSTEM_PROMPT,
  maxTokens: 32000,
  temperature: 0.4,
} as const

export type DesignGenerationStatus = 'accepted' | 'repaired' | 'accepted_with_violations'

export interface DesignGenerationResult {
  content: string
  status: DesignGenerationStatus
  violations: string[]
}

function validateDesignContent(markdown: string): string[] {
  return /(?:only when|only if|context-supported|no screen blueprint|screens? supported by (?:the )?context)/i.test(markdown)
    ? []
    : ['Missing conditional screen blueprint rule']
}

function validateDesignMarkdown(markdown: string): string[] {
  const content = markdown.trim()
  if (!content) return ['Markdown content cannot be empty']

  const violations: string[] = []
  if (!/^# DESIGN\.md(?:\s|$)/m.test(content)) {
    violations.push('Missing top-level # DESIGN.md heading')
  }
  violations.push(...validateDesignStructure(content))
  violations.push(...validateDesignContent(content))
  return [...new Set(violations)]
}

function isSubstantiveDesign(markdown: string): boolean {
  return markdown.trim().length >= 200
}

function pickBestDraft(
  initial: { content: string; violations: string[] },
  repaired: { content: string; violations: string[] },
): { content: string; violations: string[] } {
  if (!isSubstantiveDesign(initial.content)) return repaired
  if (!isSubstantiveDesign(repaired.content)) return initial
  return repaired.violations.length <= initial.violations.length ? repaired : initial
}

export async function generateDesignArtifactResult(
  provider: AIProvider,
  projectName: string,
  contextJson: string,
  contextVersion: number,
  visualReferenceId?: string,
): Promise<DesignGenerationResult> {
  const selectedReference = visualReferenceId && isValidVisualReferenceId(visualReferenceId)
    ? getVisualReference(visualReferenceId)
    : undefined
  const userPrompt = buildDesignGeneratorUserPrompt(
    projectName,
    contextJson,
    contextVersion,
    selectedReference ? { name: selectedReference.name, dnaPrompt: selectedReference.dnaPrompt } : undefined,
  )
  const fallbackDirection = selectedReference ? `${selectedReference.name}: ${selectedReference.dnaPrompt}` : undefined
  let fallbackContext: Record<string, unknown> = {}
  try {
    fallbackContext = JSON.parse(contextJson) as Record<string, unknown>
  } catch {}
  if (selectedReference) {
    fallbackContext.design_direction = {
      value: fallbackDirection,
      provenance: 'confirmed',
    }
  }

  let result: { markdown_content: string }
  try {
    result = await provider.generateStructured(userPrompt, DesignDocumentPayloadSchema, DESIGN_GENERATION_OPTIONS)
  } catch (error) {
    console.warn('[design-generator] initial provider call failed, attempting fallback', error)
    const fallback = buildFallbackDesignMarkdown(projectName, fallbackContext, fallbackDirection)
    return {
      content: fallback,
      status: 'accepted_with_violations',
      violations: ['Provider call failed, generated contextual fallback design'],
    }
  }

  const initial = {
    content: result.markdown_content,
    violations: validateDesignMarkdown(result.markdown_content),
  }

  if (initial.violations.length === 0) {
    return { content: initial.content, status: 'accepted', violations: [] }
  }

  const repairPrompt = `${userPrompt}

<draft_to_repair>
${result.markdown_content}
</draft_to_repair>

AUTOMATED REVIEW FAILED:
${initial.violations.map((violation) => `- ${violation}`).join('\n')}

Return the complete JSON object again. Preserve the draft's project-specific decisions, tokens, archetype, and screen scope. Repair every listed violation without inventing context.`

  console.warn(`[design-generator] repair requested: ${initial.violations.length} validation issue(s)`)

  try {
    const repairedResult = await provider.generateStructured(
      repairPrompt,
      DesignDocumentPayloadSchema,
      DESIGN_GENERATION_OPTIONS,
    )
    const repaired = {
      content: repairedResult.markdown_content,
      violations: validateDesignMarkdown(repairedResult.markdown_content),
    }

    if (repaired.violations.length === 0) {
      return { content: repaired.content, status: 'repaired', violations: [] }
    }

    const best = pickBestDraft(initial, repaired)
    console.warn(`[design-generator] repair accepted with ${best.violations.length} remaining issue(s)`)
    return { content: best.content, status: 'accepted_with_violations', violations: best.violations }
  } catch (error) {
    if (!isSubstantiveDesign(initial.content)) {
      console.warn('[design-generator] repair failed and draft is unsubstantial, using fallback', error)
      return {
        content: buildFallbackDesignMarkdown(projectName, fallbackContext, fallbackDirection),
        status: 'accepted_with_violations',
        violations: initial.violations,
      }
    }
    console.warn('[design-generator] repair failed; retaining the substantive initial draft')
    return { content: initial.content, status: 'accepted_with_violations', violations: initial.violations }
  }
}

export async function generateDesignArtifactContent(
  provider: AIProvider,
  projectName: string,
  contextJson: string,
  contextVersion: number,
  visualReferenceId?: string,
): Promise<string> {
  const result = await generateDesignArtifactResult(
    provider,
    projectName,
    contextJson,
    contextVersion,
    visualReferenceId,
  )
  return result.content
}

export { validateDesignMarkdown }
