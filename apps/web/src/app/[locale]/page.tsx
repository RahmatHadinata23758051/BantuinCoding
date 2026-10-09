import { ArrowRight, ArrowUpRight, KeyRound, PackageCheck, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

import { AgentHandoffConsole } from '@/app/components/AgentHandoffConsole'
import { ArtifactCardDeck, type ArtifactCard } from '@/app/components/ArtifactCardDeck'
import { Hero3DScene, type HeroPrompt } from '@/app/components/Hero3DScene'
import { InteractiveTransformation, type TransformationStage } from '@/app/components/InteractiveTransformation'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'

export default async function Home() {
  const t = await getTranslations('Home')
  const tCommon = await getTranslations('Common')

  const prompts: HeroPrompt[] = [
    { label: t('heroPromptOne'), accent: '#f4a261' },
    { label: t('heroPromptTwo'), accent: '#b9d7ff' },
    { label: t('heroPromptThree'), accent: '#b8d8bd' },
  ]

  const transformationStages: TransformationStage[] = [
    { id: 'idea', number: '01', label: t('showcaseIdea'), detail: t('showcaseIdeaDetail'), artifact: 'idea.md' },
    { id: 'analysis', number: '02', label: t('showcaseAnalysis'), detail: t('showcaseAnalysisDetail'), artifact: 'requirements.json' },
    { id: 'context', number: '03', label: t('showcaseContext'), detail: t('showcaseContextDetail'), artifact: 'context.json' },
    { id: 'documents', number: '04', label: t('showcaseDocuments'), detail: t('showcaseDocumentsDetail'), artifact: 'docs/*.md' },
    { id: 'handoff', number: '05', label: t('showcaseHandoff'), detail: t('showcaseHandoffDetail'), artifact: 'bootstrap-pack.zip' },
  ]

  const artifactCards: ArtifactCard[] = [
    { name: 'PRD.md', type: t('artifactPrdType'), description: t('artifactPrdDescription'), snippet: t('artifactPrdSnippet') },
    { name: 'SRS.md', type: t('artifactSrsType'), description: t('artifactSrsDescription'), snippet: t('artifactSrsSnippet') },
    { name: 'ARCHITECTURE.md', type: t('artifactArchitectureType'), description: t('artifactArchitectureDescription'), snippet: t('artifactArchitectureSnippet') },
    { name: 'AGENT.md', type: t('artifactAgentType'), description: t('artifactAgentDescription'), snippet: t('artifactAgentSnippet') },
    { name: 'RULES.md', type: t('artifactRulesType'), description: t('artifactRulesDescription'), snippet: t('artifactRulesSnippet') },
    { name: 'SKILLS/', type: t('artifactSkillsType'), description: t('artifactSkillsDescription'), snippet: t('artifactSkillsSnippet') },
    { name: 'BACKLOG.md', type: t('artifactBacklogType'), description: t('artifactBacklogDescription'), snippet: t('artifactBacklogSnippet') },
  ]

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f7f6f3] text-[#24231f] selection:bg-[#f4a261] selection:text-[#24231f]">
      <header className="sticky top-0 z-30 border-b border-[#dedbd5] bg-[#f7f6f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[66px] max-w-[1240px] items-center justify-between gap-5 px-5 sm:px-8">
          <Link href="/" className="shrink-0 text-[19px] font-bold tracking-[-0.07em]">bantuin<span className="font-serif font-normal text-[#a66142]">.</span></Link>
          <nav aria-label={t('authNavigationLabel')} className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#716c65] lg:flex">
              <a href="#engine" className="transition-colors hover:text-[#24231f]">{t('navWorkflow')}</a>
              <a href="#artifacts" className="transition-colors hover:text-[#24231f]">{t('navFeatures')}</a>
              <a href="#security" className="transition-colors hover:text-[#24231f]">{t('navSecurity')}</a>
            </div>
            <LanguageSwitcher />
            <Link href="/login" className="hidden px-2 py-2 text-sm font-medium hover:underline sm:inline">{tCommon('signIn')}</Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#25241f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#45433c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{tCommon('getStarted')}<ArrowUpRight size={15} /></Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1240px] px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14">
          <div>
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{t('caption')}</p>
            <h1 className="max-w-[660px] text-[clamp(2.7rem,5.2vw,5.3rem)] font-semibold leading-[1.01] tracking-[-.05em]"><span>{t('heroTitleLead')}</span>{' '}<span className="relative inline-block underline decoration-[#f4a261] decoration-[0.14em] underline-offset-[0.08em]">{t('heroTitleHighlight')}</span>{' '}<span>{t('heroTitleTrail')}</span></h1>
            <p className="mt-8 max-w-[590px] text-base leading-7 text-[#66615b] sm:text-lg sm:leading-8">{t('heroSubtitle')}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a85e3c] px-6 py-3 text-sm font-semibold text-white shadow-[5px_5px_0_#24231f] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-[#8e4e32] hover:shadow-[7px_7px_0_#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('buildFirst')}<ArrowRight size={17} /></Link>
              <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#c9c4bc] px-6 py-3 text-sm font-semibold transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('openWorkspace')}<ArrowUpRight size={16} /></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#8a8178]"><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#6f9474]" />{t('heroNote')}</span><span>{t('heroAsideEyebrow')}</span></div>
          </div>
          <Hero3DScene ariaLabel={t('heroSceneAria')} statusLabel={t('heroSceneStatus')} packMeta={t('heroSceneMeta')} promptLabel={t('heroPromptLabel')} prompts={prompts} note={t('heroSceneNote')} />
        </div>
      </section>

      <section id="engine" className="border-y border-[#dedbd5] bg-[#f0ece6] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-12 flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div className="max-w-2xl"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{t('showcaseEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[.97] tracking-[-.07em] sm:text-6xl">{t('showcaseHeading')}</h2></div>
            <p className="max-w-sm text-sm leading-6 text-[#706b64]">{t('showcaseCopy')}</p>
          </div>
          <InteractiveTransformation ariaLabel={t('transformationAria')} stages={transformationStages} rawLabel={t('transformationRawLabel')} rawCopy={t('transformationRawCopy')} outputLabel={t('transformationOutputLabel')} outputCopy={t('transformationOutputCopy')} />
        </div>
      </section>

      <section id="artifacts" className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8 sm:py-32">
        <ArtifactCardDeck ariaLabel={t('artifactDeckAria')} cards={artifactCards} deckLabel={t('artifactDeckLabel')} deckCopy={t('artifactDeckCopy')} />
      </section>

      <section id="handoff" className="border-y border-[#dedbd5] bg-[#25241f] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#f4a261]">{t('handoffEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[.97] tracking-[-.07em] sm:text-6xl">{t('handoffHeading')}</h2><p className="mt-6 max-w-lg text-base leading-7 text-white/65">{t('handoffCopy')}</p><div className="mt-8 flex flex-wrap gap-2"><span className="border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/65">Claude Code</span><span className="border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/65">Cursor</span><span className="border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/65">Codex</span></div></div>
            <AgentHandoffConsole ariaLabel={t('handoffConsoleAria')} title={t('handoffConsoleTitle')} status={t('handoffConsoleStatus')} packLabel={t('handoffStagePack')} packMeta={t('handoffStagePackMeta')} contextLabel={t('handoffStageContext')} contextMeta={t('handoffStageContextMeta')} agentLabel={t('handoffStageAgent')} agentMeta={t('handoffStageAgentMeta')} connectorLabel={t('handoffConnector')} command={t('handoffCommand')} prompt={t('handoffPrompt')} notice={t('handoffNotice')} copyLabel={t('handoffCopyButton')} copiedLabel={t('handoffCopied')} copyFailedLabel={t('handoffCopyFailed')} />
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{t('securityEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[.97] tracking-[-.07em] sm:text-6xl">{t('securityHeading')}</h2><p className="mt-6 max-w-md text-base leading-7 text-[#706b64]">{t('securityCopy')}</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{[[KeyRound, t('securityCard1Title'), t('securityCard1Copy')], [ShieldCheck, t('securityCard2Title'), t('securityCard2Copy')], [PackageCheck, t('securityCard3Title'), t('securityCard3Copy')]].map(([Icon, title, copy]) => { const Component = Icon as typeof ShieldCheck; return <article key={title as string} className="border border-[#d8d1c7] bg-white p-5 transition-transform hover:-translate-y-1 sm:p-6"><Component aria-hidden="true" className="text-[#a85e3c]" size={21} /><h3 className="mt-7 text-lg font-semibold tracking-[-.03em]">{title as string}</h3><p className="mt-3 text-sm leading-6 text-[#706b64]">{copy as string}</p></article> })}</div>
        </div>
        <div className="mx-auto mt-20 max-w-[760px]"><h2 className="mb-7 text-center text-3xl font-semibold tracking-[-.05em]">{t('faqTitle')}</h2>{[1, 2, 3].map((n) => <details key={n} className="group border-t border-[#dedbd5] py-5 last:border-b"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a66142]">{t(`faq${n}Question`)}<span className="text-xl font-normal text-[#8b5b43] transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-[650px] text-sm leading-6 text-[#706b64]">{t(`faq${n}Answer`)}</p></details>)}</div>
      </section>

      <section className="border-t border-[#dedbd5] bg-[#f4a261] px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1120px] md:flex md:items-end md:justify-between md:gap-10"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f4328]">{t('closingEyebrow')}</p><h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[.97] tracking-[-.07em] text-[#25241f] sm:text-6xl">{t('closingHeading')}</h2><p className="mt-5 max-w-lg text-base leading-7 text-[#5a3d2b]">{t('closingCopy')}</p></div><Link href="/register" className="mt-9 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#25241f] px-6 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_#fffdfa] transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25241f]">{t('buildFirst')}<ArrowRight size={17} /></Link></div></section>

      <footer className="border-t border-[#dedbd5]"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-5 px-5 py-8 text-sm text-[#716c65] sm:flex-row sm:items-center sm:px-8"><div><Link href="/" className="font-semibold tracking-[-.06em] text-[#24231f]">bantuin.dev</Link><p className="mt-2 text-xs">{t('footerNote')}</p></div><div className="flex flex-wrap gap-x-6 gap-y-3"><a href="#engine" className="hover:text-[#24231f]">{t('footerWorkflow')}</a><a href="#artifacts" className="hover:text-[#24231f]">{t('footerFeatures')}</a><a href="#security" className="hover:text-[#24231f]">{t('navSecurity')}</a><a href="#" className="inline-flex items-center gap-1 hover:text-[#24231f]">{t('backToTop')}<ArrowUpRight size={13} /></a></div></div></footer>
    </main>
  )
}
