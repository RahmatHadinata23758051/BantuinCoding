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
export interface ContextValue {
  value: string
  provenance: ContextProvenance
}

export interface CanonicalFunctionalRequirement {
  id: string
  title: string
  description: string
  provenance: ContextProvenance
}

export interface CanonicalNonFunctionalRequirement {
  category: string
  requirement: string
  provenance: ContextProvenance
}

export interface CanonicalCoreEntity {
  name: string
  fields: string[]
  relationships?: string[]
}

/**
 * Stored and generated canonical-context contract. Snake case is intentional:
 * this exact shape crosses the AI structured-output and persistence boundaries.
 */
export interface CanonicalProjectContext {
  project_name: string
  summary: string
  target_users: ContextValue[]
  goals: ContextValue[]
  non_goals: ContextValue[]
  functional_requirements: CanonicalFunctionalRequirement[]
  non_functional_requirements: CanonicalNonFunctionalRequirement[]
  core_entities: CanonicalCoreEntity[]
  technical_constraints: ContextValue[]
  stack_preferences: {
    frontend: ContextValue
    backend: ContextValue
    database: ContextValue
    styling: ContextValue
  }
  design_direction: ContextValue
  security_requirements: ContextValue[]
  integrations: ContextValue[]
  deployment_target: ContextValue
  agent_target: string
  confirmed_decisions: ContextValue[]
  open_questions: ContextValue[]
  assumptions: ContextValue[]
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
