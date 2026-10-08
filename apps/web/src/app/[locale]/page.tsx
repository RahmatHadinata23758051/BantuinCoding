import { ArrowDown, ArrowRight, FileText, KeyRound, PackageCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'

import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'

const PACK_FILES = ['PRD.md', 'ARCHITECTURE.md', 'DESIGN.md', 'Agent.md', 'BACKLOG.md']

export default async function Home() {
  const t = await getTranslations('Home')
  const tCommon = await getTranslations('Common')

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#24231f] selection:bg-[#f3d2bd] selection:text-[#24231f]">
      <header className="sticky top-0 z-20 border-b border-[#dedbd5] bg-[#f7f6f3]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-[19px] font-bold tracking-[-0.07em]">bantuin<span className="font-serif font-normal text-[#a66142]">.</span></Link>
          <nav aria-label={t('authNavigationLabel')} className="flex items-center gap-2 sm:gap-4">
            <a href="#how-it-works" className="hidden text-sm text-[#68645e] hover:text-[#24231f] sm:inline">{t('workflowTitle')}</a>
            <LanguageSwitcher />
            <Link href="/login" className="px-2 py-2 text-sm font-medium hover:underline">{tCommon('signIn')}</Link>
            <Link href="/register" className="rounded-full bg-[#25241f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#45433c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a66142]">{tCommon('getStarted')}</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto px-5 pb-0 pt-16 text-center sm:px-8 sm:pt-24 lg:pt-28">
        <p className="mx-auto mb-6 max-w-fit text-sm font-medium text-[#706b64]">{t('caption')}</p>
        <h1 className="mx-auto max-w-[1000px] text-[clamp(3.15rem,8vw,7.5rem)] font-semibold leading-[.98] tracking-[-.075em]"><span>{t('heroTitleLead')}</span> <span className="rounded-[.16em] bg-[#f3d2bd] px-[.12em]">{t('heroTitleHighlight')}</span> <span>{t('heroTitleTrail')}</span></h1>
        <p className="mx-auto mt-7 max-w-[620px] text-base leading-7 text-[#66615b] sm:text-lg sm:leading-8">{t('heroSubtitle')}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a85e3c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('buildFirst')}<ArrowRight size={17} /></Link>
          <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#c9c4bc] px-6 py-3 text-sm font-semibold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('openWorkspace')}</Link>
        </div>
        <p className="mt-4 text-xs text-[#77716a]">{t('heroNote')}</p>

        <div id="preview" className="mx-auto mt-16 max-w-[1080px] overflow-hidden rounded-t-[22px] border border-[#dedbd5] bg-white text-left shadow-[0_18px_60px_rgba(40,35,28,0.08)] sm:mt-20">
          <div className="flex h-12 items-center justify-between border-b border-[#e9e6e0] px-4 text-xs text-[#716c65] sm:px-6">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#6f9474]" />{t('previewWorkspace')}</span><span>{t('previewStatus')}</span>
          </div>
          <div className="grid min-h-[370px] md:grid-cols-[210px_1fr]">
            <aside className="hidden border-r border-[#e9e6e0] bg-[#faf9f7] p-5 md:block">
              <p className="text-sm font-semibold">{t('previewProjectName')}</p>
              <p className="mt-1 text-xs text-[#8a847c]">{t('previewProjectMeta')}</p>
              <div className="mt-8 space-y-1 text-sm text-[#716c65]">
                {[t('previewOverview'), t('previewContext'), t('previewDocuments'), t('previewSkills'), t('previewBacklog')].map((item, index) => <p key={item} className={`rounded-md px-3 py-2 ${index === 4 ? 'bg-[#eeeae4] font-medium text-[#282722]' : ''}`}>{item}</p>)}
              </div>
            </aside>
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e9e6e0] pb-5">
                <div><p className="text-xs text-[#8a847c]">{t('previewBreadcrumb')}</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.05em]">{t('previewProjectName')}</h2><p className="mt-2 text-sm text-[#77716a]">{t('previewDescription')}</p></div>
                <span className="rounded-full bg-[#e7eee4] px-3 py-1.5 text-xs font-medium text-[#4b694f]">{t('previewReady')}</span>
              </div>
              <div className="grid gap-5 pt-6 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-3">
                  {PACK_FILES.map((file, index) => <div key={file} className="flex items-center gap-3 border-b border-[#efede9] py-2.5"><FileText size={16} className="shrink-0 text-[#a66142]" /><span className="flex-1 text-sm">{file}</span><span className="text-xs text-[#89837c]">{index < 3 ? t('previewComplete') : t('previewPlanned')}</span></div>)}
                </div>
                <div className="bg-[#f8f6f2] p-5 sm:p-6">
                  <p className="text-xs font-medium text-[#7b746b]">{t('previewNextStep')}</p><p className="mt-3 text-xl font-semibold leading-snug tracking-[-.04em]">{t('previewNextAction')}</p><p className="mt-3 text-sm leading-6 text-[#6d675f]">{t('previewNextCopy')}</p><div className="mt-6 h-px bg-[#dedbd5]" /><p className="mt-4 text-xs text-[#7b746b]">{t('secretSafe')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stories" className="mx-auto max-w-[1080px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-8 border-b border-[#dedbd5] pb-10 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <p className="text-sm text-[#8b5b43]">{t('storyEyebrow')}</p><h2 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-.065em] sm:text-6xl">{t('storyHeading')}</h2>
        </div>
        <div className="grid gap-10 py-10 sm:grid-cols-3 sm:gap-8">
          {[{ icon: KeyRound, title: t('proof1Title'), copy: t('proof1Copy') }, { icon: FileText, title: t('proof2Title'), copy: t('proof2Copy') }, { icon: PackageCheck, title: t('proof3Title'), copy: t('proof3Copy') }].map((item) => { const Icon = item.icon; return <article key={item.title}><Icon aria-hidden="true" className="mb-6 text-[#a66142]" size={22} /><h3 className="text-lg font-semibold tracking-[-.03em]">{item.title}</h3><p className="mt-3 text-sm leading-6 text-[#706b64]">{item.copy}</p></article> })}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#25241f] text-white">
        <div className="mx-auto grid max-w-[1080px] gap-12 px-5 py-20 sm:px-8 sm:py-28 md:grid-cols-[.9fr_1.1fr] md:items-center">
          <div><p className="text-sm text-[#e9b39a]">{t('workflowEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('workflowHeading')}</h2><p className="mt-6 max-w-md text-base leading-7 text-white/70">{t('workflowCopy')}</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#25241f] hover:bg-[#f1eee8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{t('buildFirst')}<ArrowRight size={16} /></Link></div>
          <ol className="border-t border-white/20">
            {[t('workflowIdea'), t('workflowClarify'), t('workflowContext'), t('workflowGenerate'), t('workflowReview'), t('workflowExport')].map((step, index) => <li key={step} className="flex items-center gap-5 border-b border-white/20 py-4"><span className="w-8 text-xs text-white/45">0{index + 1}</span><span className="text-lg font-medium">{step}</span>{index === 5 && <ArrowRight className="ml-auto text-[#e9b39a]" size={18} />}</li>)}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-5 py-24 text-center sm:px-8 sm:py-32">
        <p className="text-sm text-[#8b5b43]">{t('closingEyebrow')}</p><h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('closingHeading')}</h2><p className="mx-auto mt-5 max-w-lg text-base leading-7 text-[#706b64]">{t('closingCopy')}</p><Link href="/register" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a85e3c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('buildFirst')}<ArrowRight size={17} /></Link>
      </section>

      <section id="faq" className="mx-auto max-w-[760px] px-5 pb-24 sm:px-8 sm:pb-28"><h2 className="mb-7 text-center text-3xl font-semibold tracking-[-.05em]">{t('faqTitle')}</h2>{[1, 2, 3].map((n) => <details key={n} className="group border-t border-[#dedbd5] py-5 last:border-b"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a66142]">{t(`faq${n}Question`)}<span className="text-xl font-normal text-[#8b5b43] group-open:rotate-45">+</span></summary><p className="mt-3 max-w-[650px] text-sm leading-6 text-[#706b64]">{t(`faq${n}Answer`)}</p></details>)}</section>

      <footer className="border-t border-[#dedbd5]">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-5 px-5 py-8 text-sm text-[#716c65] sm:flex-row sm:items-center sm:px-8"><div><Link href="/" className="font-semibold tracking-[-.06em] text-[#24231f]">bantuin.dev</Link><p className="mt-2 text-xs">{t('footerNote')}</p></div><div className="flex flex-wrap gap-x-6 gap-y-3"><a href="#stories" className="hover:text-[#24231f]">{t('footerFeatures')}</a><a href="#how-it-works" className="hover:text-[#24231f]">{t('footerWorkflow')}</a><a href="#faq" className="hover:text-[#24231f]">FAQ</a><a href="#preview" className="inline-flex items-center gap-1 hover:text-[#24231f]">{t('backToTop')}<ArrowDown className="rotate-180" size={13} /></a></div></div>
      </footer>
    </main>
  )
}
