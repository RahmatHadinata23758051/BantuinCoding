import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

import { AgentHandoffConsole } from '@/app/components/AgentHandoffConsole'
import { ArtifactCardDeck, type ArtifactCard } from '@/app/components/ArtifactCardDeck'
import { CrowdCanvas } from '@/app/components/CrowdCanvas'
import { HeroWorkbench, type HeroWorkbenchFloatingFile, type HeroWorkbenchPreview, type HeroWorkbenchPrompt } from '@/app/components/HeroWorkbench'
import { InteractiveTransformation, type TransformationStage } from '@/app/components/InteractiveTransformation'
import { RevealOnScroll } from '@/app/components/RevealOnScroll'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'

export default async function Home() {
  const t = await getTranslations('Home')
  const tCommon = await getTranslations('Common')

  const prompts: HeroWorkbenchPrompt[] = [
    { label: t('heroPromptOne'), accent: '#f4a261' },
    { label: t('heroPromptTwo'), accent: '#b9d7ff' },
    { label: t('heroPromptThree'), accent: '#b8d8bd' },
  ]

  const heroPreviews: HeroWorkbenchPreview[] = [
    {
      eyebrow: t('heroWorkbenchPreviewOneEyebrow'),
      title: t('heroWorkbenchPreviewOneTitle'),
      lines: [[t('heroWorkbenchPreviewOneAudience'), t('heroWorkbenchPreviewOneAudienceValue')], [t('heroWorkbenchPreviewOneOutcome'), t('heroWorkbenchPreviewOneOutcomeValue')], [t('heroWorkbenchPreviewOneBoundary'), t('heroWorkbenchPreviewOneBoundaryValue')]],
    },
    {
      eyebrow: t('heroWorkbenchPreviewTwoEyebrow'),
      title: t('heroWorkbenchPreviewTwoTitle'),
      lines: [[t('heroWorkbenchPreviewTwoConsumer'), t('heroWorkbenchPreviewTwoConsumerValue')], [t('heroWorkbenchPreviewTwoContract'), t('heroWorkbenchPreviewTwoContractValue')], [t('heroWorkbenchPreviewTwoBoundary'), t('heroWorkbenchPreviewTwoBoundaryValue')]],
    },
    {
      eyebrow: t('heroWorkbenchPreviewThreeEyebrow'),
      title: t('heroWorkbenchPreviewThreeTitle'),
      lines: [[t('heroWorkbenchPreviewThreeAudience'), t('heroWorkbenchPreviewThreeAudienceValue')], [t('heroWorkbenchPreviewThreeOutcome'), t('heroWorkbenchPreviewThreeOutcomeValue')], [t('heroWorkbenchPreviewThreeBoundary'), t('heroWorkbenchPreviewThreeBoundaryValue')]],
    },
  ]

  const heroFloatingFiles: HeroWorkbenchFloatingFile[] = [
    { name: 'PRD.md', subtitle: t('heroWorkbenchFilePrdSubtitle') },
    { name: 'AGENT.md', subtitle: t('heroWorkbenchFileAgentSubtitle') },
    { name: 'ARCHITECTURE.md', subtitle: t('heroWorkbenchFileArchitectureSubtitle') },
    { name: 'RULES.md', subtitle: t('heroWorkbenchFileRulesSubtitle') },
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
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex min-h-[60px] max-w-[1180px] items-center justify-between gap-4 rounded-2xl border border-white/80 bg-[#f7f6f3]/85 px-3 shadow-[0_12px_30px_rgba(36,35,31,0.08)] backdrop-blur-xl sm:min-h-[64px] sm:rounded-full sm:px-5">
          <Link href="/" className="shrink-0 rounded-full px-2 py-1 text-[19px] font-bold tracking-[-0.07em] text-[#24231f] transition-colors hover:text-[#a66142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">bantuin<span className="font-serif font-normal text-[#a66142]">.</span></Link>
          <nav aria-label={t('authNavigationLabel')} className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-1 rounded-full border border-[#dedbd5] bg-white/55 p-1 lg:flex">
              <a href="#engine" className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#716c65] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{t('navWorkflow')}</a>
              <a href="#artifacts" className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#716c65] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{t('navFeatures')}</a>
              <a href="#security" className="rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#716c65] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{t('navSecurity')}</a>
            </div>
            <LanguageSwitcher />
            <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-medium text-[#24231f] transition-colors hover:bg-white/70 sm:inline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{tCommon('signIn')}</Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-[#25241f] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#45433c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{tCommon('getStarted')}<ArrowUpRight size={15} /></Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1240px] px-5 pb-20 pt-8 sm:px-8 sm:pb-28 sm:pt-12 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14">
          <div>
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{t('caption')}</p>
            <h1 className="max-w-[660px] text-[clamp(2.7rem,5.2vw,5.3rem)] font-semibold leading-[1.01] tracking-[-.05em]"><span>{t('heroTitleLead')}</span>{' '}<span className="relative inline-block underline decoration-[#f4a261] decoration-[0.14em] underline-offset-[0.08em]">{t('heroTitleHighlight')}</span>{' '}<span>{t('heroTitleTrail')}</span></h1>
            <p className="mt-8 max-w-[590px] text-base leading-7 text-[#66615b] sm:text-lg sm:leading-8">{t('heroSubtitle')}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#a85e3c] px-6 py-3 text-sm font-semibold text-white shadow-[5px_5px_0_#24231f] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-[#8e4e32] hover:shadow-[7px_7px_0_#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('buildFirst')}<ArrowRight size={17} /></Link>
              <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#c9c4bc] px-6 py-3 text-sm font-semibold transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">{t('openWorkspace')}<ArrowUpRight size={16} /></Link>
            </div>
            <p className="mt-8 max-w-[590px] text-xs leading-5 text-[#8a8178]">{t('heroNote')}</p>
          </div>
          <HeroWorkbench ariaLabel={t('heroSceneAria')} packMeta={t('heroSceneMeta')} workspaceLabel={t('heroWorkbenchWorkspace')} promptLabel={t('heroPromptLabel')} prompts={prompts} note={t('heroSceneNote')} filesLabel={t('heroWorkbenchFiles')} artifactsAriaLabel={t('heroWorkbenchArtifactsAria')} previewBadge={t('heroWorkbenchPreviewBadge')} previewOnlyLabel={t('heroWorkbenchPreviewOnly')} previews={heroPreviews} floatingFiles={heroFloatingFiles} />
        </div>
      </section>

      <section id="engine" className="border-y border-[#dedbd5] bg-[#f0ece6] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-12 flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div className="max-w-2xl"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{t('showcaseEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[.97] tracking-[-.07em] sm:text-6xl">{t('showcaseHeading')}</h2></div>
            <p className="max-w-sm text-sm leading-6 text-[#706b64]">{t('showcaseCopy')}</p>
          </div>
          <RevealOnScroll>
            <InteractiveTransformation ariaLabel={t('transformationAria')} stages={transformationStages} rawLabel={t('transformationRawLabel')} rawCopy={t('transformationRawCopy')} outputLabel={t('transformationOutputLabel')} outputCopy={t('transformationOutputCopy')} />
          </RevealOnScroll>
        </div>
      </section>

      <section id="artifacts" className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8 sm:py-32">
        <RevealOnScroll>
          <ArtifactCardDeck ariaLabel={t('artifactDeckAria')} cards={artifactCards} deckLabel={t('artifactDeckLabel')} deckCopy={t('artifactDeckCopy')} stageLabel={t('artifactDeckStageLabel')} stageCount={t('artifactDeckStageCount', { current: '{current}', total: '{total}' })} />
        </RevealOnScroll>
      </section>

      <section id="handoff" className="relative isolate overflow-hidden border-y border-[#dedbd5] bg-[#25241f] px-5 py-20 text-white sm:px-8 sm:py-28">
        <CrowdCanvas className="absolute inset-0 z-0 opacity-[0.09] mix-blend-screen" />
        <div className="relative z-10 mx-auto max-w-[1120px]">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#f4a261]">{t('handoffEyebrow')}</p><h2 className="mt-5 text-4xl font-semibold leading-[.97] tracking-[-.07em] sm:text-6xl">{t('handoffHeading')}</h2><p className="mt-6 max-w-lg text-base leading-7 text-white/65">{t('handoffCopy')}</p><div className="mt-8 flex flex-wrap gap-2"><span className="border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/65">Claude Code</span><span className="border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/65">Cursor</span><span className="border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/65">Codex</span></div></div>
            <RevealOnScroll>
              <AgentHandoffConsole ariaLabel={t('handoffConsoleAria')} title={t('handoffConsoleTitle')} status={t('handoffConsoleStatus')} connectorLabel={t('handoffConnector')} briefLabel={t('handoffStageBrief')} briefMeta={t('handoffStageBriefMeta')} contextLabel={t('handoffStageContext')} contextMeta={t('handoffStageContextMeta')} packLabel={t('handoffStagePack')} packMeta={t('handoffStagePackMeta')} exportLabel={t('handoffStageExport')} exportMeta={t('handoffStageExportMeta')} agentLabel={t('handoffStageAgent')} agentMeta={t('handoffStageAgentMeta')} command={t('handoffCommand')} prompt={t('handoffPrompt')} notice={t('handoffNotice')} copyLabel={t('handoffCopyButton')} copiedLabel={t('handoffCopied')} copyFailedLabel={t('handoffCopyFailed')} />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section id="security" className="border-y border-[#dedbd5] bg-[#f0ece6]/55 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{t('securityEyebrow')}</p>
              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[.97] tracking-[-.07em] sm:text-6xl">{t('securityHeading')}</h2>
            </div>
            <div className="lg:pb-1">
              <p className="max-w-md text-base leading-7 text-[#706b64]">{t('securityCopy')}</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d8d1c7] bg-[#f7f6f3] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8b5b43]">
                <span className="size-1.5 rounded-full bg-[#a85e3c]" aria-hidden="true" />
                <span>BYOK / DOCS ONLY</span>
              </div>
            </div>
          </div>

          <RevealOnScroll className="mt-12 grid gap-4 md:grid-cols-12" delay={0.08}>
            <article className="group relative min-h-[330px] overflow-hidden rounded-2xl border border-[#d8d1c7] bg-white p-6 shadow-[0_4px_20px_rgba(36,35,31,0.04)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#c9c4bc] hover:shadow-[0_10px_30px_rgba(36,35,31,0.08)] md:col-span-7 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex items-center rounded-lg border border-[#f4a261]/30 bg-[#f4a261]/10 px-2.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#a85e3c]">BYOK</span>
                <span className="rounded-full border border-[#dedbd5] bg-[#f7f6f3] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8b5b43]">01 / CUSTODY</span>
              </div>
              <h3 className="mt-8 max-w-sm text-2xl font-semibold tracking-[-.05em] sm:text-3xl">{t('securityCard1Title')}</h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#706b64]">{t('securityCard1Copy')}</p>

              <div className="mt-8 rounded-xl border border-[#dedbd5] bg-[#f7f6f3] p-3.5" aria-hidden="true">
                <div className="flex flex-wrap gap-2">
                  {['Anthropic', 'OpenAI', 'Gemini', 'OpenRouter'].map((provider, i) => (
                    <span key={provider} className={`rounded-full border border-[#d8d1c7] bg-white px-2.5 py-1.5 font-mono text-[9px] text-[#706b64] security-chip-${i + 1}`}>{provider}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#f4a261]/25 bg-white px-3 py-2.5 security-boundary relative overflow-hidden">
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-[#f4a261]/25 to-transparent security-signal" aria-hidden="true" />
                  <span className="font-mono text-[10px] tracking-[0.08em] text-[#8b5b43]">key_••••••••••••</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#a85e3c]">masked</span>
                </div>
              </div>
              <span className="pointer-events-none absolute -bottom-16 -right-12 size-44 rounded-full border border-[#f4a261]/20 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
            </article>

            <article className="group relative min-h-[330px] overflow-hidden rounded-2xl border border-[#d8d1c7] bg-[#25241f] p-6 text-white shadow-[0_4px_20px_rgba(36,35,31,0.08)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#f4a261]/45 hover:shadow-[0_10px_30px_rgba(36,35,31,0.14)] md:col-span-5 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex items-center rounded-lg border border-[#f4a261]/35 bg-[#f4a261]/10 px-2.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#f4a261]">BYOK</span>
                <span className="rounded-full border border-white/15 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">02 / BOUNDARY</span>
              </div>
              <h3 className="mt-8 max-w-sm text-2xl font-semibold tracking-[-.05em] sm:text-3xl">{t('securityCard2Title')}</h3>
              <p className="mt-3 text-sm leading-6 text-white/60">{t('securityCard2Copy')}</p>
              <div className="mt-8 rounded-xl border border-dashed border-[#f4a261]/35 bg-white/[0.04] p-4 security-boundary relative overflow-hidden" aria-hidden="true">
                <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#f4a261]">
                  <span>credential boundary</span>
                  <span className="size-2 rounded-full bg-[#f4a261] shadow-[0_0_0_5px_rgba(244,162,97,.12)] security-boundary-pulse" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-1.5 opacity-55">
                  <span className="h-1 rounded-full bg-white/30 security-bar-1" />
                  <span className="h-1 rounded-full bg-white/15 security-bar-2" />
                  <span className="h-1 rounded-full bg-white/10 security-bar-3" />
                  <span className="col-span-2 h-1 rounded-full bg-white/15" />
                  <span className="h-1 rounded-full bg-[#f4a261]/45 security-bar-2" />
                </div>
                <p className="mt-4 font-mono text-[8px] uppercase leading-4 tracking-[0.1em] text-white/35">not in export / telemetry</p>
              </div>
              <span className="pointer-events-none absolute -bottom-20 -right-16 size-52 rounded-full border border-white/10" aria-hidden="true" />
            </article>

            <article className="group relative overflow-hidden rounded-2xl border border-[#d8d1c7] bg-white p-6 shadow-[0_4px_20px_rgba(36,35,31,0.04)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#c9c4bc] hover:shadow-[0_10px_30px_rgba(36,35,31,0.08)] md:col-span-12 md:flex md:items-center md:justify-between md:gap-10 md:p-8">
              <div className="max-w-xl">
                <div className="flex items-start justify-between gap-4 md:justify-start">
                  <span className="inline-flex items-center rounded-lg border border-[#d8d1c7] bg-[#f0ece6] px-2.5 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#a85e3c]">PACK</span>
                  <span className="rounded-full border border-[#dedbd5] bg-[#f7f6f3] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8b5b43] md:hidden">03 / OUTPUT</span>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <h3 className="text-2xl font-semibold tracking-[-.05em] sm:text-3xl">{t('securityCard3Title')}</h3>
                  <span className="hidden rounded-full border border-[#dedbd5] bg-[#f7f6f3] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8b5b43] md:inline-flex">03 / OUTPUT</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#706b64]">{t('securityCard3Copy')}</p>
              </div>
              <div className="mt-8 flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-[#dedbd5] bg-[#f7f6f3] p-3 md:mt-0" aria-hidden="true">
                <span className="rounded-lg border border-[#d8d1c7] bg-white px-3 py-2 font-mono text-[10px] text-[#706b64] security-output-1">PRD.md</span>
                <span className="rounded-lg border border-[#d8d1c7] bg-white px-3 py-2 font-mono text-[10px] text-[#706b64] security-output-2">AGENT.md</span>
                <span className="rounded-lg bg-[#a85e3c] px-3 py-2 font-mono text-[10px] font-semibold text-white security-output-3">ZIP</span>
                <span className="w-full px-1 pt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#8b5b43]">standalone UTF-8 / run anywhere</span>
              </div>
            </article>
          </RevealOnScroll>

          <div className="mx-auto mt-24 max-w-[840px] border-t border-[#d8d1c7] pt-14">
            <div className="mb-7 flex items-end justify-between gap-5">
              <h2 className="text-3xl font-semibold tracking-[-.05em] sm:text-4xl">{t('faqTitle')}</h2>
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#a66142] sm:inline">03 / answers</span>
            </div>
            <div className="space-y-3.5">
              {[1, 2, 3].map((n) => (
                <details key={n} className="group rounded-2xl border border-[#dedbd5] bg-white/70 p-5 shadow-[0_3px_14px_rgba(36,35,31,0.025)] transition-[background-color,border-color,box-shadow] duration-300 hover:border-[#c9c4bc] hover:bg-white open:border-[#a66142]/40 open:bg-white open:shadow-[0_8px_24px_rgba(36,35,31,0.06)] sm:p-6">
                  <summary className="flex cursor-pointer list-none items-center gap-4 select-none marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a66142] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f0ece6]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f0ece6] font-mono text-[10px] tracking-[0.08em] text-[#8b5b43] transition-colors group-open:bg-[#f4a261]/15 group-open:text-[#a85e3c]">0{n}</span>
                    <span className="min-w-0 flex-1 text-sm font-semibold leading-6 tracking-[-.01em]">{t(`faq${n}Question`)}</span>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f0ece6] text-lg font-normal leading-none text-[#8b5b43] transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-[#a85e3c] group-open:text-white" aria-hidden="true">+</span>
                  </summary>
                  <p className="ml-[3.25rem] mt-4 max-w-2xl text-sm leading-6 text-[#706b64]">{t(`faq${n}Answer`)}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#dedbd5] bg-[#f4a261] px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1120px] md:flex md:items-end md:justify-between md:gap-10"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f4328]">{t('closingEyebrow')}</p><h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[.97] tracking-[-.07em] text-[#25241f] sm:text-6xl">{t('closingHeading')}</h2><p className="mt-5 max-w-lg text-base leading-7 text-[#5a3d2b]">{t('closingCopy')}</p></div><Link href="/register" className="mt-9 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#25241f] px-6 py-3 text-sm font-semibold text-white shadow-[6px_6px_0_#fffdfa] transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25241f]">{t('buildFirst')}<ArrowRight size={17} /></Link></div></section>

      <footer className="border-t border-[#dedbd5]"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-5 px-5 py-8 text-sm text-[#716c65] sm:flex-row sm:items-center sm:px-8"><div><Link href="/" className="font-semibold tracking-[-.06em] text-[#24231f]">bantuin.dev</Link><p className="mt-2 text-xs">{t('footerNote')}</p></div><div className="flex flex-wrap gap-x-6 gap-y-3"><a href="#engine" className="hover:text-[#24231f]">{t('footerWorkflow')}</a><a href="#artifacts" className="hover:text-[#24231f]">{t('footerFeatures')}</a><a href="#security" className="hover:text-[#24231f]">{t('navSecurity')}</a><a href="#" className="inline-flex items-center gap-1 hover:text-[#24231f]">{t('backToTop')}<ArrowUpRight size={13} /></a></div></div></footer>
    </main>
  )
}
