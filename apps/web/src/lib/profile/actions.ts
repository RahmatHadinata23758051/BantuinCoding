'use server'

import { auth } from '@/lib/auth'
import {
  changeUserPassword,
  getUserProfile,
  PROFILE_ERROR_CODES,
  updateUserName,
} from '@/lib/profile/profile-service'
import type { ProfileResult, SafeUserProfile } from '@/lib/profile/profile-service'

export type { ProfileResult, SafeUserProfile }

export async function getCurrentUserProfileAction(): Promise<SafeUserProfile | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return getUserProfile(session.user.id)
}

export async function updateUserNameAction(
  formData: FormData,
): Promise<ProfileResult<{ name: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: PROFILE_ERROR_CODES.UNAUTHORIZED }
  }

  const rawName = formData.get('name')
  const name = typeof rawName === 'string' ? rawName : ''

  return updateUserName(session.user.id, name)
}

export async function changeUserPasswordAction(
  formData: FormData,
): Promise<ProfileResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: PROFILE_ERROR_CODES.UNAUTHORIZED }
  }

  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (newPassword !== confirmPassword) {
    return { success: false, error: PROFILE_ERROR_CODES.PASSWORDS_DO_NOT_MATCH }
  }

  return changeUserPassword(session.user.id, currentPassword, newPassword)
}
