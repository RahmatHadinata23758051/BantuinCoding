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

CORE MANDATORY DOCUMENTS (ALWAYS REQUIRED for every project type):
- PRD (PRD.md)
- SRS (SRS.md)
- ARCHITECTURE (ARCHITECTURE.md)
- AGENT (Agent.md)
- RULES (RULES.md)
- SKILLS (SKILLS.md)
- BACKLOG (BACKLOG.md)

CONDITIONAL DESIGN DOCUMENT:
- DESIGN (DESIGN.md): REQUIRED for UI/product-facing scope including STATIC_SITE, LANDING_PAGE, CRUD_APP, DASHBOARD, SAAS, MOBILE_APP, AI_APP, IOT_DASHBOARD, FULLSTACK_COMPLEX, or when the context contains design_direction/styling preferences. Optional or omitted only for backend-only API_SERVICE projects with no user interface scope.

OPTIONAL CONDITIONAL DOCUMENTS (Include based on project complexity):
- DATABASE (docs/DATABASE.md): Include if the project has a database or data persistence.
- API (docs/API.md): Include for SaaS, API services, or fullstack apps.
- SECURITY (docs/SECURITY.md): Include for SaaS, auth-heavy apps, or financial/health apps.
- TESTING (docs/TESTING.md): Include for complex applications.
- DEPLOYMENT (docs/DEPLOYMENT.md): Include for cloud, SaaS, or complex infra.
- README (README.md): Include for repo overview.
- MCP_SETUP (docs/MCP_SETUP.md): Include for AI apps or agentic workflows.

RULES:
1. Landing pages and static sites MUST have fewer documents than SaaS or complex fullstack apps.
2. Return a complete, tailored list of artifacts.`

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
