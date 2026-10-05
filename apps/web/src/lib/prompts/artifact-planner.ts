import { z } from 'zod'
import type { ProjectClassification } from '@repo/types'

// ============================================================
// Artifact Planner Prompt & Schema Module
// Dedicated prompt module to determine required artifact pack.
// ============================================================

export const PlannedArtifactSchema = z.object({
  type: z.enum([
    'PRD',
    'SRS',
    'ARCHITECTURE',
    'DESIGN',
    'AGENT',
    'RULES',
    'SKILLS',
    'BACKLOG',
    'DATABASE',
    'API',
    'SECURITY',
    'TESTING',
    'DEPLOYMENT',
    'README',
    'MCP_SETUP',
  ]),
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

CORE LEAN DOCUMENTATION PACK:
- PRD (PRD.md): MANDATORY. Contains complete product overview, user flows, functional requirements (FR-xxx), non-functional requirements, data requirements, and error behavior.
- ARCHITECTURE (ARCHITECTURE.md): REQUIRED for apps, dashboards, and SaaS projects. Defines tech stack, database schema, component boundaries, and API routes. (Omit only for pure static sites/landing pages with no backend).
- DESIGN (DESIGN.md): REQUIRED for any project with a visual or UI component. Sole visual authority.
- AGENT (Agent.md): MANDATORY. Single operational contract and rulebook for the coding agent. Absorbs operational rules, hard constraints, BYOK secret isolation, and recommended skills.
- BACKLOG (BACKLOG.md): MANDATORY. Phased, atomic, dependency-aware task ledger.

CONDITIONAL / ADVANCED DOCUMENTS:
- SRS (SRS.md): Only include for massive enterprise systems with external regulatory compliance where functional specs exceed standard PRD scope. For typical projects, functional specs are absorbed into PRD.md.
- RULES & SKILLS: These are consolidated directly into Agent.md. Do NOT generate separate RULES.md or SKILLS.md files unless explicitly requested.
- DATABASE (docs/DATABASE.md): Include if the project has intricate custom database schema beyond ARCHITECTURE.md.
- API (docs/API.md): Include for multi-service or public API documentation.
- SECURITY (docs/SECURITY.md): Include for high-risk fintech or healthcare compliance.
- TESTING (docs/TESTING.md): Include for complex end-to-end testing setups.

RULES:
1. Landing pages and static sites must produce a lean 3-4 file pack (PRD.md, DESIGN.md, Agent.md, BACKLOG.md).
2. Standard web applications produce 4-5 files (PRD.md, ARCHITECTURE.md, DESIGN.md, Agent.md, BACKLOG.md).
3. Do NOT create bloated duplicate files. Keep documentation concise, authoritative, and actionable.`

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
