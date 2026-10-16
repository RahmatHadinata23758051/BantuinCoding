import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  requireProjectAction: vi.fn(),
  updateProject: vi.fn(),
  analyzeProjectRequirements: vi.fn(),
  generateClarificationRound: vi.fn(),
  submitClarificationAnswers: vi.fn(),
  generateCanonicalContext: vi.fn(),
  getCurrentContext: vi.fn(),
  planProjectArtifacts: vi.fn(),
  generateCoreArtifacts: vi.fn(),
  regenerateFailedArtifacts: vi.fn(),
  generateAgentAndRulesArtifacts: vi.fn(),
  regenerateIncompleteAgentArtifacts: vi.fn(),
  repairMissingSystemGraph: vi.fn(),
  resolveProjectSkills: vi.fn(),
  generateProjectBacklog: vi.fn(),
  auditProjectConsistency: vi.fn(),
  getProjectReadiness: vi.fn(),
  recomputeProjectReadiness: vi.fn(),
  exportProjectZip: vi.fn(),
  saveArtifactContent: vi.fn(),
  findProject: vi.fn(),
  findTask: vi.fn(),
  updateTask: vi.fn(),
  findArtifact: vi.fn(),
  findPhases: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))

vi.mock('@repo/db', () => ({
  db: {
    project: {
      findFirst: mocks.findProject,
    },
    backlogTask: {
      findFirst: mocks.findTask,
      update: mocks.updateTask,
    },
    artifact: {
      findUnique: mocks.findArtifact,
    },
    backlogPhase: {
      findMany: mocks.findPhases,
    },
  },
}))

vi.mock('@/lib/projects/project-service', () => ({
  requireProjectAction: mocks.requireProjectAction,
  updateProject: mocks.updateProject,
}))

vi.mock('@/lib/projects/readiness-service', () => ({
  getProjectReadiness: mocks.getProjectReadiness,
  recomputeProjectReadiness: mocks.recomputeProjectReadiness,
}))

vi.mock('@/lib/engine/requirement-analyzer', () => ({
  analyzeProjectRequirements: mocks.analyzeProjectRequirements,
}))

vi.mock('@/lib/engine/clarification-engine', () => ({
  generateClarificationRound: mocks.generateClarificationRound,
  submitClarificationAnswers: mocks.submitClarificationAnswers,
}))

vi.mock('@/lib/engine/context-engine', () => ({
  generateCanonicalContext: mocks.generateCanonicalContext,
  getCurrentContext: mocks.getCurrentContext,
}))

vi.mock('@/lib/engine/artifact-planner', () => ({
  planProjectArtifacts: mocks.planProjectArtifacts,
}))

vi.mock('@/lib/engine/artifact-generator', () => ({
  generateCoreArtifacts: mocks.generateCoreArtifacts,
  regenerateFailedArtifacts: mocks.regenerateFailedArtifacts,
}))

vi.mock('@/lib/engine/agent-rules-generator', () => ({
  generateAgentAndRulesArtifacts: mocks.generateAgentAndRulesArtifacts,
  regenerateIncompleteAgentArtifacts: mocks.regenerateIncompleteAgentArtifacts,
}))

vi.mock('@/lib/projects/workspace-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/projects/workspace-service')>()
  return {
    ...actual,
    repairMissingSystemGraph: mocks.repairMissingSystemGraph,
  }
})

vi.mock('@/lib/engine/skill-resolver', () => ({
  resolveProjectSkills: mocks.resolveProjectSkills,
}))

vi.mock('@/lib/engine/backlog-generator', () => ({
  generateProjectBacklog: mocks.generateProjectBacklog,
}))

vi.mock('@/lib/engine/consistency-validator', () => ({
  auditProjectConsistency: mocks.auditProjectConsistency,
}))

vi.mock('@/lib/export/export-service', () => ({
  exportProjectZip: mocks.exportProjectZip,
}))

vi.mock('@/lib/artifacts/artifact-service', () => ({
  saveArtifactContent: mocks.saveArtifactContent,
}))

// Import route handlers under test
import { POST as analyzeRoute } from './[id]/analyze/route'
import { POST as clarifyRoute } from './[id]/clarifications/route'
import { POST as contextRoute } from './[id]/context/route'
import { POST as plannerRoute } from './[id]/planner/route'
import { POST as generateRoute } from './[id]/generate/route'
import { POST as skillsRoute } from './[id]/skills/route'
import { POST as backlogRoute } from './[id]/backlog/route'
import { POST as validateRoute } from './[id]/validate/route'
import { GET as exportRoute } from './[id]/export/route'
import { PATCH as taskStatusRoute } from './[id]/tasks/[taskId]/route'
import { PATCH as artifactEditRoute } from './[id]/artifacts/[type]/route'

const projectId = 'proj-integration-1'
const params = { params: Promise.resolve({ id: projectId }) }

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

async function parseBody<T = Record<string, unknown>>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

describe('BK-031 Route Integration, Security, and Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'user-integration' } })
    mocks.findPhases.mockResolvedValue([])
  })

  describe('1. End-to-End Route Lifecycle Sequence', () => {
    it('executes the full ordered bootstrap pipeline across route boundaries', async () => {
      // Step 1: Requirement Analysis
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'CONFIGURED' })
      mocks.analyzeProjectRequirements.mockResolvedValueOnce({
        project_type: 'SAAS',
        domain: 'fintech',
        features: [{ name: 'Auth', description: 'User login' }],
      })

      const analyzeRes = await analyzeRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/analyze`, 'POST'),
        params,
      )
      expect(analyzeRes.status).toBe(200)
      const analyzeBody = await parseBody<{ analysis: { project_type: string } }>(analyzeRes)
      expect(analyzeBody.analysis.project_type).toBe('SAAS')
      expect(mocks.requireProjectAction).toHaveBeenCalledWith('user-integration', projectId, 'ANALYZE')

      // Step 2: Clarification Questions Generation
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'ANALYZING' })
      mocks.generateClarificationRound.mockResolvedValueOnce({
        round: 1,
        questions: [{ id: 'q-1', question: 'Preferred cloud database?' }],
        is_context_sufficient: false,
      })

      const clarifyGenRes = await clarifyRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/clarifications?action=generate`, 'POST'),
        params,
      )
      expect(clarifyGenRes.status).toBe(200)
      const clarifyGenBody = await parseBody<{ round: number; is_context_sufficient: boolean }>(clarifyGenRes)
      expect(clarifyGenBody.round).toBe(1)
      expect(clarifyGenBody.is_context_sufficient).toBe(false)

      // Step 3: Clarification Answers Submission
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'CLARIFYING' })
      mocks.submitClarificationAnswers.mockResolvedValueOnce({
        success: true,
        answeredCount: 1,
      })

      const clarifyAnswerRes = await clarifyRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/clarifications?action=answer`, 'POST', {
          answers: [{ questionId: 'q-1', answer: 'Managed PostgreSQL' }],
        }),
        params,
      )
      expect(clarifyAnswerRes.status).toBe(200)
      const clarifyAnswerBody = await parseBody<{ success: boolean; answeredCount: number }>(clarifyAnswerRes)
      expect(clarifyAnswerBody.success).toBe(true)
      expect(clarifyAnswerBody.answeredCount).toBe(1)

      // Step 4: Canonical Context Normalization
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'CLARIFYING' })
      mocks.generateCanonicalContext.mockResolvedValueOnce({
        context: { database: 'Managed PostgreSQL', classification: 'SAAS' },
        version: 1,
      })

      const contextRes = await contextRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/context`, 'POST'),
        params,
      )
      expect(contextRes.status).toBe(200)
      const contextBody = await parseBody<{ version: number }>(contextRes)
      expect(contextBody.version).toBe(1)
      expect(mocks.requireProjectAction).toHaveBeenCalledWith('user-integration', projectId, 'CONTEXT')

      // Step 5: Artifact Planning
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'CONTEXT_READY' })
      mocks.planProjectArtifacts.mockResolvedValueOnce({
        planned_artifacts: ['PRD', 'ARCHITECTURE', 'DESIGN', 'AGENT', 'RULES', 'BACKLOG'],
      })

      const plannerRes = await plannerRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/planner`, 'POST'),
        params,
      )
      expect(plannerRes.status).toBe(200)
      const plannerBody = await parseBody<{ plan: { planned_artifacts: string[] } }>(plannerRes)
      expect(plannerBody.plan.planned_artifacts).toContain('PRD')
      expect(plannerBody.plan.planned_artifacts).toContain('ARCHITECTURE')

      // Step 6: Core Document Generation (PRD, Architecture, Design)
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'GENERATING' })
      mocks.generateCoreArtifacts.mockResolvedValueOnce([
        { id: 'art-prd', type: 'PRD', status: 'READY', path: 'PRD.md', content: '# PRD' },
        { id: 'art-arch', type: 'ARCHITECTURE', status: 'READY', path: 'ARCHITECTURE.md', content: '# Architecture' },
        { id: 'art-design', type: 'DESIGN', status: 'READY', path: 'DESIGN.md', content: '# Design System' },
      ])
      mocks.recomputeProjectReadiness.mockResolvedValueOnce({ isReady: false, missingTypes: ['AGENT', 'RULES', 'BACKLOG'] })
      mocks.findArtifact.mockResolvedValueOnce(null)

      const generateCoreRes = await generateRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/generate`, 'POST'),
        params,
      )
      expect(generateCoreRes.status).toBe(200)
      const generateCoreBody = await parseBody<{ artifacts: Array<{ type: string; status: string }> }>(generateCoreRes)
      expect(generateCoreBody.artifacts).toHaveLength(3)
      expect(generateCoreBody.artifacts.every((art) => art.status === 'READY')).toBe(true)

      // Step 7: Agent & Rules Orchestration
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'GENERATING' })
      mocks.generateAgentAndRulesArtifacts.mockResolvedValueOnce([
        { id: 'art-agent', type: 'AGENT', status: 'READY', path: 'Agent.md', content: '# Agent' },
        { id: 'art-rules', type: 'RULES', status: 'READY', path: 'RULES.md', content: '# Rules' },
      ])
      mocks.recomputeProjectReadiness.mockResolvedValueOnce({ isReady: false, missingTypes: ['BACKLOG'] })

      const generateAgentRes = await generateRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/generate`, 'POST', { type: 'AGENT_RULES' }),
        params,
      )
      expect(generateAgentRes.status).toBe(200)
      const generateAgentBody = await parseBody<{ artifacts: Array<{ type: string }> }>(generateAgentRes)
      expect(generateAgentBody.artifacts).toHaveLength(2)

      // Step 8: Skill Resolution
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'GENERATING' })
      mocks.resolveProjectSkills.mockResolvedValueOnce([
        { name: 'prisma-cli', description: 'Prisma DB migration skill' },
      ])
      mocks.recomputeProjectReadiness.mockResolvedValueOnce({ isReady: false, missingTypes: ['BACKLOG'] })

      const skillsRes = await skillsRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/skills`, 'POST'),
        params,
      )
      expect(skillsRes.status).toBe(200)
      const skillsBody = await parseBody<{ result: Array<{ name: string }> }>(skillsRes)
      expect(skillsBody.result[0]?.name).toBe('prisma-cli')

      // Step 9: Backlog Generation
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'GENERATING' })
      mocks.generateProjectBacklog.mockResolvedValueOnce({
        phases: [{ name: 'Phase 1', tasks: [{ id: 'BK-001', title: 'Setup' }] }],
      })
      mocks.recomputeProjectReadiness.mockResolvedValueOnce({ isReady: true, missingTypes: [] })
      mocks.findArtifact.mockResolvedValueOnce({
        id: 'art-backlog',
        type: 'BACKLOG',
        path: 'BACKLOG.md',
        status: 'READY',
        content: '# Backlog',
        updatedAt: new Date(),
      })

      const backlogRes = await backlogRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/backlog`, 'POST'),
        params,
      )
      expect(backlogRes.status).toBe(200)
      const backlogBody = await parseBody<{ artifact: { type: string; status: string } }>(backlogRes)
      expect(backlogBody.artifact.type).toBe('BACKLOG')

      // Step 10: Consistency Validation & Export Promotion
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'READY' })
      mocks.getProjectReadiness.mockResolvedValueOnce({
        isReady: true,
        requiredTypes: ['PRD', 'ARCHITECTURE', 'DESIGN', 'AGENT', 'RULES', 'BACKLOG'],
        missingTypes: [],
        blockingTypes: [],
      })
      mocks.auditProjectConsistency.mockResolvedValueOnce({
        isConsistent: true,
        score: 95,
        issues: [],
      })
      mocks.updateProject.mockResolvedValueOnce({ id: projectId, status: 'EXPORTABLE' })

      const validateRes = await validateRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/validate`, 'POST'),
        params,
      )
      expect(validateRes.status).toBe(200)
      const validateBody = await parseBody<{ report: { isConsistent: boolean } }>(validateRes)
      expect(validateBody.report.isConsistent).toBe(true)
      expect(mocks.updateProject).toHaveBeenCalledWith('user-integration', projectId, { status: 'EXPORTABLE' })

      // Step 11: Export Project Bootstrap Pack ZIP
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'EXPORTABLE' })
      const sampleZipBuffer = Buffer.from('PK\x03\x04mock-zip-content')
      mocks.exportProjectZip.mockResolvedValueOnce({
        filename: 'BantuinCoding-Bootstrap-Pack.zip',
        buffer: sampleZipBuffer,
      })

      const exportRes = await exportRoute(
        new NextRequest(`http://localhost/api/projects/${projectId}/export`),
        params,
      )
      expect(exportRes.status).toBe(200)
      expect(exportRes.headers.get('Content-Type')).toBe('application/zip')
      expect(exportRes.headers.get('Content-Disposition')).toContain('BantuinCoding-Bootstrap-Pack.zip')
      const buffer = await exportRes.arrayBuffer()
      expect(buffer.byteLength).toBe(sampleZipBuffer.length)
    })
  })

  describe('2. Tenant Isolation & Resource Boundaries', () => {
    it('rejects cross-user backlog task updates with 404', async () => {
      // User owns nothing under this projectId
      mocks.findProject.mockResolvedValueOnce(null)

      const response = await taskStatusRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/tasks/task-foreign`, 'PATCH', {
          status: 'DONE',
        }),
        { params: Promise.resolve({ id: projectId, taskId: 'task-foreign' }) },
      )

      expect(response.status).toBe(404)
      expect(await parseBody(response)).toEqual({ error: 'Project not found' })
      expect(mocks.findProject).toHaveBeenCalledWith({
        where: { id: projectId, userId: 'user-integration' },
        select: { id: true },
      })
      expect(mocks.findTask).not.toHaveBeenCalled()
    })

    it('rejects updates for a task not belonging to the project with 404', async () => {
      mocks.findProject.mockResolvedValueOnce({ id: projectId })
      mocks.findTask.mockResolvedValueOnce(null)

      const response = await taskStatusRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/tasks/task-missing`, 'PATCH', {
          status: 'DONE',
        }),
        { params: Promise.resolve({ id: projectId, taskId: 'task-missing' }) },
      )

      expect(response.status).toBe(404)
      expect(await parseBody(response)).toEqual({ error: 'Task not found in this project' })
      expect(mocks.updateTask).not.toHaveBeenCalled()
    })

    it('automatically recalculates dependent task statuses when prerequisite completes', async () => {
      mocks.findProject.mockResolvedValueOnce({ id: projectId })
      mocks.findTask.mockResolvedValueOnce({
        id: 'task-1',
        taskKey: 'BK-001',
        status: 'IN_PROGRESS',
        dependedBy: [
          {
            task: {
              id: 'task-2',
              taskKey: 'BK-002',
              status: 'PENDING',
              dependsOn: [
                {
                  dependsOnTaskId: 'task-1',
                  dependsOn: { id: 'task-1', status: 'IN_PROGRESS' },
                },
              ],
            },
          },
        ],
      })
      mocks.updateTask.mockImplementation(({ where, data }: { where: { id: string }; data: { status: string } }) => {
        if (where.id === 'task-1') {
          return Promise.resolve({
            id: 'task-1',
            taskKey: 'BK-001',
            title: 'Initial setup',
            status: data.status,
            updatedAt: new Date().toISOString(),
          })
        }
        if (where.id === 'task-2') {
          return Promise.resolve({
            id: 'task-2',
            taskKey: 'BK-002',
            status: data.status,
          })
        }
        return Promise.resolve({})
      })

      const response = await taskStatusRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/tasks/task-1`, 'PATCH', {
          status: 'DONE',
        }),
        { params: Promise.resolve({ id: projectId, taskId: 'task-1' }) },
      )

      expect(response.status).toBe(200)
      const data = await parseBody<{
        task: { id: string; status: string }
        affectedTasks: Array<{ id: string; status: string }>
      }>(response)

      expect(data.task.status).toBe('DONE')
      expect(data.affectedTasks).toEqual([
        { id: 'task-2', taskKey: 'BK-002', status: 'READY' },
      ])
      expect(mocks.updateTask).toHaveBeenCalledWith({
        where: { id: 'task-2' },
        data: { status: 'READY' },
        select: { id: true, taskKey: true, status: true },
      })
    })

    it('rejects cross-user manual artifact content edits with 404', async () => {
      mocks.saveArtifactContent.mockRejectedValueOnce(new Error('Project not found'))

      const response = await artifactEditRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/artifacts/prd`, 'PATCH', {
          content: '# Hacked PRD',
        }),
        { params: Promise.resolve({ id: projectId, type: 'prd' }) },
      )

      expect(response.status).toBe(404)
      expect(await parseBody(response)).toEqual({ error: 'Project not found' })
      expect(mocks.saveArtifactContent).toHaveBeenCalledWith({
        userId: 'user-integration',
        projectId,
        artifactType: 'PRD',
        content: '# Hacked PRD',
      })
      expect(mocks.recomputeProjectReadiness).not.toHaveBeenCalled()
    })

    it('sanitizes and never leaks internal tokens or secrets in error bodies', async () => {
      const liveKey = 'sk-live-secret-never-expose-998877'
      mocks.saveArtifactContent.mockRejectedValueOnce(
        new Error(`Provider call crashed with token=${liveKey} at internal-service.ts:89`),
      )

      const response = await artifactEditRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/artifacts/prd`, 'PATCH', {
          content: '# New PRD',
        }),
        { params: Promise.resolve({ id: projectId, type: 'prd' }) },
      )

      const rawText = JSON.stringify(await parseBody(response))
      expect(rawText).not.toContain(liveKey)
      expect(rawText).not.toContain('internal-service.ts')
    })
  })

  describe('3. Failure Recovery and State Resilience at Route Boundaries', () => {
    it('handles provider timeout gracefully and recovers via regenerateFailed request', async () => {
      // Step 1: Initial core generation fails due to provider rate limit/timeout
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'GENERATING' })
      mocks.generateCoreArtifacts.mockRejectedValueOnce(
        new Error('429 Rate limit exceeded: upstream model saturated'),
      )

      const failRes = await generateRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/generate`, 'POST'),
        params,
      )
      expect(failRes.status).toBe(400)
      const failJson = await parseBody<{ error: string }>(failRes)
      expect(failJson.error).toBe('Provider rate limit exceeded. Please wait and retry.')

      // Step 2: Client triggers recovery with regenerateFailed: true
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'GENERATION_FAILED' })
      mocks.regenerateFailedArtifacts.mockResolvedValueOnce([
        { id: 'art-prd', type: 'PRD', status: 'READY', path: 'PRD.md', content: '# PRD (Recovered)' },
        { id: 'art-arch', type: 'ARCHITECTURE', status: 'READY', path: 'ARCHITECTURE.md', content: '# Arch (Recovered)' },
      ])
      mocks.regenerateIncompleteAgentArtifacts.mockResolvedValueOnce([])
      mocks.recomputeProjectReadiness.mockResolvedValueOnce({ isReady: true, missingTypes: [] })
      mocks.findArtifact.mockResolvedValueOnce(null)

      const recoverRes = await generateRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/generate`, 'POST', { regenerateFailed: true }),
        params,
      )
      expect(recoverRes.status).toBe(200)
      const recoverJson = await parseBody<{ artifacts: Array<{ type: string; status: string }> }>(recoverRes)
      expect(recoverJson.artifacts).toHaveLength(2)
      expect(recoverJson.artifacts.every((art) => art.status === 'READY')).toBe(true)
      expect(mocks.regenerateFailedArtifacts).toHaveBeenCalledWith({
        userId: 'user-integration',
        projectId,
      })
    })

    it('demotes project to READY on validation failure and blocks export until consistency is restored', async () => {
      // Step 1: Consistency validation fails due to database mismatch between PRD and Architecture
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'READY' })
      mocks.getProjectReadiness.mockResolvedValueOnce({
        isReady: true,
        requiredTypes: ['PRD', 'ARCHITECTURE'],
        missingTypes: [],
        blockingTypes: [],
      })
      mocks.auditProjectConsistency.mockResolvedValueOnce({
        isConsistent: false,
        score: 55,
        issues: [
          { category: 'DATABASE_MISMATCH', message: 'PRD specifies PostgreSQL while Architecture specifies MongoDB', severity: 'error' },
        ],
      })
      mocks.updateProject.mockResolvedValueOnce({ id: projectId, status: 'READY' })

      const validateRes = await validateRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/validate`, 'POST'),
        params,
      )
      expect(validateRes.status).toBe(200)
      const validateJson = await parseBody<{ report: { isConsistent: boolean; score: number } }>(validateRes)
      expect(validateJson.report.isConsistent).toBe(false)
      expect(mocks.updateProject).toHaveBeenCalledWith('user-integration', projectId, { status: 'READY' })

      // Step 2: Export attempt is blocked because project is READY, not EXPORTABLE
      mocks.requireProjectAction.mockRejectedValueOnce(
        new Error('Project state READY does not allow EXPORT'),
      )

      const exportRes = await exportRoute(
        new NextRequest(`http://localhost/api/projects/${projectId}/export`),
        params,
      )
      expect(exportRes.status).toBe(400)
      const exportJson = await parseBody<{ error: string }>(exportRes)
      expect(exportJson.error).toContain('current state')

      // Step 3: Issue fixed, re-run validation -> promotes to EXPORTABLE
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'READY' })
      mocks.getProjectReadiness.mockResolvedValueOnce({
        isReady: true,
        requiredTypes: ['PRD', 'ARCHITECTURE'],
        missingTypes: [],
        blockingTypes: [],
      })
      mocks.auditProjectConsistency.mockResolvedValueOnce({
        isConsistent: true,
        score: 100,
        issues: [],
      })
      mocks.updateProject.mockResolvedValueOnce({ id: projectId, status: 'EXPORTABLE' })

      const reValidateRes = await validateRoute(
        jsonRequest(`http://localhost/api/projects/${projectId}/validate`, 'POST'),
        params,
      )
      expect(reValidateRes.status).toBe(200)
      const reValidateJson = await parseBody<{ report: { isConsistent: boolean } }>(reValidateRes)
      expect(reValidateJson.report.isConsistent).toBe(true)
      expect(mocks.updateProject).toHaveBeenCalledWith('user-integration', projectId, { status: 'EXPORTABLE' })

      // Step 4: Export now succeeds
      mocks.requireProjectAction.mockResolvedValueOnce({ id: projectId, status: 'EXPORTABLE' })
      mocks.exportProjectZip.mockResolvedValueOnce({
        filename: 'Restored-Bootstrap-Pack.zip',
        buffer: Buffer.from('PK\x03\x04clean-zip'),
      })

      const reExportRes = await exportRoute(
        new NextRequest(`http://localhost/api/projects/${projectId}/export`),
        params,
      )
      expect(reExportRes.status).toBe(200)
      expect(reExportRes.headers.get('Content-Type')).toBe('application/zip')
    })
  })
})
