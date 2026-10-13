import { z } from 'zod'

// ============================================================
// Project Classifier Prompt & Schema Module
// Dedicated prompt module per architecture specification.
// Classifies raw user prompt into supported archetypes.
// ============================================================

export const PROJECT_CLASSIFICATIONS = [
  'STATIC_SITE',
  'LANDING_PAGE',
  'CRUD_APP',
  'DASHBOARD',
  'SAAS',
  'API_SERVICE',
  'MOBILE_APP',
  'AI_APP',
  'IOT_DASHBOARD',
  'FULLSTACK_COMPLEX',
  'OTHER',
] as const

export const ProjectClassificationSchema = z.enum(PROJECT_CLASSIFICATIONS)
export type ProjectClassification = z.infer<typeof ProjectClassificationSchema>

export const PROJECT_CLASSIFIER_SYSTEM_PROMPT = `You are an expert Software Architect and Project Classifier.

Your task is to analyze a raw software project idea and classify it into exactly ONE of the following 11 supported project archetypes:

1. STATIC_SITE: Static content-driven websites, documentation sites, personal portfolios, blogs without dynamic backend.
2. LANDING_PAGE: Marketing pages, conversion-focused single pages, product announcement pages with lead capture or CTA.
3. CRUD_APP: Standard data-management applications, administrative tools, internal portals with basic Create-Read-Update-Delete flows.
4. DASHBOARD: Analytics portals, data visualization platforms, metric-heavy reporting interfaces.
5. SAAS: Multi-tenant subscription web services, business platforms with billing, user workspaces, and complex domain logic.
6. API_SERVICE: Backend services, REST/GraphQL APIs, microservices, headless backends, or webhook consumers.
7. MOBILE_APP: iOS/Android native or cross-platform mobile apps (React Native, Flutter, Swift, Kotlin).
8. AI_APP: AI-centric applications, RAG pipelines, LLM wrapper tools, agent workspaces, computer vision/audio ML tools.
9. IOT_DASHBOARD: Hardware-connected dashboards, sensor monitoring, telematics, device management portals.
10. FULLSTACK_COMPLEX: Multi-tier applications combining complex frontend, real-time sync/websockets, background workers, or event-driven backends.
11. OTHER: Novel or unconventional software projects that do not cleanly fit any of the above categories (e.g. CLI tools, desktop utilities, browser extensions, standalone bots).

Rules:
- You must ONLY select from the 11 supported archetypes.
- Never invent new categories.
- Pick the archetype that best matches the primary technical architecture and product scope.
- Return structured JSON with "classification", and optional "confidence" ('high' | 'medium' | 'low') and "reasoning".`

export const ProjectClassifierSchema = z
  .object({
    classification: ProjectClassificationSchema.describe(
      'Primary project classification archetype',
    ),
    confidence: z.enum(['high', 'medium', 'low']).optional(),
    reasoning: z.string().max(200).optional(),
  })
  .strict()

export type ProjectClassifierResult = z.infer<typeof ProjectClassifierSchema>

export function buildProjectClassifierUserPrompt(
  projectName: string,
  rawIdea: string,
  language: string = 'id',
): string {
  const languageDirective =
    language === 'id'
      ? 'Context note: The raw idea is provided in Indonesian or English. Classify based on the functional and architectural intent.'
      : 'Context note: The raw idea is provided in English. Classify based on the functional and architectural intent.'

  return `Project Name: ${projectName}
${languageDirective}

Raw Project Idea:
"""
${rawIdea}
"""

Classify this project into exactly one supported archetype.`
}
