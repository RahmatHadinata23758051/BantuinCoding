import { z } from 'zod'
import type { ProjectClassification } from '@repo/types'

// ============================================================
// Artifact Planner Prompt & Schema Module
// Dedicated prompt module to determine required artifact pack.
// ============================================================

export const SUPPORTED_PLANNED_ARTIFACT_TYPES = [
  'PRD',
  'ARCHITECTURE',
  'DESIGN',
  'AGENT',
  'BACKLOG',
] as const

export const PlannedArtifactSchema = z.object({
  type: z.enum(SUPPORTED_PLANNED_ARTIFACT_TYPES),
  path: z.string(),
  reason: z.string(),
  isRequired: z.boolean(),
})

export const ArtifactPlanSchema = z.object({
  classification: z.enum([
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
  ]),
  artifacts: z.array(PlannedArtifactSchema),
  rationale: z.string(),
})

export type ArtifactPlanOutput = z.infer<typeof ArtifactPlanSchema>

export const ARTIFACT_PLANNER_SYSTEM_PROMPT = `You are a Principal Technical Architect creating a tailored Documentation Pack Plan for a coding agent.

Your job is to analyze the Canonical Project Context and determine which documents must be generated for the project bootstrap pack.

SUPPORTED DOCUMENT PACK:
- PRD (PRD.md): MANDATORY. Owns product scope, user flows, functional requirements, and product acceptance criteria. Keep implementation-level technical design out of the PRD.
- ARCHITECTURE (ARCHITECTURE.md): REQUIRED for apps, dashboards, and SaaS projects. Owns technical design, stack, data architecture, component boundaries, and API behavior. (Omit only for pure static sites/landing pages with no backend).
- DESIGN (DESIGN.md): REQUIRED for any project with a visual or UI component. Sole authority for visual and interaction design decisions.
- AGENT (Agent.md): MANDATORY. Owns operational coding rules, hard constraints, BYOK secret isolation, and resolved skill recommendations.
- BACKLOG (BACKLOG.md): MANDATORY. Translates the other documents into a phased, atomic, dependency-aware task ledger; it does not create new requirements.

SRS.md is not generated in the current lean pack. Consolidate product and software requirements into PRD.md, and put technical design in ARCHITECTURE.md. Do NOT plan separate SRS.md, RULES.md, SKILLS.md, DATABASE.md, API.md, SECURITY.md, or TESTING.md files; these types do not have a supported end-to-end generation stage.

RULES:
1. Landing pages and static sites must produce a lean 3-4 file pack (PRD.md, DESIGN.md when visual, Agent.md, BACKLOG.md).
2. Standard web applications produce 4-5 files (PRD.md, ARCHITECTURE.md, DESIGN.md, Agent.md, BACKLOG.md).
3. Plan only the supported artifact types in the schema. Keep documents concise, authoritative, and actionable.`

export function buildArtifactPlannerUserPrompt(
  projectName: string,
  classification: ProjectClassification,
  contextJson: string,
): string {
  return `Project Name: ${projectName}
Declared Classification: ${classification}

Canonical Project Context:
"""
${contextJson}
"""

Determine the exact set of documents to generate for this project.`
}
