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
    await signIn('credentials', { email, password, redirect: false })
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Invalid email or password' }
  }
}
