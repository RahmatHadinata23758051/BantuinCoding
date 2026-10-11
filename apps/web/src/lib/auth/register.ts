import { hash } from 'bcryptjs'
import { z } from 'zod'
import { db } from '@repo/db'

// ============================================================
// Pure auth business logic (no 'use server' — testable)
// ============================================================

export const AUTH_ERROR_CODES = {
  INVALID_EMAIL: 'INVALID_EMAIL',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG: 'PASSWORD_TOO_LONG',
  NAME_REQUIRED: 'NAME_REQUIRED',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_ACCOUNT: 'DUPLICATE_ACCOUNT',
  REGISTRATION_FAILED: 'REGISTRATION_FAILED',
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
} as const

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES]

export const RegisterSchema = z.object({
  email: z.string().email(AUTH_ERROR_CODES.INVALID_EMAIL),
  password: z
    .string()
    .min(8, AUTH_ERROR_CODES.PASSWORD_TOO_SHORT)
    .max(128, AUTH_ERROR_CODES.PASSWORD_TOO_LONG),
  name: z.string().min(1, AUTH_ERROR_CODES.NAME_REQUIRED).max(100).optional(),
})

export const LoginSchema = z.object({
  email: z.string().email(AUTH_ERROR_CODES.INVALID_EMAIL),
  password: z.string().min(8, AUTH_ERROR_CODES.PASSWORD_TOO_SHORT),
})

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: AuthErrorCode }

export async function registerUser(input: {
  email: string
  password: string
  name?: string | null
}): Promise<ActionResult<{ email: string }>> {
  const parsed = RegisterSchema.safeParse(input)
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message
    const errorCode = Object.values(AUTH_ERROR_CODES).includes(error as AuthErrorCode)
      ? error as AuthErrorCode
      : AUTH_ERROR_CODES.INVALID_INPUT
    return { success: false, error: errorCode }
  }

  const email = parsed.data.email.toLowerCase().trim()
  const { password, name } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: AUTH_ERROR_CODES.DUPLICATE_ACCOUNT }
  }

  const passwordHash = await hash(password, 12)

  await db.user.create({
    data: { email, password: passwordHash, name: name ?? null },
  })

  return { success: true, data: { email } }
}
