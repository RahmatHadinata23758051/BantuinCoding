import { z } from 'zod'

// ============================================================
// Architecture Generator Prompt & Schema Module (BK-011)
// Generates Architecture Specification from Canonical Context
// ============================================================

export const ArchitectureDocumentSchema = z.object({
  title: z.string().default('ARCHITECTURE.md'),
  system_overview: z.string().optional(),
  stack: z.object({
    frontend: z.string().optional(),
    backend: z.string().optional(),
    database: z.string().optional(),
    styling: z.string().optional(),
    infrastructure: z.string().optional(),
  }).optional(),
  components: z.array(
    z.object({
      name: z.string(),
      responsibility: z.string(),
      boundary: z.string(),
    }),
  ).optional(),
  data_flow: z.array(
    z.object({
      flow_name: z.string(),
      description: z.string(),
    }),
  ).optional(),
  security_architecture: z.array(z.string()).optional(),
  deployment_strategy: z.string().optional(),
  markdown_content: z.string().describe('Full formatted ARCHITECTURE.md content in Markdown'),
})

export type ArchitectureDocumentOutput = z.infer<typeof ArchitectureDocumentSchema>

export const ARCHITECTURE_GENERATOR_SYSTEM_PROMPT = `You are a Principal Software Architect drafting an ARCHITECTURE.md specification for a coding agent.

Your output must strictly follow the provided JSON schema.
The markdown_content field must contain a complete, architectural blueprint in GitHub-flavored Markdown.

ARCHITECTURE STRUCTURE REQUIREMENTS:
1. Executive System Overview
2. Selected Technology Stack & Rationale
3. System Component Breakdown & Module Boundaries
4. Data Flow & Sequence Descriptions
5. Security & BYOK Key Handling Architecture
6. Storage & Database Design
7. Deployment Expectations & Environment Setup

CRITICAL CONSTRAINTS:
- Keep the architecture practical (modular monolith first; avoid unnecessary microservices or over-engineering).
- Explicitly detail data flow and security boundaries.
- Ensure the specification is dense, rigorous, and completes cleanly within token limits.`

export function buildArchitectureGeneratorUserPrompt(
  projectName: string,
  contextJson: string,
): string {
  return `Project Name: ${projectName}

Canonical Project Context:
"""
${contextJson}
"""

Generate the complete ARCHITECTURE.md document output according to the schema.`
}
