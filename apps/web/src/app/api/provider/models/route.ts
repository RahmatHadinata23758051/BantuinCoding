import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createProvider } from '@/lib/ai/provider'
import { z } from 'zod'
import type { AIProviderType } from '@repo/types'

// ============================================================
// POST /api/provider/models
// Fetch available models for a provider using the provided API key.
// Does NOT test connection to a specific model.
// ============================================================

const ModelsSchema = z.object({
  provider: z.enum(['ANTHROPIC', 'OPENAI', 'GEMINI', 'OPENROUTER']),
  apiKey: z
    .string()
    .min(8, 'API key too short')
    .max(512, 'API key too long')
    .regex(/^[^\s]+$/, 'API key must not contain spaces'),
  baseUrl: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = ModelsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { provider, apiKey, baseUrl } = parsed.data

  const aiProvider = createProvider({
    provider: provider as AIProviderType,
    model: 'placeholder', // dummy, not used for listModels
    apiKey,
    baseUrl,
  })

  // Check if listModels is supported
  if (!aiProvider.listModels) {
    return NextResponse.json({
      error: 'Model listing not supported for this provider',
    }, { status: 400 })
  }

  try {
    const models = await aiProvider.listModels()
    return NextResponse.json({ models })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 502 },
    )
  }
}
