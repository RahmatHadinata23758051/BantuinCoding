'use client'

import { Link, useRouter } from '@/i18n/routing'
import { useState } from 'react'

import { registerAction } from '@/lib/auth/actions'

import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'

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
      const errorKey = result.error === 'Invalid email address'
        ? 'invalidEmail'
        : result.error === 'Password must be at least 8 characters'
          ? 'passwordTooShort'
          : result.error === 'Password too long'
            ? 'passwordTooLong'
            : result.error === 'Name is required'
              ? 'nameRequired'
              : result.error === 'Invalid input'
                ? 'invalidInput'
                : result.error === 'An account with this email already exists'
                  ? 'duplicateAccount'
                  : 'registrationFailed'
      setError(t(errorKey))
      setLoading(false)
    } else {
      router.push('/login?registered=1')
    }
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] px-5 py-5 text-[var(--ink)] sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-6xl flex-col sm:min-h-[calc(100svh-4rem)]">
        <header className="flex items-center justify-between border-b border-[var(--ink)]/15 pb-4">
          <Link href="/" className="min-h-11 inline-flex items-center text-sm font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4">
            bantuin.dev <span className="ml-2 text-[var(--paper-muted)]">/ {t('accessLabel')}</span>
          </Link>
          <LanguageSwitcher />
        </header>

        <div className="grid flex-1 content-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-16">
          <section className="flex flex-col justify-between gap-10 lg:py-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--paper-muted)]">{t('registerCaption')}</p>
              <h1 className="mt-6 max-w-xl text-4xl font-medium leading-[1.08] tracking-[-0.04em] sm:text-5xl">{t('oneAccount')}</h1>
              <p className="mt-5 max-w-md text-base leading-7 text-[var(--ink-soft)]">{t('oneAccountDesc')}</p>
            </div>

            <dl className="grid max-w-lg gap-5 border-t border-[var(--ink)]/15 pt-5 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--paper-muted)]">01 — {t('bringOwnKey')}</dt>
                <dd className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{t('bringOwnKeyDesc')}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--paper-muted)]">02 — {t('leavePack')}</dt>
                <dd className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{t('leavePackDesc')}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="register-title" className="w-full max-w-xl lg:ml-auto lg:border-l lg:border-[var(--ink)]/15 lg:pl-12">
            <div className="mb-8 flex items-start justify-between gap-4 border-b border-[var(--ink)]/15 pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--paper-muted)]">bantuin.dev / 02</p>
                <h2 id="register-title" className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">{t('createAccountTitle')}</h2>
              </div>
              <span className="pt-1 text-xs text-[var(--paper-muted)]">{t('newMember')}</span>
            </div>

            {error && (
              <div role="alert" className="mb-6 border-l-2 border-[var(--action-red)] py-1 pl-3 text-sm leading-6 text-[var(--ink)]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6" aria-busy={loading}>
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium">{t('nameOptional')}</label>
                <input id="name" name="name" type="text" autoComplete="name" placeholder={t('namePlaceholder')} className="min-h-12 w-full border-b border-[var(--ink)]/30 bg-transparent px-0 py-3 text-base placeholder:text-[var(--paper-muted)] focus:border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--paper)]" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">{t('emailLabel')}</label>
                <input id="email" name="email" type="email" required autoComplete="email" placeholder={t('emailPlaceholder')} className="min-h-12 w-full border-b border-[var(--ink)]/30 bg-transparent px-0 py-3 text-base placeholder:text-[var(--paper-muted)] focus:border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--paper)]" />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium">{t('passwordLabel')}</label>
                <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder={t('passwordPlaceholder')} className="min-h-12 w-full border-b border-[var(--ink)]/30 bg-transparent px-0 py-3 text-base placeholder:text-[var(--paper-muted)] focus:border-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--paper)]" />
              </div>

              <button type="submit" disabled={loading} className="mt-2 inline-flex min-h-12 items-center justify-between border-t border-b border-[var(--ink)] py-3 text-left text-sm font-semibold transition-colors motion-reduce:transition-none hover:text-[var(--paper-muted)] focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-60">
                {loading ? tCommon('loading') : t('submitRegisterBtn')}
                <span aria-hidden="true">↗</span>
              </button>
            </form>

            <p className="mt-7 text-sm leading-6 text-[var(--ink-soft)]">
              <Link href="/login" className="font-medium text-[var(--ink)] underline decoration-[var(--ink)]/40 underline-offset-4 hover:decoration-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2">{t('haveAccount')}</Link>
            </p>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ink)]/15 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--paper-muted)]">
          <span>{t('secureSession')}</span><span>02 — {t('submitRegisterBtn')}</span>
        </footer>
      </div>
    </main>
  )
}
