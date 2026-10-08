import { ArrowRight, Check, Coins, HelpCircle, KeyRound, ShieldCheck, Sparkles } from 'lucide-react'
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
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const breadcrumbRaw = t('breadcrumb')
  const breadcrumbText = breadcrumbRaw.startsWith('/') ? breadcrumbRaw.slice(1).trim() : breadcrumbRaw

  return (
    <PageFrame width="5xl" className="bg-[#f6f5f4] py-5 text-[#111]" contentClassName="bg-[#f6f5f4]">
      <TopBar className="bg-[#f6f5f4]">
        <div className="flex items-center gap-2 text-xs font-medium sm:text-sm">
          <Link href="/dashboard" className="text-[#615d59] transition-colors hover:text-[#111]">
            {tNew('backDashboard')}
          </Link>
          <span aria-hidden="true" className="text-[#b7b2ac]">/</span>
          <span className="font-semibold text-[#111]">{breadcrumbText}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="max-w-56 truncate text-xs text-[#757575]">{session.user.email}</span>
          <LanguageSwitcher />
        </div>
      </TopBar>

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Editorial Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#77716b]">
            <span>{t('caption')}</span>
            <span className="text-[#ffb110]" aria-hidden="true">✳</span>
            <span>{t('sessionOnly')}</span>
          </div>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-[1.06] tracking-[-0.055em] text-[#111] sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-[var(--font-lyon-text)] text-base leading-relaxed text-[#615d59] sm:text-lg">
            {t('subtitle')}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/projects/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0075de] px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_0_rgba(0,70,136,0.08)] transition-all hover:bg-[#0067c2] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0075de] focus-visible:ring-offset-2"
            >
              {t('captureIdea')} <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-black/[0.09] bg-white px-5 py-2.5 text-sm font-semibold text-[#111] transition-all hover:bg-[#fafaf9] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0075de]"
            >
              {tNew('backDashboard')}
            </Link>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#817c76]">
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#e7f2e6] text-[10px] font-bold text-[#4f8256]">✓</span>
            <span>{t('securityNote')} · {t('sessionOnly')}</span>
          </p>
        </header>

        {/* Beginner's Guide: 3 Feature Cards */}
        <section aria-labelledby="byok-guide-heading" className="mt-12">
          <div className="mb-5 text-center">
            <h2 id="byok-guide-heading" className="text-xl font-bold tracking-[-0.03em] text-[#111] sm:text-2xl">
              {t('byokGuideTitle')}
            </h2>
            <p className="mt-1 font-[var(--font-lyon-text)] text-sm text-[#615d59]">
              {t('byokGuideSubtitle')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col justify-between rounded-xl border border-black/[0.08] bg-white p-5 transition-colors hover:border-black/20">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff5d2] px-2.5 py-1 text-[11px] font-bold text-[#a47417]">
                  <Coins size={13} aria-hidden="true" /> {t('cardByokTitle')}
                </span>
                <h3 className="mt-3 text-base font-bold tracking-[-0.02em] text-[#111]">{t('cardByokHeading')}</h3>
                <p className="mt-2 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                  {t('cardByokDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-black/[0.08] bg-white p-5 transition-colors hover:border-black/20">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f3fe] px-2.5 py-1 text-[11px] font-bold text-[#0075de]">
                  <Sparkles size={13} aria-hidden="true" /> {t('cardProviderTitle')}
                </span>
                <h3 className="mt-3 text-base font-bold tracking-[-0.02em] text-[#111]">{t('cardProviderHeading')}</h3>
                <p className="mt-2 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                  {t('cardProviderDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-black/[0.08] bg-white p-5 transition-colors hover:border-black/20">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f2e6] px-2.5 py-1 text-[11px] font-bold text-[#3c7448]">
                  <ShieldCheck size={13} aria-hidden="true" /> {t('cardSecurityTitle')}
                </span>
                <h3 className="mt-3 text-base font-bold tracking-[-0.02em] text-[#111]">{t('cardSecurityHeading')}</h3>
                <p className="mt-2 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                  {t('cardSecurityDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Provider Desk: Sequence, Readiness & Setup Panel */}
        <section aria-labelledby="desk-main-heading" className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          {/* Left Column: Setup Sequence & Readiness Checklist */}
          <div className="space-y-5">
            <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-none">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#757575]">
                <KeyRound size={15} aria-hidden="true" />
                <span>{t('deskLabel')}</span>
              </div>
              <h2 id="desk-main-heading" className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#111]">
                {t('aiProvider')}
              </h2>
              <p className="mt-2 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                {t('aiProviderDesc')}
              </p>

              <div className="mt-6 border-t border-black/[0.06] pt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#757575]">
                  {t('setupSequence')}
                </p>
                <ol className="mt-4 space-y-3.5 border-l border-[#d9d6d2] pl-4 text-xs">
                  {[t('setupProvider'), t('setupTest'), t('setupSave')].map((step, index) => (
                    <li key={step} className="relative leading-relaxed text-[#615d59]">
                      <span className="absolute -left-[21px] top-0.5 flex size-4 items-center justify-center rounded-full border border-[#c9c5bf] bg-[#f6f5f4] text-[9px] font-semibold text-[#77716b]">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-none">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f3fe] px-2.5 py-0.5 text-xs font-semibold text-[#0067c2]">
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                  {t('readinessPrereq')}
                </span>
                <span className="text-[11px] text-[#757575]">{t('sessionOnly')}</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[#111]">{t('readinessTitle')}</h3>
              <p className="mt-2 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                {t('readinessPrereqDesc')}
              </p>

              <div className="mt-4 rounded-lg border border-black/[0.06] bg-[#fafaf9] p-4">
                <p className="text-xs font-bold text-[#111]">{t('readinessNext')}</p>
                <p className="mt-1 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                  {t('readinessNextDesc')}
                </p>
                <Link
                  href="/projects/new"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0075de] hover:underline"
                >
                  {t('readinessCta')} <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Setup Panel and Security Footnote */}
          <div className="min-w-0">
            <div className="rounded-xl border border-black/[0.08] bg-white p-5 shadow-none sm:p-6">
              <div className="mb-5 flex items-start gap-3 border-b border-black/[0.06] pb-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e6f3fe] text-[#0075de]">
                  <KeyRound size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.025em] text-[#111]">{t('aiProvider')}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-[#615d59]">{t('aiProviderDesc')}</p>
                </div>
              </div>

              <ProviderSetupPanel />
            </div>

            <aside className="mt-4 rounded-xl border border-black/[0.08] bg-white p-5 shadow-none" aria-label={t('securityNote')}>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[#0075de]" size={18} aria-hidden="true" />
                <div>
                  <p className="text-xs font-bold text-[#111]">{t('securityNote')}</p>
                  <p className="mt-1 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                    {t('securityNoteDesc')}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Beginner FAQ Section */}
        <section aria-labelledby="faq-heading" className="mt-12 rounded-xl border border-black/[0.08] bg-white p-6 sm:p-8">
          <div className="mx-auto max-w-xl text-center">
            <p className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#757575]">
              <HelpCircle size={14} aria-hidden="true" />
              <span>{t('deskLabel')}</span>
            </p>
            <h2 id="faq-heading" className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#111]">
              {t('faqTitle')}
            </h2>
          </div>
          <div className="mt-6 divide-y divide-black/[0.07] border-t border-black/[0.07]">
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[#111]">
                <span>{t('faq1Q')}</span>
                <span className="ml-2 font-mono text-base font-normal text-[#757575] transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-2.5 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                {t('faq1A')}
              </p>
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[#111]">
                <span>{t('faq2Q')}</span>
                <span className="ml-2 font-mono text-base font-normal text-[#757575] transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-2.5 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                {t('faq2A')}
              </p>
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[#111]">
                <span>{t('faq3Q')}</span>
                <span className="ml-2 font-mono text-base font-normal text-[#757575] transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-2.5 font-[var(--font-lyon-text)] text-xs leading-relaxed text-[#615d59]">
                {t('faq3A')}
              </p>
            </details>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}
