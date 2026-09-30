import { z } from 'zod'

// ============================================================
// AGENT & RULES Prompt & Schema Module (BK-012)
// Defines schemas for generating AGENT.md and RULES.md
// ============================================================

export const AgentRulesDocumentSchema = z.object({
  agent_content: z.string().describe('Full formatted Agent.md content in Markdown'),
  rules_content: z.string().describe('Full formatted RULES.md content in Markdown'),
})

export type AgentRulesDocumentOutput = z.infer<typeof AgentRulesDocumentSchema>

export const AGENT_RULES_GENERATOR_SYSTEM_PROMPT = `You are a Principal AI Agent Engineer & Technical Architect drafting operational contracts (Agent.md) and strict constraints (RULES.md) for a coding agent.

Your output must strictly follow the provided JSON schema containing both agent_content and rules_content.

AGENT.MD STRUCTURE REQUIREMENTS:
1. Agent Role & Primary Responsibilities
2. Source-of-Truth Document Hierarchy (Explicit user instruction > SRS > PRD > DESIGN for visual/interaction scope > ARCHITECTURE > RULES > Agent.md > BACKLOG.md)
3. Implementation Workflow (UNDERSTAND -> INSPECT -> PLAN -> IMPLEMENT -> VERIFY -> REPORT)
4. Backlog Execution Rules & State Machine Handling
5. Quality Gates (Typecheck, Lint, Tests, Security, Zero Regression)
6. Prohibited Behaviors & Reporting Format
7. Definition of Done

RULES.MD STRUCTURE REQUIREMENTS:
1. Hard Technology Constraints (No stack change without approval)
2. Dependency Execution Rules (No skipping backlog tasks or dependencies)
3. BYOK & Secret Isolation Rules (Zero API key persistence or leakage)
4. Scope Boundaries & Anti-Feature Creep Rules

CRITICAL CONSTRAINTS:
- Keep AGENT.md focused on operational agent workflow.
- Keep RULES.md focused on non-negotiable hard constraints.`

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

Generate the complete AGENT.md and RULES.md documents.`
}
