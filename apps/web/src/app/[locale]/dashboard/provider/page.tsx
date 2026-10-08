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
    <PageFrame
      width="6xl"
      className="!border-[#e8e8f2] !bg-white !shadow-none py-4 text-[#303055]"
      contentClassName="overflow-hidden"
    >
      <TopBar className="!border-[#e8e8f2] !bg-white">
        <div className="flex min-w-0 items-center gap-2 font-mono text-xs font-semibold text-[#303055] sm:text-sm">
          <Link href="/dashboard" className="shrink-0 underline decoration-2 underline-offset-4">
            {tNew('backDashboard')}
          </Link>
          <span className="truncate text-[#767682]">{t('breadcrumb')}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-56 truncate font-mono text-xs font-bold text-[#767682] sm:inline">
            {session.user.email}
          </span>
          <LanguageSwitcher />
        </div>
      </TopBar>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-[#e8e8f2] bg-[#e8e8f2] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
          <Caption className="!border-[#303055] !bg-white !text-[#303055] !shadow-none">
            {t('caption')}
          </Caption>
          <h1 className="mt-5 max-w-xs text-4xl font-semibold leading-tight tracking-[-0.05em] text-[#303055]">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#403f53]">{t('subtitle')}</p>

          <Link
            href="/projects/new"
            className={buttonClassName({
              variant: 'primary',
              size: 'lg',
              className:
                'mt-8 w-full !rounded-[4px] !border-[#303055] !bg-[#303055] !text-white !shadow-none',
            })}
          >
            {t('captureIdea')}
          </Link>

          <div className="mt-8 border-t border-[#303055] pt-5">
            <p className="font-mono text-xs font-semibold tracking-[0.08em] text-[#303055]">
              {t('setupSequence')}
            </p>
            <ol className="mt-4 grid gap-3">
              <li className="flex gap-3 text-sm leading-5 text-[#403f53]">
                <span className="font-mono font-semibold text-[#303055]">01</span>
                <span>{t('setupProvider')}</span>
              </li>
              <li className="flex gap-3 text-sm leading-5 text-[#403f53]">
                <span className="font-mono font-semibold text-[#303055]">02</span>
                <span>{t('setupTest')}</span>
              </li>
              <li className="flex gap-3 text-sm leading-5 text-[#403f53]">
                <span className="font-mono font-semibold text-[#303055]">03</span>
                <span>{t('setupSave')}</span>
              </li>
            </ol>
          </div>
        </aside>

        <main className="min-w-0 bg-white p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e8e8f2] pb-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[4px] border border-[#303055] bg-[#e8e8f2] text-[#303055]">
                <KeyRound size={21} strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold tracking-[0.08em] text-[#767682]">
                  {t('deskLabel')}
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#303055]">
                  {t('aiProvider')}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#403f53]">
                  {t('aiProviderDesc')}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-[4px] border border-[#e8e8f2] bg-[#e8e8f2] px-3 py-2 font-mono text-[11px] font-semibold text-[#303055]">
              <ShieldCheck size={15} aria-hidden="true" />
              {t('sessionOnly')}
            </span>
          </div>

          <div className="mt-6 rounded-lg border border-[#e8e8f2] bg-[#e8e8f2] p-2 sm:p-3">
            <ProviderSetupPanel />
          </div>

          <Panel
            raised={false}
            className="mt-6 !rounded-lg !border-[#e8e8f2] !bg-white !p-4 !shadow-none sm:!p-5"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#303055]" size={20} aria-hidden="true" />
              <div>
                <p className="font-mono text-xs font-semibold text-[#303055]">{t('securityNote')}</p>
                <p className="mt-2 text-sm leading-6 text-[#403f53]">{t('securityNoteDesc')}</p>
              </div>
            </div>
          </Panel>
        </main>
      </div>
    </PageFrame>
  )
}
