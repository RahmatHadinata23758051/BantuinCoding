import { ArrowDown, ArrowRight, Check, FileCode2, FileText, KeyRound, PackageCheck, ShieldCheck, TerminalSquare } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { LandingProductTour, type LandingTourItem } from '@/app/components/LandingProductTour'
import { LandingScrollShowcase, type LandingShowcaseStage } from '@/app/components/LandingScrollShowcase'

const PACK_FILES = ['PRD.md', 'SRS.md', 'ARCHITECTURE.md', 'AGENT.md', 'RULES.md', 'SKILLS/', 'BACKLOG.md']

export default async function Home() {
  const t = await getTranslations('Home')
  const tCommon = await getTranslations('Common')

  const showcaseStages: LandingShowcaseStage[] = [
    { id: 'idea', number: '01', label: t('showcaseIdea'), detail: t('showcaseIdeaDetail'), artifact: 'idea.md' },
    { id: 'analysis', number: '02', label: t('showcaseAnalysis'), detail: t('showcaseAnalysisDetail'), artifact: 'requirements.json' },
    { id: 'context', number: '03', label: t('showcaseContext'), detail: t('showcaseContextDetail'), artifact: 'context.json' },
    { id: 'documents', number: '04', label: t('showcaseDocuments'), detail: t('showcaseDocumentsDetail'), artifact: 'docs/*.md' },
    { id: 'handoff', number: '05', label: t('showcaseHandoff'), detail: t('showcaseHandoffDetail'), artifact: 'bootstrap-pack.zip' },
  ]

  const tourItems: LandingTourItem[] = [
    { id: 'context', label: t('tourContext'), eyebrow: t('tourContextEyebrow'), description: t('tourContextDescription'), lines: [t('tourContextLine1'), t('tourContextLine2'), t('tourContextLine3')] },
    { id: 'documents', label: t('tourDocuments'), eyebrow: t('tourDocumentsEyebrow'), description: t('tourDocumentsDescription'), lines: [t('tourDocumentsLine1'), t('tourDocumentsLine2'), t('tourDocumentsLine3')] },
    { id: 'skills', label: t('tourSkills'), eyebrow: t('tourSkillsEyebrow'), description: t('tourSkillsDescription'), lines: [t('tourSkillsLine1'), t('tourSkillsLine2'), t('tourSkillsLine3')] },
    { id: 'backlog', label: t('tourBacklog'), eyebrow: t('tourBacklogEyebrow'), description: t('tourBacklogDescription'), lines: [t('tourBacklogLine1'), t('tourBacklogLine2'), t('tourBacklogLine3')] },
    { id: 'export', label: t('tourExport'), eyebrow: t('tourExportEyebrow'), description: t('tourExportDescription'), lines: [t('tourExportLine1'), t('tourExportLine2'), t('tourExportLine3')] },
  ]

  const workflow = [
    [t('workflowIdea'), t('workflowIdeaDetail')], [t('workflowClarify'), t('workflowClarifyDetail')], [t('workflowContext'), t('workflowContextDetail')],
    [t('workflowGenerate'), t('workflowGenerateDetail')], [t('workflowReview'), t('workflowReviewDetail')], [t('workflowExport'), t('workflowExportDetail')],
  ]

  const useCases = [
    [t('useCaseFounderTitle'), t('useCaseFounderCopy'), t('useCaseFounderCta')],
    [t('useCaseTeamTitle'), t('useCaseTeamCopy'), t('useCaseTeamCta')],
    [t('useCaseAgentTitle'), t('useCaseAgentCopy'), t('useCaseAgentCta')],
  ]

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f6f3] text-[#24231f] selection:bg-[#f3d2bd] selection:text-[#24231f]">
      <header className="sticky top-0 z-20 border-b border-[#dedbd5] bg-[#f7f6f3]/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[68px] max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="shrink-0 text-[19px] font-bold tracking-[-0.07em]">bantuin<span className="font-serif font-normal text-[#a66142]">.</span></Link>
          <nav aria-label={t('authNavigationLabel')} className="flex items-center gap-1 sm:gap-4">
            <div className="hidden items-center gap-4 text-sm text-[#68645e] lg:flex">
              <a href="#how-it-works" className="hover:text-[#24231f]">{t('navWorkflow')}</a>
              <a href="#tour" className="hover:text-[#24231f]">{t('navFeatures')}</a>
              <a href="#security" className="hover:text-[#24231f]">{t('navSecurity')}</a>
              <a href="#faq" className="hover:text-[#24231f]">FAQ</a>
            </div>
            <LanguageSwitcher />
            <Link href="/login" className="hidden px-2 py-2 text-sm font-medium hover:underline sm:inline">{tCommon('signIn')}</Link>
            <Link href="/register" className="rounded-full bg-[#25241f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#45433c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a66142]">{tCommon('getStarted')}</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1240px] px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:pt-28">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_0.42fr]">
          <div>
            <p className="mb-6 max-w-fit font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{t('caption')}</p>
            <h1 className="max-w-[980px] text-[clamp(3.15rem,8vw,7.5rem)] font-semibold leading-[.95] tracking-[-.075em]"><span>{t('heroTitleLead')}</span> <span className="rounded-[.16em] bg-[#f3d2bd] px-[.12em]">{t('heroTitleHighlight')}</span> <span>{t('heroTitleTrail')}</span></h1>
            <p className="mt-8 max-w-[660px] text-base leading-7 text-[#66615b] sm:text-lg sm:leading-8">{t('heroSubtitle')}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a85e3c] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('buildFirst')}<ArrowRight size={17} /></Link>
              <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#c9c4bc] px-6 py-3 text-sm font-semibold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('openWorkspace')}</Link>
            </div>
            <p className="mt-4 text-xs text-[#77716a]">{t('heroNote')}</p>
          </div>
          <aside className="border-l border-[#d8d1c7] pl-5 text-sm leading-6 text-[#716c65] lg:mb-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a66142]">{t('heroAsideEyebrow')}</p>
            <p className="mt-3">{t('heroAsideCopy')}</p>
          </aside>
        </div>

        <div id="preview" className="mt-16 overflow-hidden rounded-[22px] border border-[#dedbd5] bg-white text-left shadow-[0_18px_60px_rgba(40,35,28,0.08)] sm:mt-20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9e6e0] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#716c65] sm:px-6"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#6f9474]" />{t('previewWorkspace')}</span><span>{t('previewStatus')}</span></div>
          <div className="grid md:grid-cols-[220px_1fr]">
            <aside className="hidden border-r border-[#e9e6e0] bg-[#faf9f7] p-5 md:block"><p className="text-sm font-semibold">{t('previewProjectName')}</p><p className="mt-1 font-mono text-[10px] text-[#8a847c]">{t('previewProjectMeta')}</p><div className="mt-8 space-y-1 text-sm text-[#716c65]">{[t('previewOverview'), t('previewContext'), t('previewDocuments'), t('previewSkills'), t('previewBacklog')].map((item, index) => <p key={item} className={`rounded-md px-3 py-2 ${index === 1 ? 'bg-[#eeeae4] font-medium text-[#282722]' : ''}`}>{item}</p>)}</div></aside>
            <div className="p-5 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e9e6e0] pb-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a847c]">{t('previewBreadcrumb')}</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.05em]">{t('previewProjectName')}</h2><p className="mt-2 max-w-xl text-sm text-[#77716a]">{t('previewDescription')}</p></div><span className="rounded-full bg-[#e7eee4] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#4b694f]">{t('previewReady')}</span></div><div className="grid gap-5 pt-6 lg:grid-cols-[1fr_0.8fr]"><div className="space-y-3">{PACK_FILES.map((file, index) => <div key={file} className="flex items-center gap-3 border-b border-[#efede9] py-2.5"><FileText size={16} className="shrink-0 text-[#a66142]" /><span className="flex-1 font-mono text-xs sm:text-sm">{file}</span><span className="text-xs text-[#89837c]">{index < 5 ? t('previewComplete') : t('previewPlanned')}</span></div>)}</div><div className="bg-[#f8f6f2] p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#7b746b]">{t('previewNextStep')}</p><p className="mt-3 text-xl font-semibold leading-snug tracking-[-.04em]">{t('previewNextAction')}</p><p className="mt-3 text-sm leading-6 text-[#6d675f]">{t('previewNextCopy')}</p><div className="mt-6 h-px bg-[#dedbd5]" /><p className="mt-4 flex items-center gap-2 text-xs text-[#7b746b]"><ShieldCheck size={14} className="text-[#6f9474]" />{t('secretSafe')}</p></div></div></div>
          </div>
        </div>
      </section>

      <section id="transformation" className="border-y border-[#dedbd5] bg-[#f0ece6] px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1080px]"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{t('showcaseEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('showcaseHeading')}</h2><p className="mt-5 text-base leading-7 text-[#706b64]">{t('showcaseCopy')}</p></div><div className="mt-12"><LandingScrollShowcase ariaLabel={t('showcaseAriaLabel')} stages={showcaseStages} staticNote={t('showcaseStaticNote')} /></div></div></section>

      <section id="how-it-works" className="mx-auto max-w-[1080px] px-5 py-24 sm:px-8 sm:py-32"><div className="grid gap-8 border-b border-[#dedbd5] pb-10 md:grid-cols-[.8fr_1.2fr] md:items-end"><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{t('workflowEyebrow')}</p><h2 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-.065em] sm:text-6xl">{t('workflowHeading')}</h2></div><p className="mt-7 max-w-2xl text-base leading-7 text-[#706b64]">{t('workflowCopy')}</p><ol className="mt-12 grid border-t border-[#dedbd5] sm:grid-cols-2 lg:grid-cols-3">{workflow.map(([label, detail], index) => <li key={label} className="border-b border-r border-[#dedbd5] p-5 last:border-r-0 sm:p-7"><span className="font-mono text-xs text-[#a85e3c]">0{index + 1}</span><h3 className="mt-8 text-xl font-semibold tracking-[-.04em]">{label}</h3><p className="mt-2 text-sm leading-6 text-[#706b64]">{detail}</p></li>)}</ol></section>

      <section id="tour" className="bg-[#25241f] px-5 py-24 text-white sm:px-8 sm:py-32"><div className="mx-auto max-w-[1080px]"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#e9b39a]">{t('tourEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('tourHeading')}</h2><p className="mt-5 text-base leading-7 text-white/70">{t('tourCopy')}</p></div><div className="mt-12"><LandingProductTour ariaLabel={t('tourAriaLabel')} items={tourItems} /></div></div></section>

      <section id="stories" className="mx-auto max-w-[1080px] px-5 py-24 sm:px-8 sm:py-32"><div className="grid gap-8 md:grid-cols-2 md:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{t('beforeAfterEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('beforeAfterHeading')}</h2></div><p className="text-base leading-7 text-[#706b64]">{t('beforeAfterCopy')}</p></div><div className="mt-12 grid gap-4 md:grid-cols-2"><article className="border border-[#dedbd5] bg-[#f0ece6] p-6 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a85e3c]">{t('beforeLabel')}</p><p className="mt-8 text-2xl font-medium leading-snug tracking-[-.04em]">“{t('beforeCopy')}”</p><ul className="mt-8 space-y-3 text-sm leading-6 text-[#706b64]"><li>— {t('beforePoint1')}</li><li>— {t('beforePoint2')}</li><li>— {t('beforePoint3')}</li></ul></article><article className="border border-[#25241f] bg-white p-6 shadow-[8px_8px_0_#f0d6c6] sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6f9474]">{t('afterLabel')}</p><p className="mt-8 text-2xl font-semibold leading-snug tracking-[-.04em]">{t('afterHeading')}</p><ul className="mt-8 space-y-3 text-sm leading-6 text-[#706b64]"><li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-[#6f9474]" />{t('afterPoint1')}</li><li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-[#6f9474]" />{t('afterPoint2')}</li><li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-[#6f9474]" />{t('afterPoint3')}</li></ul></article></div></section>

      <section id="artifacts" className="border-y border-[#dedbd5] bg-[#fffdfa] px-5 py-24 sm:px-8 sm:py-32"><div className="mx-auto grid max-w-[1080px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{t('artifactsEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('artifactsHeading')}</h2><p className="mt-5 text-base leading-7 text-[#706b64]">{t('artifactsCopy')}</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#a85e3c] hover:underline">{t('artifactsCta')}<ArrowRight size={16} /></Link></div><div className="overflow-hidden border border-[#d8d1c7] bg-[#25241f] text-white shadow-[10px_10px_0_#e8d4c7]"><div className="flex items-center gap-2 border-b border-white/15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/50"><span className="size-2 rounded-full bg-[#e9a27b]" />project-bootstrap-pack / tree</div><div className="space-y-1 p-5 font-mono text-sm leading-8 sm:p-8">{PACK_FILES.map((file, index) => <div key={file} className={`${index === 0 || index === 6 ? 'text-[#f0b493]' : 'text-white/75'} flex items-center gap-3`}><FileCode2 size={15} className="text-white/35" />{file}</div>)}</div></div></div></section>

      <section id="handoff" className="mx-auto max-w-[1080px] px-5 py-24 sm:px-8 sm:py-32"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{t('handoffEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('handoffHeading')}</h2><p className="mt-5 text-base leading-7 text-[#706b64]">{t('handoffCopy')}</p></div><div className="overflow-hidden rounded-[16px] bg-[#25241f] text-white shadow-[10px_10px_0_#f0d6c6]"><div className="flex items-center gap-2 border-b border-white/15 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/50"><TerminalSquare size={14} />{t('handoffPreviewLabel')}</div><div className="p-5 font-mono text-xs leading-7 sm:p-8"><p className="text-[#e9a27b]">$ {t('handoffCommand')}</p><p className="mt-4 text-white/65">{t('handoffPrompt')}</p><p className="mt-5 border-t border-white/15 pt-4 text-white/45">{t('handoffNotice')}</p></div></div></div></section>

      <section id="security" className="bg-[#f0ece6] px-5 py-24 sm:px-8 sm:py-32"><div className="mx-auto max-w-[1080px]"><div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><div><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{t('securityEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('securityHeading')}</h2></div><p className="text-base leading-7 text-[#706b64]">{t('securityCopy')}</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{[[KeyRound, t('securityCard1Title'), t('securityCard1Copy')], [ShieldCheck, t('securityCard2Title'), t('securityCard2Copy')], [PackageCheck, t('securityCard3Title'), t('securityCard3Copy')]].map(([Icon, title, copy]) => { const Component = Icon as typeof ShieldCheck; return <article key={title as string} className="border border-[#d8d1c7] bg-white p-6"><Component aria-hidden="true" className="text-[#a85e3c]" size={21} /><h3 className="mt-7 text-lg font-semibold tracking-[-.03em]">{title as string}</h3><p className="mt-3 text-sm leading-6 text-[#706b64]">{copy as string}</p></article> })}</div></div></section>

      <section id="use-cases" className="mx-auto max-w-[1080px] px-5 py-24 sm:px-8 sm:py-32"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#a66142]">{t('useCasesEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('useCasesHeading')}</h2></div><div className="mt-12 grid gap-4 md:grid-cols-3">{useCases.map(([title, copy, cta], index) => <article key={title} className="flex min-h-[250px] flex-col border border-[#dedbd5] bg-white p-6 sm:p-7"><span className="font-mono text-xs text-[#a85e3c]">0{index + 1}</span><h3 className="mt-8 text-xl font-semibold tracking-[-.04em]">{title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-[#706b64]">{copy}</p><Link href="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#a85e3c] hover:underline">{cta}<ArrowRight size={15} /></Link></article>)}</div></section>

      <section id="faq" className="mx-auto max-w-[760px] px-5 pb-24 sm:px-8 sm:pb-28"><h2 className="mb-7 text-center text-3xl font-semibold tracking-[-.05em]">{t('faqTitle')}</h2>{[1, 2, 3].map((n) => <details key={n} className="group border-t border-[#dedbd5] py-5 last:border-b"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a66142]">{t(`faq${n}Question`)}<span className="text-xl font-normal text-[#8b5b43] transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-[650px] text-sm leading-6 text-[#706b64]">{t(`faq${n}Answer`)}</p></details>)}</section>

      <section className="bg-[#25241f] px-5 py-24 text-center text-white sm:px-8 sm:py-32"><p className="font-mono text-xs uppercase tracking-[0.15em] text-[#e9b39a]">{t('closingEyebrow')}</p><h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-.065em] sm:text-6xl">{t('closingHeading')}</h2><p className="mx-auto mt-5 max-w-lg text-base leading-7 text-white/70">{t('closingCopy')}</p><Link href="/register" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#25241f] hover:bg-[#f1eee8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{t('buildFirst')}<ArrowRight size={17} /></Link></section>

      <footer className="border-t border-[#dedbd5]"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-5 px-5 py-8 text-sm text-[#716c65] sm:flex-row sm:items-center sm:px-8"><div><Link href="/" className="font-semibold tracking-[-.06em] text-[#24231f]">bantuin.dev</Link><p className="mt-2 text-xs">{t('footerNote')}</p></div><div className="flex flex-wrap gap-x-6 gap-y-3"><a href="#transformation" className="hover:text-[#24231f]">{t('footerFeatures')}</a><a href="#how-it-works" className="hover:text-[#24231f]">{t('footerWorkflow')}</a><a href="#faq" className="hover:text-[#24231f]">FAQ</a><a href="#preview" className="inline-flex items-center gap-1 hover:text-[#24231f]">{t('backToTop')}<ArrowDown className="rotate-180" size={13} /></a></div></div></footer>
    </main>
  )
}
