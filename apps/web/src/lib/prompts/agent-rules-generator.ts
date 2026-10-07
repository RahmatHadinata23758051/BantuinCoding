import { z } from 'zod'

// ============================================================
// AGENT & RULES Prompt & Schema Module (BK-012)
// Defines schemas for generating AGENT.md and RULES.md
// ============================================================

export const AgentDocumentSchema = z.object({
  agent_content: z.string().describe('Full formatted Agent.md content in Markdown, including rules and recommended skills'),
})

export const AgentRulesDocumentSchema = z.object({
  agent_content: z.string().describe('Full formatted Agent.md content in Markdown, including rules and recommended skills'),
  rules_content: z.string().default('').describe('Legacy compatibility field; leave empty when the consolidated Agent.md is used'),
})

export type AgentRulesDocumentOutput = z.infer<typeof AgentRulesDocumentSchema>

export const AGENT_RULES_GENERATOR_SYSTEM_PROMPT = `You are a Principal AI Agent Engineer & Technical Architect drafting a unified operational contract (Agent.md) for a coding agent.

Your output must strictly follow the provided JSON schema. The agent_content field must contain a single, complete Agent.md document that includes all operational rules, hard constraints, and recommended skills.

AGENT.MD STRUCTURE REQUIREMENTS:
1. Agent Role & Primary Responsibilities
2. Source-of-Truth Document Hierarchy (PRD > ARCHITECTURE > DESIGN for visual/interaction scope > Agent.md > BACKLOG.md; visual decisions must always come from DESIGN.md alone)
3. Implementation Workflow (UNDERSTAND -> INSPECT -> PLAN -> IMPLEMENT -> VERIFY -> REPORT)
4. Backlog Execution Rules & State Machine Handling
5. Quality Gates (Typecheck, Lint, Tests, Security, Zero Regression)
6. Hard Technology Constraints (No stack change without approval)
7. Dependency Execution Rules (No skipping backlog tasks or dependencies)
8. BYOK & Secret Isolation Rules (Zero API key persistence or leakage)
9. Scope Boundaries & Anti-Feature Creep Rules
10. Security Rules & Compliance
10. Recommended Agent Skills & Triggers
11. Definition of Done

CRITICAL CONSTRAINTS:
- Produce a SINGLE Agent.md document that includes ALL operational rules, hard constraints, security rules, and recommended skills.
- Do NOT produce a separate RULES.md document; the rules_content field must be left empty.
- Visual decisions must ALWAYS come from DESIGN.md alone.
- Agent.md is the sole operational contract for the coding agent.`

export function buildAgentRulesGeneratorUserPrompt(
  projectName: string,
  targetAgent: string,
  contextJson: string,
): string {
  return `Project Name: ${projectName}
Target Coding Agent: ${targetAgent}

Canonical Project Context:
"""
${contextJson}
"""

Generate the complete Agent.md document. Put all rules, security constraints, and recommended skills inside Agent.md. Leave the legacy rules_content field empty.`
}
