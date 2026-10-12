import { ArrowRight, ChevronRight, FolderKanban, KeyRound, Plus } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { StatusBadge } from '@/app/components/ui'
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
  const readyProjects = projects.filter((project) => project.status === 'READY' || project.status === 'EXPORTABLE').length
  const activeProjects = projects.filter((project) => ['CONFIGURED', 'ANALYZING', 'CLARIFYING', 'CONTEXT_READY', 'GENERATING'].includes(project.status)).length

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#24231f]">
      <header className="sticky top-0 z-30 border-b border-[#dedbd5] bg-[#fffdfa]/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 text-sm font-semibold">
            <Link href="/" className="shrink-0 rounded px-1 py-1 text-[18px] font-bold tracking-[-0.07em] text-[#24231f] transition-colors hover:text-[#a66142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
              bantuin<span className="font-serif font-normal text-[#a66142]">.</span>
            </Link>
            <span aria-hidden="true" className="text-[#c9c4bc]">/</span>
            <span className="truncate text-[#706b64]">{t('projectLedger')}</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <Link href="/dashboard/provider" className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#706b64] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] sm:inline-flex">
              <KeyRound size={14} aria-hidden="true" />
              {t('providerSettings')}
            </Link>
            <span className="hidden max-w-56 truncate px-2 text-xs text-[#706b64] lg:inline">{session.user.email}</span>
            <LanguageSwitcher />
            <form action={logoutAction}>
              <button type="submit" className="rounded-full px-3 py-2 text-xs font-semibold text-[#706b64] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{tCommon('signOut')}</button>
            </form>
            <Link href="/projects/new" className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#a85e3c] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">
              <Plus size={15} aria-hidden="true" />
              {tCommon('newProject')}
            </Link>
          </div>
        </div>
      </header>

      <div className="w-full px-4 pb-16 sm:px-6 lg:px-8">
        <section aria-labelledby="dashboard-heading" className="border-b border-[#dedbd5] py-7 sm:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#a66142]">{t('workspaceLabel')}</p>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#c9c4bc]" />
                <span className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{projects.length} {t('total')}</span>
              </div>
              <h1 id="dashboard-heading" className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-4xl">{t('title')}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#706b64]">{t('subtitle')}</p>
            </div>
            <Link href="/projects/new" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#a85e3c] bg-[#a85e3c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#8e4e32] hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f] xl:self-auto">
              {t('captureIdea')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-7 grid max-w-3xl grid-cols-3 divide-x divide-[#dedbd5] border-y border-[#dedbd5]">
            <div className="py-3 pr-3 sm:py-4 sm:pr-6">
              <p className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{t('totalProjects')}</p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">{projects.length}</p>
            </div>
            <div className="px-3 py-3 sm:px-6 sm:py-4">
              <p className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{t('readyProjects')}</p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#1b6a4e] sm:text-2xl">{readyProjects}</p>
            </div>
            <div className="py-3 pl-3 sm:py-4 sm:pl-6">
              <p className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{t('activeProjects')}</p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#8e4e32] sm:text-2xl">{activeProjects}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="projects-heading" className="py-8 sm:py-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[#706b64]">{t('projectLedger')}</p>
              <h2 id="projects-heading" className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{t('projects')}</h2>
            </div>
            <Link href="/dashboard/provider" className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-[#a66142] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] sm:hidden">
              <KeyRound size={15} aria-hidden="true" />
              {t('providerSettings')}
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="grid gap-6 rounded-xl border border-[#dedbd5] bg-[#fffdfa] px-5 py-9 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7">
              <div className="max-w-xl">
                <h3 className="text-2xl font-semibold tracking-[-0.045em]">{t('emptyTitle')}</h3>
                <p className="mt-3 text-sm leading-6 text-[#706b64]">{t('emptyDesc')}</p>
              </div>
              <Link href="/projects/new" className="inline-flex min-h-10 items-center justify-center gap-2 justify-self-start rounded-full bg-[#a85e3c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">
                {t('emptyCta')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#dedbd5] bg-[#fffdfa] shadow-[0_1px_3px_rgba(36,35,31,0.04)]">
              <div className="hidden grid-cols-[minmax(240px,2fr)_150px_minmax(180px,1.25fr)_90px_110px_24px] gap-5 border-b border-[#dedbd5] bg-[#f0ece6]/45 px-5 py-3 font-mono text-[10px] tracking-[0.08em] text-[#706b64] md:grid lg:px-6">
                <span>{t('project')}</span>
                <span>{t('state')}</span>
                <span>{t('type')} / {t('agent')}</span>
                <span className="text-right">{t('docs')}</span>
                <span className="text-right">{t('updated')}</span>
                <span aria-hidden="true" />
              </div>
              <ul className="divide-y divide-[#dedbd5]">
                {projects.map((project: Awaited<ReturnType<typeof getUserProjects>>[number]) => {
                  const statusTone = STATUS_TONE[project.status] ?? 'neutral'

                  return (
                    <li key={project.id}>
                      <Link href={`/projects/${project.id}`} className="group grid gap-4 px-4 py-4 transition-colors hover:bg-[#f7f6f3]/70 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#f4a261] sm:px-5 md:grid-cols-[minmax(240px,2fr)_150px_minmax(180px,1.25fr)_90px_110px_24px] md:items-center md:gap-5 lg:px-6">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#dedbd5] bg-[#f7f6f3] text-[#a66142]">
                            <FolderKanban size={15} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#24231f] transition-colors group-hover:text-[#a66142]">{project.name}</p>
                            <p className="mt-1 line-clamp-1 text-xs leading-5 text-[#706b64]">{project.rawIdea.slice(0, 110)}</p>
                            <p className="mt-2 text-xs font-medium leading-5 text-[#8a8178]">{t(NEXT_ACTION_KEY[project.status] ?? 'nextActionDraft')}</p>
                          </div>
                        </div>
                        <div>
                          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.08em] text-[#8a8178] md:hidden">{t('state')}</span>
                          <StatusBadge tone={statusTone} className={statusBadgeClass(statusTone)}>{tStatus(project.status as Parameters<typeof tStatus>[0]) ?? project.status}</StatusBadge>
                        </div>
                        <div className="min-w-0 font-mono text-[11px] leading-5 tracking-[-0.02em] text-[#706b64]">
                          <span className="font-sans text-xs text-[#8a8178] md:hidden">{t('type')} / {t('agent')}: </span>
                          <span className="break-words">{t(CLASSIFICATION_KEY[project.classification] ?? 'classificationOther')}</span>
                          <span className="mx-1 text-[#c9c4bc]">/</span>
                          <span className="break-words">{t(AGENT_KEY[project.targetAgent] ?? 'agentOther')}</span>
                        </div>
                        <div className="font-mono text-[11px] text-[#706b64] md:text-right"><span className="font-sans text-xs text-[#8a8178] md:hidden">{t('docs')}: </span>{project._count.artifacts}</div>
                        <div className="font-mono text-[11px] text-[#8a8178] md:text-right"><span className="font-sans text-xs text-[#8a8178] md:hidden">{t('updated')}: </span>{formatRelative(project.updatedAt, t)}</div>
                        <ChevronRight size={16} className="hidden text-[#c9c4bc] transition-transform group-hover:translate-x-0.5 group-hover:text-[#a66142] md:block" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        <section aria-labelledby="provider-heading" className="border-t border-[#dedbd5] pt-8 sm:pt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[#706b64]">{t('providerSettings')}</p>
              <h2 id="provider-heading" className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{t('openProviderDesk')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#706b64]">{t('chapter01Desc')}</p>
            </div>
            <Link href="/dashboard/provider" className="hidden items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-[#a66142] transition-colors hover:bg-[#f0ece6] hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] sm:inline-flex">
              {t('openProviderDesk')}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="rounded-xl border border-[#dedbd5] bg-[#fffdfa]">
            <ProviderSetupPanel />
          </div>
        </section>
      </div>
    </main>
  )
}
