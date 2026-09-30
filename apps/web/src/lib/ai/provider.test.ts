import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { createProvider } from '@/lib/ai/provider'
import type { AIProviderConfig } from '@repo/types'

// ============================================================
// AIProvider contract tests
// These run without live API keys — all SDK calls are mocked.
// ============================================================

// ---- Anthropic mock ----
vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"ok":true}' }],
      }),
    },
  })),
}))

// ---- OpenAI mock ----
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"ok":true}' } }],
        }),
      },
    },
    models: {
      list: vi.fn().mockResolvedValue({ data: [{ id: 'gpt-4o' }] }),
    },
  })),
}))

// ---- Gemini mock ----
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => '{"ok":true}' },
      }),
    }),
  })),
}))

const OkSchema = z.object({ ok: z.boolean() })

const configs = [
  { provider: 'ANTHROPIC', model: 'claude-sonnet-4-5' },
  { provider: 'OPENAI', model: 'gpt-4o' },
  { provider: 'GEMINI', model: 'gemini-2.0-flash' },
  { provider: 'OPENROUTER', model: 'anthropic/claude-3-haiku' },
] satisfies Array<{ provider: AIProviderConfig['provider']; model: string }>

describe('AIProvider — interface contract', () => {
  describe('createProvider factory', () => {
    it('creates a provider for each supported type', () => {
      for (const { provider, model } of configs) {
        const p = createProvider({ provider, model, apiKey: 'test-key' })
        expect(p.type).toBe(provider)
      }
    })

    it('throws for unknown provider', () => {
      expect(() =>
        createProvider({
          provider: 'UNKNOWN' as AIProviderConfig['provider'],
          model: 'x',
          apiKey: 'x',
        }),
      ).toThrow('Unknown provider')
    })
  })

  describe('testConnection — returns typed result, never throws', () => {
    it('ANTHROPIC returns VALID on success', async () => {
      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      const result = await p.testConnection()
      expect(result.status).toBe('VALID')
      expect(result.message).toBeTruthy()
    })

    it('OPENAI returns VALID on success', async () => {
      const p = createProvider({ provider: 'OPENAI', model: 'gpt-4o', apiKey: 'sk-test' })
      const result = await p.testConnection()
      expect(result.status).toBe('VALID')
    })

    it('GEMINI returns VALID on success', async () => {
      const p = createProvider({ provider: 'GEMINI', model: 'gemini-2.0-flash', apiKey: 'AIza-test' })
      const result = await p.testConnection()
      expect(result.status).toBe('VALID')
    })
  })

  describe('generateStructured — validates against schema', () => {
    it('ANTHROPIC: returns validated object', async () => {
      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      const result = await p.generateStructured('test prompt', OkSchema)
      expect(result).toEqual({ ok: true })
    })

    it('OPENAI: returns validated object', async () => {
      const p = createProvider({ provider: 'OPENAI', model: 'gpt-4o', apiKey: 'sk-test' })
      const result = await p.generateStructured('test prompt', OkSchema)
      expect(result).toEqual({ ok: true })
    })

    it('GEMINI: returns validated object', async () => {
      const p = createProvider({ provider: 'GEMINI', model: 'gemini-2.0-flash', apiKey: 'AIza-test' })
      const result = await p.generateStructured('test prompt', OkSchema)
      expect(result).toEqual({ ok: true })
    })
  })

  describe('generateStructured — error handling', () => {
    it('throws descriptive error when response is not JSON', async () => {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'sorry, I cannot help with that' }],
      })
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: { create: mockCreate },
      }) as never)

      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      await expect(p.generateStructured('test', OkSchema)).rejects.toThrow(
        '[ANTHROPIC] AI response is not valid JSON',
      )
    })

    it('throws descriptive error when JSON fails schema validation', async () => {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"wrong_key":42}' }],
      })
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: { create: mockCreate },
      }) as never)

      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      await expect(p.generateStructured('test', OkSchema)).rejects.toThrow(
        '[ANTHROPIC] AI response failed schema validation',
      )
    })
  })

  describe('generateStructured — handles markdown code fences', () => {
    it('strips ```json fences before parsing', async () => {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '```json\n{"ok":true}\n```' }],
      })
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: { create: mockCreate },
      }) as never)

      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      const result = await p.generateStructured('test', OkSchema)
      expect(result).toEqual({ ok: true })
    })

    it('unwraps single-element array wrapping an object response', async () => {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '[{"ok":true}]' }],
      })
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: { create: mockCreate },
      }) as never)

      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      const result = await p.generateStructured('test', OkSchema)
      expect(result).toEqual({ ok: true })
    })

    it('recovers markdown_content from broken JSON with inner array', async () => {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const DocSchema = z.object({
        title: z.string().default('DESIGN.md'),
        markdown_content: z.string(),
      })
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: '```json\n{\n  "title": "DESIGN.md",\n  "markdown_content": "# Heading\\nHere is markdown.",\n  "colors": ["#151515", "#F7F0DF"]\n}\n```',
        }],
      })
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: { create: mockCreate },
      }) as never)

      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      const result = await p.generateStructured('test', DocSchema)
      expect(result.markdown_content).toContain('# Heading')
    })
  })

  describe('error mapping — maps SDK errors to typed status', () => {
    it('returns INVALID_CREDENTIAL for 401 errors', async () => {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: {
          create: vi.fn().mockRejectedValue(new Error('401 Unauthorized: invalid api key')),
        },
      }) as never)

      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'bad-key' })
      const result = await p.testConnection()
      expect(result.status).toBe('INVALID_CREDENTIAL')
    })

    it('returns RATE_LIMITED for 429 errors', async () => {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: {
          create: vi.fn().mockRejectedValue(new Error('429 rate limit exceeded')),
        },
      }) as never)

      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      const result = await p.testConnection()
      expect(result.status).toBe('RATE_LIMITED')
    })

    it('returns NETWORK_ERROR for connection refused', async () => {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      vi.mocked(Anthropic).mockImplementationOnce(() => ({
        messages: {
          create: vi.fn().mockRejectedValue(new Error('fetch failed: ECONNREFUSED')),
        },
      }) as never)

      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      const result = await p.testConnection()
      expect(result.status).toBe('NETWORK_ERROR')
    })
  })

  describe('listModels — returns model list', () => {
    it('ANTHROPIC has listModels and returns models', async () => {
      const p = createProvider({ provider: 'ANTHROPIC', model: 'claude-sonnet-4-5', apiKey: 'sk-ant-test' })
      expect(p.listModels).toBeDefined()
      const models = await p.listModels!()
      expect(models.length).toBeGreaterThan(0)
      expect(models[0]).toHaveProperty('id')
      expect(models[0]).toHaveProperty('name')
    })

    it('OPENAI has listModels', async () => {
      const p = createProvider({ provider: 'OPENAI', model: 'gpt-4o', apiKey: 'sk-test' })
      expect(p.listModels).toBeDefined()
    })
  })
})
