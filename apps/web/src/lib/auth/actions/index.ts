'use server'

import { signIn } from '@/lib/auth'
import { registerUser } from '@/lib/auth/register'
import type { ActionResult } from '@/lib/auth/register'

export type { ActionResult }

/**
 * Register a new user — thin server action wrapper around registerUser().
 */
export async function registerAction(
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  return registerUser({
    email: (formData.get('email') as string) ?? '',
    password: (formData.get('password') as string) ?? '',
    name: formData.get('name') as string | null,
  })
}

/**
 * Sign in via credentials.
 */
export async function loginAction(
  formData: FormData,
): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
    return { success: true, data: undefined }
  } catch (error) {
    // Next.js redirect throws a special NEXT_REDIRECT error which MUST be re-thrown
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    return { success: false, error: 'Invalid email or password' }
  }
}
