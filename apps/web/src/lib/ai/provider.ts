import type {
  AIProviderType,
  AIProviderConfig,
  TestConnectionResult,
  VerifiedProviderIdentity,
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
  generateStructured<T, I = T>(
    prompt: string,
    schema: z.ZodType<T, z.ZodTypeDef, I>,
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

export const OPENAI_COMPATIBLE_DEFAULT_URLS = {
  DEEPSEEK: 'https://api.deepseek.com/v1',
  GROQ: 'https://api.groq.com/openai/v1',
  MISTRAL: 'https://api.mistral.ai/v1',
  XAI: 'https://api.x.ai/v1',
  OLLAMA: 'http://localhost:11434/v1',
} as const

export const SUPPORTED_PROVIDER_VALUES = [
  'ANTHROPIC',
  'OPENAI',
  'GEMINI',
  'OPENROUTER',
  'DEEPSEEK',
  'GROQ',
  'MISTRAL',
  'XAI',
  'OLLAMA',
] as const

export const SUPPORTED_PROVIDERS: AIProviderType[] = [...SUPPORTED_PROVIDER_VALUES]

export function isOllamaProvider(provider: AIProviderType): boolean {
  return provider === 'OLLAMA'
}

function isTruncationFinishReason(reason: unknown): boolean {
  return typeof reason === 'string' && ['length', 'max_tokens', 'max_output_tokens'].includes(reason.toLowerCase())
}

function extractJsonString(text: string, quoteIndex: number): string | null {
  if (text[quoteIndex] !== '"') return null
  let escaped = false
  for (let i = quoteIndex + 1; i < text.length; i++) {
    if (escaped) {
      escaped = false
    } else if (text[i] === '\\') {
      escaped = true
    } else if (text[i] === '"') {
      try {
        const value: unknown = JSON.parse(text.slice(quoteIndex, i + 1))
        return typeof value === 'string' ? value : null
      } catch {
        return null
      }
    }
  }
  return null
}

function extractCompleteMarkdownContent(text: string): string | null {
  const marker = /"markdown_content"\s*:/g
  const match = marker.exec(text)
  if (!match) return null
  const valueStart = text.slice(marker.lastIndex).search(/\S/)
  if (valueStart < 0) return null
  const quoteIndex = marker.lastIndex + valueStart
  return extractJsonString(text, quoteIndex)
}

export const OPENAI_COMPATIBLE_MODELS: Record<keyof typeof OPENAI_COMPATIBLE_DEFAULT_URLS, ModelInfo[]> = {
  DEEPSEEK: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
  ],
  GROQ: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' },
  ],
  MISTRAL: [
    { id: 'mistral-large-latest', name: 'Mistral Large' },
    { id: 'codestral-latest', name: 'Codestral' },
    { id: 'mistral-small-latest', name: 'Mistral Small' },
  ],
  XAI: [
    { id: 'grok-2-latest', name: 'Grok 2' },
    { id: 'grok-beta', name: 'Grok Beta' },
  ],
  OLLAMA: [
    { id: 'llama3.2', name: 'Llama 3.2' },
    { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder' },
    { id: 'deepseek-r1', name: 'DeepSeek R1' },
  ],
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
    case 'DEEPSEEK':
    case 'GROQ':
    case 'MISTRAL':
    case 'XAI':
    case 'OLLAMA':
      return new OpenAICompatibleProvider(config)
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
  abstract generateStructured<T, I = T>(
    prompt: string,
    schema: z.ZodType<T, z.ZodTypeDef, I>,
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

    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    const firstBracket = text.indexOf('[')
    const lastBracket = text.lastIndexOf(']')

    // 3. Find the outermost JSON object boundaries: from the FIRST { to the LAST }
    // Only attempt if text starts as an object ({ appears before [ or there is no [)
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket) && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1)
      try {
        return JSON.parse(candidate)
      } catch {
        // Candidate slicing failed to parse directly.
        // Try sanitizing unescaped newlines/tabs inside string literals before giving up.
        let inString = false
        let escaped = false
        let repaired = ''
        for (let i = 0; i < candidate.length; i++) {
          const char = candidate[i]
          if (escaped) {
            repaired += char
            escaped = false
            continue
          }
          if (char === '\\') {
            repaired += char
            escaped = true
            continue
          }
          if (char === '"') {
            inString = !inString
            repaired += char
            continue
          }
          if (inString) {
            if (char === '\n') {
              repaired += '\\n'
              continue
            }
            if (char === '\r') {
              repaired += '\\r'
              continue
            }
            if (char === '\t') {
              repaired += '\\t'
              continue
            }
          }
          repaired += char
        }
        try {
          return JSON.parse(repaired)
        } catch {
          // Object repair failed, proceed to markdown/truncation recovery below.
          // CRITICAL: DO NOT fall back to extracting an inner array from inside this broken object!
        }
      }
    }

    // 4. Find the outermost JSON array boundaries ONLY if the text explicitly started with an array
    // ([ appears BEFORE { or there is no { at all)
    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace) && lastBracket > firstBracket) {
      const candidate = text.slice(firstBracket, lastBracket + 1)
      try {
        return JSON.parse(candidate)
      } catch {
        // Fallback below
      }
    }

    // 5. Recover a complete markdown string only when its closing quote is present.
    const completeMarkdown = extractCompleteMarkdownContent(text)
    if (completeMarkdown?.trim()) {
      return { markdown_content: completeMarkdown.trim() }
    }

    // An unterminated JSON string is incomplete output and must not be accepted as a draft.

    // 6. Direct Markdown recovery: if model returned direct markdown starting with #
    const directMd = text.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/i, '').trim()
    if (directMd.startsWith('#')) {
      return { markdown_content: directMd }
    }

    return JSON.parse(text)
  }

  /**
   * Resilient fallback to extract markdown content from raw AI response text
   * when schema validation or JSON parsing fails.
   */
  protected extractMarkdownContent(raw: string): string | null {
    let text = raw.trim()
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '')
    text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    text = text.replace(/<\?xml[^>]*>/gi, '')
    text = text.replace(/^\s*[\r\n]+/, '')

    // Case A: Recover only a complete JSON string value; truncated strings fail closed.
    const markdownContent = extractCompleteMarkdownContent(text)?.trim()
    if (markdownContent && markdownContent.length > 20) return markdownContent


    // Case B: Markdown code fence ```markdown ... ``` or ```md ... ```
    const mdFence = text.match(/```(?:markdown|md)\s*\n([\s\S]*?)\n```/i)
    if (mdFence && mdFence[1].trim().startsWith('#')) {
      return mdFence[1].trim()
    }

    // Case C: Direct Markdown starting with #
    const direct = text.replace(/^```[a-z]*\s*\n/i, '').replace(/\n```\s*$/i, '').trim()
    if (direct.startsWith('#') && direct.length > 50) {
      return direct
    }

    return null
  }

  /**
   * Parse and validate JSON against a Zod schema.
   * Throws a descriptive error if validation fails.
   * Includes multi-stage resilient recovery for non-conforming model outputs:
   * 1. Direct validation
   * 2. Unpack single-element arrays: [ { ... } ]
   * 3. Extract markdown_content from parsed object if schema accepts it
   * 4. Extract markdown_content directly from raw text if schema accepts it
   */
  protected parseAndValidate<T, I = T>(raw: string, schema: z.ZodType<T, z.ZodTypeDef, I>): T {
    let parsed: unknown
    try {
      parsed = this.extractJson(raw)
    } catch {
      // extraction failed, will attempt markdown recovery below
    }

    if (parsed !== undefined) {
      // 1. Direct validation attempt
      const result = schema.safeParse(parsed)
      if (result.success) {
        return result.data
      }

      // 2. Unpack single-element array if schema expects an object: [ { ... } ]
      if (
        Array.isArray(parsed) &&
        parsed.length === 1 &&
        typeof parsed[0] === 'object' &&
        parsed[0] !== null &&
        !Array.isArray(parsed[0])
      ) {
        const unwrapped = schema.safeParse(parsed[0])
        if (unwrapped.success) {
          return unwrapped.data
        }
      }

      // 3. If parsed is an object and has a valid markdown_content string
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const asRec = parsed as Record<string, unknown>
        if (typeof asRec.markdown_content === 'string' && asRec.markdown_content.trim().length > 0) {
          const minimal = schema.safeParse({
            title: asRec.title || 'DESIGN.md',
            markdown_content: asRec.markdown_content,
          })
          if (minimal.success) {
            return minimal.data
          }
        }
      }
    }

    // 4. Fallback: extract markdown directly from raw text if schema expects markdown_content
    const extractedMd = this.extractMarkdownContent(raw)
    if (extractedMd) {
      const mdResult = schema.safeParse({
        title: 'DESIGN.md',
        markdown_content: extractedMd,
      })
      if (mdResult.success) {
        return mdResult.data
      }
    }

    // If all recovery paths failed, throw the detailed validation error
    if (parsed !== undefined) {
      const result = schema.safeParse(parsed)
      if (!result.success) {
        throw new Error(
          `[${this.type}] AI response failed schema validation.\n` +
            `Issues: ${JSON.stringify(result.error.issues, null, 2)}
Raw (first 1000 chars): ${raw.slice(0, 1000)}`,
        )
      }
    }

    throw new Error(
      `[${this.type}] AI response is not valid JSON.\n` +
        `Raw (first 500 chars): ${raw.slice(0, 500)}`,
    )
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

      return {
        status: 'VALID',
        message: 'Connection successful',
        identity: verifiedIdentity(this.config),
      }
    } catch (err) {
      return mapError('ANTHROPIC', err, this.config.apiKey)
    }
  }

  async generateStructured<T, I = T>(
    prompt: string,
    schema: z.ZodType<T, z.ZodTypeDef, I>,
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

    if (msg.stop_reason === 'max_tokens') {
      throw new Error('Generation truncated due to max tokens limit')
    }

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
          const detail = safeProviderDetail(completionErr, this.config.apiKey)
          return {
            status: 'MODEL_UNAVAILABLE',
            message: sanitizeProviderMessage(
              `Model ${this.config.model} unavailable${detail ? `: ${detail}` : ''}. Try another model.`,
              this.config.apiKey,
            ),
          }
        }
      }

      return {
        status: 'VALID',
        message: 'Connection successful',
        identity: verifiedIdentity(this.config, this.getBaseUrl()),
      }
    } catch (err) {
      return mapError('OPENAI', err, this.config.apiKey)
    }
  }

  async generateStructured<T, I = T>(
    prompt: string,
    schema: z.ZodType<T, z.ZodTypeDef, I>,
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

    if (isTruncationFinishReason(completion.choices[0]?.finish_reason)) {
      throw new Error('Generation truncated due to max tokens limit')
    }

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

      return {
        status: 'VALID',
        message: 'Connection successful',
        identity: verifiedIdentity(this.config),
      }
    } catch (err) {
      return mapError('GEMINI', err, this.config.apiKey)
    }
  }

  async generateStructured<T, I = T>(
    prompt: string,
    schema: z.ZodType<T, z.ZodTypeDef, I>,
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
    const finishReason = result.response.candidates?.[0]?.finishReason
    if (finishReason === 'MAX_TOKENS') {
      throw new Error('Generation truncated due to max tokens limit')
    }

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
// OpenAI-compatible providers
// ============================================================

class OpenAICompatibleProvider extends BaseProvider {
  readonly type: AIProviderType

  constructor(config: AIProviderConfig) {
    super(config)
    this.type = config.provider
  }

  private getBaseUrl(): string {
    if (this.config.baseUrl) return this.config.baseUrl.replace(/\/+$/, '')
    if (this.config.provider === 'OPENROUTER') return 'https://openrouter.ai/api/v1'
    return OPENAI_COMPATIBLE_DEFAULT_URLS[this.config.provider as keyof typeof OPENAI_COMPATIBLE_DEFAULT_URLS]
  }

  private getFallbackModels(): ModelInfo[] {
    if (this.config.provider === 'OPENROUTER') {
      return [
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      ]
    }
    return OPENAI_COMPATIBLE_MODELS[this.config.provider as keyof typeof OPENAI_COMPATIBLE_MODELS]
  }

  private getIdentity(): VerifiedProviderIdentity {
    return verifiedIdentity(this.config, this.getBaseUrl())
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({
        apiKey: this.config.apiKey || 'ollama',
        baseURL: this.getBaseUrl(),
        timeout: 10_000,
      })

      await client.models.list()

      try {
        await client.chat.completions.create({
          model: this.config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        })
      } catch (completionErr) {
        const msg = completionErr instanceof Error ? completionErr.message : String(completionErr)
        return {
          status: 'MODEL_UNAVAILABLE',
          message: `Model ${this.config.model} unavailable: ${msg}. Try another model.`,
        }
      }

      return {
        status: 'VALID',
        message: 'Connection successful',
        identity: this.getIdentity(),
      }
    } catch (err) {
      return mapError(this.config.provider, err, this.config.apiKey)
    }
  }

  async generateStructured<T, I = T>(
    prompt: string,
    schema: z.ZodType<T, z.ZodTypeDef, I>,
    options: GenerateOptions = {},
  ): Promise<T> {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({
      apiKey: this.config.apiKey || 'ollama',
      baseURL: this.getBaseUrl(),
      timeout: 180_000,
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

    if (isTruncationFinishReason(completion.choices[0]?.finish_reason)) {
      throw new Error('Generation truncated due to max tokens limit')
    }

    return this.parseAndValidate(completion.choices[0]?.message?.content ?? '', schema)
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const { default: OpenAI } = await import('openai')
      const client = new OpenAI({
        apiKey: this.config.apiKey || 'ollama',
        baseURL: this.getBaseUrl(),
        timeout: 10_000,
      })
      const list = await client.models.list()
      const models = list.data.map((m) => ({
        id: m.id,
        name: m.id,
        contextWindow: (m as { context_window?: number }).context_window,
      }))
      return models.length > 0 ? models : this.getFallbackModels()
    } catch {
      return this.getFallbackModels()
    }
  }
}

class OpenRouterProvider extends OpenAICompatibleProvider {
  readonly type = 'OPENROUTER' as const
}

function maskProviderKey(value: string): string {
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}

function verifiedIdentity(config: AIProviderConfig, baseUrl?: string): VerifiedProviderIdentity {
  return {
    provider: config.provider,
    model: config.model,
    maskedKey: maskProviderKey(config.apiKey),
    ...(baseUrl ? { baseUrl } : {}),
    verifiedAt: new Date().toISOString(),
  }
}

// ============================================================
// Error mapping — maps SDK errors to ConnectionTestResult status
// ============================================================

const PROVIDER_MESSAGE_LIMIT = 240

function extractProviderMessage(value: unknown, depth = 0, seen = new Set<object>()): string {
  if (depth > 4 || value == null) return ''

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const jsonStart = trimmed.indexOf('{')
    const jsonEnd = trimmed.lastIndexOf('}')
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try {
        const nested = extractProviderMessage(JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)), depth + 1, seen)
        if (nested) return nested
      } catch {
        // Keep looking for a quoted message in non-JSON SDK error text.
      }
    }

    const quoted = trimmed.match(/"message"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i)?.[1]
    if (quoted) {
      try {
        return JSON.parse(`"${quoted}"`)
      } catch {
        return quoted.replace(/\\"/g, '"')
      }
    }
    return trimmed
  }

  if (typeof value !== 'object') return ''
  if (seen.has(value)) return ''
  seen.add(value)

  const record = value as Record<string, unknown>
  for (const key of ['error', 'response', 'body', 'data', 'detail', 'message']) {
    const message = extractProviderMessage(record[key], depth + 1, seen)
    if (message) return message
  }
  return ''
}

export function sanitizeProviderMessage(message: string, secret?: string): string {
  let cleaned = message
  if (secret && secret.length >= 6) cleaned = cleaned.replaceAll(secret, '[redacted]')

  cleaned = cleaned
    .replace(/Bearer\s+[^\s,;)}\]]+/gi, 'Bearer [redacted]')
    .replace(/\b(?:sk|pk|rk|gsk|xai|key|token|secret)[-_][A-Za-z0-9._~-]{12,}\b/gi, '[redacted]')
    .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/gi, '[redacted]')
    .replace(/\b(?:api[_ -]?key|access[_ -]?token|secret)[-:\s=]+[A-Za-z0-9._~-]{12,}\b/gi, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned || /^\[redacted\]$/i.test(cleaned)) return ''
  return cleaned
    .replace(/^\s*(?:HTTP\s*)?\d{3}\s*[:\-]?\s*/i, '')
    .slice(0, PROVIDER_MESSAGE_LIMIT)
    .trim()
}

function extractProviderStatus(value: unknown, depth = 0, seen = new Set<object>()): string {
  if (depth > 4 || value == null || typeof value !== 'object' || seen.has(value)) return ''
  seen.add(value)
  const record = value as Record<string, unknown>
  const status = record.status ?? record.statusCode ?? record.code
  if (typeof status === 'string' || typeof status === 'number') return String(status)
  for (const key of ['error', 'response', 'body', 'data']) {
    const nested = extractProviderStatus(record[key], depth + 1, seen)
    if (nested) return nested
  }
  return ''
}

function safeProviderDetail(err: unknown, secret?: string): string {
  return sanitizeProviderMessage(extractProviderMessage(err), secret)
}

function mapError(
  provider: string,
  err: unknown,
  secret?: string,
): TestConnectionResult {
  const msg = extractProviderMessage(err)
  const lower = `${extractProviderStatus(err)} ${msg}`.toLowerCase()
  const detail = safeProviderDetail(err, secret)
  const fallback = (message: string) => sanitizeProviderMessage(detail ? `${message}: ${detail}` : message, secret) || message

  if (
    lower.includes('401') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid api key') ||
    lower.includes('authentication')
  ) {
    return { status: 'INVALID_CREDENTIAL', message: fallback('Invalid API key') }
  }

  if (lower.includes('429') || lower.includes('rate limit')) {
    return { status: 'RATE_LIMITED', message: fallback('Rate limit exceeded') }
  }

  if (
    lower.includes('model') &&
    (lower.includes('not found') || lower.includes('does not exist') || lower.includes('invalid'))
  ) {
    return {
      status: 'MODEL_UNAVAILABLE',
      message: fallback('Selected model is unavailable for this provider'),
    }
  }

  if (
    lower.includes('econnrefused') ||
    lower.includes('network') ||
    lower.includes('fetch failed') ||
    lower.includes('enotfound')
  ) {
    return { status: 'NETWORK_ERROR', message: fallback('Network error — check connectivity') }
  }

  return { status: 'PROVIDER_ERROR', message: fallback('Provider connection failed. Please retry or choose another provider.') }
}
