import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  setProviderSession,
  getProviderConfig,
  getProviderMeta,
  hasProviderSession,
  clearProviderSession,
  maskApiKey,
} from '@/lib/byok/session-store'

// ============================================================
// BYOK Session Store tests
// Verifies: storage, retrieval, key masking, security invariants
// ============================================================

const TEST_USER_ID = 'user-test-123'
const TEST_CONFIG = {
  provider: 'ANTHROPIC' as const,
  model: 'claude-sonnet-4-5',
  apiKey: 'sk-ant-api03-supersecretkey',
}

describe('BYOK Session Store — core operations', () => {
  beforeEach(() => {
    vi.useRealTimers()
    clearProviderSession(TEST_USER_ID)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('hasProviderSession returns false when no session set', () => {
    expect(hasProviderSession(TEST_USER_ID)).toBe(false)
  })

  it('setProviderSession stores config and hasProviderSession returns true', () => {
    setProviderSession(TEST_USER_ID, TEST_CONFIG)
    expect(hasProviderSession(TEST_USER_ID)).toBe(true)
  })

  it('getProviderConfig returns full config including apiKey', () => {
    setProviderSession(TEST_USER_ID, TEST_CONFIG)
    const config = getProviderConfig(TEST_USER_ID)
    expect(config).not.toBeNull()
    expect(config?.provider).toBe('ANTHROPIC')
    expect(config?.model).toBe('claude-sonnet-4-5')
    expect(config?.apiKey).toBe('sk-ant-api03-supersecretkey')
  })

  it('getProviderConfig returns null when no session', () => {
    expect(getProviderConfig('non-existent-user')).toBeNull()
  })

  it('getProviderMeta returns metadata WITHOUT apiKey', () => {
    setProviderSession(TEST_USER_ID, TEST_CONFIG)
    const meta = getProviderMeta(TEST_USER_ID)
    expect(meta).not.toBeNull()
    expect(meta?.provider).toBe('ANTHROPIC')
    expect(meta?.model).toBe('claude-sonnet-4-5')
    expect(meta?.configuredAt).toBeInstanceOf(Date)
    // Security: apiKey MUST NOT appear in meta
    expect(Object.keys(meta as object)).not.toContain('apiKey')
    expect(Object.keys(meta as object)).not.toContain('_apiKey')
    expect(JSON.stringify(meta)).not.toContain('sk-ant-api03')
  })

  it('getProviderMeta returns null when no session', () => {
    expect(getProviderMeta('non-existent-user')).toBeNull()
  })

  it('clearProviderSession removes the session', () => {
    setProviderSession(TEST_USER_ID, TEST_CONFIG)
    clearProviderSession(TEST_USER_ID)
    expect(hasProviderSession(TEST_USER_ID)).toBe(false)
    expect(getProviderConfig(TEST_USER_ID)).toBeNull()
  })

  it('supports multiple independent user sessions', () => {
    const user1 = 'user-111'
    const user2 = 'user-222'
    const config1 = { provider: 'ANTHROPIC' as const, model: 'claude-opus-4-5', apiKey: 'key-aaa' }
    const config2 = { provider: 'OPENAI' as const, model: 'gpt-4o', apiKey: 'key-bbb' }

    setProviderSession(user1, config1)
    setProviderSession(user2, config2)

    expect(getProviderConfig(user1)?.provider).toBe('ANTHROPIC')
    expect(getProviderConfig(user2)?.provider).toBe('OPENAI')
    expect(getProviderConfig(user1)?.apiKey).toBe('key-aaa')
    expect(getProviderConfig(user2)?.apiKey).toBe('key-bbb')

    clearProviderSession(user1)
    clearProviderSession(user2)
  })

  it('overwriting session replaces previous config', () => {
    setProviderSession(TEST_USER_ID, TEST_CONFIG)
    setProviderSession(TEST_USER_ID, { provider: 'OPENAI', model: 'gpt-4o', apiKey: 'new-key' })
    const config = getProviderConfig(TEST_USER_ID)
    expect(config?.provider).toBe('OPENAI')
    expect(config?.apiKey).toBe('new-key')
  })

  it('expires and clears provider credentials after the session TTL', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-27T00:00:00Z'))
    setProviderSession(TEST_USER_ID, TEST_CONFIG)

    vi.advanceTimersByTime(4 * 60 * 60 * 1000)

    expect(hasProviderSession(TEST_USER_ID)).toBe(false)
    expect(getProviderConfig(TEST_USER_ID)).toBeNull()
    expect(getProviderMeta(TEST_USER_ID)).toBeNull()
  })
})

describe('BYOK Session Store — security invariants', () => {
  beforeEach(() => {
    clearProviderSession(TEST_USER_ID)
  })

  it('getProviderMeta JSON output never contains apiKey value', () => {
    const secretKey = 'sk-ant-super-secret-key-do-not-expose'
    setProviderSession(TEST_USER_ID, { ...TEST_CONFIG, apiKey: secretKey })
    const meta = getProviderMeta(TEST_USER_ID)
    const json = JSON.stringify(meta)
    expect(json).not.toContain(secretKey)
    expect(json).not.toContain('sk-ant')
  })

  it('API key value is never in metadata object keys or values', () => {
    const secretKey = 'ultra-secret-key-xyz-987'
    setProviderSession(TEST_USER_ID, { ...TEST_CONFIG, apiKey: secretKey })
    const meta = getProviderMeta(TEST_USER_ID)
    if (meta) {
      const allValues = Object.values(meta).map(String)
      expect(allValues.some((v) => v.includes(secretKey))).toBe(false)
    }
  })
})

describe('maskApiKey', () => {
  it('shows first 8 chars followed by asterisks', () => {
    const masked = maskApiKey('sk-ant-api03-supersecret')
    expect(masked).toMatch(/^sk-ant-a\*+$/)
    expect(masked).not.toContain('supersecret')
  })

  it('returns *** for short keys', () => {
    expect(maskApiKey('short')).toBe('***')
    expect(maskApiKey('12345678')).toBe('***')
  })

  it('asterisk count is capped at 20', () => {
    const longKey = 'abcdefgh' + 'x'.repeat(100)
    const masked = maskApiKey(longKey)
    expect(masked).toBe('abcdefgh' + '*'.repeat(20))
  })

  it('never exposes the full key', () => {
    const key = 'sk-ant-api03-FULL-SECRET-KEY'
    const masked = maskApiKey(key)
    expect(masked).not.toBe(key)
    expect(masked).not.toContain('FULL-SECRET-KEY')
  })
})
