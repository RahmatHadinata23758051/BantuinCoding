import { hash } from 'bcryptjs'
import { z } from 'zod'
import { db } from '@repo/db'

// ============================================================
// Pure auth business logic (no 'use server' — testable)
// ============================================================

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  name: z.string().min(1, 'Name is required').max(100).optional(),
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function registerUser(input: {
  email: string
  password: string
  name?: string | null
}): Promise<ActionResult<{ email: string }>> {
  const parsed = RegisterSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    }
  }

  const { email, password, name } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'An account with this email already exists' }
  }

  const passwordHash = await hash(password, 12)

  await db.user.create({
    data: { email, password: passwordHash, name: name ?? null },
  })

  return { success: true, data: { email } }
}
