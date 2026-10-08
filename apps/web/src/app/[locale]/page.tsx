import { ArrowRight, FileText, KeyRound, PackageCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'

import { PipelineSpine } from '@/app/components/PipelineSpine'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { PageFrame, StatusBadge, TopBar, buttonClassName } from '@/app/components/ui'
import { getTranslations } from 'next-intl/server'

const PACK_FILES = [
  'PRD.md',
  'ARCHITECTURE.md',
  'DESIGN.md',
  'Agent.md',
  'BACKLOG.md',
]

export default async function Home() {
  const t = await getTranslations('Home')
  const tCommon = await getTranslations('Common')
  return (
    <PageFrame width="7xl" fullHeight className="bg-[#f6f5f4] px-4 py-5 sm:px-8" contentClassName="flex flex-col">
      <TopBar className="border-b border-black/10 bg-white px-4 py-3">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[-0.01em] text-black/80">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#0075de] text-xs font-bold text-white">BC</span>
          <span>bantuin.dev / project-bootstrapper</span>
        </Link>
        <nav className="flex items-center gap-1.5" aria-label="Authentication">
          <LanguageSwitcher />
          <Link href="/login" className={buttonClassName({ variant: 'neutral', size: 'sm' })}>{tCommon('signIn')}</Link>
          <Link href="/register" className={buttonClassName({ variant: 'primary', size: 'sm' })}>{tCommon('getStarted')}</Link>
        </nav>
      </TopBar>

      <section className="mx-auto grid w-full max-w-6xl flex-1 gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
        <div className="flex flex-col gap-12">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-[#ffb110] px-3 py-1 text-xs font-semibold tracking-wide text-black">{t('caption')}</span>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-black sm:text-6xl lg:text-7xl">{t('heroTitle')}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#615d59] sm:text-lg">{t('heroSubtitle')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={buttonClassName({ variant: 'primary', size: 'lg' })}>{t('buildFirst')} <ArrowRight size={18} /></Link>
              <Link href="/login" className={buttonClassName({ variant: 'secondary', size: 'lg' })}>{t('openWorkspace')}</Link>
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-5"><PipelineSpine current="idea" /></div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="rounded-xl bg-[#02093a] p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">{t('noSlop')}</p>
            <p className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.035em]">{t('noSlopDesc')}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
              <p className="font-mono text-xs font-semibold text-black/70">project-bootstrap-pack.zip</p>
              <StatusBadge tone="success">{t('secretSafe')}</StatusBadge>
            </div>
            <div className="divide-y divide-black/10">
              {PACK_FILES.map((file) => <div key={file} className="flex items-center justify-between px-5 py-3.5"><span className="font-mono text-sm text-black/80">{file}</span><span className="text-xs text-[#757575]">UTF-8</span></div>)}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { icon: KeyRound, title: t('proof1Title'), copy: t('proof1Copy') },
              { icon: FileText, title: t('proof2Title'), copy: t('proof2Copy') },
              { icon: PackageCheck, title: t('proof3Title'), copy: t('proof3Copy') },
            ].map((point) => { const Icon = point.icon; return <div key={point.title} className="rounded-xl border border-black/10 bg-white p-5"><Icon aria-hidden="true" className="mb-4 text-[#0075de]" size={22} /><h2 className="text-sm font-semibold text-black">{point.title}</h2><p className="mt-2 text-sm leading-6 text-[#696969]">{point.copy}</p></div> })}
          </div>
        </aside>
      </section>
    </PageFrame>
  )
}
