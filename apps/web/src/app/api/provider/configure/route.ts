import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createProvider } from '@/lib/ai/provider'
import {
  setProviderSession,
  getProviderMeta,
} from '@/lib/byok/session-store'
import { z } from 'zod'
import type { AIProviderType } from '@repo/types'

// ============================================================
// POST /api/provider/configure
// Test the API key + provider connection and store session if valid.
//
// SECURITY:
//   - API key is NEVER echoed back in any response field
//   - Errors are typed — never include raw SDK error messages that
//     might contain key fragments
//   - Rate limiting: 5 attempts per minute per user (see below)
// ============================================================

const ConfigureSchema = z.object({
  provider: z.enum(['ANTHROPIC', 'OPENAI', 'GEMINI', 'OPENROUTER']),
  model: z.string().min(1, 'Model is required').max(200),
  apiKey: z
    .string()
    .min(8, 'API key too short')
    .max(512, 'API key too long')
    .regex(/^[^\s]+$/, 'API key must not contain spaces'),
})

// Simple in-process rate limiter: 5 attempts per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
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
  // Auth guard
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Rate limit
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: 'Too many connection attempts. Wait 60 seconds.' },
      { status: 429 },
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = ConfigureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { provider, model, apiKey } = parsed.data

  // Test connection — API key stays in server memory only
  const aiProvider = createProvider({
    provider: provider as AIProviderType,
    model,
    apiKey,
  })

  const result = await aiProvider.testConnection()

  if (result.status !== 'VALID') {
    // Return typed error — NEVER include apiKey in response
    return NextResponse.json(
      {
        status: result.status,
        message: result.message,
        // Intentionally: no apiKey, no raw SDK message
      },
      { status: 200 }, // 200 so client can read the typed status
    )
  }

  // Store in session — key never leaves the server
  setProviderSession(userId, { provider: provider as AIProviderType, model, apiKey })

  // Return safe metadata only
  const meta = getProviderMeta(userId)

  return NextResponse.json({
    status: 'VALID',
    message: result.message,
    provider: meta?.provider,
    model: meta?.model,
    configuredAt: meta?.configuredAt,
  })
}

// ============================================================
// GET /api/provider/configure
// Return current provider session metadata (no API key).
// ============================================================

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const meta = getProviderMeta(session.user.id)
  if (!meta) {
    return NextResponse.json({ configured: false })
  }

  return NextResponse.json({
    configured: true,
    provider: meta.provider,
    model: meta.model,
    configuredAt: meta.configuredAt,
    // No apiKey or keyHint here — only show on initial configuration
  })
}
