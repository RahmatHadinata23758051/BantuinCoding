import type { AIProvider } from '@/lib/ai/provider'
import {
  DESIGN_GENERATOR_SYSTEM_PROMPT,
  DesignDocumentSchema,
  buildDesignGeneratorUserPrompt,
  validateDesignStructure,
} from '@/lib/prompts/design-generator'

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

function countSignatureMoves(markdown: string): number {
  return (markdown.match(/^\s*(?:[-*]|\d+[.)])\s+(?:\*\*)?(?:Composition|Typography|Material \/ interaction)(?:\*\*)?:/gim) || []).length
}

function validateDesignContent(markdown: string): string[] {
  const violations: string[] = []
  if (!/visual thesis/i.test(markdown)) {
    violations.push('Missing visual thesis')
  }
  if (!/material metaphor/i.test(markdown)) {
    violations.push('Missing material metaphor')
  }
  const rejectedDirections = markdown.match(/^\s*[-*]\s+(?:\*\*)?Rejected (?:direction|alternative)[^\n]*:/gim) || []
  if (rejectedDirections.length < 2) {
    violations.push('Requires two rejected directions with concrete reasons')
  }
  if (countSignatureMoves(markdown) !== 3) {
    violations.push('Requires exactly three signature design moves')
  }
  if (!/(?:only when|only if|context-supported|no screen blueprint|screens? supported by (?:the )?context)/i.test(markdown)) {
    violations.push('Missing conditional screen blueprint rule')
  }
  return violations
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
): Promise<DesignGenerationResult> {
  const userPrompt = buildDesignGeneratorUserPrompt(projectName, contextJson, contextVersion)
  const result = await provider.generateStructured(userPrompt, DesignDocumentSchema, DESIGN_GENERATION_OPTIONS)
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
      DesignDocumentSchema,
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
    if (!isSubstantiveDesign(initial.content)) throw error
    console.warn('[design-generator] repair failed; retaining the substantive initial draft')
    return { content: initial.content, status: 'accepted_with_violations', violations: initial.violations }
  }
}

export async function generateDesignArtifactContent(
  provider: AIProvider,
  projectName: string,
  contextJson: string,
  contextVersion: number,
): Promise<string> {
  const result = await generateDesignArtifactResult(provider, projectName, contextJson, contextVersion)
  return result.content
}

export { validateDesignMarkdown }
