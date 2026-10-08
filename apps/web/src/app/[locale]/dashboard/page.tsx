import { ArrowRight, FolderKanban, KeyRound, Plus } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { PipelineSpine } from '@/app/components/PipelineSpine'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { PageFrame, StatusBadge, TopBar } from '@/app/components/ui'
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
    <PageFrame width="7xl" className="bg-[#f6f5f4] py-5 text-black" contentClassName="bg-[#f6f5f4]">
      <TopBar className="bg-[#f6f5f4]">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-[-0.01em]">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#02093a] text-xs font-bold text-white">BC</span>
          <span className="hidden text-[#615d59] sm:inline">bantuin.dev</span>
          <span className="text-[#9a9a9a]">/</span>
          <span>{t('title')}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="hidden max-w-56 truncate text-xs text-[#757575] lg:inline">{session.user.email}</span>
          <LanguageSwitcher />
          <form action={logoutAction}>
            <button type="submit" className="rounded-[8px] px-3 py-2 text-xs font-semibold text-[#757575] transition-colors hover:bg-white hover:text-black">{tCommon('signOut')}</button>
          </form>
          <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-[8px] bg-[#0075de] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#005fb5]">
            <Plus size={15} aria-hidden="true" /> {tCommon('newProject')}
          </Link>
        </div>
      </TopBar>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          <div className="rounded-[12px] border border-[#dfe3e7] bg-white p-5 sm:p-7">
            <PipelineSpine current="idea" compact className="mb-7" />
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-2xl">
                <p className="text-xs font-medium text-[#757575]">{t('controlDesk')}</p>
                <h1 className="mt-2 text-3xl font-semibold leading-[1.04] tracking-[-0.048em] sm:text-4xl">{t('title')}</h1>
                <p className="mt-3 font-[var(--font-lyon-text)] text-sm leading-6 text-[#615d59]">{t('subtitle')}</p>
              </div>
              <div className="flex gap-2">
                <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-[8px] bg-[#0075de] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#005fb5]">{t('captureIdea')} <ArrowRight size={16} aria-hidden="true" /></Link>
                <Link href="/dashboard/provider" aria-label={t('providerSettings')} className="inline-flex items-center rounded-[8px] border border-[#dfe3e7] bg-white p-2.5 text-[#64707d] hover:border-[#0075de] hover:text-[#0075de]"><KeyRound size={17} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>

          <ProviderSetupPanel />

          <section className="mt-5 rounded-[12px] border border-[#dfe3e7] bg-white">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e8ebee] px-5 py-5 sm:px-7">
              <div><p className="text-xs font-medium text-[#757575]">{t('projectLedger')}</p><div className="mt-1 flex items-center gap-3"><h2 className="text-2xl font-semibold tracking-[-0.035em]">{t('projects')}</h2><span className="rounded-full bg-[#e6f3fe] px-2.5 py-1 text-xs font-medium text-[#0075de]">{projects.length} {t('total')}</span></div></div>
              <Link href="/dashboard/provider" className="text-sm font-semibold text-[#0075de] hover:underline">{t('openProviderDesk')}</Link>
            </div>
            {projects.length === 0 ? (
              <div className="p-7 sm:p-10"><FolderKanban size={30} className="text-[#0075de]" aria-hidden="true" /><h2 className="mt-4 text-2xl font-bold tracking-[-0.03em]">{t('emptyTitle')}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#64707d]">{t('emptyDesc')}</p><Link href="/projects/new" className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-[#0075de] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#005fb5]">{t('emptyCta')} <ArrowRight size={17} aria-hidden="true" /></Link></div>
            ) : (
              <div className="overflow-x-auto"><div className="hidden min-w-[760px] grid-cols-12 border-b border-[#e8ebee] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64707d] md:grid"><span className="col-span-2">{t('state')}</span><span className="col-span-4">{t('project')}</span><span className="col-span-2">{t('type')}</span><span className="col-span-2">{t('agent')}</span><span className="col-span-1 text-right">{t('docs')}</span><span className="col-span-1 text-right">{t('updated')}</span></div><div className="divide-y divide-[#e8ebee]">{projects.map((project: Awaited<ReturnType<typeof getUserProjects>>[number]) => (<Link key={project.id} href={`/projects/${project.id}`} className="group grid min-w-[760px] gap-4 px-5 py-4 transition-colors hover:bg-[#f7fbff] md:grid-cols-12 md:items-center"><div className="md:col-span-2"><StatusBadge tone={STATUS_TONE[project.status] ?? 'neutral'}>{tStatus(project.status as Parameters<typeof tStatus>[0]) ?? project.status}</StatusBadge></div><div className="min-w-0 md:col-span-4"><p className="truncate text-sm font-bold group-hover:text-[#0075de]">{project.name}</p><p className="mt-1 truncate text-xs text-[#64707d]">{project.rawIdea.slice(0, 90)}</p><p className="mt-2 text-xs text-[#64707d]">{t(NEXT_ACTION_KEY[project.status] ?? 'nextActionDraft')}</p></div><span className="font-mono text-xs text-[#64707d] md:col-span-2">{project.classification.toLowerCase().replace(/_/g, '-')}</span><span className="font-mono text-xs text-[#64707d] md:col-span-2">{project.targetAgent.toLowerCase().replace(/_/g, '-')}</span><span className="font-mono text-xs md:col-span-1 md:text-right">{project._count.artifacts} {t('docs')}</span><span className="font-mono text-xs text-[#64707d] md:col-span-1 md:text-right">{formatRelative(project.updatedAt, t)}</span></Link>))}</div></div>
            )}
          </section>
        </main>
        <aside className="h-fit rounded-[12px] border border-black/[0.08] bg-white p-5 sm:p-6"><p className="text-xs font-medium text-[#757575]">{t('currentChapter')}</p><p className="mt-3 text-lg font-semibold">{t('chapter01')}</p><p className="mt-2 font-[var(--font-lyon-text)] text-sm leading-6 text-[#615d59]">{t('chapter01Desc')}</p><div className="mt-6 border-t border-black/[0.08] pt-5"><p className="text-xs font-medium text-[#757575]">{t('providerSettings')}</p><Link href="/dashboard/provider" className="mt-2 inline-flex text-sm font-semibold text-[#0075de] hover:underline">{t('openProviderDesk')} <ArrowRight size={15} className="ml-1" aria-hidden="true" /></Link></div></aside>
      </div>
    </PageFrame>
  )
}
