import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createProvider } from '@/lib/ai/provider'
import { getSafeApiErrorMessage } from '@/lib/api/errors'

function safeProviderMessage(message: string): string {
  return getSafeApiErrorMessage(new Error(message), 'Provider connection failed. Please retry.')
}
import { z } from 'zod'
import type { AIProviderType } from '@repo/types'

// ============================================================
// POST /api/provider/test
// Test connection and list available models without persisting session.
// Returns typed result + models array on success.
// ============================================================

const TestSchema = z.object({
  provider: z.enum(['ANTHROPIC', 'OPENAI', 'GEMINI', 'OPENROUTER']),
  model: z.string().min(1, 'Model is required').max(200),
  apiKey: z
    .string()
    .min(8, 'API key too short')
    .max(512, 'API key too long')
    .regex(/^[^\s]+$/, 'API key must not contain spaces'),
  baseUrl: z.string().optional(),
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

  const { provider, model, apiKey } = parsed.data

  const aiProvider = createProvider({
    provider: provider as AIProviderType,
    model,
    apiKey,
  })

  const testResult = await aiProvider.testConnection()

  // Connection valid — fetch available models
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
        message: safeProviderMessage(testResult.message),
        models, // still return models so user can pick a different one!
      },
      { status: 200 },
    )
  }

  return NextResponse.json({
    status: 'VALID',
    message: testResult.message,
    models,
  })
}