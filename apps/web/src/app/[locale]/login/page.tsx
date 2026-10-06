'use client'

import { ArrowRight, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { loginAction } from '@/lib/auth/actions'

import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { Button, Caption, Input, Panel, StatusBadge } from '@/app/components/ui'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageContent registered={false} />}>
      <RegisteredLoginPage />
    </Suspense>
  )
}

function RegisteredLoginPage() {
  const searchParams = useSearchParams()

  return <LoginPageContent registered={searchParams.get('registered') === '1'} />
}

function LoginPageContent({ registered }: { registered: boolean }) {
  const t = useTranslations('Auth')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await loginAction(formData)

    if (!result.success) {
      setError(result.error ?? 'Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 text-[var(--ink)] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hero)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="flex flex-col justify-between gap-8 border-b-2 border-[var(--ink)] bg-[var(--cobalt)] p-6 text-white sm:p-9 lg:border-b-0 lg:border-r-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-mono text-xs font-bold underline underline-offset-4">
              ← bantuin.dev
            </Link>
            <LanguageSwitcher />
          </div>
          <div>
            <div className="mt-10">
              <Caption className="bg-[var(--electric-yellow)] text-[var(--ink)]">
                {t('loginCaption')}
              </Caption>
              <h1 className="mt-6 max-w-lg text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl">
                {t('loginHeading')}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/85">
                {t('loginDesc')}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 border-2 border-[var(--ink)] bg-[var(--paper-raised)] p-4 text-[var(--ink)] shadow-[var(--shadow-sm)]">
              <KeyRound className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
              <div>
                <p className="text-sm font-black">{t('yourModelKey')}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--paper-muted)]">
                  {t('yourModelKeyDesc')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-2 border-[var(--ink)] bg-[var(--mint)] p-4 text-[var(--ink)] shadow-[var(--shadow-sm)]">
              <ShieldCheck className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
              <div>
                <p className="text-sm font-black">{t('safeExport')}</p>
                <p className="mt-1 text-xs leading-5">
                  {t('safeExportDesc')}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center bg-[var(--paper)] p-5 sm:p-9">
          <Panel className="w-full max-w-md overflow-hidden">
            <div className="border-b-2 border-[var(--ink)] bg-[var(--electric-yellow)] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <StatusBadge tone="neutral">{t('memberAccess')}</StatusBadge>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">{t('signInTitle')}</h2>
                </div>
                <span className="font-mono text-xs font-black">01 / 01</span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {registered && !error && (
                <div
                  role="status"
                  className="mb-5 flex items-start gap-3 border-2 border-[var(--ink)] bg-[var(--mint-dim)] p-3 shadow-[var(--shadow-xs)]"
                >
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                  <p className="text-sm font-bold">
                    {t('accountCreated')}
                  </p>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mb-5 border-2 border-[var(--ink)] bg-[var(--action-red-dim)] p-3 text-sm font-bold text-[var(--ink)] shadow-[var(--shadow-xs)]"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={loading}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-black">
                    {t('emailLabel')}
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
                    {t('passwordLabel')}
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="At least 8 characters"
                  />
                </div>

                <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
                  {loading ? tCommon('loading') : t('submitLoginBtn')}
                  {!loading && <ArrowRight size={18} aria-hidden="true" />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[var(--paper-muted)]">
                <Link href="/register" className="font-black text-[var(--ink)] underline decoration-2 underline-offset-4">
                  {t('needAccount')}
                </Link>
              </p>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  )
}
