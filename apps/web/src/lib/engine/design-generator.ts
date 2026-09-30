import type { AIProvider } from '@/lib/ai/provider'
import {
  DESIGN_GENERATOR_SYSTEM_PROMPT,
  DesignDocumentSchema,
  buildDesignGeneratorUserPrompt,
} from '@/lib/prompts/design-generator'

export async function generateDesignArtifactContent(
  provider: AIProvider,
  projectName: string,
  contextJson: string,
  contextVersion: number,
): Promise<string> {
  const userPrompt = buildDesignGeneratorUserPrompt(projectName, contextJson, contextVersion)
  const result = await provider.generateStructured(userPrompt, DesignDocumentSchema, {
    system: DESIGN_GENERATOR_SYSTEM_PROMPT,
    maxTokens: 4096,
    temperature: 0.2,
  })

  return result.markdown_content
}
