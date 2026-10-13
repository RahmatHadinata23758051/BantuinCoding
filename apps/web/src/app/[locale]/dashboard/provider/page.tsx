import { ArrowRight, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'

import { BrandLogo } from '@/app/components/BrandLogo'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { PageFrame, TopBar } from '@/app/components/ui'
import { auth } from '@/lib/auth'

export default async function ProviderSettingsPage() {
  const t = await getTranslations('ProviderDesk')
  const tNew = await getTranslations('NewProject')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const breadcrumbRaw = t('breadcrumb')
  const breadcrumbText = breadcrumbRaw.startsWith('/') ? breadcrumbRaw.slice(1).trim() : breadcrumbRaw

  return (
    <PageFrame
      width="6xl"
      className="bg-[var(--color-paper-warmth)] py-4 sm:py-6"
      contentClassName="overflow-hidden border-[var(--border-subtle)] bg-[var(--color-pure-white)]"
    >
      <TopBar className="bg-[var(--color-pure-white)] px-4 py-3.5 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            aria-label={tNew('backDashboard')}
            className="shrink-0 rounded-full text-[var(--color-ink-black)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-sun-orange)]"
          >
            <BrandLogo imageSize={26} textClassName="text-[17px] font-bold tracking-[-0.07em]" />
          </Link>
          <span aria-hidden="true" className="h-5 w-px bg-[var(--border-subtle)]" />
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium sm:text-sm">
            <Link href="/dashboard" className="truncate text-[var(--color-body-text)] transition-colors hover:text-[var(--color-ink-black)]">
              {tNew('backDashboard')}
            </Link>
            <span aria-hidden="true" className="text-[var(--color-faint-text)]">/</span>
            <span className="truncate font-semibold text-[var(--color-ink-black)]">{breadcrumbText}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <span className="hidden max-w-56 truncate text-xs text-[var(--color-body-text)] sm:inline">{session.user.email}</span>
          <LanguageSwitcher />
        </div>
      </TopBar>

      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-7 sm:pb-16 sm:pt-12 lg:px-10 lg:pt-14">
        <header className="grid gap-6 border-b border-[var(--border-subtle)] pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,21rem)] lg:items-end lg:gap-12">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--workspace-primary,#a85e3c)]">
              {t('caption')}
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.07em] text-[var(--color-ink-black)] sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 max-w-2xl font-[var(--font-lyon-text)] text-base leading-7 text-[var(--color-body-text)] sm:text-lg sm:leading-8">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-start gap-3 border-l-2 border-[var(--color-sun-orange)] pl-4 text-sm leading-6 text-[var(--color-body-text)] lg:mb-1">
            <ShieldCheck className="mt-0.5 shrink-0 text-[var(--workspace-primary,#a85e3c)]" size={18} aria-hidden="true" />
            <div>
              <p className="font-semibold text-[var(--color-ink-black)]">{t('sessionOnly')}</p>
              <p className="mt-0.5 font-[var(--font-lyon-text)]">{t('securityNote')}</p>
            </div>
          </div>
        </header>

        <section aria-labelledby="provider-connection-heading" className="mt-8 overflow-hidden rounded-[var(--radius-cards)] border border-[var(--border-subtle)] bg-[var(--color-pure-white)]">
          <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-body-text)]">{t('deskLabel')}</p>
              <h2 id="provider-connection-heading" className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-[var(--color-ink-black)] sm:text-3xl">
                {t('aiProvider')}
              </h2>
              <p className="mt-2 max-w-xl font-[var(--font-lyon-text)] text-sm leading-6 text-[var(--color-body-text)] sm:text-base">
                {t('aiProviderDesc')}
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-[var(--border-subtle)] bg-[var(--color-paper-warmth)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-body-text)]">
              {t('sessionOnly')}
            </span>
          </div>

          <div className="p-3 sm:p-5 lg:p-7">
            <ProviderSetupPanel />
          </div>

          <aside className="flex items-start gap-3 border-t border-[var(--border-subtle)] bg-[var(--color-paper-warmth)] px-5 py-4 sm:px-7" aria-label={t('securityNote')}>
            <ShieldCheck className="mt-0.5 shrink-0 text-[var(--workspace-primary,#a85e3c)]" size={18} aria-hidden="true" />
            <div className="max-w-3xl">
              <p className="text-xs font-semibold text-[var(--color-ink-black)]">{t('securityNote')}</p>
              <p className="mt-1 font-[var(--font-lyon-text)] text-xs leading-5 text-[var(--color-body-text)] sm:text-sm sm:leading-6">
                {t('securityNoteDesc')}
              </p>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-4 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 font-semibold text-[var(--color-body-text)] underline decoration-[var(--border-subtle)] underline-offset-4 transition-colors hover:text-[var(--color-ink-black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sun-orange)] focus-visible:ring-offset-2"
          >
            {tNew('backDashboard')}
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--workspace-primary,#a85e3c)] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sun-orange)] focus-visible:ring-offset-2"
          >
            {t('captureIdea')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </footer>
      </main>
    </PageFrame>
  )
}
