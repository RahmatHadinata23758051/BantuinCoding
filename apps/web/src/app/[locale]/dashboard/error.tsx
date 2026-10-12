'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { BrandLogo } from '@/app/components/BrandLogo'

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
      <div className="mx-3 flex min-h-[60px] items-center rounded-2xl border border-white/80 bg-[#f7f6f3]/85 px-4 shadow-[0_12px_30px_rgba(36,35,31,0.08)] sm:mx-5 sm:min-h-[64px] sm:rounded-full sm:px-5">
        <Link href="/" className="rounded-full px-1 py-1 text-[#24231f] transition-colors hover:text-[#a66142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]"><BrandLogo imageSize={30} textClassName="text-[19px] font-bold tracking-[-0.07em]" /></Link>
      </div>
      <section role="alert" className="mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-3xl items-start px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="w-full rounded-[24px] border border-[#dedbd5] bg-[#fffdfa] p-6 shadow-[0_16px_35px_rgba(36,35,31,0.06)] sm:p-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a66142]">{t('errorCaption')}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">{t('errorTitle')}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#706b64]">{t('errorDesc')}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="rounded-full bg-[#a85e3c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('retryDashboard')}</button>
            <Link href="/" className="rounded-full border border-[#dedbd5] bg-[#fffdfa] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#f0ece6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{tCommon('backToHome')}</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
