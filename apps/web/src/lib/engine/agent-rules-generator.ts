import { db } from '@repo/db'
import { getProviderConfig } from '@/lib/byok/session-store'
import { createProvider } from '@/lib/ai/provider'
import { updateProject } from '@/lib/projects/project-service'
import {
  AGENT_RULES_GENERATOR_SYSTEM_PROMPT,
  AgentRulesDocumentSchema,
  buildAgentRulesGeneratorUserPrompt,
  type AgentSkillRecommendation,
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
  _targetAgent?: string,
  skills?: AgentSkillRecommendation[],
): string {
  void _targetAgent

  const skillsMarkdown = skills && skills.length > 0
    ? skills
        .map(
          (s) =>
            `- **\`${s.name}\`**: ${s.purpose}\n  - *Trigger*: ${s.trigger}${s.installationHint ? `\n  - *Install*: \`${s.installationHint}\`` : ''}`,
        )
        .join('\n')
    : '_Skill recommendations have not been resolved yet._'

  return `# Agent.md — Universal Operational Contract for AI Coding Agents

## Project: ${projectName}

### 1. Role & Responsibilities
You are the primary coding agent assigned to implement ${projectName}.

### 2. Document Hierarchy Precedence
1. Explicit user instructions
2. PRD.md
3. ARCHITECTURE.md
4. DESIGN.md (visual and interaction scope)
5. Agent.md
6. BACKLOG.md

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

### 5. Recommended Agent Skills & Triggers
${skillsMarkdown}

### 6. Definition of Done
Task is complete only when all quality gate checks pass.
`
}

/**
 * Legacy compatibility fallback. Rules are now part of Agent.md.
 */
export function generateFallbackRulesMd(projectName: string): string {
  return `# Agent.md — Operational Rules for ${projectName}

This content is consolidated into Agent.md in the current pack format.

## Non-Negotiable Rules

1. **Tech Stack Immutability**: Do not change tech stack or ORM without explicit user authorization.
2. **Backlog Integrity**: Do not execute tasks out of dependency order.
3. **Secret Protection**: BYOK API keys must remain session-scoped and in-memory only. NEVER persist API keys to DB or export in ZIP packs.
4. **Scope Control**: Do not add unapproved features or arbitrary dependencies.
5. **Quality Gate Compliance**: Never bypass typecheck, lint, or test failures.
`
}

/**
 * Generates the unified Agent.md artifact consuming Canonical Project Context.
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
      skillRecommendations: true,
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

  const recommendations: AgentSkillRecommendation[] = (project.skillRecommendations ?? []).map((skill) => {
    let metadata: {
      applicable_phases?: string[]
      applicable_task_types?: string[]
      installation_hint?: string
    } = {}
    if (skill.metadata) {
      try {
        metadata = JSON.parse(skill.metadata)
      } catch {}
    }

    return {
      name: skill.name,
      purpose: skill.purpose,
      trigger: skill.trigger,
      source: skill.source,
      installationHint: metadata.installation_hint,
      applicablePhases: metadata.applicable_phases,
      applicableTaskTypes: metadata.applicable_task_types,
    }
  })

  const userPrompt = buildAgentRulesGeneratorUserPrompt(
    project.name,
    currentContextRecord.contentJson,
    undefined,
    recommendations,
  )

  const items = [
    { type: 'AGENT' as const, path: 'Agent.md' },
  ]

  // RULES.md and SKILLS.md are consolidated into Agent.md; no standalone legacy artifacts are created.

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
    // Legacy schema field is intentionally ignored; Agent.md absorbs all rules/skills.
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
    const content = agentContent
    const updatedArtifact = await db.artifact.update({
      where: { projectId_type: { projectId, type: item.type } },
      data: {
        content,
        status: 'READY',
        provider: providerConfig?.provider ?? 'FALLBACK',
        model: providerConfig?.model ?? 'BASELINE',
      },
      select: {
        id: true,
        updatedAt: true,
      },
    })

    results.push({
      id: updatedArtifact?.id,
      type: item.type,
      status: 'READY',
      path: item.path,
      content,
      updatedAt: updatedArtifact?.updatedAt ? updatedArtifact.updatedAt.toISOString() : undefined,
    })
  }

  return results
}

/**
 * Regenerates Agent.md only when the current context does not have a usable copy.
 * Manually modified and ready artifacts are never overwritten by a retry.
 */
export async function regenerateIncompleteAgentArtifacts({
  userId,
  projectId,
}: GenerateAgentRulesOptions): Promise<GeneratedArtifactResult[]> {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
        include: {
          artifactPlans: { where: { isRequired: true }, select: { type: true } },
        },
      },
      artifacts: true,
    },
  })

  if (!project) throw new Error('Project not found')
  const currentContext = project.contexts[0]
  if (!currentContext) {
    throw new Error('No Canonical Project Context found. Generate context first.')
  }

  const isAgentRequired = currentContext.artifactPlans.some((plan) => plan.type === 'AGENT')
  if (!isAgentRequired) {
    return []
  }

  const currentAgent = project.artifacts.find(
    (artifact) => artifact.type === 'AGENT' && artifact.contextId === currentContext.id,
  )
  if (currentAgent && (currentAgent.status === 'READY' || currentAgent.status === 'MODIFIED')) {
    return []
  }

  return generateAgentAndRulesArtifacts({ userId, projectId })
}
