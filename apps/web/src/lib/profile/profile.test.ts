import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  changeUserPassword,
  getUserProfile,
  PROFILE_ERROR_CODES,
  updateUserName,
} from './profile-service'

vi.mock('@repo/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn().mockResolvedValue('new_hashed_password_xyz789'),
}))

describe('Profile Service — getUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null if userId is empty', async () => {
    const profile = await getUserProfile('')
    expect(profile).toBeNull()
  })

  it('returns safe profile fields and excludes password hash', async () => {
    const { db } = await import('@repo/db')
    const mockUser = {
      id: 'user-123',
      email: 'dev@bantuin.com',
      name: 'Rahmat',
      password: 'hashed_secret_never_leak',
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
    }
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as never)

    const profile = await getUserProfile('user-123')
    expect(profile).toEqual({
      id: 'user-123',
      email: 'dev@bantuin.com',
      name: 'Rahmat',
      createdAt: '2026-09-01T00:00:00.000Z',
      hasPassword: true,
    })
    expect((profile as unknown as Record<string, unknown>).password).toBeUndefined()
  })

  it('returns null if user does not exist', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)

    const profile = await getUserProfile('user-404')
    expect(profile).toBeNull()
  })
})

describe('Profile Service — updateUserName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns UNAUTHORIZED if userId is empty', async () => {
    const result = await updateUserName('', 'New Name')
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.UNAUTHORIZED })
  })

  it('returns NAME_REQUIRED if name is empty or whitespace', async () => {
    const result = await updateUserName('user-123', '   ')
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.NAME_REQUIRED })
  })

  it('returns NAME_TOO_LONG if name exceeds 100 chars', async () => {
    const result = await updateUserName('user-123', 'a'.repeat(101))
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.NAME_TOO_LONG })
  })

  it('updates user name successfully', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.user.update).mockResolvedValueOnce({
      name: 'Rahmat Updated',
    } as never)

    const result = await updateUserName('user-123', 'Rahmat Updated')
    expect(result).toEqual({ success: true, data: { name: 'Rahmat Updated' } })
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { name: 'Rahmat Updated' },
      select: { name: true },
    })
  })
})

describe('Profile Service — changeUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns UNAUTHORIZED if userId is empty', async () => {
    const result = await changeUserPassword('', 'currentPass123', 'newPass123')
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.UNAUTHORIZED })
  })

  it('returns CURRENT_PASSWORD_REQUIRED if currentPassword is empty', async () => {
    const result = await changeUserPassword('user-123', '', 'newPass123')
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.CURRENT_PASSWORD_REQUIRED })
  })

  it('returns PASSWORD_TOO_SHORT if newPassword is less than 8 chars', async () => {
    const result = await changeUserPassword('user-123', 'currentPass123', 'short')
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.PASSWORD_TOO_SHORT })
  })

  it('returns PASSWORD_TOO_LONG if newPassword exceeds 128 chars', async () => {
    const result = await changeUserPassword('user-123', 'currentPass123', 'a'.repeat(129))
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.PASSWORD_TOO_LONG })
  })

  it('returns USER_NOT_FOUND if user is not in database', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)

    const result = await changeUserPassword('user-404', 'currentPass123', 'newPass123')
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.USER_NOT_FOUND })
  })

  it('returns NO_PASSWORD_SET if user has null password', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'user-123',
      password: null,
    } as never)

    const result = await changeUserPassword('user-123', 'currentPass123', 'newPass123')
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.NO_PASSWORD_SET })
  })

  it('returns CURRENT_PASSWORD_INCORRECT if password verification fails', async () => {
    const { db } = await import('@repo/db')
    const { compare } = await import('bcryptjs')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'user-123',
      password: 'stored_hashed_password',
    } as never)
    vi.mocked(compare).mockResolvedValueOnce(false as never)

    const result = await changeUserPassword('user-123', 'wrongPass123', 'newPass123')
    expect(result).toEqual({ success: false, error: PROFILE_ERROR_CODES.CURRENT_PASSWORD_INCORRECT })
    expect(db.user.update).not.toHaveBeenCalled()
  })

  it('hashes and updates password when current password matches', async () => {
    const { db } = await import('@repo/db')
    const { compare, hash } = await import('bcryptjs')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'user-123',
      password: 'stored_hashed_password',
    } as never)
    vi.mocked(compare).mockResolvedValueOnce(true as never)
    vi.mocked(db.user.update).mockResolvedValueOnce({} as never)

    const result = await changeUserPassword('user-123', 'correctPass123', 'superSecurePass123')
    expect(result).toEqual({ success: true, data: undefined })
    expect(hash).toHaveBeenCalledWith('superSecurePass123', 12)
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { password: 'new_hashed_password_xyz789' },
    })
  })
})
