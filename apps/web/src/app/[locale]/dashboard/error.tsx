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
    <main className="min-h-screen bg-[#f7f6f3] text-[#24231f]">
      <header className="border-b border-[#dedbd5] bg-[#fffdfa] px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-block rounded px-1 py-1 text-[18px] font-bold tracking-[-0.07em] text-[#24231f] transition-colors hover:text-[#a66142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
          bantuin<span className="font-serif font-normal text-[#a66142]">.</span>
        </Link>
      </header>
      <section role="alert" className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-3xl items-start px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="w-full rounded-xl border border-[#dedbd5] bg-[#fffdfa] p-6 sm:p-8">
          <p className="font-mono text-[10px] tracking-[0.1em] text-[#a66142]">{t('errorCaption')}</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">{t('errorTitle')}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#706b64]">{t('errorDesc')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="rounded-full bg-[#a85e3c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">
              {t('retryDashboard')}
            </button>
            <Link href="/" className="rounded-full border border-[#dedbd5] bg-[#fffdfa] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0ece6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
              {tCommon('backToHome')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
