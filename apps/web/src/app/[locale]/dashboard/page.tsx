import { ArrowUpRight, ChevronRight, FolderKanban, KeyRound, LayoutGrid, Plus, Settings2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
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
const PIPELINE_STEPS = ['idea', 'clarify', 'context', 'generate', 'export'] as const
const PIPELINE_INDEX: Record<string, number> = {
  DRAFT: 0, CONFIGURED: 0, ANALYZING: 1, CLARIFYING: 1, CONTEXT_READY: 2, GENERATING: 3, READY: 4, EXPORTABLE: 4, GENERATION_FAILED: 3,
}

type Tone = 'neutral' | 'current' | 'pending' | 'success' | 'danger' | 'accent'

function formatRelative(value: Date | string, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return t('justNow')
  if (minutes < 60) return t('mAgo', { minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hAgo', { hours })
  return t('dAgo', { days: Math.floor(hours / 24) })
}

function statusBadgeClass(tone: Tone) {
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

function statusRailClass(tone: Tone) {
  return {
    neutral: 'bg-[#b8b1a8]',
    current: 'bg-[#a85e3c]',
    pending: 'bg-[#f4a261]',
    success: 'bg-[#5c9b73]',
    danger: 'bg-[#c45b46]',
    accent: 'bg-[#8774b2]',
  }[tone]
}

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard')
  const tCommon = await getTranslations('Common')
  const tStatus = await getTranslations('Status')
  const tPipeline = await getTranslations('Pipeline')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const projects = await getUserProjects(session.user.id)
  const readyProjects = projects.filter((project) => project.status === 'READY' || project.status === 'EXPORTABLE').length
  const activeProjects = projects.filter((project) => ['CONFIGURED', 'ANALYZING', 'CLARIFYING', 'CONTEXT_READY', 'GENERATING'].includes(project.status)).length

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#24231f]">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="border-b border-[#393832] bg-[#292823] text-[#f7f6f3] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:block lg:px-5 lg:py-6">
            <Link href="/" className="inline-block rounded px-1 py-1 text-[19px] font-bold tracking-[-0.07em] text-[#fffdfa] transition-colors hover:text-[#f4a261] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
              bantuin<span className="font-serif font-normal text-[#f4a261]">.</span>
            </Link>
            <span className="hidden font-mono text-[9px] tracking-[0.12em] text-[#aaa69d] lg:mt-2 lg:block">PROJECT WORKSPACE</span>
            <span className="font-mono text-[10px] text-[#aaa69d] lg:hidden">{t('workspaceNav')}</span>
          </div>

          <nav aria-label={t('workspaceNav')} className="flex gap-1 overflow-x-auto px-4 pb-4 sm:px-6 lg:block lg:space-y-1 lg:px-3 lg:pb-0">
            <Link href="/dashboard" aria-current="page" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#f7f6f3] px-3 py-2.5 text-xs font-semibold text-[#292823] shadow-[0_1px_0_rgba(0,0,0,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] lg:flex">
              <LayoutGrid size={15} aria-hidden="true" />
              {t('overviewNav')}
            </Link>
            <Link href="/dashboard" className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#c4c0b8] transition-colors hover:bg-[#393832] hover:text-[#fffdfa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] lg:flex">
              <FolderKanban size={15} aria-hidden="true" />
              {t('projects')}
            </Link>
          </nav>

          <div className="hidden px-3 pt-8 lg:block">
            <p className="px-3 font-mono text-[9px] tracking-[0.13em] text-[#817d75]">{t('toolsNav')}</p>
            <Link href="/dashboard/provider" className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#c4c0b8] transition-colors hover:bg-[#393832] hover:text-[#fffdfa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
              <KeyRound size={15} aria-hidden="true" />
              {t('providerSettings')}
            </Link>
          </div>

          <div className="hidden border-t border-[#393832] px-4 py-5 lg:mt-auto lg:block">
            <p className="truncate text-xs font-medium text-[#f7f6f3]">{session.user.email}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <LanguageSwitcher />
              <form action={logoutAction}>
                <button type="submit" className="rounded-md px-2 py-1.5 text-xs font-medium text-[#aaa69d] transition-colors hover:bg-[#393832] hover:text-[#fffdfa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">{tCommon('signOut')}</button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex min-h-[65px] items-center justify-between gap-4 border-b border-[#dedbd5] bg-[#fffdfa]/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{t('workspaceLabel')}</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#24231f]">{t('projectLedger')}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden sm:block"><LanguageSwitcher /></div>
              <Link href="/projects/new" className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#a85e3c] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">
                <Plus size={15} aria-hidden="true" />
                <span className="hidden sm:inline">{tCommon('newProject')}</span>
                <span className="sm:hidden">{t('captureIdea')}</span>
              </Link>
            </div>
          </header>

          <div className="px-4 pb-16 sm:px-6 lg:px-8">
            <section aria-labelledby="dashboard-heading" className="border-b border-[#dedbd5] py-8 sm:py-10">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[#a66142]">
                    <span>{t('workspaceLabel')}</span>
                    <span aria-hidden="true" className="text-[#c9c4bc]">/</span>
                    <span className="text-[#8a8178]">{projects.length} {t('total')}</span>
                  </div>
                  <h1 id="dashboard-heading" className="mt-3 text-3xl font-semibold leading-[1.05] tracking-[-0.06em] sm:text-5xl">{t('workspaceTitle')}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#706b64]">{t('subtitle')}</p>
                </div>
                <Link href="/dashboard/provider" className="inline-flex items-center gap-2 self-start rounded-lg border border-[#dedbd5] bg-[#fffdfa] px-3.5 py-2.5 text-xs font-semibold text-[#706b64] transition-colors hover:border-[#a85e3c]/40 hover:text-[#a66142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] xl:self-auto">
                  <Settings2 size={14} aria-hidden="true" />
                  {t('providerSettings')}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-8 grid max-w-4xl gap-px overflow-hidden rounded-xl border border-[#dedbd5] bg-[#dedbd5] sm:grid-cols-3">
                <div className="bg-[#fffdfa] px-4 py-4 sm:px-5">
                  <p className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{t('totalProjects')}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{projects.length}</p>
                  <p className="mt-1 text-xs text-[#8a8178]">{t('projectLedger')}</p>
                </div>
                <div className="bg-[#fffdfa] px-4 py-4 sm:px-5">
                  <p className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{t('readyProjects')}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#1b6a4e]">{readyProjects}</p>
                  <p className="mt-1 text-xs text-[#8a8178]">{t('readyProjectsHint')}</p>
                </div>
                <div className="bg-[#fffdfa] px-4 py-4 sm:px-5">
                  <p className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{t('activeProjects')}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#8e4e32]">{activeProjects}</p>
                  <p className="mt-1 text-xs text-[#8a8178]">{t('activeProjectsHint')}</p>
                </div>
              </div>
            </section>

            <section aria-labelledby="projects-heading" className="pt-8 sm:pt-10">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.1em] text-[#a66142]">{t('projectLedger')}</p>
                  <h2 id="projects-heading" className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{t('projects')}</h2>
                </div>
                {projects.length > 0 && <span className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{projects.length} {t('total')}</span>}
              </div>

              {projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#c9c4bc] bg-[#fffdfa] px-5 py-10 sm:px-8">
                  <h3 className="text-2xl font-semibold tracking-[-0.045em]">{t('emptyTitle')}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#706b64]">{t('emptyDesc')}</p>
                  <Link href="/projects/new" className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#a85e3c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8e4e32] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24231f]">
                    {t('emptyCta')}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project: Awaited<ReturnType<typeof getUserProjects>>[number]) => {
                    const statusTone = STATUS_TONE[project.status] ?? 'neutral'
                    const currentStep = PIPELINE_INDEX[project.status] ?? 0

                    return (
                      <Link href={`/projects/${project.id}`} key={project.id} className="group relative flex min-h-[270px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dedbd5] bg-[#fffdfa] p-5 shadow-[0_1px_2px_rgba(36,35,31,0.03)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#b9afa4] hover:shadow-[0_10px_24px_rgba(36,35,31,0.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
                        <span className={`absolute inset-y-0 left-0 w-1 ${statusRailClass(statusTone)}`} aria-hidden="true" />
                        <div className="flex items-start justify-between gap-3 pl-1">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#dedbd5] bg-[#f7f6f3] text-[#a66142]">
                            <FolderKanban size={17} aria-hidden="true" />
                          </span>
                          <StatusBadge tone={statusTone} className={statusBadgeClass(statusTone)}>{tStatus(project.status as Parameters<typeof tStatus>[0]) ?? project.status}</StatusBadge>
                        </div>
                        <div className="mt-5 min-w-0 pl-1">
                          <h3 className="truncate text-lg font-semibold tracking-[-0.035em] text-[#24231f] transition-colors group-hover:text-[#a66142]">{project.name}</h3>
                          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#706b64]">{project.rawIdea}</p>
                        </div>
                        <div className="mt-5 pl-1">
                          <div className="flex items-center justify-between gap-2 font-mono text-[9px] tracking-[-0.01em] text-[#8a8178]">
                            {PIPELINE_STEPS.map((step, index) => (
                              <span key={step} className={index <= currentStep ? 'font-semibold text-[#a66142]' : ''}>{tPipeline(step)}</span>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center gap-1" aria-label={t('pipelineProgress')}>
                            {PIPELINE_STEPS.map((step, index) => (
                              <span key={step} className={`h-1.5 flex-1 rounded-full ${index <= currentStep ? statusRailClass(statusTone) : 'bg-[#e7e2dc]'}`} aria-hidden="true" />
                            ))}
                          </div>
                        </div>
                        <p className="mt-4 pl-1 text-xs font-medium leading-5 text-[#8a8178]">{t(NEXT_ACTION_KEY[project.status] ?? 'nextActionDraft')}</p>
                        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#ebe7e1] pt-4 pl-1">
                          <div className="min-w-0 font-mono text-[10px] leading-5 text-[#706b64]">
                            <p className="truncate">{t(CLASSIFICATION_KEY[project.classification] ?? 'classificationOther')}</p>
                            <p className="truncate text-[#8a8178]">{t(AGENT_KEY[project.targetAgent] ?? 'agentOther')}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-[#8a8178]">
                            <span>{project._count.artifacts} {t('docs')}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatRelative(project.updatedAt, t)}</span>
                            <ChevronRight size={14} className="text-[#c9c4bc] transition-transform group-hover:translate-x-0.5 group-hover:text-[#a66142]" aria-hidden="true" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="mt-8 grid gap-4 border-t border-[#dedbd5] pt-8 sm:mt-10 sm:grid-cols-[minmax(0,1fr)_280px] sm:pt-10">
              <div>
                <p className="font-mono text-[10px] tracking-[0.1em] text-[#a66142]">{t('providerSettings')}</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">{t('providerSummaryTitle')}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#706b64]">{t('providerSummary')}</p>
              </div>
              <Link href="/dashboard/provider" className="group flex items-center justify-between rounded-xl border border-[#dedbd5] bg-[#fffdfa] p-4 transition-[border-color,box-shadow] hover:border-[#b9afa4] hover:shadow-[0_8px_20px_rgba(36,35,31,0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]">
                <span className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0ece6] text-[#a66142]"><KeyRound size={16} aria-hidden="true" /></span>
                  <span className="text-sm font-semibold text-[#24231f]">{t('openProviderDesk')}</span>
                </span>
                <ArrowUpRight size={16} className="text-[#a66142] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
