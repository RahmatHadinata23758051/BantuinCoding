'use client'

import { ArrowRight, FileArchive, KeyRound, UserRoundPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { registerAction } from '@/lib/auth/actions'

import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { Button, Caption, Input, Panel, StatusBadge } from '@/app/components/ui'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await registerAction(formData)

    if (!result.success) {
      setError(result.error ?? 'Registration failed')
      setLoading(false)
    } else {
      router.push('/login?registered=1')
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 text-[var(--ink)] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hero)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="order-2 flex items-center justify-center bg-[var(--paper)] p-5 sm:p-9 lg:order-1">
          <Panel className="w-full max-w-md overflow-hidden">
            <div className="border-b-2 border-[var(--ink)] bg-[var(--punch-pink)] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <StatusBadge tone="neutral">new builder</StatusBadge>
                  <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Create account</h1>
                </div>
                <UserRoundPlus aria-hidden="true" size={30} strokeWidth={2.5} />
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {error && (
                <div
                  role="alert"
                  className="mb-5 border-2 border-[var(--ink)] bg-[var(--action-red-dim)] p-3 text-sm font-bold shadow-[var(--shadow-xs)]"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={loading}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-black">
                    Name <span className="font-normal text-[var(--paper-muted)]">(optional)</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="How should we address you?"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-black">
                    Email address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-black">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                </div>

                <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
                  {loading ? 'Creating account…' : 'Create account'}
                  {!loading && <ArrowRight size={18} aria-hidden="true" />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[var(--paper-muted)]">
                Already registered?{' '}
                <Link href="/login" className="font-black text-[var(--ink)] underline decoration-2 underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>
          </Panel>
        </section>

        <aside className="order-1 flex flex-col justify-between gap-8 border-b-2 border-[var(--ink)] bg-[var(--lavender)] p-6 sm:p-9 lg:order-2 lg:border-b-0 lg:border-l-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-mono text-xs font-bold underline underline-offset-4">
              ← bantuin.dev
            </Link>
            <LanguageSwitcher />
          </div>
          <div>
            <div className="mt-10">
              <Caption>Open a new project file</Caption>
              <h2 className="mt-6 max-w-lg text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
                One account. Your models. Better project context.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-[var(--ink-soft)]">
                Sign up to build documentation packs. Provider access is configured separately,
                so the application never bundles a hidden model subscription.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="border-2 border-[var(--ink)] bg-[var(--electric-yellow)] p-4 shadow-[var(--shadow-sm)]">
              <KeyRound className="mb-3" size={22} aria-hidden="true" />
              <p className="text-sm font-black">Bring your own API key</p>
              <p className="mt-1 text-xs leading-5">Anthropic, OpenAI, Gemini, or OpenRouter.</p>
            </div>
            <div className="border-2 border-[var(--ink)] bg-[var(--mint)] p-4 shadow-[var(--shadow-sm)]">
              <FileArchive className="mb-3" size={22} aria-hidden="true" />
              <p className="text-sm font-black">Leave with a usable pack</p>
              <p className="mt-1 text-xs leading-5">Readable Markdown, explicit decisions, safe ZIP export.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
