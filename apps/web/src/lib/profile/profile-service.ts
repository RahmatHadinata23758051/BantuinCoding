import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { db } from '@repo/db'

export const PROFILE_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  NAME_REQUIRED: 'NAME_REQUIRED',
  NAME_TOO_LONG: 'NAME_TOO_LONG',
  CURRENT_PASSWORD_REQUIRED: 'CURRENT_PASSWORD_REQUIRED',
  CURRENT_PASSWORD_INCORRECT: 'CURRENT_PASSWORD_INCORRECT',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG: 'PASSWORD_TOO_LONG',
  PASSWORDS_DO_NOT_MATCH: 'PASSWORDS_DO_NOT_MATCH',
  NO_PASSWORD_SET: 'NO_PASSWORD_SET',
  UPDATE_FAILED: 'UPDATE_FAILED',
} as const

export type ProfileErrorCode = (typeof PROFILE_ERROR_CODES)[keyof typeof PROFILE_ERROR_CODES]

export interface SafeUserProfile {
  id: string
  email: string
  name: string | null
  createdAt: string
  hasPassword: boolean
}

export type ProfileResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: ProfileErrorCode }

const NameSchema = z
  .string()
  .trim()
  .min(1, PROFILE_ERROR_CODES.NAME_REQUIRED)
  .max(100, PROFILE_ERROR_CODES.NAME_TOO_LONG)

const PasswordSchema = z
  .string()
  .min(8, PROFILE_ERROR_CODES.PASSWORD_TOO_SHORT)
  .max(128, PROFILE_ERROR_CODES.PASSWORD_TOO_LONG)

/**
 * Fetch safe user profile data (excludes password hash).
 */
export async function getUserProfile(userId: string): Promise<SafeUserProfile | null> {
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      createdAt: true,
    },
  })

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    hasPassword: Boolean(user.password),
  }
}

/**
 * Update user display name.
 */
export async function updateUserName(
  userId: string,
  rawName: string,
): Promise<ProfileResult<{ name: string }>> {
  if (!userId) {
    return { success: false, error: PROFILE_ERROR_CODES.UNAUTHORIZED }
  }

  const parsed = NameSchema.safeParse(rawName)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message
    const error = (Object.values(PROFILE_ERROR_CODES) as string[]).includes(issue ?? '')
      ? (issue as ProfileErrorCode)
      : PROFILE_ERROR_CODES.NAME_REQUIRED
    return { success: false, error }
  }

  const name = parsed.data

  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: { name },
      select: { name: true },
    })

    return { success: true, data: { name: updated.name ?? name } }
  } catch (err) {
    console.error('Error updating user name:', err)
    return { success: false, error: PROFILE_ERROR_CODES.UPDATE_FAILED }
  }
}

/**
 * Change user password after verifying current password.
 */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ProfileResult> {
  if (!userId) {
    return { success: false, error: PROFILE_ERROR_CODES.UNAUTHORIZED }
  }

  if (!currentPassword) {
    return { success: false, error: PROFILE_ERROR_CODES.CURRENT_PASSWORD_REQUIRED }
  }

  const parsedNewPassword = PasswordSchema.safeParse(newPassword)
  if (!parsedNewPassword.success) {
    const issue = parsedNewPassword.error.issues[0]?.message
    const error = (Object.values(PROFILE_ERROR_CODES) as string[]).includes(issue ?? '')
      ? (issue as ProfileErrorCode)
      : PROFILE_ERROR_CODES.PASSWORD_TOO_SHORT
    return { success: false, error }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  })

  if (!user) {
    return { success: false, error: PROFILE_ERROR_CODES.USER_NOT_FOUND }
  }

  if (!user.password) {
    return { success: false, error: PROFILE_ERROR_CODES.NO_PASSWORD_SET }
  }

  const matches = await compare(currentPassword, user.password)
  if (!matches) {
    return { success: false, error: PROFILE_ERROR_CODES.CURRENT_PASSWORD_INCORRECT }
  }

  const passwordHash = await hash(parsedNewPassword.data, 12)

  try {
    await db.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    })

    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error updating user password:', err)
    return { success: false, error: PROFILE_ERROR_CODES.UPDATE_FAILED }
  }
}
