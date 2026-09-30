import { z } from 'zod'
import type { CanonicalProjectContext } from '@repo/types'

// ============================================================
// Canonical Project Context Prompt & Schema Module
// Defined in SRS §10 and Agent.md §14.
// Provenance tracking: confirmed | assumed | unknown
// ============================================================

export const ContextItemWithProvenance = z.object({
  value: z.string(),
  provenance: z.enum(['confirmed', 'assumed', 'unknown']),
})

export const CanonicalContextSchema = z.object({
  project_name: z.string(),
  summary: z.string(),
  target_users: z.array(ContextItemWithProvenance),
  goals: z.array(ContextItemWithProvenance),
  non_goals: z.array(ContextItemWithProvenance),
  functional_requirements: z.array(
    z.object({
      id: z.string().describe('e.g. FR-001'),
      title: z.string(),
      description: z.string(),
      provenance: z.enum(['confirmed', 'assumed', 'unknown']),
    }),
  ),
  non_functional_requirements: z.array(
    z.object({
      category: z.string().describe('e.g. Security, Performance, Scalability'),
      requirement: z.string(),
      provenance: z.enum(['confirmed', 'assumed', 'unknown']),
    }),
  ),
  core_entities: z.array(
    z.object({
      name: z.string(),
      fields: z.array(z.string()),
      relationships: z.array(z.string()).optional(),
    }),
  ),
  technical_constraints: z.array(ContextItemWithProvenance),
  stack_preferences: z.object({
    frontend: ContextItemWithProvenance,
    backend: ContextItemWithProvenance,
    database: ContextItemWithProvenance,
    styling: ContextItemWithProvenance,
  }),
  design_direction: ContextItemWithProvenance,
  security_requirements: z.array(ContextItemWithProvenance),
  integrations: z.array(ContextItemWithProvenance),
  deployment_target: ContextItemWithProvenance,
  agent_target: z.string(),
  confirmed_decisions: z.array(ContextItemWithProvenance),
  open_questions: z.array(ContextItemWithProvenance),
  assumptions: z.array(ContextItemWithProvenance),
}).strict()

export type CanonicalContextOutput = z.infer<typeof CanonicalContextSchema>

// Compile-time bidirectional compatibility guard for the shared contract.
const _sharedContextCompatibility: CanonicalProjectContext = {} as CanonicalContextOutput
const _schemaContextCompatibility: CanonicalContextOutput = {} as CanonicalProjectContext
void _sharedContextCompatibility
void _schemaContextCompatibility

export const CONTEXT_NORMALIZER_SYSTEM_PROMPT = `You are a Principal Technical Architect creating a Canonical Project Context snapshot.

Your task is to synthesize all raw input, requirement analysis, and answered clarification questions into a single, normalized Canonical Project Context JSON.

CRITICAL PROVENANCE RULES:
1. Every decision or requirement MUST track provenance:
   - "confirmed": Explicitly specified by the user in the raw input or answered clarification questions.
   - "assumed": Inferred logically by you based on industry standards, project classification, or best practices.
   - "unknown": Still unresolved or underspecified.
2. Confirmed decisions cannot be silently downgraded to assumed.
3. Be explicit, structured, and complete.

REQUIRED JSON SCHEMA (output EXACTLY this structure, no extra fields, no missing fields):
{
  "project_name": "string",
  "summary": "string",
  "target_users": [{"value": "string", "provenance": "confirmed|assumed|unknown"}],
  "goals": [{"value": "string", "provenance": "confirmed|assumed|unknown"}],
  "non_goals": [{"value": "string", "provenance": "confirmed|assumed|unknown"}],
  "functional_requirements": [{"id": "FR-001", "title": "string", "description": "string", "provenance": "confirmed|assumed|unknown"}],
  "non_functional_requirements": [{"category": "Security|Performance|Scalability", "requirement": "string", "provenance": "confirmed|assumed|unknown"}],
  "core_entities": [{"name": "string", "fields": ["string"], "relationships": ["string"]}],
  "technical_constraints": [{"value": "string", "provenance": "confirmed|assumed|unknown"}],
  "stack_preferences": {
    "frontend": {"value": "string", "provenance": "confirmed|assumed|unknown"},
    "backend": {"value": "string", "provenance": "confirmed|assumed|unknown"},
    "database": {"value": "string", "provenance": "confirmed|assumed|unknown"},
    "styling": {"value": "string", "provenance": "confirmed|assumed|unknown"}
  },
  "design_direction": {"value": "string", "provenance": "confirmed|assumed|unknown"},
  "security_requirements": [{"value": "string", "provenance": "confirmed|assumed|unknown"}],
  "integrations": [{"value": "string", "provenance": "confirmed|assumed|unknown"}],
  "deployment_target": {"value": "string", "provenance": "confirmed|assumed|unknown"},
  "agent_target": "string",
  "confirmed_decisions": [{"value": "string", "provenance": "confirmed"}],
  "open_questions": [{"value": "string", "provenance": "unknown"}],
  "assumptions": [{"value": "string", "provenance": "assumed"}]
}

OUTPUT FORMAT:
- Return ONLY a valid JSON object matching the schema above.
- Do NOT wrap in markdown code fences.
- Do NOT include reasoning, thinking, or explanation text.
- Do NOT use \`\`\`json blocks.
- Output the raw JSON object directly.`

export function buildContextNormalizerUserPrompt(
  projectName: string,
  rawIdea: string,
  classification: string,
  targetAgent: string,
  analysisJson: string,
  qaJson: string,
): string {
  return `Project Name: ${projectName}
Project Type: ${classification}
Target Agent: ${targetAgent}

Raw Idea Input:
"""
${rawIdea}
"""

Requirement Analysis:
"""
${analysisJson}
"""

Answered Clarification Questions:
"""
${qaJson}
"""

Synthesize all information above into the normalized Canonical Project Context JSON.
Output ONLY the raw JSON object. No markdown fences, no prose, no explanation.`
}
