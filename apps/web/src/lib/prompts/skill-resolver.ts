import { z } from 'zod'

// ============================================================
// Skill Resolver Prompt & Schema Module (BK-013)
// Infers relevant agent skills from Canonical Project Context
// ============================================================

export const ResolvedSkillSchema = z.object({
  name: z.string(),
  source: z.string(),
  purpose: z.string(),
  trigger: z.string(),
  applicable_phases: z.array(z.string()),
  applicable_task_types: z.array(z.string()),
  installation_hint: z.string().optional(),
})

export type ResolvedSkill = z.infer<typeof ResolvedSkillSchema>

export const SkillResolverOutputSchema = z.object({
  skills: z.array(ResolvedSkillSchema),
  rationale: z.string(),
  skills_md_content: z.string().describe('Full SKILLS.md file formatted in GitHub-flavored Markdown'),
})

export type SkillResolverOutput = z.infer<typeof SkillResolverOutputSchema>

export const SKILL_RESOLVER_SYSTEM_PROMPT = `You are an AI Agent Tooling & Skill Specialist.

Your job is to analyze the Canonical Project Context and resolve a concise, highly tailored list of coding agent skills needed for this project.

RULES:
1. Do NOT dump a massive generic list of skills. Recommend only 3 to 7 highly relevant skills matching the technology stack, security profile, UI needs, and domain complexity.
2. Every skill must include:
   - name: kebab-case identifier (e.g., 'typescript-backend', 'ui-ux-pro-max', 'security-hardening')
   - source: catalog domain (default: 'skillsllm.com')
   - purpose: one-sentence explanation of why the skill is needed
   - trigger: context condition that triggers the agent to use this skill
   - applicable_phases: project phases where this skill applies (e.g. ['Phase 1', 'Phase 3'])
   - applicable_task_types: task categories (e.g. ['backend', 'database', 'security'])
   - installation_hint: command to install or activate skill (optional)
3. The skills_md_content field must contain a formatted SKILLS.md file in Markdown listing the resolved skills.`

export function buildSkillResolverUserPrompt(
  projectName: string,
  classification: string,
  contextJson: string,
  availableCatalogJson: string,
): string {
  return `Project Name: ${projectName}
Project Type: ${classification}

Canonical Project Context:
"""
${contextJson}
"""

Available Skill Catalog Context:
"""
${availableCatalogJson}
"""

Resolve the optimal set of agent skills for this project and format SKILLS.md.`
}
