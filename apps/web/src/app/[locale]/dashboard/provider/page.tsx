import { ArrowUpRight, KeyRound, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { PageFrame, TopBar } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

export default async function ProviderSettingsPage() {
  const t = await getTranslations('ProviderDesk')
  const tNew = await getTranslations('NewProject')
  const tSetup = await getTranslations('ProviderSetup')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <PageFrame width="5xl" contentClassName="!border-0 !bg-transparent !shadow-none">
      <TopBar className="border-b border-slate-200 bg-white/90 shadow-none">
        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard" className="rounded-sm hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600">
            {tNew('backDashboard')}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate font-medium text-slate-900">{t('breadcrumb').replace(/^\/\s*/, '')}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden max-w-56 truncate text-sm text-slate-500 sm:inline">{session.user.email}</span>
          <LanguageSwitcher />
        </div>
      </TopBar>

      <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-7 sm:px-6 sm:pt-10">
        <header className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <KeyRound size={15} aria-hidden="true" />
            </span>
            <span>{t('caption')}</span>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{t('title')}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{t('subtitle')}</p>
              <Link
                href="/projects/new"
                className="mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-4 hover:text-violet-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              >
                {t('captureIdea')}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <ol aria-label={t('aiProvider')} className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
              {[
                { number: '01', label: tSetup('provider') },
                { number: '02', label: `${tSetup('apiKey')} + ${tSetup('model')}` },
                { number: '03', label: tSetup('testConnection') },
              ].map((step) => (
                <li key={step.number} className="flex min-w-0 items-start gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-2.5 text-xs text-slate-600 sm:gap-3 sm:px-3">
                  <span className="font-mono text-[11px] font-semibold text-violet-600">{step.number}</span>
                  <span className="leading-4">{step.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </header>

        <section aria-labelledby="provider-settings-title" className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 [&>div]:!rounded-2xl [&>div]:!border-slate-200 [&>div]:!shadow-none [&>div>button]:!rounded-t-2xl [&>div>button]:!border-b [&>div>button]:!border-slate-200 [&>div>button]:!bg-white [&>div>button:hover]:!bg-slate-50 [&>div>div]:!border-slate-200 [&>div>div]:!bg-white">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <SlidersHorizontal size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id="provider-settings-title" className="text-lg font-semibold tracking-tight text-slate-900">{t('aiProvider')}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">{t('aiProviderDesc')}</p>
              </div>
            </div>
            <ProviderSetupPanel />
          </div>

          <aside className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{t('securityNote')}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t('securityNoteDesc')}</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </PageFrame>
  )
}
