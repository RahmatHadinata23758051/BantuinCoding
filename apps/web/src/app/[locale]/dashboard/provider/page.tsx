import { ShieldCheck } from 'lucide-react'
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

      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-7 sm:pb-16 sm:pt-7 lg:px-10 lg:pt-7">
        <header className="flex flex-col gap-6 pb-0 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--workspace-primary,#a85e3c)]">
              {t('caption')}
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-[0.98] tracking-[-0.07em] text-[var(--color-ink-black)] sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 max-w-2xl font-[var(--font-lyon-text)] text-base leading-7 text-[var(--color-body-text)] sm:text-lg sm:leading-8">
              {t('subtitle')}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--color-pure-white)] px-3.5 py-2 text-xs font-medium text-[var(--color-body-text)] shadow-[0_1px_0_rgba(18,18,18,0.03)]">
            <ShieldCheck size={15} className="shrink-0 text-[var(--workspace-primary,#a85e3c)]" aria-hidden="true" />
            <span>{t('securityPill')}</span>
          </div>
        </header>

        <section aria-labelledby="provider-connection-heading" className="mt-6">
          <h2 id="provider-connection-heading" className="sr-only">{t('aiProvider')}</h2>
          <ProviderSetupPanel />
        </section>
      </main>
    </PageFrame>
  )
}
