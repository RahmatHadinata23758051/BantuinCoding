import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { AIProviderType } from '@repo/types'
import { auth } from '@/lib/auth'
import { db } from '@repo/db'
import { createProvider } from '@/lib/ai/provider'
import { setProviderSession } from '@/lib/byok/session-store'
import { decryptSecret } from '@/lib/security/encryption'
import { validateProviderBaseUrl } from '@/lib/security/url-validation'

const PatchKeySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  model: z.string().min(1).max(200).optional(),
  baseUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  testConnection: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { keyId } = await params
  const existing = await db.providerKey.findFirst({
    where: { id: keyId, userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = PatchKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { name, model, baseUrl, isActive, testConnection } = parsed.data
  const rawKey = decryptSecret(existing.encryptedKey)
  const effectiveModel = model ?? existing.model
  const effectiveBaseUrl = baseUrl !== undefined ? (baseUrl ?? undefined) : (existing.baseUrl ?? undefined)
  const urlCheck = validateProviderBaseUrl(effectiveBaseUrl, existing.provider as AIProviderType)
  if (!urlCheck.valid) {
    return NextResponse.json({ error: urlCheck.error ?? 'Invalid base URL' }, { status: 400 })
  }
  const normalizedBaseUrl = urlCheck.normalizedUrl ?? effectiveBaseUrl
  const effectiveApiKey = rawKey || (existing.provider === 'OLLAMA' ? 'ollama' : '')

  let identity
  if (testConnection) {
    const aiProvider = createProvider({
      provider: existing.provider as AIProviderType,
      model: effectiveModel,
      apiKey: effectiveApiKey,
      baseUrl: normalizedBaseUrl,
    })
    const testResult = await aiProvider.testConnection()
    if (testResult.status !== 'VALID') {
      return NextResponse.json({ status: testResult.status, message: testResult.message }, { status: 400 })
    }
    identity = testResult.identity
  }

  const updated = await db.$transaction(async (tx) => {
    if (isActive === true) {
      // Deactivate all others first
      await tx.providerKey.updateMany({
        where: { userId },
        data: { isActive: false },
      })
    }

    return tx.providerKey.update({
      where: { id: keyId },
      data: {
        ...(name && { name }),
        ...(model && { model }),
        ...(baseUrl !== undefined && { baseUrl: normalizedBaseUrl }),
        ...(isActive !== undefined && { isActive }),
        lastValidated: new Date(),
      },
      select: {
        id: true,
        name: true,
        provider: true,
        model: true,
        baseUrl: true,
        isActive: true,
        lastValidated: true,
      },
    })
  })

  if (updated.isActive) {
    setProviderSession(userId, {
      provider: updated.provider as AIProviderType,
      model: updated.model,
      apiKey: effectiveApiKey,
      baseUrl: updated.baseUrl ?? undefined,
    })
  }

  return NextResponse.json({ key: updated, identity })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { keyId } = await params
  const existing = await db.providerKey.findFirst({
    where: { id: keyId, userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  await db.providerKey.delete({ where: { id: keyId } })
  return NextResponse.json({ success: true })
}
