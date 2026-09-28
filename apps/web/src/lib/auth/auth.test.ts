import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ============================================================
// Auth logic tests — no live DB, bcryptjs mocked
// Tests target register.ts (pure logic, no 'use server')
// and loginAction (thin wrapper around next-auth signIn)
// ============================================================

vi.mock('@repo/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password_abc123'),
  compare: vi.fn().mockResolvedValue(true),
}))

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
  })),
}))

vi.mock('@/lib/auth', () => ({
  signIn: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn(),
  auth: vi.fn(),
  handlers: {},
}))

vi.mock('@/lib/byok/session-store', () => ({
  clearProviderSession: vi.fn(),
}))

// ============================================================
// Schema tests
// ============================================================

describe('Auth — input validation schemas', () => {
  const LoginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })

  const RegisterSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100).optional(),
  })

  it('LoginSchema: rejects invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('Invalid email')
  })

  it('LoginSchema: rejects short password', () => {
    const result = LoginSchema.safeParse({ email: 'a@b.com', password: '1234567' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('at least 8 characters')
  })

  it('LoginSchema: accepts valid credentials', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: 'securepass' })
    expect(result.success).toBe(true)
  })

  it('RegisterSchema: accepts valid data with name', () => {
    const result = RegisterSchema.safeParse({
      email: 'dev@bantuin.com',
      password: 'securepass123',
      name: 'Rahmat',
    })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Rahmat')
  })

  it('RegisterSchema: name is optional', () => {
    const result = RegisterSchema.safeParse({
      email: 'dev@bantuin.com',
      password: 'securepass123',
    })
    expect(result.success).toBe(true)
    expect(result.data?.name).toBeUndefined()
  })

  it('RegisterSchema: rejects password over 128 chars', () => {
    const result = RegisterSchema.safeParse({
      email: 'dev@bantuin.com',
      password: 'a'.repeat(129),
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// registerUser logic tests (no 'use server')
// ============================================================

describe('Auth — registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when email already exists', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: 'existing-id',
      email: 'taken@example.com',
      password: 'hash',
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { registerUser } = await import('@/lib/auth/register')
    const result = await registerUser({ email: 'taken@example.com', password: 'password123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('already exists')
    }
  })

  it('returns error for invalid email input', async () => {
    const { registerUser } = await import('@/lib/auth/register')
    const result = await registerUser({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('creates user and returns success when input is valid', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(db.user.create).mockResolvedValueOnce({
      id: 'new-id',
      email: 'new@example.com',
      password: 'hashed_password_abc123',
      name: 'Dev',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { registerUser } = await import('@/lib/auth/register')
    const result = await registerUser({
      email: 'new@example.com',
      password: 'securepass123',
      name: 'Dev',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('new@example.com')
    }
  })

  it('hashes password before storing (cost factor 12)', async () => {
    const { db } = await import('@repo/db')
    const { hash } = await import('bcryptjs')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(db.user.create).mockResolvedValueOnce({
      id: 'new-id',
      email: 'new@example.com',
      password: 'hashed',
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { registerUser } = await import('@/lib/auth/register')
    await registerUser({ email: 'new@example.com', password: 'securepass123' })
    expect(hash).toHaveBeenCalledWith('securepass123', 12)
  })

  it('never stores raw password', async () => {
    const { db } = await import('@repo/db')
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(db.user.create).mockResolvedValueOnce({
      id: 'new-id',
      email: 'new@example.com',
      password: 'hashed_password_abc123',
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const { registerUser } = await import('@/lib/auth/register')
    await registerUser({ email: 'new@example.com', password: 'plaintext_secret' })

    const createCall = vi.mocked(db.user.create).mock.calls[0]?.[0]
    expect(createCall?.data?.password).not.toBe('plaintext_secret')
    expect(createCall?.data?.password).toBe('hashed_password_abc123')
  })
})

// ============================================================
// loginAction tests (thin 'use server' wrapper — test behavior only)
// ============================================================

describe('Auth — loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when email or password is missing', async () => {
    const { loginAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('email', '')
    // no password set

    const result = await loginAction(fd)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
  })

  it('returns success when signIn resolves', async () => {
    const { signIn } = await import('@/lib/auth')
    vi.mocked(signIn).mockResolvedValueOnce(undefined as never)

    const { loginAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'validpass123')

    const result = await loginAction(fd)
    expect(result.success).toBe(true)
  })

  it('returns error when signIn throws', async () => {
    const { signIn } = await import('@/lib/auth')
    vi.mocked(signIn).mockRejectedValueOnce(new Error('CredentialsSignin'))

    const { loginAction } = await import('@/lib/auth/actions')
    const fd = new FormData()
    fd.set('email', 'user@example.com')
    fd.set('password', 'wrongpass123')

    const result = await loginAction(fd)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid email or password')
    }
  })

  it('clears the provider session before signing out', async () => {
    const { auth, signOut } = await import('@/lib/auth')
    const { clearProviderSession } = await import('@/lib/byok/session-store')
    vi.mocked(auth as unknown as () => Promise<unknown>).mockResolvedValueOnce({
      user: { id: 'user-1', email: 'user@example.com' },
      expires: '2099-01-01T00:00:00.000Z',
    })

    const { logoutAction } = await import('@/lib/auth/actions')
    await logoutAction()

    expect(clearProviderSession).toHaveBeenCalledWith('user-1')
    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/login' })
  })
})
