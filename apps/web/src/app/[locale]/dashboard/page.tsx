import { ArrowRight, FileText, KeyRound, Plus } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { PipelineSpine } from '@/app/components/PipelineSpine'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { StatusBadge, buttonClassName } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { logoutAction } from '@/lib/auth/actions'
import { getUserProjects } from '@/lib/projects/project-service'
import { getTranslations } from 'next-intl/server'

const STATUS_TONE: Record<string, 'neutral' | 'current' | 'pending' | 'success' | 'danger' | 'accent'> = {
  DRAFT: 'neutral',
  CONFIGURED: 'current',
  ANALYZING: 'pending',
  CLARIFYING: 'pending',
  CONTEXT_READY: 'accent',
  GENERATING: 'current',
  READY: 'success',
  EXPORTABLE: 'success',
  GENERATION_FAILED: 'danger',
}

const CLASSIFICATION_KEY: Record<string, string> = {
  STATIC_SITE: 'classificationStaticSite',
  LANDING_PAGE: 'classificationLandingPage',
  CRUD_APP: 'classificationCrudApp',
  DASHBOARD: 'classificationDashboard',
  SAAS: 'classificationSaas',
  API_SERVICE: 'classificationApiService',
  MOBILE_APP: 'classificationMobileApp',
  AI_APP: 'classificationAiApp',
  IOT_DASHBOARD: 'classificationIotDashboard',
  FULLSTACK_COMPLEX: 'classificationFullstackComplex',
  OTHER: 'classificationOther',
}

const AGENT_KEY: Record<string, string> = {
  CLAUDE_CODE: 'agentClaudeCode',
  CODEX: 'agentCodex',
  OPENCODE: 'agentOpencode',
  ANTIGRAVITY: 'agentAntigravity',
  CURSOR: 'agentCursor',
  OTHER: 'agentOther',
}

const NEXT_ACTION_KEY: Record<string, string> = {
  DRAFT: 'nextActionDraft',
  CONFIGURED: 'nextActionConfigured',
  ANALYZING: 'nextActionAnalyzing',
  CLARIFYING: 'nextActionClarifying',
  CONTEXT_READY: 'nextActionContextReady',
  GENERATING: 'nextActionGenerating',
  READY: 'nextActionReady',
  EXPORTABLE: 'nextActionExportable',
  GENERATION_FAILED: 'nextActionGenerationFailed',
}

function formatRelative(value: Date | string, t: Awaited<ReturnType<typeof getTranslations>>) {
  const date = typeof value === 'string' ? new Date(value) : value
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('justNow')
  if (minutes < 60) return t('mAgo', { minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hAgo', { hours })
  return t('dAgo', { days: Math.floor(hours / 24) })
}

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard')
  const tCommon = await getTranslations('Common')
  const tStatus = await getTranslations('Status')
  const nextActionLabel = t('nextActionLabel')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const projects = await getUserProjects(session.user.id)

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-5 text-[var(--ink)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--ink)]/15 pb-5">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cobalt)]">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--lavender)] text-sm font-bold">BC</span>
            <span className="text-sm font-semibold tracking-tight">{t('workspaceLabel')}</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <span className="hidden max-w-56 truncate text-sm text-[var(--paper-muted)] sm:inline">{session.user.email}</span>
            <LanguageSwitcher />
            <form action={logoutAction}>
              <button type="submit" className={buttonClassName({ variant: 'neutral', size: 'sm', className: 'rounded-lg border border-[var(--ink)]/15 bg-white shadow-none' })}>
                {tCommon('signOut')}
              </button>
            </form>
            <Link href="/projects/new" className={buttonClassName({ variant: 'primary', size: 'sm', className: 'rounded-lg shadow-none' })}>
              <Plus size={16} aria-hidden="true" /> {tCommon('newProject')}
            </Link>
          </div>
        </header>

        <section className="grid gap-6 border-b border-[var(--ink)]/10 py-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10 md:py-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--paper-muted)]">{t('controlDesk')}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--paper-muted)]">{t('subtitle')}</p>
          </div>
          <nav aria-label={t('actionsLabel')} className="flex flex-wrap gap-2">
            <Link href="/projects/new" className={buttonClassName({ variant: 'primary', className: 'rounded-lg shadow-none' })}>
              {t('captureIdea')} <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/dashboard/provider" className={buttonClassName({ variant: 'neutral', className: 'rounded-lg border border-[var(--ink)]/15 bg-white shadow-none' })}>
              <KeyRound size={15} aria-hidden="true" /> {t('providerSettings')}
            </Link>
          </nav>
        </section>

        <section aria-label={t('chapter01')} className="py-5">
          <PipelineSpine current="idea" compact className="mb-5 rounded-xl border border-[var(--ink)]/10 bg-white shadow-none" />
          <div className="[&>div]:!rounded-xl [&>div]:!border [&>div]:!border-[var(--ink)]/10 [&>div]:!shadow-none">
            <ProviderSetupPanel />
          </div>
        </section>

        <section aria-labelledby="projects-heading" className="pb-10 pt-3">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--ink)]/15 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--paper-muted)]">{t('projectLedger')}</p>
              <div className="mt-2 flex items-center gap-3">
                <h2 id="projects-heading" className="text-2xl font-semibold tracking-tight">{t('projects')}</h2>
                <span className="rounded-full bg-[var(--lavender)] px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)]">{projects.length} {t('total')}</span>
              </div>
            </div>
            <Link href="/dashboard/provider" className="rounded-sm text-sm font-medium text-[var(--ink-soft)] underline decoration-[var(--ink)]/25 underline-offset-4 hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cobalt)]">
              {t('openProviderDesk')} <span className="sr-only">{t('providerSettings')}</span>
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="mt-5 rounded-xl border border-[var(--ink)]/10 bg-white p-6 sm:p-8">
              <FileText size={24} strokeWidth={1.7} aria-hidden="true" className="text-[var(--paper-muted)]" />
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{t('emptyTitle')}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--paper-muted)]">{t('emptyDesc')}</p>
              <Link href="/projects/new" className={buttonClassName({ variant: 'primary', size: 'lg', className: 'mt-5 rounded-lg shadow-none' })}>
                {t('emptyCta')} <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--ink)]/10" aria-label={t('projects')}>
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group grid gap-3 rounded-lg px-3 py-4 transition-colors hover:bg-[var(--lavender)]/45 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--cobalt)] sm:px-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3 className="truncate text-base font-semibold tracking-tight group-hover:underline group-hover:underline-offset-4">{project.name}</h3>
                        <StatusBadge tone={STATUS_TONE[project.status] ?? 'neutral'}>
                          {tStatus(project.status as Parameters<typeof tStatus>[0]) ?? project.status}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--paper-muted)]">{project.rawIdea}</p>
                      <p className="mt-2 text-sm font-medium text-[var(--ink-soft)]">
                        <span className="text-[var(--paper-muted)]">{nextActionLabel}: </span>
                        {t((NEXT_ACTION_KEY[project.status] ?? 'nextActionDraft') as Parameters<typeof t>[0])}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--paper-muted)] md:justify-end">
                      <span>
                        {t((CLASSIFICATION_KEY[project.classification] ?? 'classificationOther') as Parameters<typeof t>[0])} · {t((AGENT_KEY[project.targetAgent] ?? 'agentOther') as Parameters<typeof t>[0])}
                      </span>
                      <span>{project._count.artifacts} {t('docs')}</span>
                      <time dateTime={new Date(project.updatedAt).toISOString()}>{formatRelative(project.updatedAt, t)}</time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
