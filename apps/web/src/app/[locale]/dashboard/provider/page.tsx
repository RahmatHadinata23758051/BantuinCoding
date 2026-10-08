import { KeyRound, ShieldCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { Caption, Panel, PageFrame, TopBar, buttonClassName } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

export default async function ProviderSettingsPage() {
  const t = await getTranslations('ProviderDesk')
  const tNew = await getTranslations('NewProject')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <PageFrame width="5xl">
      <TopBar>
        <div className="flex items-center gap-2 font-mono text-xs font-black sm:text-sm">
          <Link href="/dashboard" className="underline decoration-2 underline-offset-4">
            {tNew('backDashboard')}
          </Link>
          <span>{t('breadcrumb')}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-56 truncate font-mono text-xs font-bold sm:inline">{session.user.email}</span>
          <LanguageSwitcher />
        </div>
      </TopBar>

      <section className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="border-b-2 border-[var(--ink)] bg-[var(--cobalt)] p-6 text-white sm:p-8 lg:border-b-0 lg:border-r-2">
            <Caption className="bg-[var(--electric-yellow)] text-[var(--ink)]">{t('caption')}</Caption>
            <h1 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.06em]">
              {t('title')}
            </h1>
            <p className="mt-5 text-sm leading-6 text-white/85">
              {t('subtitle')}
            </p>
            <Link
              href="/projects/new"
              className={buttonClassName({ variant: 'secondary', size: 'lg', className: 'mt-8' })}
            >
              {t('captureIdea')}
            </Link>
          </aside>

          <div className="bg-[var(--paper)] p-5 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center border-2 border-[var(--ink)] bg-[var(--mint)] shadow-[var(--shadow-sm)]">
                <KeyRound size={24} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">{t('aiProvider')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--paper-muted)]">
                  {t('aiProviderDesc')}
                </p>
              </div>
            </div>

            <ProviderSetupPanel />

            <Panel raised={false} className="mt-6 p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--pass-teal)]" size={20} aria-hidden="true" />
                <div>
                  <p className="font-mono text-xs font-black">{t('securityNote')}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--paper-muted)]">
                    {t('securityNoteDesc')}
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </section>
    </PageFrame>
  )
}
