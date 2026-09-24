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

interface ProviderSession {
  provider: AIProviderType
  model: string
  // API key stored in server memory — redacted from all responses
  readonly _apiKey: string
  configuredAt: Date
}

// Map<userId → ProviderSession>
const store = new Map<string, ProviderSession>()

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
  })
}

/**
 * Retrieve the full provider config for business logic use.
 * Returns null if not configured.
 */
export function getProviderConfig(userId: string): AIProviderConfig | null {
  const session = store.get(userId)
  if (!session) return null
  return {
    provider: session.provider,
    model: session.model,
    apiKey: session._apiKey,
  }
}

/**
 * Get provider metadata safe to send to client.
 * API key is NEVER included.
 */
export function getProviderMeta(
  userId: string,
): { provider: AIProviderType; model: string; configuredAt: Date } | null {
  const session = store.get(userId)
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
  return store.has(userId)
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
