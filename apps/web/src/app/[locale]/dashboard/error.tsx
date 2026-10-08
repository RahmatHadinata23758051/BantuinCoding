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
    <main className="min-h-screen bg-[#f6f5f4] px-4 py-12 text-[#111111] sm:px-6">
      <section role="alert" className="mx-auto max-w-xl rounded-xl border border-black/[0.08] bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#757575]">{t('workspaceLabel')}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t('errorTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-[#757575]">{t('errorDesc')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-lg bg-[#0075de] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#005fb5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]">
            {t('retryDashboard')}
          </button>
          <Link href="/" className="rounded-lg border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium hover:bg-[#f6f5f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]">
            {tCommon('backToHome')}
          </Link>
        </div>
      </section>
    </main>
  )
}
