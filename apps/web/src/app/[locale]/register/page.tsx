'use client'

import { ArrowRight, FileArchive, KeyRound } from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { useState } from 'react'

import { registerAction } from '@/lib/auth/actions'

import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { Button, Caption, Input, Panel, StatusBadge } from '@/app/components/ui'

export default function RegisterPage() {
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
    const result = await registerAction(formData)

    if (!result.success) {
      setError(result.error ?? t('registrationFailed'))
      setLoading(false)
    } else {
      router.push('/login?registered=1')
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f5f4] px-5 py-6 text-[#111111] sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between pb-12">
          <Link href="/" className="text-sm font-semibold tracking-[-0.01em] text-[#111111]">bantuin.dev</Link>
          <LanguageSwitcher />
        </header>
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <section className="order-2 flex justify-center lg:order-1 lg:justify-start">
            <Panel className="w-full max-w-md overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-none">
              <div className="border-b border-black/[0.08] px-6 py-6">
                <StatusBadge tone="neutral">{t('newMember')}</StatusBadge>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{t('createAccountTitle')}</h1>
              </div>
              <div className="p-6">
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
                  <label htmlFor="name" className="text-sm font-medium">
                    {t('nameOptional')}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder={t('namePlaceholder')}
                  />
                </div>

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
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={t('passwordPlaceholder')}
                  />
                </div>

                <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
                  {loading ? tCommon('loading') : t('submitRegisterBtn')}
                  {!loading && <ArrowRight size={18} aria-hidden="true" />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[#757575]">
                <Link href="/login" className="font-medium text-[#0075de] hover:underline">
                  {t('haveAccount')}
                </Link>
              </p>
            </div>
          </Panel>
        </section>

        <aside className="order-1 flex flex-col justify-center gap-8 lg:order-2">
          <div>
            <Caption className="text-[#757575]">{t('openNewProject')}</Caption>
            <h2 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">{t('oneAccount')}</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#615d59]">{t('oneAccountDesc')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-black/[0.08] bg-[#ffb110] p-4">
              <KeyRound className="mb-3" size={20} aria-hidden="true" />
              <p className="text-sm font-semibold">{t('bringOwnKey')}</p>
              <p className="mt-1 text-sm leading-6">{t('bringOwnKeyDesc')}</p>
            </div>
            <div className="rounded-xl border border-black/[0.08] bg-white p-4">
              <FileArchive className="mb-3 text-[#0075de]" size={20} aria-hidden="true" />
              <p className="text-sm font-semibold">{t('leavePack')}</p>
              <p className="mt-1 text-sm leading-6 text-[#757575]">{t('leavePackDesc')}</p>
            </div>
          </div>
        </aside>
        </div>
      </div>
    </main>
  )
}
