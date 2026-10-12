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
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-12 text-[#24231f] sm:px-6">
      <section role="alert" className="mx-auto max-w-xl rounded-2xl border border-[#dedbd5] bg-[#fffdfa] p-6 sm:p-8">
        <p className="font-mono text-[10px] tracking-[0.1em] text-[#a66142]">{t('workspaceLabel')}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">{t('errorTitle')}</h1>
        <p className="mt-2 text-sm leading-6 text-[#706b64]">{t('errorDesc')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="rounded-full bg-[#a85e3c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">
            {t('retryDashboard')}
          </button>
          <Link href="/" className="rounded-full border border-[#dedbd5] bg-[#fffdfa] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0ece6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
            {tCommon('backToHome')}
          </Link>
        </div>
      </section>
    </main>
  )
}
