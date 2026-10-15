import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { AIProviderType } from '@repo/types'
import { auth } from '@/lib/auth'
import { createProvider, SUPPORTED_PROVIDER_VALUES } from '@/lib/ai/provider'
import { validateProviderBaseUrl } from '@/lib/security/url-validation'

const ModelsSchema = z
  .object({
    provider: z.enum(SUPPORTED_PROVIDER_VALUES),
    apiKey: z.string().max(512, 'API key too long').optional().default(''),
    baseUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider !== 'OLLAMA') {
      if (!data.apiKey || data.apiKey.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'API key too short', path: ['apiKey'] })
      } else if (/\s/.test(data.apiKey)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'API key must not contain spaces', path: ['apiKey'] })
      }
    }
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
  const urlCheck = validateProviderBaseUrl(baseUrl, provider as AIProviderType)
  if (!urlCheck.valid) {
    return NextResponse.json({ error: urlCheck.error ?? 'Invalid base URL' }, { status: 400 })
  }

  const aiProvider = createProvider({
    provider: provider as AIProviderType,
    model: 'placeholder',
    apiKey: apiKey || (provider === 'OLLAMA' ? 'ollama' : ''),
    baseUrl: urlCheck.normalizedUrl ?? baseUrl,
  })

  if (!aiProvider.listModels) {
    return NextResponse.json(
      { error: 'Model listing not supported for this provider' },
      { status: 400 },
    )
  }

  try {
    const models = await aiProvider.listModels()
    return NextResponse.json({ models })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 502 })
  }
}
