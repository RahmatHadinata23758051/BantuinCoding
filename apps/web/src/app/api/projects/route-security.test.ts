import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  requireProjectAction: vi.fn(),
  updateProject: vi.fn(),
  analyzeProjectRequirement: vi.fn(),
  generateClarificationRound: vi.fn(),
  generateCanonicalContext: vi.fn(),
  planProjectArtifacts: vi.fn(),
  generateCoreArtifacts: vi.fn(),
  generateAgentAndRulesArtifacts: vi.fn(),
  resolveProjectSkills: vi.fn(),
  generateProjectBacklog: vi.fn(),
  auditProjectConsistency: vi.fn(),
  getProjectReadiness: vi.fn(),
  recomputeProjectReadiness: vi.fn(),
  exportProjectZip: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/projects/project-service', () => ({
  requireProjectAction: mocks.requireProjectAction,
  updateProject: mocks.updateProject,
}))
vi.mock('@/lib/projects/readiness-service', () => ({
  getProjectReadiness: mocks.getProjectReadiness,
  recomputeProjectReadiness: mocks.recomputeProjectReadiness,
}))
vi.mock('@/lib/engine/requirement-analyzer', () => ({ analyzeProjectRequirement: mocks.analyzeProjectRequirement }))
vi.mock('@/lib/engine/clarification-engine', () => ({ generateClarificationRound: mocks.generateClarificationRound }))
vi.mock('@/lib/engine/context-engine', () => ({ generateCanonicalContext: mocks.generateCanonicalContext }))
vi.mock('@/lib/engine/artifact-planner', () => ({ planProjectArtifacts: mocks.planProjectArtifacts }))
vi.mock('@/lib/engine/artifact-generator', () => ({ generateCoreArtifacts: mocks.generateCoreArtifacts }))
vi.mock('@/lib/engine/agent-rules-generator', () => ({ generateAgentAndRulesArtifacts: mocks.generateAgentAndRulesArtifacts }))
vi.mock('@/lib/engine/skill-resolver', () => ({ resolveProjectSkills: mocks.resolveProjectSkills }))
vi.mock('@/lib/engine/backlog-generator', () => ({ generateProjectBacklog: mocks.generateProjectBacklog }))
vi.mock('@/lib/engine/consistency-validator', () => ({ auditProjectConsistency: mocks.auditProjectConsistency }))
vi.mock('@/lib/export/export-service', () => ({ exportProjectZip: mocks.exportProjectZip }))

import { POST as analyze } from './[id]/analyze/route'
import { POST as clarify } from './[id]/clarifications/route'
import { POST as context } from './[id]/context/route'
import { POST as planner } from './[id]/planner/route'
import { POST as generate } from './[id]/generate/route'
import { POST as skills } from './[id]/skills/route'
import { POST as backlog } from './[id]/backlog/route'
import { POST as validate } from './[id]/validate/route'
import { GET as exportZip } from './[id]/export/route'

const params = { params: Promise.resolve({ id: 'project-1' }) }
const postRequest = () => new NextRequest('http://localhost/api/projects/project-1', {
  method: 'POST',
  body: '{}',
  headers: { 'content-type': 'application/json' },
})
const getRequest = () => new NextRequest('http://localhost/api/projects/project-1/export')

const routes = [
  ['analyze', (request: NextRequest) => analyze(request, params)],
  ['clarifications', (request: NextRequest) => clarify(request, params)],
  ['context', (request: NextRequest) => context(request, params)],
  ['planner', (request: NextRequest) => planner(request, params)],
  ['generate', (request: NextRequest) => generate(request, params)],
  ['skills', (request: NextRequest) => skills(request, params)],
  ['backlog', (request: NextRequest) => backlog(request, params)],
  ['validate', (request: NextRequest) => validate(request, params)],
  ['export', () => exportZip(getRequest(), params)],
] as const

async function body<T = unknown>(response: Response) {
  return response.json() as Promise<T>
}

describe('BK-025 workflow route security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it.each(routes)('%s rejects unauthenticated requests with 401', async (_name, invoke) => {
    mocks.auth.mockResolvedValue(null)
    const response = await invoke(postRequest())
    expect(response.status).toBe(401)
    expect(await body(response)).toEqual({ error: 'Unauthorized' })
    expect(mocks.requireProjectAction).not.toHaveBeenCalled()
  })

  it.each(routes)('%s hides cross-user projects as not found', async (_name, invoke) => {
    mocks.requireProjectAction.mockRejectedValueOnce(new Error('Project not found'))
    const response = await invoke(postRequest())
    expect(response.status).toBe(404)
    expect(await body(response)).toEqual({ error: 'Project not found' })
  })

  it.each(routes)('%s rejects invalid project state with sanitized copy', async (_name, invoke) => {
    mocks.requireProjectAction.mockRejectedValueOnce(new Error('Project state DRAFT does not allow generate'))
    const response = await invoke(postRequest())
    const payload = await body<{ error?: string }>(response)
    expect([400, 409]).toContain(response.status)
    expect(payload.error).toContain('current state')
    expect(payload.error).not.toContain('DRAFT')
  })

  it.each(routes.slice(0, -1))('%s blocks missing or expired BYOK with actionable copy', async (_name, invoke) => {
    mocks.requireProjectAction.mockRejectedValueOnce(new Error('No active AI provider session found. secret-fragment'))
    const response = await invoke(postRequest())
    expect([400, 409]).toContain(response.status)
    expect(await body(response)).toEqual({
      error: 'No active AI provider session found. Please configure your BYOK provider first.',
    })
  })

  it.each(routes.slice(0, -1))('%s does not expose provider internals', async (_name, invoke) => {
    const secret = 'sk-live-do-not-return'
    mocks.requireProjectAction.mockRejectedValueOnce(new Error(`SDK payload ${secret}\n    at provider.ts:42 prompt=private`))
    const response = await invoke(postRequest())
    const serialized = JSON.stringify(await body(response))
    expect(serialized).not.toContain(secret)
    expect(serialized).not.toContain('provider.ts')
    expect(serialized).not.toContain('prompt=private')
    expect(serialized).not.toContain('SDK payload')
  })

  it('clarification generation ignores client-supplied analysis JSON', async () => {
    mocks.requireProjectAction.mockResolvedValue({ id: 'project-1', status: 'ANALYZING' })
    mocks.generateClarificationRound.mockResolvedValue({ questions: [], is_context_sufficient: true })
    const request = new NextRequest('http://localhost/api/projects/project-1/clarifications?action=generate', {
      method: 'POST',
      body: JSON.stringify({ analysisJson: '{"apiKey":"client-secret"}' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await clarify(request, params)

    expect(response.status).toBe(200)
    expect(mocks.generateClarificationRound).toHaveBeenCalledWith({
      userId: 'user-1',
      projectId: 'project-1',
    })
  })

  it('context generation ignores client-supplied analysis JSON', async () => {
    mocks.requireProjectAction.mockResolvedValue({ id: 'project-1', status: 'CLARIFYING' })
    mocks.generateCanonicalContext.mockResolvedValue({ context: {}, version: 1 })
    const request = new NextRequest('http://localhost/api/projects/project-1/context', {
      method: 'POST',
      body: JSON.stringify({ analysisJson: '{"rawProviderPayload":"untrusted"}' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await context(request, params)

    expect(response.status).toBe(200)
    expect(mocks.generateCanonicalContext).toHaveBeenCalledWith({
      userId: 'user-1',
      projectId: 'project-1',
    })
  })

  it('export requires EXPORTABLE and never grants EXPORTABLE itself', async () => {
    mocks.requireProjectAction.mockResolvedValue({ id: 'project-1', status: 'EXPORTABLE' })
    mocks.exportProjectZip.mockResolvedValue({ filename: 'pack.zip', buffer: Buffer.from('zip') })
    const response = await exportZip(getRequest(), params)
    expect(response.status).toBe(200)
    expect(mocks.requireProjectAction).toHaveBeenCalledWith('user-1', 'project-1', 'EXPORT')
    expect(mocks.updateProject).not.toHaveBeenCalled()
  })

  it('generate route supports AGENT_RULES orchestration without filtering', async () => {
    mocks.requireProjectAction.mockResolvedValue({ id: 'project-1', status: 'GENERATING' })
    mocks.generateAgentAndRulesArtifacts.mockResolvedValue([
      { type: 'AGENT', status: 'READY', path: 'Agent.md', content: 'Agent' },
      { type: 'RULES', status: 'READY', path: 'RULES.md', content: 'Rules' },
    ])
    mocks.recomputeProjectReadiness.mockResolvedValue({ isReady: false })

    const request = new NextRequest('http://localhost/api/projects/project-1/generate', {
      method: 'POST',
      body: JSON.stringify({ type: 'AGENT_RULES' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await generate(request, params)
    const json = await body<{ artifacts?: Array<{ type: string; status: string; path: string; content: string }> }>(response)

    expect(response.status).toBe(200)
    expect(mocks.generateAgentAndRulesArtifacts).toHaveBeenCalledWith({
      userId: 'user-1',
      projectId: 'project-1',
    })
    expect(json.artifacts).toHaveLength(2)
  })
})
