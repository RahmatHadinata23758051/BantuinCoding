// Project State Machine
export type ProjectStatus =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'ANALYZING'
  | 'CLARIFYING'
  | 'CONTEXT_READY'
  | 'GENERATING'
  | 'READY'
  | 'EXPORTABLE'
  | 'GENERATION_FAILED'

// Artifact State Machine
export type ArtifactStatus =
  | 'NOT_GENERATED'
  | 'GENERATING'
  | 'READY'
  | 'MODIFIED'
  | 'OUTDATED'
  | 'FAILED'

// Backlog Task State Machine
export type BacklogTaskStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'REVIEW'
  | 'DONE'

// Project Classification
export type ProjectClassification =
  | 'STATIC_SITE'
  | 'LANDING_PAGE'
  | 'CRUD_APP'
  | 'DASHBOARD'
  | 'SAAS'
  | 'API_SERVICE'
  | 'MOBILE_APP'
  | 'AI_APP'
  | 'IOT_DASHBOARD'
  | 'FULLSTACK_COMPLEX'
  | 'OTHER'

// Target coding agent
export type AgentTarget =
  | 'CLAUDE_CODE'
  | 'CODEX'
  | 'OPENCODE'
  | 'ANTIGRAVITY'
  | 'CURSOR'
  | 'OTHER'

// AI Provider
export type AIProviderType = 'ANTHROPIC' | 'OPENAI' | 'GEMINI' | 'OPENROUTER'

// Provider connection test result
export type ConnectionTestResult =
  | 'VALID'
  | 'INVALID_CREDENTIAL'
  | 'MODEL_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'NETWORK_ERROR'

// Artifact types
export type ArtifactType =
  | 'PRD'
  | 'SRS'
  | 'ARCHITECTURE'
  | 'DESIGN'
  | 'AGENT'
  | 'RULES'
  | 'SKILLS'
  | 'BACKLOG'
  | 'DATABASE'
  | 'API'
  | 'SECURITY'
  | 'TESTING'
  | 'DEPLOYMENT'
  | 'README'
  | 'MCP_SETUP'

// Context provenance
export type ContextProvenance = 'confirmed' | 'assumed' | 'unknown'

// Canonical Project Context
export interface CanonicalProjectContext {
  project: {
    name: string
    description: string
    classification: ProjectClassification
    agentTarget: AgentTarget
  }
  users: Array<{ role: string; description: string }>
  goals: Array<{ goal: string; provenance: ContextProvenance }>
  nonGoals: Array<{ goal: string; provenance: ContextProvenance }>
  functionalRequirements: Array<{ requirement: string; provenance: ContextProvenance }>
  nonFunctionalRequirements: Array<{ requirement: string; provenance: ContextProvenance }>
  technicalConstraints: Record<string, { value: string; provenance: ContextProvenance }>
  stackPreferences: Record<string, { value: string; provenance: ContextProvenance }>
  designDirection: Record<string, { value: string; provenance: ContextProvenance }>
  securityRequirements: Array<{ requirement: string; provenance: ContextProvenance }>
  integrations: Array<{ name: string; purpose: string; provenance: ContextProvenance }>
  deployment: Record<string, { value: string; provenance: ContextProvenance }>
  openQuestions: Array<{ question: string; impact: string }>
  confirmedDecisions: Array<{ decision: string; confirmedAt: string }>
  assumptions: Array<{ assumption: string; impact: string }>
}

// AI Provider interface
export interface AIProviderConfig {
  provider: AIProviderType
  apiKey: string
  model: string
}

export interface TestConnectionResult {
  status: ConnectionTestResult
  message: string
  availableModels?: string[]
}
