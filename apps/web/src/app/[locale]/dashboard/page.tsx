import { ArrowRight, KeyRound, Plus } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { PageFrame, StatusBadge, TopBar } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { logoutAction } from '@/lib/auth/actions'
import { getUserProjects } from '@/lib/projects/project-service'
import { getTranslations } from 'next-intl/server'

const STATUS_TONE: Record<string, 'neutral' | 'current' | 'pending' | 'success' | 'danger' | 'accent'> = {
  DRAFT: 'neutral', CONFIGURED: 'current', ANALYZING: 'pending', CLARIFYING: 'pending',
  CONTEXT_READY: 'accent', GENERATING: 'current', READY: 'success', EXPORTABLE: 'success', GENERATION_FAILED: 'danger',
}
const NEXT_ACTION_KEY: Record<string, 'nextActionDraft' | 'nextActionConfigured' | 'nextActionAnalyzing' | 'nextActionClarifying' | 'nextActionContextReady' | 'nextActionGenerating' | 'nextActionReady' | 'nextActionExportable' | 'nextActionGenerationFailed'> = {
  DRAFT: 'nextActionDraft', CONFIGURED: 'nextActionConfigured', ANALYZING: 'nextActionAnalyzing', CLARIFYING: 'nextActionClarifying',
  CONTEXT_READY: 'nextActionContextReady', GENERATING: 'nextActionGenerating', READY: 'nextActionReady', EXPORTABLE: 'nextActionExportable', GENERATION_FAILED: 'nextActionGenerationFailed',
}
const CLASSIFICATION_KEY: Record<string, 'classificationStaticSite' | 'classificationLandingPage' | 'classificationCrudApp' | 'classificationDashboard' | 'classificationSaas' | 'classificationApiService' | 'classificationMobileApp' | 'classificationAiApp' | 'classificationIotDashboard' | 'classificationFullstackComplex' | 'classificationOther'> = {
  STATIC_SITE: 'classificationStaticSite', LANDING_PAGE: 'classificationLandingPage', CRUD_APP: 'classificationCrudApp', DASHBOARD: 'classificationDashboard',
  SAAS: 'classificationSaas', API_SERVICE: 'classificationApiService', MOBILE_APP: 'classificationMobileApp', AI_APP: 'classificationAiApp',
  IOT_DASHBOARD: 'classificationIotDashboard', FULLSTACK_COMPLEX: 'classificationFullstackComplex', OTHER: 'classificationOther',
}
const AGENT_KEY: Record<string, 'agentClaudeCode' | 'agentCodex' | 'agentOpencode' | 'agentAntigravity' | 'agentCursor' | 'agentOther'> = {
  CLAUDE_CODE: 'agentClaudeCode', CODEX: 'agentCodex', OPENCODE: 'agentOpencode', ANTIGRAVITY: 'agentAntigravity', CURSOR: 'agentCursor', OTHER: 'agentOther',
}

function formatRelative(value: Date | string, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return t('justNow')
  if (minutes < 60) return t('mAgo', { minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hAgo', { hours })
  return t('dAgo', { days: Math.floor(hours / 24) })
}

function statusBadgeClass(tone: 'neutral' | 'current' | 'pending' | 'success' | 'danger' | 'accent') {
  const styles = {
    neutral: '!border-[#dedbd5] !bg-[#f0ece6] !text-[#706b64]',
    current: '!border-[#a85e3c]/30 !bg-[#a85e3c]/10 !text-[#8e4e32]',
    pending: '!border-[#f4a261]/35 !bg-[#f4a261]/15 !text-[#8b5b43]',
    success: '!border-[#b8d8bd] !bg-[#eef7f0] !text-[#1b6a4e]',
    danger: '!border-[#e8b4a4] !bg-[#fff1ee] !text-[#8e3a25]',
    accent: '!border-[#c9bce8] !bg-[#f3f0fa] !text-[#65518f]',
  } as const

  return `!border ${styles[tone]}`
}

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard')
  const tCommon = await getTranslations('Common')
  const tStatus = await getTranslations('Status')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const projects = await getUserProjects(session.user.id)

  return (
    <PageFrame width="7xl" className="bg-[#f7f6f3] py-4 text-[#24231f] sm:py-6" contentClassName="overflow-hidden border-[#dedbd5] bg-[#fffdfa]">
      <TopBar className="border-[#dedbd5] bg-[#fffdfa] px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3 text-sm font-semibold">
          <Link href="/" className="shrink-0 rounded-full px-1 py-1 text-[18px] font-bold tracking-[-0.07em] text-[#24231f] transition-colors hover:text-[#a66142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
            bantuin<span className="font-serif font-normal text-[#a66142]">.</span>
          </Link>
          <span aria-hidden="true" className="text-[#c9c4bc]">/</span>
          <span className="truncate">{t('title')}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <span className="hidden max-w-56 truncate px-2 text-xs text-[#706b64] lg:inline">{session.user.email}</span>
          <LanguageSwitcher />
          <form action={logoutAction}>
            <button type="submit" className="rounded-full px-3 py-2 text-xs font-semibold text-[#706b64] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{tCommon('signOut')}</button>
          </form>
          <Link href="/projects/new" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#a85e3c] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">
            <Plus size={15} aria-hidden="true" />
            {tCommon('newProject')}
          </Link>
        </div>
      </TopBar>

      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <header className="flex flex-col gap-8 border-b border-[#dedbd5] py-10 sm:py-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.065em] sm:text-6xl">{t('title')}</h1>
              <span className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{projects.length} {t('total')}</span>
            </div>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#706b64]">{t('subtitle')}</p>
          </div>
          <Link href="/projects/new" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-[#a85e3c] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f] md:self-auto">
            {t('captureIdea')}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </header>

        <section aria-labelledby="projects-heading" className="py-10 sm:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[#706b64]">{t('projectLedger')}</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <h2 id="projects-heading" className="text-3xl font-semibold tracking-[-0.055em]">{t('projects')}</h2>
                <span className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{projects.length} {t('total')}</span>
              </div>
            </div>
            <Link href="/dashboard/provider" className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-[#a66142] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
              <KeyRound size={15} aria-hidden="true" />
              {t('openProviderDesk')}
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="grid gap-8 rounded-2xl border border-[#dedbd5] bg-[#fffdfa] px-5 py-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7 sm:py-14">
              <div className="max-w-xl">
                <h3 className="text-2xl font-semibold tracking-[-0.045em]">{t('emptyTitle')}</h3>
                <p className="mt-3 text-sm leading-6 text-[#706b64]">{t('emptyDesc')}</p>
              </div>
              <Link href="/projects/new" className="inline-flex min-h-11 items-center justify-center gap-2 justify-self-start rounded-full bg-[#a85e3c] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">
                {t('emptyCta')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#dedbd5] bg-[#fffdfa]">
              <div className="hidden grid-cols-[minmax(190px,1.4fr)_minmax(140px,1fr)_minmax(110px,.8fr)_90px_90px] gap-5 border-b border-[#dedbd5] bg-[#f7f6f3]/65 px-5 py-3 font-mono text-[10px] tracking-[0.08em] text-[#8a8178] md:grid md:px-6">
                <span>{t('project')}</span>
                <span>{t('state')}</span>
                <span>{t('type')} / {t('agent')}</span>
                <span className="text-right">{t('docs')}</span>
                <span className="text-right">{t('updated')}</span>
              </div>
              <ul className="divide-y divide-[#dedbd5]">
                {projects.map((project: Awaited<ReturnType<typeof getUserProjects>>[number]) => {
                  const statusTone = STATUS_TONE[project.status] ?? 'neutral'

                  return (
                    <li key={project.id}>
                      <Link href={`/projects/${project.id}`} className="group grid gap-4 px-5 py-5 transition-colors hover:bg-[#f7f6f3]/60 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#f4a261] sm:px-6 md:grid-cols-[minmax(190px,1.4fr)_minmax(140px,1fr)_minmax(110px,.8fr)_90px_90px] md:items-center md:gap-5">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold tracking-[-0.025em] text-[#24231f] transition-colors group-hover:text-[#a66142]">{project.name}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#706b64]">{project.rawIdea.slice(0, 90)}</p>
                          <p className="mt-3 text-xs font-medium leading-5 text-[#8a8178]">{t(NEXT_ACTION_KEY[project.status] ?? 'nextActionDraft')}</p>
                        </div>
                        <div>
                          <span className="mb-1 block font-mono text-[10px] tracking-[0.08em] text-[#8a8178] md:hidden">{t('state')}</span>
                          <StatusBadge tone={statusTone} className={statusBadgeClass(statusTone)}>{tStatus(project.status as Parameters<typeof tStatus>[0]) ?? project.status}</StatusBadge>
                        </div>
                        <div className="font-mono text-[11px] leading-5 tracking-[-0.02em] text-[#706b64]">
                          <span className="font-sans text-xs text-[#8a8178] md:hidden">{t('type')} / {t('agent')}: </span>
                          {t(CLASSIFICATION_KEY[project.classification] ?? 'classificationOther')}
                          <span className="mx-1 text-[#c9c4bc]">/</span>
                          {t(AGENT_KEY[project.targetAgent] ?? 'agentOther')}
                        </div>
                        <div className="font-mono text-[11px] text-[#706b64] md:text-right"><span className="font-sans text-xs text-[#8a8178] md:hidden">{t('docs')}: </span>{project._count.artifacts}</div>
                        <div className="font-mono text-[11px] text-[#8a8178] md:text-right"><span className="font-sans text-xs text-[#8a8178] md:hidden">{t('updated')}: </span>{formatRelative(project.updatedAt, t)}</div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        <section aria-labelledby="provider-heading" className="grid gap-8 border-t border-[#dedbd5] py-10 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start sm:py-12">
          <div>
            <p className="text-sm text-[#706b64]">{t('providerSettings')}</p>
            <h2 id="provider-heading" className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{t('openProviderDesk')}</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#706b64]">{t('chapter01Desc')}</p>
            <div className="mt-6"><ProviderSetupPanel /></div>
          </div>
          <div className="sm:border-l sm:border-[#dedbd5] sm:pl-6">
            <p className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{t('providerSettings')}</p>
            <Link href="/dashboard/provider" className="mt-4 inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-[#a66142] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
              {t('openProviderDesk')}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </PageFrame>
  )
}
