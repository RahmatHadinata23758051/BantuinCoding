import { ArrowDown, ArrowRight, FileText, KeyRound, PackageCheck } from 'lucide-react'
import { IBM_Plex_Mono, Rubik } from 'next/font/google'
import { Link } from '@/i18n/routing'

import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { getTranslations } from 'next-intl/server'

const rubik = Rubik({ subsets: ['latin'], variable: '--font-home-rubik' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-home-mono' })

const PACK_FILES = [
  { name: 'PRD.md', detailKey: 'fileProductBrief' },
  { name: 'ARCHITECTURE.md', detailKey: 'fileSystemMap' },
  { name: 'DESIGN.md', detailKey: 'fileInterfaceRules' },
  { name: 'Agent.md', detailKey: 'fileWorkingContext' },
  { name: 'BACKLOG.md', detailKey: 'fileNextSteps' },
]

export default async function Home() {
  const t = await getTranslations('Home')
  const tCommon = await getTranslations('Common')

  return (
    <main className={`${rubik.variable} ${plexMono.variable} min-h-screen bg-white text-[#272536]`}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-[#eceaf1]">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-[-0.02em] text-[#272536] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7161a8]">
            <span className="grid size-8 place-items-center rounded-lg bg-[#f0edfa] font-mono text-xs font-semibold text-[#574b7d]">BC</span>
            <span>bantuin.dev</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label={t('authNavigationLabel')}>
            <LanguageSwitcher />
            <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-[#59566a] transition-colors hover:bg-[#f7f6fa] hover:text-[#272536] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7161a8] motion-reduce:transition-none">
              {tCommon('signIn')}
            </Link>
            <Link href="/register" className="rounded-md bg-[#302a43] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4c4266] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7161a8] motion-reduce:transition-none sm:px-4">
              {tCommon('getStarted')}
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className={`${plexMono.className} inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#756a96]`}>
              <span className="size-1.5 rounded-full bg-[#9181bd]" aria-hidden="true" />
              {t('caption')}
            </p>
            <h1 className={`${rubik.className} mt-5 text-[clamp(2.7rem,5vw,4.5rem)] font-medium leading-[1.06] tracking-[-0.055em] text-[#272536]`}>
              {t('heroTitle')}
            </h1>
            <p className={`${rubik.className} mt-6 max-w-lg text-base leading-7 text-[#666276] sm:text-lg sm:leading-8`}>
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/register" className="group inline-flex min-h-11 items-center gap-2 rounded-md bg-[#302a43] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4c4266] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7161a8] motion-reduce:transition-none">
                {t('buildFirst')} <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
              <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 py-3 text-sm font-medium text-[#625b79] underline decoration-[#c6bfd7] underline-offset-4 transition-colors hover:text-[#302a43] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7161a8] motion-reduce:transition-none">
                {t('openWorkspace')}
              </Link>
            </div>

            <div className="mt-12 border-t border-[#eceaf1] pt-5">
              <p className={`${plexMono.className} text-[10px] font-medium uppercase tracking-[0.15em] text-[#928da0]`}>{t('workflowTitle')}</p>
              <ol className="mt-4 grid grid-cols-3 gap-2" aria-label={t('workflowLabel')}>
                {[
                  { number: '01', title: t('workflowIdea'), copy: t('workflowIdeaCopy') },
                  { number: '02', title: t('workflowStructure'), copy: t('workflowStructureCopy') },
                  { number: '03', title: t('workflowPack'), copy: t('workflowPackCopy') },
                ].map((step, index) => (
                  <li key={step.number} className="relative min-w-0 pr-2">
                    <p className={`${plexMono.className} text-[10px] text-[#8c82a8]`}>{step.number}</p>
                    <p className="mt-1 text-sm font-medium text-[#373347]">{step.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#858092]">{step.copy}</p>
                    {index < 2 && <ArrowRight aria-hidden="true" className="absolute right-1 top-3 hidden text-[#b5aec5] sm:block" size={13} />}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[610px] lg:ml-auto">
            <div className="absolute -right-3 -top-4 size-28 rounded-full bg-[#f2eff9] blur-2xl sm:-right-5 sm:-top-6 sm:size-40" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-xl border border-[#e6e2ef] bg-[#f8f7fb] shadow-[0_18px_55px_-42px_rgba(48,42,67,0.38)]">
              <div className="flex items-center justify-between border-b border-[#e8e5ee] px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#c7bfd9]" />
                  <span className={`${plexMono.className} text-[11px] font-medium text-[#6e6782]`}>project-brief.md</span>
                </div>
                <span className={`${plexMono.className} text-[10px] text-[#9690a5]`}>{t('draftToPack')}</span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_180px] sm:gap-5 sm:p-6">
                <article className="rounded-lg border border-[#e8e4f0] bg-white p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#f0edfa] px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-[#6e608f]">{t('projectBrief')}</span>
                    <span className="font-mono text-[9px] text-[#aaa5b5]">01 / 05</span>
                  </div>
                  <h2 className={`${rubik.className} mt-5 text-lg font-medium tracking-[-0.03em] text-[#353145] sm:text-xl`}>{t('briefQuestion')}</h2>
                  <p className={`${rubik.className} mt-2 text-xs leading-5 text-[#817c8e]`}>{t('briefDescription')}</p>
                  <div className="mt-5 space-y-3">
                    <div className="h-2 w-[86%] rounded-full bg-[#eeecf3]" />
                    <div className="h-2 w-full rounded-full bg-[#eeecf3]" />
                    <div className="h-2 w-[72%] rounded-full bg-[#eeecf3]" />
                  </div>
                  <div className="mt-6 rounded-md bg-[#f2eff9] p-3">
                    <p className={`${plexMono.className} text-[9px] uppercase tracking-[0.12em] text-[#776b98]`}>{t('capturedDirection')}</p>
                    <p className={`${rubik.className} mt-1.5 text-xs leading-5 text-[#5d566f]`}>{t('capturedDirectionItems')}</p>
                  </div>
                </article>

                <section aria-label={t('generatedFilesLabel')} className="flex flex-col rounded-lg border border-[#e7e3ee] bg-white p-3.5 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`${plexMono.className} text-[10px] font-medium text-[#5e5871]`}>project-pack/</p>
                    <PackageCheck size={14} className="text-[#8a7bab]" aria-hidden="true" />
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {PACK_FILES.map((file) => (
                      <li key={file.name} className="flex min-w-0 items-start gap-2 rounded px-1.5 py-1.5">
                        <FileText size={13} className="mt-0.5 shrink-0 text-[#8c7eaa]" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className={`${plexMono.className} block truncate text-[9px] font-medium text-[#514b61]`}>{file.name}</span>
                          <span className={`${rubik.className} block text-[9px] text-[#9a95a5]`}>{t(file.detailKey as Parameters<typeof t>[0])}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto border-t border-[#efedf3] pt-3">
                    <div className="flex items-center gap-1.5 text-[#7c719a]">
                      <KeyRound size={12} aria-hidden="true" />
                      <p className={`${plexMono.className} text-[9px]`}>{t('secretSafe')}</p>
                    </div>
                  </div>
                </section>
              </div>
              <div className="flex items-center justify-between border-t border-[#e8e5ee] bg-white/70 px-4 py-3 sm:px-5">
                <p className={`${plexMono.className} text-[9px] text-[#8d879b]`}>{t('exportReadyMeta')}</p>
                <ArrowDown size={14} className="text-[#8c7eaa]" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { icon: KeyRound, title: t('proof1Title'), copy: t('proof1Copy') },
                { icon: FileText, title: t('proof2Title'), copy: t('proof2Copy') },
                { icon: PackageCheck, title: t('proof3Title'), copy: t('proof3Copy') },
              ].map((point) => {
                const Icon = point.icon
                return (
                  <div key={point.title} className="border-t border-[#e9e6ef] px-1 pt-3">
                    <Icon aria-hidden="true" className="mb-2 text-[#82759f]" size={16} strokeWidth={1.8} />
                    <h2 className="text-xs font-medium text-[#504b5e]">{point.title}</h2>
                    <p className="mt-1 text-[10px] leading-4 text-[#898495]">{point.copy}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eceaf1] py-4">
          <p className={`${plexMono.className} text-[10px] text-[#9691a1]`}>{t('noSlop')}</p>
          <p className={`${plexMono.className} text-[10px] text-[#9691a1]`}>{t('noSlopDesc')}</p>
        </footer>
      </div>
    </main>
  )
}
