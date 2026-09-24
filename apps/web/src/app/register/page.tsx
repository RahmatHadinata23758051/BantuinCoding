'use client'

import { useState } from 'react'
import { registerAction } from '@/lib/auth/actions'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await registerAction(formData)

    if (!result.success) {
      setError(result.error ?? 'Registration failed')
      setLoading(false)
    } else {
      router.push('/login?registered=1')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-mono">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="mb-6">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">
            BantuinCoding
          </span>
          <h1 className="mt-1 text-lg font-semibold text-zinc-50">Create account</h1>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="name"
              className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <a href="/login" className="text-zinc-300 hover:text-zinc-100 underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
