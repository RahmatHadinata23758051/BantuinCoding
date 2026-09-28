import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { db } from '@repo/db'

// ============================================================
// Auth.js v5 (next-auth 5.0.0-beta) configuration
// Strategy: email + password for MVP
// ============================================================

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be configured in production')
  }

  return 'development-only-auth-secret-do-not-use-in-production'
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getAuthSecret(),
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const email = parsed.data.email.toLowerCase().trim()
        const { password } = parsed.data

        const user = await db.user.findUnique({ where: { email } })
        if (!user || !user.password) return null

        const isValid = await compare(password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
