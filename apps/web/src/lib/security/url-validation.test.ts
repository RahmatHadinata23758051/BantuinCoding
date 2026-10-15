import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateProviderBaseUrl } from '@/lib/security/url-validation'

describe('validateProviderBaseUrl — SSRF and endpoint security', () => {
  const env = process.env as Record<string, string | undefined>
  const originalEnv = env.NODE_ENV

  beforeEach(() => {
    env.NODE_ENV = 'development'
  })

  afterEach(() => {
    env.NODE_ENV = originalEnv
  })

  it('allows empty, null, or undefined URLs', () => {
    expect(validateProviderBaseUrl(undefined, 'OPENAI')).toEqual({ valid: true })
    expect(validateProviderBaseUrl(null, 'DEEPSEEK')).toEqual({ valid: true })
    expect(validateProviderBaseUrl('', 'GROQ')).toEqual({ valid: true })
    expect(validateProviderBaseUrl('   ', 'OLLAMA')).toEqual({ valid: true })
  })

  it('rejects invalid URL strings', () => {
    const result = validateProviderBaseUrl('not-a-valid-url', 'OPENAI')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid URL format')
  })

  it('rejects non-http/https protocols like file:// or javascript:', () => {
    expect(validateProviderBaseUrl('file:///etc/passwd', 'OPENAI').valid).toBe(false)
    expect(validateProviderBaseUrl('ftp://example.com/api', 'OPENAI').valid).toBe(false)
    expect(validateProviderBaseUrl('gopher://example.com', 'OPENAI').valid).toBe(false)
  })

  it('rejects URLs with embedded credentials', () => {
    const result = validateProviderBaseUrl('https://admin:secret@api.groq.com/v1', 'GROQ')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('credentials')
  })

  describe('Cloud metadata endpoint protection (strictly forbidden for all providers)', () => {
    const metadataTargets = [
      'http://169.254.169.254/latest/meta-data',
      'http://169.254.169.254:80/computeMetadata/v1',
      'http://metadata.google.internal/computeMetadata/v1',
      'http://[fd00:ec2::254]/latest/meta-data',
    ]

    for (const target of metadataTargets) {
      it(`rejects cloud metadata ${target} for remote provider`, () => {
        const res = validateProviderBaseUrl(target, 'OPENAI')
        expect(res.valid).toBe(false)
        expect(res.error).toContain('metadata')
      })

      it(`rejects cloud metadata ${target} even for OLLAMA`, () => {
        const res = validateProviderBaseUrl(target, 'OLLAMA')
        expect(res.valid).toBe(false)
        expect(res.error).toBeDefined()
      })
    }
  })

  describe('Ollama loopback rules', () => {
    it('allows localhost for Ollama', () => {
      const res = validateProviderBaseUrl('http://localhost:11434/v1', 'OLLAMA')
      expect(res.valid).toBe(true)
      expect(res.normalizedUrl).toBe('http://localhost:11434/v1')
    })

    it('allows 127.0.0.1 for Ollama', () => {
      const res = validateProviderBaseUrl('http://127.0.0.1:11434/v1', 'OLLAMA')
      expect(res.valid).toBe(true)
      expect(res.normalizedUrl).toBe('http://127.0.0.1:11434/v1')
    })

    it('allows ::1 IPv6 loopback for Ollama', () => {
      const res = validateProviderBaseUrl('http://[::1]:11434/v1', 'OLLAMA')
      expect(res.valid).toBe(true)
    })

    it('rejects remote or non-loopback addresses for Ollama', () => {
      const res1 = validateProviderBaseUrl('http://192.168.1.100:11434/v1', 'OLLAMA')
      expect(res1.valid).toBe(false)
      expect(res1.error).toContain('loopback')

      const res2 = validateProviderBaseUrl('https://api.ollama-host.com/v1', 'OLLAMA')
      expect(res2.valid).toBe(false)
      expect(res2.error).toContain('loopback')
    })
  })

  describe('Remote hosted provider endpoint rules', () => {
    it('allows legitimate public HTTPS endpoints', () => {
      const res = validateProviderBaseUrl('https://api.deepseek.com/v1/', 'DEEPSEEK')
      expect(res.valid).toBe(true)
      expect(res.normalizedUrl).toBe('https://api.deepseek.com/v1')
    })

    it('rejects localhost and 127.0.0.1 for remote providers', () => {
      const res1 = validateProviderBaseUrl('http://localhost:8000/v1', 'OPENAI')
      expect(res1.valid).toBe(false)
      expect(res1.error).toContain('localhost or private network')

      const res2 = validateProviderBaseUrl('http://127.0.0.1:8000/v1', 'GROQ')
      expect(res2.valid).toBe(false)
    })

    it('rejects private IPv4 networks (RFC 1918) for remote providers', () => {
      const privateIps = [
        'http://10.0.0.1/v1',
        'http://172.16.5.10/v1',
        'http://172.31.255.255/v1',
        'http://192.168.0.1/v1',
      ]
      for (const ip of privateIps) {
        const res = validateProviderBaseUrl(ip, 'DEEPSEEK')
        expect(res.valid).toBe(false)
        expect(res.error).toContain('private network')
      }
    })

    it('enforces HTTPS in production mode for remote providers', () => {
      env.NODE_ENV = 'production'
      const res = validateProviderBaseUrl('http://api.deepseek.com/v1', 'DEEPSEEK')
      expect(res.valid).toBe(false)
      expect(res.error).toContain('HTTPS')
    })
  })
})
