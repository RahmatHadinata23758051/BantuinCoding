import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { AIProviderType } from '@repo/types'
import { auth } from '@/lib/auth'
import { db } from '@repo/db'
import { createProvider, SUPPORTED_PROVIDER_VALUES } from '@/lib/ai/provider'
import { setProviderSession } from '@/lib/byok/session-store'
import { encryptSecret, maskSecret } from '@/lib/security/encryption'
import { validateProviderBaseUrl } from '@/lib/security/url-validation'

const ProviderSchema = z.enum(SUPPORTED_PROVIDER_VALUES)
const CreateKeySchema = z
  .object({
    name: z.string().min(1).max(80),
    provider: ProviderSchema,
    model: z.string().min(1).max(200),
    apiKey: z.string().max(512).optional().default(''),
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

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keys = await db.providerKey.findMany({
    where: { userId },
    orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true, name: true, provider: true, model: true, baseUrl: true,
      isActive: true, lastValidated: true, createdAt: true, updatedAt: true,
      encryptedKey: true,
    },
  })

  return NextResponse.json({
    keys: keys.map(({ encryptedKey, ...key }) => ({ ...key, keyHint: maskSecret(encryptedKey) })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = CreateKeySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

  const { name, provider, model, apiKey, baseUrl } = parsed.data
  const urlCheck = validateProviderBaseUrl(baseUrl, provider as AIProviderType)
  if (!urlCheck.valid) {
    return NextResponse.json({ error: urlCheck.error ?? 'Invalid base URL' }, { status: 400 })
  }
  const effectiveBaseUrl = urlCheck.normalizedUrl ?? baseUrl
  const effectiveApiKey = apiKey || (provider === 'OLLAMA' ? 'ollama' : '')
  const aiProvider = createProvider({ provider: provider as AIProviderType, model, apiKey: effectiveApiKey, baseUrl: effectiveBaseUrl })
  const validation = await aiProvider.testConnection()
  if (validation.status !== 'VALID') {
    return NextResponse.json({ status: validation.status, message: validation.message }, { status: 400 })
  }

  const hasExisting = await db.providerKey.count({ where: { userId } }) > 0
  const created = await db.$transaction(async (tx) => {
    if (!hasExisting) await tx.providerKey.updateMany({ where: { userId }, data: { isActive: false } })
    return tx.providerKey.create({
      data: {
        userId,
        name,
        provider,
        model,
        baseUrl: effectiveBaseUrl,
        encryptedKey: encryptSecret(effectiveApiKey),
        isActive: !hasExisting,
        lastValidated: new Date(),
      },
      select: { id: true, name: true, provider: true, model: true, baseUrl: true, isActive: true, lastValidated: true },
    })
  })

  if (created.isActive) setProviderSession(userId, { provider: provider as AIProviderType, model, apiKey: effectiveApiKey, baseUrl: effectiveBaseUrl })
  return NextResponse.json({ status: 'VALID', key: created, identity: validation.identity })
}
