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
      setError(result.error ?? t('invalidCredentials'))
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f5f4] px-5 py-6 text-[#111111] sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between pb-12">
          <Link href="/" className="text-sm font-semibold tracking-[-0.01em] text-[#111111]">
            bantuin.dev
          </Link>
          <LanguageSwitcher />
        </header>
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <aside className="max-w-md">
            <Caption className="text-[#757575]">{t('loginCaption')}</Caption>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">{t('loginHeading')}</h1>
            <p className="mt-5 text-base leading-7 text-[#615d59]">{t('loginDesc')}</p>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-black/[0.08] bg-white p-4">
                <KeyRound className="mb-3 text-[#0075de]" size={20} aria-hidden="true" />
                <p className="text-sm font-semibold">{t('yourModelKey')}</p>
                <p className="mt-1 text-sm leading-6 text-[#757575]">{t('yourModelKeyDesc')}</p>
              </div>
              <div className="rounded-xl border border-black/[0.08] bg-[#e6f3fe] p-4">
                <ShieldCheck className="mb-3 text-[#0075de]" size={20} aria-hidden="true" />
                <p className="text-sm font-semibold">{t('safeExport')}</p>
                <p className="mt-1 text-sm leading-6 text-[#615d59]">{t('safeExportDesc')}</p>
              </div>
            </div>
          </aside>
          <section className="flex justify-center lg:justify-end">
            <Panel className="w-full max-w-md overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-none">
              <div className="border-b border-black/[0.08] px-6 py-6">
                <StatusBadge tone="neutral">{t('memberAccess')}</StatusBadge>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{t('signInTitle')}</h2>
              </div>
              <div className="p-6">
              {registered && !error && (
                <div
                  role="status"
                  className="mb-5 flex items-start gap-3 rounded-lg border border-black/[0.08] bg-[#e6f3fe] p-3 text-sm"
                >
                  <CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                  <p className="text-sm font-medium">
                    {t('accountCreated')}
                  </p>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-[#f64932]/25 bg-[#fff1ee] p-3 text-sm font-medium text-[#8f2416]"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={loading}>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    {t('emailLabel')}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    {t('passwordLabel')}
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder={t('passwordPlaceholder')}
                  />
                </div>

                <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
                  {loading ? tCommon('loading') : t('submitLoginBtn')}
                  {!loading && <ArrowRight size={18} aria-hidden="true" />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[#757575]">
                <Link href="/register" className="font-medium text-[#0075de] hover:underline">
                  {t('needAccount')}
                </Link>
              </p>
            </div>
          </Panel>
        </section>
        </div>
      </div>
    </main>
  )
}
