import { db } from '@repo/db'
import type { ProjectStatus } from '@repo/types'
import { z } from 'zod'
import { hasProviderSession, restoreProviderSession } from '@/lib/byok/session-store'

// ============================================================
// Project State Machine
// DRAFT → CONFIGURED → ANALYZING → CLARIFYING → CONTEXT_READY → GENERATING → READY → EXPORTABLE (+ GENERATION_FAILED)
// ============================================================

const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['CONFIGURED'],
  CONFIGURED: ['ANALYZING', 'DRAFT'],
  ANALYZING: ['CLARIFYING', 'CONTEXT_READY', 'GENERATION_FAILED'],
  CLARIFYING: ['CONTEXT_READY', 'ANALYZING', 'GENERATION_FAILED'],
  CONTEXT_READY: ['GENERATING', 'CONFIGURED'],
  GENERATING: ['READY', 'GENERATION_FAILED'],
  READY: ['EXPORTABLE', 'GENERATING'],
  EXPORTABLE: ['READY', 'GENERATING'],
  GENERATION_FAILED: ['CONFIGURED', 'ANALYZING', 'GENERATING'],
}

export function canTransition(
  current: ProjectStatus,
  next: ProjectStatus,
): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false
}

const ACTION_ALLOWED_STATES = {
  ANALYZE: ['DRAFT', 'CONFIGURED', 'ANALYZING', 'CLARIFYING', 'GENERATION_FAILED'],
  CLARIFY: ['ANALYZING', 'CLARIFYING'],
  CONTEXT: ['ANALYZING', 'CLARIFYING'],
  PLAN: ['CONTEXT_READY', 'GENERATING', 'READY', 'EXPORTABLE', 'GENERATION_FAILED'],
  GENERATE: ['CONTEXT_READY', 'GENERATING', 'READY', 'EXPORTABLE', 'GENERATION_FAILED'],
  VALIDATE: ['READY', 'EXPORTABLE'],
  EXPORT: ['READY', 'EXPORTABLE'],
} as const satisfies Record<string, readonly ProjectStatus[]>

export type ProjectAction = keyof typeof ACTION_ALLOWED_STATES

const AI_BACKED_ACTIONS = new Set<ProjectAction>([
  'ANALYZE',
  'CLARIFY',
  'CONTEXT',
  'PLAN',
  'GENERATE',
  'VALIDATE',
])

export async function requireProjectAction(
  userId: string,
  projectId: string,
  action: ProjectAction,
) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, status: true },
  })

  if (!project) throw new Error('Project not found')

  const allowedStates = ACTION_ALLOWED_STATES[action]
  if (!allowedStates.includes(project.status as never)) {
    throw new Error(
      `Project state ${project.status} does not allow ${action.toLowerCase()}`,
    )
  }

  if (AI_BACKED_ACTIONS.has(action) && !hasProviderSession(userId)) {
    const restored = await restoreProviderSession(userId)
    if (!restored) {
      throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
    }
  }

  return project
}

// ============================================================
// Schemas
// ============================================================

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  rawIdea: z
    .string()
    .min(10, 'Idea text must be at least 10 characters')
    .max(5000, 'Idea text too long'),
  classification: z
    .enum([
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
    ])
    .default('OTHER'),
  targetAgent: z
    .enum(['CLAUDE_CODE', 'CODEX', 'OPENCODE', 'ANTIGRAVITY', 'CURSOR', 'OTHER'])
    .default('CLAUDE_CODE'),
  language: z.enum(['en', 'id']).default('id'),
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

const ProjectStatusSchema = z.enum([
  'DRAFT',
  'CONFIGURED',
  'ANALYZING',
  'CLARIFYING',
  'CONTEXT_READY',
  'GENERATING',
  'READY',
  'EXPORTABLE',
  'GENERATION_FAILED',
])

export const InternalProjectUpdateSchema = UpdateProjectSchema.extend({
  status: ProjectStatusSchema.optional(),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
type InternalProjectUpdateInput = z.infer<typeof InternalProjectUpdateSchema>

// ============================================================
// Database CRUD operations
// ============================================================

export async function createProject(userId: string, input: CreateProjectInput) {
  const parsed = CreateProjectSchema.parse(input)

  return db.project.create({
    data: {
      userId,
      name: parsed.name,
      rawIdea: parsed.rawIdea,
      classification: parsed.classification,
      targetAgent: parsed.targetAgent,
      language: parsed.language,
      status: 'DRAFT',
    },
  })
}

export async function getUserProjects(userId: string) {
  return db.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      rawIdea: true,
      classification: true,
      targetAgent: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          artifacts: true,
          clarificationQuestions: true,
        },
      },
    },
  })
}

export async function getProjectById(userId: string, projectId: string) {
  return db.project.findFirst({
    where: { id: projectId, userId },
    include: {
      contexts: {
        where: { isCurrent: true },
        take: 1,
      },
      artifacts: {
        select: {
          id: true,
          type: true,
          path: true,
          status: true,
          version: true,
          updatedAt: true,
        },
      },
      clarificationQuestions: {
        orderBy: { round: 'asc' },
      },
    },
  })
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: InternalProjectUpdateInput,
) {
  const existing = await db.project.findFirst({
    where: { id: projectId, userId },
  })
  if (!existing) return null

  // Validate state transition if status is being updated
  if (input.status && input.status !== existing.status) {
    if (!canTransition(existing.status as ProjectStatus, input.status as ProjectStatus)) {
      throw new Error(
        `Invalid status transition from ${existing.status} to ${input.status}`,
      )
    }
  }

  return db.project.update({
    where: { id: projectId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.rawIdea && { rawIdea: input.rawIdea }),
      ...(input.classification && { classification: input.classification }),
      ...(input.targetAgent && { targetAgent: input.targetAgent }),
      ...(input.language && { language: input.language }),
      ...(input.status && { status: input.status }),
    },
  })
}

export async function deleteProject(userId: string, projectId: string) {
  const existing = await db.project.findFirst({
    where: { id: projectId, userId },
  })
  if (!existing) return false

  await db.project.delete({ where: { id: projectId } })
  return true
}
