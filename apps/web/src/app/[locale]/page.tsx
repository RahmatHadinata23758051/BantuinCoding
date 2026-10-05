import { ArrowRight, FileText, KeyRound, PackageCheck } from 'lucide-react'
import Link from 'next/link'

import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { PipelineSpine } from '@/app/components/PipelineSpine'
import { Caption, Panel, StatusBadge, buttonClassName } from '@/app/components/ui'
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
    <main className="min-h-screen px-4 py-4 text-[var(--ink)] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hero)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--ink)] bg-[var(--electric-yellow)] px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-black">
            <span className="inline-flex size-7 items-center justify-center border-2 border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-raised)] shadow-[var(--shadow-xs)]">
              BC
            </span>
            <span>bantuin.dev / project-bootstrapper</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Authentication">
            <LanguageSwitcher />
            <Link
              href="/login"
              className={buttonClassName({ variant: 'neutral', size: 'sm' })}
            >
              {tCommon('signIn')}
            </Link>
            <Link
              href="/register"
              className={buttonClassName({ variant: 'primary', size: 'sm' })}
            >
              {tCommon('getStarted')}
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col justify-between gap-10 border-b-2 border-[var(--ink)] p-5 sm:p-8 lg:border-b-0 lg:border-r-2 lg:p-10">
            <div className="max-w-3xl">
              <Caption>{t('caption')}</Caption>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] text-[var(--ink)] sm:text-6xl lg:text-7xl">
                {t('heroTitle')}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--ink-soft)] sm:text-lg">
                {t('heroSubtitle')}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className={buttonClassName({ variant: 'primary', size: 'lg' })}
                >
                  {t('buildFirst')} <ArrowRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className={buttonClassName({ variant: 'secondary', size: 'lg' })}
                >
                  {t('openWorkspace')}
                </Link>
              </div>
            </div>

            <PipelineSpine current="idea" />
          </div>

          <aside className="flex flex-col gap-5 bg-[var(--paper)] p-5 sm:p-8 lg:p-10">
            <Panel tone="pink" className="rotate-[-1deg] p-5">
              <p className="font-mono text-xs font-black">{t('noSlop')}</p>
              <p className="mt-3 text-2xl font-black leading-tight tracking-[-0.04em]">
                {t('noSlopDesc')}
              </p>
            </Panel>

            <Panel className="overflow-hidden">
              <div className="border-b-2 border-[var(--ink)] bg-[var(--lavender)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs font-black">project-bootstrap-pack.zip</p>
                  <StatusBadge tone="success">{t('secretSafe')}</StatusBadge>
                </div>
              </div>
              <div className="divide-y-2 divide-[var(--ink)]">
                {PACK_FILES.map((file) => (
                  <div key={file} className="flex items-center justify-between px-4 py-3">
                    <span className="font-mono text-sm font-bold">{file}</span>
                    <span className="text-xs font-bold text-[var(--paper-muted)]">UTF-8</span>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[{ icon: KeyRound, title: t('proof1Title'), copy: t('proof1Copy') }, { icon: FileText, title: t('proof2Title'), copy: t('proof2Copy') }, { icon: PackageCheck, title: t('proof3Title'), copy: t('proof3Copy') }].map((point) => {
                const Icon = point.icon
                return (
                  <Panel key={point.title} raised={false} className="p-4 shadow-[var(--shadow-sm)]">
                    <Icon aria-hidden="true" className="mb-3" size={22} strokeWidth={2.5} />
                    <h2 className="text-sm font-black">{point.title}</h2>
                    <p className="mt-2 text-xs leading-5 text-[var(--paper-muted)]">
                      {point.copy}
                    </p>
                  </Panel>
                )
              })}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
