import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { AIProviderType } from '@repo/types'
import { auth } from '@/lib/auth'
import { createProvider, sanitizeProviderMessage, SUPPORTED_PROVIDER_VALUES } from '@/lib/ai/provider'
import { validateProviderBaseUrl } from '@/lib/security/url-validation'

function safeProviderMessage(message: string, apiKey?: string): string {
  return sanitizeProviderMessage(message, apiKey) || 'Provider connection failed. Please retry.'
}

const TestSchema = z
  .object({
    provider: z.enum(SUPPORTED_PROVIDER_VALUES),
    model: z.string().min(1, 'Model is required').max(200),
    apiKey: z.string().max(512, 'API key too long').optional().default(''),
    baseUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider !== 'OLLAMA') {
      if (!data.apiKey || data.apiKey.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'API key too short',
          path: ['apiKey'],
        })
      } else if (/\s/.test(data.apiKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'API key must not contain spaces',
          path: ['apiKey'],
        })
      }
    }
  })

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false

  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: 'Too many test attempts. Wait 60 seconds.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = TestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { provider, model, apiKey, baseUrl } = parsed.data

  const urlCheck = validateProviderBaseUrl(baseUrl, provider as AIProviderType)
  if (!urlCheck.valid) {
    return NextResponse.json(
      { error: urlCheck.error ?? 'Invalid base URL' },
      { status: 400 },
    )
  }

  const aiProvider = createProvider({
    provider: provider as AIProviderType,
    model,
    apiKey: apiKey || (provider === 'OLLAMA' ? 'ollama' : ''),
    baseUrl: urlCheck.normalizedUrl ?? baseUrl,
  })

  const testResult = await aiProvider.testConnection()

  let models: Array<{ id: string; name: string; contextWindow?: number }> = []
  try {
    models = (await aiProvider.listModels?.()) ?? []
  } catch {
    models = []
  }

  if (testResult.status !== 'VALID') {
    return NextResponse.json(
      {
        status: testResult.status,
        message: safeProviderMessage(testResult.message, apiKey),
        models,
      },
      { status: 200 },
    )
  }

  return NextResponse.json({
    status: 'VALID',
    message: testResult.message,
    models,
    identity: testResult.identity,
  })
}
