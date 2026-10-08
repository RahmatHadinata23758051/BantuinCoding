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
          <span className="max-w-56 truncate font-mono text-xs font-bold">{session.user.email}</span>
          <LanguageSwitcher />
        </div>
      </TopBar>

      <section className="rounded-xl border border-black/10 bg-white p-6 sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <aside>
            <Caption className="rounded-full bg-[#ffb110] px-3 py-1 text-black">{t('caption')}</Caption>
            <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-[-0.04em] text-black sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-[#615d59]">{t('subtitle')}</p>
            <Link href="/projects/new" className={buttonClassName({ variant: 'primary', size: 'md', className: 'mt-6 rounded-lg' })}>
              Capture a project idea
            </Link>
          </aside>

          <div>
            <div className="mb-6 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e6f3fe] text-[#0075de]">
                <KeyRound size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">{t('aiProvider')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#615d59]">{t('aiProviderDesc')}</p>
              </div>
            </div>

            <ProviderSetupPanel />

            <Panel raised={false} className="mt-5 rounded-xl border border-black/10 bg-[#f6f5f4] p-4 shadow-none">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[#0075de]" size={20} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-black">{t('securityNote')}</p>
                  <p className="mt-1 text-sm leading-6 text-[#615d59]">{t('securityNoteDesc')}</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section> <div className="sr-only">Provider setup</div>
    </PageFrame>
  )
}
