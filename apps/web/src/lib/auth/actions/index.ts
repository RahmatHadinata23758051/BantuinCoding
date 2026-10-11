'use server'

import { auth, signIn, signOut } from '@/lib/auth'
import { clearProviderSession } from '@/lib/byok/session-store'
import { AUTH_ERROR_CODES, LoginSchema, registerUser } from '@/lib/auth/register'
import type { ActionResult } from '@/lib/auth/register'

export type { ActionResult }

/**
 * Register a new user — thin server action wrapper around registerUser().
 */
export async function registerAction(
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const rawName = formData.get('name')
  const name = typeof rawName === 'string' ? rawName.trim() : ''

  return registerUser({
    email: (formData.get('email') as string) ?? '',
    password: (formData.get('password') as string) ?? '',
    name: name || undefined,
  })
}

/**
 * Sign in via credentials.
 */
export async function loginAction(
  formData: FormData,
): Promise<ActionResult> {
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')
  const email = typeof rawEmail === 'string' ? rawEmail : ''
  const password = typeof rawPassword === 'string' ? rawPassword : ''

  if (!email || !password) {
    return { success: false, error: AUTH_ERROR_CODES.MISSING_CREDENTIALS }
  }

  const parsed = LoginSchema.safeParse({ email, password })
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message
    if (error === AUTH_ERROR_CODES.INVALID_EMAIL || error === AUTH_ERROR_CODES.PASSWORD_TOO_SHORT) {
      return { success: false, error }
    }
    return { success: false, error: AUTH_ERROR_CODES.INVALID_CREDENTIALS }
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim()
  const normalizedPassword = parsed.data.password

  try {
    await signIn('credentials', { email: normalizedEmail, password: normalizedPassword, redirectTo: '/dashboard' })
    return { success: true, data: undefined }
  } catch (error) {
    // Next.js redirect throws a special NEXT_REDIRECT error which MUST be re-thrown
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    return { success: false, error: AUTH_ERROR_CODES.INVALID_CREDENTIALS }
  }
}

/**
 * Sign out and clear the session-scoped BYOK provider key from server memory.
 */
export async function logoutAction(): Promise<void> {
  const session = await auth()
  if (session?.user?.id) {
    clearProviderSession(session.user.id)
  }

  await signOut({ redirectTo: '/login' })
}
