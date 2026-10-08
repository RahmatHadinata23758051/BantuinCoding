import { ArrowRight, FolderKanban, KeyRound, Plus } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { PipelineSpine } from '@/app/components/PipelineSpine'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { Caption, Panel, StatusBadge, TopBar, PageFrame, buttonClassName } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { logoutAction } from '@/lib/auth/actions'
import { getUserProjects } from '@/lib/projects/project-service'
import { getTranslations } from 'next-intl/server'

const STATUS_TONE: Record<
  string,
  'neutral' | 'current' | 'pending' | 'success' | 'danger' | 'accent'
> = {
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

function formatRelative(value: Date | string, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('justNow')
  if (minutes < 60) return t('mAgo', { minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hAgo', { hours })
  return t('dAgo', { days: Math.floor(hours / 24) })
}

const NEXT_ACTION_KEY: Record<string, 'nextActionDraft' | 'nextActionConfigured' | 'nextActionAnalyzing' | 'nextActionClarifying' | 'nextActionContextReady' | 'nextActionGenerating' | 'nextActionReady' | 'nextActionExportable' | 'nextActionGenerationFailed'> = {
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

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard')
  const tCommon = await getTranslations('Common')
  const tStatus = await getTranslations('Status')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const projects = await getUserProjects(session.user.id)

  return (
    <PageFrame width="7xl" className="!border-[#e8e8f2] !bg-white !shadow-none py-4 text-[#303055]" contentClassName="overflow-hidden">
      <TopBar className="!border-[#e8e8f2] !bg-white">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#303055] sm:text-sm">
          <span className="inline-flex size-7 items-center justify-center rounded-[4px] border border-[#303055] bg-[#303055] text-xs text-white">
            BC
          </span>
          <span>{t('workspaceLabel')}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="hidden max-w-56 truncate font-mono text-xs text-[#767682] sm:inline">
            {session.user.email}
          </span>
          <LanguageSwitcher />
          <form action={logoutAction}>
            <button
              type="submit"
              className={buttonClassName({
                variant: 'neutral',
                size: 'sm',
                className: '!rounded-[4px] !border-[#e8e8f2] !bg-white !text-[#303055] !shadow-none',
              })}
            >
              {tCommon('signOut')}
            </button>
          </form>
          <Link
            href="/projects/new"
            className={buttonClassName({
              variant: 'primary',
              size: 'sm',
              className: '!rounded-[4px] !border-[#303055] !bg-[#303055] !text-white !shadow-none',
            })}
          >
            <Plus size={16} aria-hidden="true" /> {tCommon('newProject')}
          </Link>
        </div>
      </TopBar>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-[#e8e8f2] bg-[#e8e8f2] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
          <Caption className="!border-[#303055] !bg-white !text-[#303055] !shadow-none">{t('controlDesk')}</Caption>
          <h1 className="mt-5 max-w-xs text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#303055]">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#403f53]">
            {t('subtitle')}
          </p>

          <nav className="mt-8 grid gap-3" aria-label={t('actionsLabel')}>
            <Link
              href="/projects/new"
              className={buttonClassName({
                variant: 'primary',
                className: 'w-full !rounded-[4px] !border-[#303055] !bg-[#303055] !text-white !shadow-none',
              })}
            >
              {t('captureIdea')} <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard/provider"
              className={buttonClassName({
                variant: 'neutral',
                className: 'w-full !rounded-[4px] !border-white !bg-white !text-[#303055] !shadow-none',
              })}
            >
              {t('providerSettings')} <KeyRound size={17} aria-hidden="true" />
            </Link>
          </nav>

          <div className="mt-8 border-t border-[#303055] pt-5">
            <p className="font-mono text-xs font-semibold tracking-[0.08em] text-[#303055]">{t('currentChapter')}</p>
            <p className="mt-2 text-sm font-semibold text-[#303055]">{t('chapter01')}</p>
            <p className="mt-1 text-xs leading-5 text-[#767682]">
              {t('chapter01Desc')}
            </p>
          </div>
        </aside>

        <section className="min-w-0 bg-white p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e8e8f2] pb-5">
            <div>
              <p className="font-mono text-xs font-semibold tracking-[0.08em] text-[#767682]">{t('projectLedger')}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#303055]">{t('projects')}</h2>
                <StatusBadge tone="accent">{projects.length} {t('total')}</StatusBadge>
              </div>
            </div>
            <Link
              href="/dashboard/provider"
              className="font-mono text-xs font-semibold text-[#303055] underline underline-offset-4"
            >
              {t('openProviderDesk')}
            </Link>
          </div>

          <div className="mt-6 rounded-lg border border-[#e8e8f2] bg-[#e8e8f2] p-3 sm:p-4">
            <PipelineSpine current="idea" compact />
          </div>

          <div className="mt-5 rounded-lg border border-[#e8e8f2] bg-white">
            <ProviderSetupPanel />
          </div>

          {projects.length === 0 ? (
            <Panel raised={false} tone="yellow" className="mt-6 rounded-lg !border-[#e8e8f2] !bg-[#e8e8f2] !p-6 !shadow-none sm:!p-8">
              <FolderKanban className="text-[#303055]" size={34} strokeWidth={2} aria-hidden="true" />
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-[#303055]">{t('emptyTitle')}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#403f53]">
                {t('emptyDesc')}
              </p>
              <Link
                href="/projects/new"
                className={buttonClassName({
                  variant: 'primary',
                  size: 'lg',
                  className: 'mt-6 !rounded-[4px] !border-[#303055] !bg-[#303055] !text-white !shadow-none',
                })}
              >
                {t('emptyCta')} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </Panel>
          ) : (
            <div className="mt-6 overflow-hidden rounded-lg border border-[#e8e8f2] bg-white">
              <div className="hidden grid-cols-12 border-b border-[#e8e8f2] bg-[#e8e8f2] px-4 py-3 font-mono text-[11px] font-semibold text-[#303055] md:grid">
                <span className="col-span-2">{t('state')}</span>
                <span className="col-span-4">{t('project')}</span>
                <span className="col-span-2">{t('type')}</span>
                <span className="col-span-2">{t('agent')}</span>
                <span className="col-span-1 text-right">{t('docs')}</span>
                <span className="col-span-1 text-right">{t('updated')}</span>
              </div>

              <div className="divide-y divide-[#e8e8f2]">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group grid gap-4 px-4 py-4 transition-colors hover:bg-[#e8e8f2] focus-visible:bg-[#e8e8f2] md:grid-cols-12 md:items-center"
                  >
                    <div className="md:col-span-2">
                      <StatusBadge tone={STATUS_TONE[project.status] ?? 'neutral'}>
                        {tStatus(project.status as Parameters<typeof tStatus>[0]) ?? project.status}
                      </StatusBadge>
                    </div>

                    <div className="min-w-0 md:col-span-4">
                      <p className="truncate text-base font-semibold text-[#303055] group-hover:underline group-hover:underline-offset-4">
                        {project.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#767682]">
                        {project.rawIdea.slice(0, 90)}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[#403f53]">
                        {t(NEXT_ACTION_KEY[project.status] ?? 'nextActionDraft')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs md:contents">
                      <span className="font-mono font-semibold text-[#767682] md:col-span-2">
                        {project.classification.toLowerCase().replace(/_/g, '-')}
                      </span>
                      <span className="font-mono font-semibold text-[#767682] md:col-span-2">
                        {project.targetAgent.toLowerCase().replace(/_/g, '-')}
                      </span>
                      <span className="font-mono font-semibold text-[#303055] md:col-span-1 md:text-right">
                        {project._count.artifacts} {t('docs')}
                      </span>
                      <span className="font-mono text-[#767682] md:col-span-1 md:text-right">
                        {formatRelative(project.updatedAt, t)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  )
}
