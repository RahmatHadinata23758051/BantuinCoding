'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Link } from '@/i18n/routing'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Dashboard')
  const tCommon = useTranslations('Common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-12 text-[var(--ink)] sm:px-6">
      <section role="alert" className="mx-auto max-w-xl rounded-xl border border-[var(--ink)]/10 bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--paper-muted)]">{t('workspaceLabel')}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t('errorTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--paper-muted)]">{t('errorDesc')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-lg bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cobalt)]">
            {t('retryDashboard')}
          </button>
          <Link href="/" className="rounded-lg border border-[var(--ink)]/15 bg-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--lavender)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cobalt)]">
            {tCommon('backToHome')}
          </Link>
        </div>
      </section>
    </main>
  )
}
