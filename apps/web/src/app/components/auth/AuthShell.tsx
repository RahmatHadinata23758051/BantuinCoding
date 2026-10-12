'use client'

import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { AuthVisualPanel } from '@/app/components/auth/AuthVisualPanel'
import { BrandLogo } from '@/app/components/BrandLogo'

export function AuthShell({
  children,
  routeKey,
}: {
  children: ReactNode
  routeKey: 'login' | 'register'
}) {
  const t = useTranslations('Auth')
  const isRegister = routeKey === 'register'

  const formPanel = (
    <section
      className="auth-form-panel flex min-h-0 flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-12 lg:py-14 xl:px-20"
      aria-label={t('formPanelAriaLabel')}
    >
      <div className="w-full max-w-[430px]">
        <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
          <Link href="/" className="shrink-0 rounded-full text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4a261]"><BrandLogo imageSize={28} textClassName="text-[18px] font-bold tracking-[-0.07em]" /></Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#dedbd5] bg-white/70 px-2.5 text-[11px] font-semibold text-[#24231f] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdfa]">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>{t('backToLanding')}</span>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
        <div className="rounded-[24px] border border-[#dedbd5] bg-[#fffdfa] p-5 shadow-[0_18px_55px_rgba(36,35,31,0.08)] sm:p-7 lg:p-8">
          <div className="mb-5 flex justify-center" aria-hidden="true">
            <BrandLogo imageSize={40} showWordmark={false} />
          </div>
          <div>{children}</div>
        </div>
      </div>
    </section>
  )

  const visualPanel = (
    <div className="auth-visual-panel min-h-0 flex-1 px-3 pb-3 sm:px-5 sm:pb-5 lg:h-full lg:px-4 lg:py-4">
      <AuthVisualPanel
        labels={{
          ariaLabel: t('visualAriaLabel'),
          eyebrow: t('visualEyebrow'),
          title: t('visualTitle'),
          copy: t('visualCopy'),
          idea: t('visualIdea'),
          context: t('visualContext'),
          agent: t('visualAgent'),
        }}
      />
    </div>
  )

  return (
    <main className="auth-fade-in min-h-dvh overflow-x-clip bg-[#f7f6f3] text-[#24231f] selection:bg-[#f4a261] selection:text-[#24231f] lg:h-dvh lg:overflow-hidden">
      <div className="hidden items-center justify-between px-7 pt-6 lg:flex xl:px-10">
        <Link href="/" className="rounded-full text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4a261]"><BrandLogo imageSize={30} textClassName="text-[19px] font-bold tracking-[-0.07em]" /></Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#dedbd5] bg-white/70 px-3 text-xs font-semibold text-[#24231f] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]">
            <ArrowLeft size={14} aria-hidden="true" />
            <span>{t('backToLanding')}</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="flex flex-col lg:h-[calc(100dvh-76px)] lg:flex-row">
        {isRegister ? visualPanel : formPanel}
        {isRegister ? formPanel : visualPanel}
      </div>
      <footer className="px-5 pb-4 text-center text-[10px] leading-4 text-[#8a8178] lg:hidden">
        {t('legalNotice')}{' '}
        <Link href="/" className="underline decoration-[#c9c4bc] underline-offset-4">{t('termsLink')}</Link>{' '}
        {t('andLabel')}{' '}
        <Link href="/" className="underline decoration-[#c9c4bc] underline-offset-4">{t('privacyLink')}</Link>
      </footer>
    </main>
  )
}
