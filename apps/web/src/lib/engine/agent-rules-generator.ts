import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import { updateProject } from '@/lib/projects/project-service'
import {
  AGENT_RULES_GENERATOR_SYSTEM_PROMPT,
  AgentRulesDocumentSchema,
  buildAgentRulesGeneratorUserPrompt,
} from '@/lib/prompts/agent-rules-generator'
import type { GeneratedArtifactResult } from '@/lib/engine/artifact-generator'

export interface GenerateAgentRulesOptions {
  userId: string
  projectId: string
}

/**
 * Fallback generator for Agent.md when AI is not configured or fails.
 */
export function generateFallbackAgentMd(
  projectName: string,
  targetAgent: string,
): string {
  return `# Agent.md — Operational Contract for ${targetAgent}

## Project: ${projectName}

### 1. Role & Responsibilities
You are the primary coding agent assigned to implement ${projectName}.

### 2. Document Hierarchy Precedence
1. Explicit user instructions
2. SRS.md
3. PRD.md
4. DESIGN.md (visual and interaction scope)
5. ARCHITECTURE.md
6. RULES.md
7. Agent.md
8. BACKLOG.md

### 3. Implementation Workflow
- **UNDERSTAND**: Read specifications and requirements.
- **INSPECT**: Audit codebase state before editing.
- **PLAN**: Design implementation approach.
- **IMPLEMENT**: Write code that matches repo patterns.
- **VERIFY**: Run typecheck, lint, and tests.
- **REPORT**: Provide structured completion report.

### 4. Quality Gate
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] No secrets exposed
- [ ] Acceptance criteria met

### 5. Definition of Done
Task is complete only when all quality gate checks pass.
`
}

/**
 * Fallback generator for RULES.md when AI is not configured or fails.
 */
export function generateFallbackRulesMd(projectName: string): string {
  return `# RULES.md — Hard Constraints for ${projectName}

## Non-Negotiable Rules

1. **Tech Stack Immutability**: Do not change tech stack or ORM without explicit user authorization.
2. **Backlog Integrity**: Do not execute tasks out of dependency order.
3. **Secret Protection**: BYOK API keys must remain session-scoped and in-memory only. NEVER persist API keys to DB or export in ZIP packs.
4. **Scope Control**: Do not add unapproved features or arbitrary dependencies.
5. **Quality Gate Compliance**: Never bypass typecheck, lint, or test failures.
`
}

/**
 * Generates AGENT.md and RULES.md artifacts consuming Canonical Project Context.
 */
export async function generateAgentAndRulesArtifacts({
  userId,
  projectId,
}: GenerateAgentRulesOptions): Promise<GeneratedArtifactResult[]> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  })

  if (!project) throw new Error('Project not found')

  const currentContextRecord = project.contexts[0]
  if (!currentContextRecord) {
    throw new Error('No Canonical Project Context found. Generate context first.')
  }

  const providerConfig = getProviderConfig(userId)
  if (!providerConfig) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  const provider = createProvider(providerConfig)

  await updateProject(userId, projectId, { status: 'GENERATING' })

  const targetAgent = project.targetAgent || 'CLAUDE_CODE'
  const userPrompt = buildAgentRulesGeneratorUserPrompt(
    project.name,
    targetAgent,
    currentContextRecord.contentJson,
  )

  const items = [
    { type: 'AGENT' as const, path: 'Agent.md' },
    { type: 'RULES' as const, path: 'RULES.md' },
  ]

  // Set both artifacts to GENERATING before provider call
  for (const item of items) {
    await db.artifact.upsert({
      where: { projectId_type: { projectId, type: item.type } },
      update: { status: 'GENERATING', contextId: currentContextRecord.id },
      create: {
        projectId,
        contextId: currentContextRecord.id,
        type: item.type,
        path: item.path,
        content: '',
        status: 'GENERATING',
      },
    })
  }

  let agentContent = ''
  let rulesContent = ''

  try {
    const generated = await provider.generateStructured(
      userPrompt,
      AgentRulesDocumentSchema,
      {
        system: AGENT_RULES_GENERATOR_SYSTEM_PROMPT,
        maxTokens: 32000,
        temperature: 0.2,
      },
    )
    agentContent = generated.agent_content
    rulesContent = generated.rules_content
  } catch (err) {
    for (const item of items) {
      await db.artifact.update({
        where: { projectId_type: { projectId, type: item.type } },
        data: { status: 'FAILED' },
      })
    }
    throw err
  }

  const results: GeneratedArtifactResult[] = []

  for (const item of items) {
    const content = item.type === 'AGENT' ? agentContent : rulesContent
    await db.artifact.update({
      where: { projectId_type: { projectId, type: item.type } },
      data: {
        content,
        status: 'READY',
        provider: providerConfig?.provider ?? 'FALLBACK',
        model: providerConfig?.model ?? 'BASELINE',
      },
    })

    results.push({
      type: item.type,
      status: 'READY',
      path: item.path,
      content,
    })
  }

  return results
}
