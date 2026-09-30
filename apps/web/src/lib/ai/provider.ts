import type {
  AIProviderType,
  AIProviderConfig,
  TestConnectionResult,
} from '@repo/types'
import { z } from 'zod'

// ============================================================
// Core AIProvider Interface
// All AI calls must go through this interface.
// Business logic MUST NOT call provider SDKs directly.
// ============================================================

export interface GenerateOptions {
  /** System prompt for the AI model */
  system?: string
  /** Max tokens to generate */
  maxTokens?: number
  /** Temperature (0–1) */
  temperature?: number
}

export interface AIProvider {
  readonly type: AIProviderType

  /**
   * Test whether the API key + model combination is valid.
   * Must never throw — always returns a typed result.
   */
  testConnection(): Promise<TestConnectionResult>

  /**
   * Generate structured output validated against a Zod schema.
   * All internal AI responses used by business logic MUST use this method.
   */
  generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateOptions,
  ): Promise<T>

  /**
   * List available models for this provider (optional).
   */
  listModels?(): Promise<ModelInfo[]>
}

export interface ModelInfo {
  id: string
  name: string
  contextWindow?: number
}

// ============================================================
// Factory
// ============================================================

export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case 'ANTHROPIC':
      return new AnthropicProvider(config)
    case 'OPENAI':
      return new OpenAIProvider(config)
    case 'GEMINI':
      return new GeminiProvider(config)
    case 'OPENROUTER':
      return new OpenRouterProvider(config)
    default: {
      const _exhaustive: never = config.provider
      throw new Error(`Unknown provider: ${_exhaustive}`)
    }
  }
}

// ============================================================
// Base class — shared JSON extraction logic
// ============================================================

abstract class BaseProvider implements AIProvider {
  abstract readonly type: AIProviderType

  protected readonly config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
  }

  abstract testConnection(): Promise<TestConnectionResult>
  abstract generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateOptions,
  ): Promise<T>

  /**
   * Extract JSON from a raw AI response string.
   * Handles markdown code fences (```json ... ```), bare JSON,
   * and strips common model reasoning/think tags from 9router models.
   * Robustly handles nested markdown code fences inside JSON string values
   * by finding the outermost JSON boundaries (first { to last }).
   */
  protected extractJson(raw: string): unknown {
    let text = raw.trim()

    // 1. Strip common reasoning/thinking tags that 9router models may emit
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '')
    text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    text = text.replace(/<\?xml[^>]*>/gi, '')
    text = text.replace(/^\s*[\r\n]+/, '')

    // 2. If it's wrapped in an outer ```json ... ``` code fence, strip ONLY the outer wrapper
    const outerFence = text.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/)
    if (outerFence) {
      text = outerFence[1].trim()
    }

    // 3. Find the outermost JSON object boundaries: from the FIRST { to the LAST }
    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1)
      try {
        return JSON.parse(candidate)
      } catch {
        // Candidate slicing failed, fallback below
      }
    }

    // 4. Find the outermost JSON array boundaries: from the FIRST [ to the LAST ]
    const firstBracket = text.indexOf('[')
    const lastBracket = text.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      const candidate = text.slice(firstBracket, lastBracket + 1)
      try {
        return JSON.parse(candidate)
      } catch {
        // Fallback below
      }
    }

    // 5. Truncated JSON string recovery: if the output was cut off by max_tokens
    // while emitting "markdown_content": "...", extract the unescaped markdown.
    const marker = '"markdown_content":'
    const markerIdx = text.indexOf(marker)
    if (markerIdx !== -1) {
      const afterMarker = text.slice(markerIdx + marker.length)
      const quoteIdx = afterMarker.indexOf('"')
      if (quoteIdx !== -1) {
        let contentSlice = afterMarker.slice(quoteIdx + 1)
        for (let i = 0; i < contentSlice.length; i++) {
          if (contentSlice[i] === '"' && (i === 0 || contentSlice[i - 1] !== '\\')) {
            contentSlice = contentSlice.slice(0, i)
            break
          }
        }
        const unescaped = contentSlice
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')

        if (unescaped.trim().length > 0) {
          return { markdown_content: unescaped.trim() }
        }
      }
    }

    // 6. Direct Markdown recovery: if model returned direct markdown starting with #
    const directMd = text.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/i, '').trim()
    if (directMd.startsWith('#')) {
      return { markdown_content: directMd }
    }

    return JSON.parse(text)
  }

  /**
   * Parse and validate JSON against a Zod schema.
   * Throws a descriptive error if validation fails.
   */
  protected parseAndValidate<T>(raw: string, schema: z.ZodSchema<T>): T {
    let parsed: unknown
    try {
      parsed = this.extractJson(raw)
    } catch {
      throw new Error(
        `[${this.type}] AI response is not valid JSON.\n` +
          `Raw (first 500 chars): ${raw.slice(0, 500)}`,
      )
    }

    const result = schema.safeParse(parsed)
    if (!result.success) {
      throw new Error(
        `[${this.type}] AI response failed schema validation.\n` +
          `Issues: ${JSON.stringify(result.error.issues, null, 2)}`,
      )
    }

    return result.data
  }
}

// ============================================================
// Anthropic Provider
// ============================================================

class AnthropicProvider extends BaseProvider {
  readonly type = 'ANTHROPIC' as const

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: this.config.apiKey })

      await client.messages.create({
        model: this.config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      })

      return { status: 'VALID', message: 'Connection successful' }
    } catch (err) {
      return mapError('ANTHROPIC', err)
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: GenerateOptions = {},
  ): Promise<T> {
    const { Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey: this.config.apiKey })

    const systemPrompt =
      (options.system ?? '') +
      '\n\nRespond ONLY with valid JSON matching the requested schema. No prose, no markdown fences.'

    const msg = await client.messages.create({
      model: this.config.model,
      max_tokens: options.maxTokens ?? 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = msg.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    return this.parseAndValidate(raw, schema)
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', contextWindow: 200000 },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', contextWindow: 200000 },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', contextWindow: 200000 },
    ]
  }
}

// ============================================================
// OpenAI Provider
// ============================================================

class OpenAIProvider extends BaseProvider {
  readonly type = 'OPENAI' as const

  private getBaseUrl(): string | undefined {
    return this.config.baseUrl?.replace(/\/+$/, '') || undefined
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.getBaseUrl(),
      })

      // First: verify auth + endpoint with models.list()
      await client.models.list()

      // If a model is configured, also test that specific model with a timeout
      // to ensure it's available for chat completions
      if (this.config.model) {
        try {
          const completionPromise = client.chat.completions.create({
            model: this.config.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }],
          })
          // Race with a 10s timeout to avoid hanging on unresponsive models
          await Promise.race([
            completionPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('MODEL_TIMEOUT')), 10_000),
            ),
          ])
        } catch (completionErr) {
          // IMPORTANT: models.list() already succeeded above. So the user's API key
          // is valid. Any error from chat.completions.create is a MODEL/UPSTREAM
          // issue, NEVER a credential issue. Always report MODEL_UNAVAILABLE here.
          const msg = completionErr instanceof Error ? completionErr.message : String(completionErr)
          return {
            status: 'MODEL_UNAVAILABLE',
            message: `Model ${this.config.model} unavailable: ${msg}. Try another model.`,
          }
        }
      }

      return { status: 'VALID', message: 'Connection successful' }
    } catch (err) {
      return mapError('OPENAI', err)
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: GenerateOptions = {},
  ): Promise<T> {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.getBaseUrl(),
      timeout: 180_000, // 3 minutes timeout for document generation
    })

    const systemContent =
      (options.system ?? '') +
      '\n\nRespond ONLY with valid JSON matching the requested schema. No prose, no markdown fences.'

    const completion = await client.chat.completions.create({
      model: this.config.model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.3,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    return this.parseAndValidate(raw, schema)
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.getBaseUrl(),
      })
      const list = await client.models.list()

      return list.data.map((m) => ({
        id: m.id,
        name: m.id,
        contextWindow: (m as { context_window?: number }).context_window,
      }))
    } catch {
      return [
        { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
      ]
    }
  }
}

// ============================================================
// Gemini Provider
// ============================================================

class GeminiProvider extends BaseProvider {
  readonly type = 'GEMINI' as const

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const client = new GoogleGenerativeAI(this.config.apiKey)
      const model = client.getGenerativeModel({ model: this.config.model })

      await model.generateContent('ping')

      return { status: 'VALID', message: 'Connection successful' }
    } catch (err) {
      return mapError('GEMINI', err)
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: GenerateOptions = {},
  ): Promise<T> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const client = new GoogleGenerativeAI(this.config.apiKey)

    const systemInstruction =
      (options.system ?? '') +
      '\n\nRespond ONLY with valid JSON matching the requested schema. No prose, no markdown fences.'

    const model = client.getGenerativeModel({
      model: this.config.model,
      systemInstruction,
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text()

    return this.parseAndValidate(raw, schema)
  }

  async listModels(): Promise<ModelInfo[]> {
    return [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1000000 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000 },
    ]
  }
}

// ============================================================
// OpenRouter Provider (OpenAI-compatible API)
// ============================================================

class OpenRouterProvider extends BaseProvider {
  readonly type = 'OPENROUTER' as const

  private getBaseUrl(): string {
    return this.config.baseUrl?.replace(/\/+$/, '') || 'https://openrouter.ai/api/v1'
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.getBaseUrl(),
      })

      // First: verify auth with models endpoint
      await client.models.list()

      if (this.config.model) {
        try {
          const completionPromise = client.chat.completions.create({
            model: this.config.model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }],
          })
          await Promise.race([
            completionPromise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('MODEL_TIMEOUT')), 10_000),
            ),
          ])
        } catch (completionErr) {
          const msg = completionErr instanceof Error ? completionErr.message : String(completionErr)
          return {
            status: 'MODEL_UNAVAILABLE',
            message: `Model ${this.config.model} unavailable: ${msg}. Try another model.`,
          }
        }
      }

      return { status: 'VALID', message: 'Connection successful' }
    } catch (err) {
      return mapError('OPENROUTER', err)
    }
  }

  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: GenerateOptions = {},
  ): Promise<T> {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.getBaseUrl(),
      timeout: 180_000, // 3 minutes timeout for document generation
    })

    const systemContent =
      (options.system ?? '') +
      '\n\nRespond ONLY with valid JSON matching the requested schema. No prose, no markdown fences.'

    const completion = await client.chat.completions.create({
      model: this.config.model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.3,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    return this.parseAndValidate(raw, schema)
  }

  async listModels(): Promise<ModelInfo[]> {
    const baseUrl = this.getBaseUrl()
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      })
      if (!res.ok) throw new Error('Failed to fetch models')
      const data = (await res.json()) as { data: Array<{ id: string; name?: string; context_length?: number }> }
      return data.data.map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        contextWindow: m.context_length,
      }))
    } catch {
      return []
    }
  }
}

// ============================================================
// Error mapping — maps SDK errors to ConnectionTestResult status
// ============================================================

function mapError(
  provider: string,
  err: unknown,
): TestConnectionResult {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (
    lower.includes('401') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid api key') ||
    lower.includes('authentication')
  ) {
    return { status: 'INVALID_CREDENTIAL', message: 'Invalid API key' }
  }

  if (lower.includes('429') || lower.includes('rate limit')) {
    return { status: 'RATE_LIMITED', message: 'Rate limit exceeded' }
  }

  if (
    lower.includes('model') &&
    (lower.includes('not found') || lower.includes('does not exist') || lower.includes('invalid'))
  ) {
    return {
      status: 'MODEL_UNAVAILABLE',
      message: `Model unavailable for ${provider}: ${msg}`,
    }
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('network') ||
    lower.includes('fetch failed') ||
    lower.includes('enotfound')
  ) {
    return { status: 'NETWORK_ERROR', message: 'Network error — check connectivity' }
  }

  return { status: 'PROVIDER_ERROR', message: `${provider} error: ${msg}` }
}
