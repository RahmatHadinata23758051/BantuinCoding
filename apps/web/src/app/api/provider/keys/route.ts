import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { AIProviderType } from '@repo/types'
import { auth } from '@/lib/auth'
import { db } from '@repo/db'
import { createProvider } from '@/lib/ai/provider'
import { setProviderSession } from '@/lib/byok/session-store'
import { encryptSecret, maskSecret } from '@/lib/security/encryption'

const ProviderSchema = z.enum(['ANTHROPIC', 'OPENAI', 'GEMINI', 'OPENROUTER'])
const CreateKeySchema = z.object({
  name: z.string().min(1).max(80),
  provider: ProviderSchema,
  model: z.string().min(1).max(200),
  apiKey: z.string().min(8).max(512).regex(/^[^\s]+$/),
  baseUrl: z.string().url().optional(),
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
  const aiProvider = createProvider({ provider: provider as AIProviderType, model, apiKey, baseUrl })
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
        baseUrl,
        encryptedKey: encryptSecret(apiKey),
        isActive: !hasExisting,
        lastValidated: new Date(),
      },
      select: { id: true, name: true, provider: true, model: true, baseUrl: true, isActive: true, lastValidated: true },
    })
  })

  if (created.isActive) setProviderSession(userId, { provider: provider as AIProviderType, model, apiKey, baseUrl })
  return NextResponse.json({ status: 'VALID', key: created })
}
