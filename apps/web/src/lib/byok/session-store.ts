import type { AIProviderConfig, AIProviderType } from '@repo/types'

// ============================================================
// BYOK Session Store
//
// API keys are held in server-side memory, keyed by user session ID.
// They are NEVER:
//   - logged
//   - included in API responses
//   - persisted to the database
//   - exported in ZIP packs
//   - committed to git
//
// This is a process-memory store appropriate for MVP single-instance.
// In multi-instance deployments, replace with Redis + encryption.
// ============================================================

const SESSION_TTL_MS = 1000 * 60 * 60 * 4

interface ProviderSession {
  provider: AIProviderType
  model: string
  // API key stored in server memory — redacted from all responses
  readonly _apiKey: string
  configuredAt: Date
  expiresAt: Date
}

// Map<userId → ProviderSession>
const store = new Map<string, ProviderSession>()

function isExpired(session: ProviderSession, now = Date.now()): boolean {
  return session.expiresAt.getTime() <= now
}

function getActiveSession(userId: string): ProviderSession | null {
  const session = store.get(userId)
  if (!session) return null

  if (isExpired(session)) {
    store.delete(userId)
    return null
  }

  return session
}

/**
 * Store a provider configuration for a user session.
 * The API key is held only in this server-process Map.
 */
export function setProviderSession(
  userId: string,
  config: AIProviderConfig,
): void {
  store.set(userId, {
    provider: config.provider,
    model: config.model,
    _apiKey: config.apiKey,
    configuredAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  })
}

/**
 * Retrieve the full provider config for business logic use.
 * Returns null if not configured.
 */
export function getProviderConfig(userId: string): AIProviderConfig | null {
  const session = getActiveSession(userId)
  if (!session) return null
  return {
    provider: session.provider,
    model: session.model,
    apiKey: session._apiKey,
  }
}

/**
 * Require an active session for all AI-backed application behavior.
 * Expired sessions are lazily removed by getActiveSession and are therefore
 * indistinguishable from missing sessions at this trust boundary.
 */
export function requireProviderConfig(userId: string): AIProviderConfig {
  const config = getProviderConfig(userId)
  if (!config) {
    throw new Error('No active AI provider session found. Please configure your BYOK provider first.')
  }
  return config
}

/**
 * Get provider metadata safe to send to client.
 * API key is NEVER included.
 */
export function getProviderMeta(
  userId: string,
): { provider: AIProviderType; model: string; configuredAt: Date } | null {
  const session = getActiveSession(userId)
  if (!session) return null
  return {
    provider: session.provider,
    model: session.model,
    configuredAt: session.configuredAt,
  }
}

/**
 * Check if a user has a provider session configured.
 */
export function hasProviderSession(userId: string): boolean {
  return getActiveSession(userId) !== null
}

/**
 * Remove a user's provider session (e.g. on sign-out).
 */
export function clearProviderSession(userId: string): void {
  store.delete(userId)
}

/**
 * Mask an API key for display/logging: show first 8 chars then asterisks.
 * Never log or return the full key.
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return '***'
  return key.slice(0, 8) + '*'.repeat(Math.min(key.length - 8, 20))
}
