import { ArrowRight, FolderKanban, KeyRound, Plus } from 'lucide-react'
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

function formatRelative(value: Date | string, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
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
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const projects = await getUserProjects(session.user.id)

  return (
    <PageFrame width="7xl" className="bg-[#f6f5f4] py-5 text-[#111]" contentClassName="bg-[#f6f5f4]">
      <TopBar className="border-b-black/[0.07] bg-[#f6f5f4] px-5 sm:px-8">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#02093a] text-xs font-bold text-white">BC</span>
          <span className="hidden text-[#615d59] sm:inline">bantuin.dev</span><span aria-hidden="true" className="text-[#b0aba6]">/</span><span>{t('title')}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="hidden max-w-56 truncate text-xs text-[#757575] lg:inline">{session.user.email}</span>
          <LanguageSwitcher />
          <form action={logoutAction}><button type="submit" className="rounded-md px-3 py-2 text-xs font-semibold text-[#615d59] hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]">{tCommon('signOut')}</button></form>
          <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-lg bg-[#0075de] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#005fb5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02093a]"><Plus size={15} aria-hidden="true" />{tCommon('newProject')}</Link>
        </div>
      </TopBar>

      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <header className="grid gap-8 border-b border-black/[0.09] py-12 sm:py-16 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#0075de]">{t('controlDesk')}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl">{t('title')}</h1>
            <p className="mt-5 max-w-xl font-[var(--font-lyon-text)] text-base leading-7 text-[#615d59]">{t('subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3 md:items-start">
            <p className="text-sm leading-6 text-[#615d59]">{t('currentChapter')}<br /><span className="font-semibold text-[#111]">{t('chapter01')}</span></p>
            <Link href="/projects/new" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#0075de] px-4 text-sm font-bold text-white hover:bg-[#005fb5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02093a]">{t('captureIdea')} <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </header>

        <section aria-labelledby="projects-heading" className="py-10 sm:py-14">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm text-[#757575]">{t('projectLedger')}</p><div className="mt-2 flex flex-wrap items-baseline gap-3"><h2 id="projects-heading" className="text-3xl font-semibold tracking-[-0.045em]">{t('projects')}</h2><span className="text-sm text-[#757575]">{projects.length} {t('total')}</span></div></div>
            <Link href="/dashboard/provider" className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-[#0075de] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]"><KeyRound size={16} aria-hidden="true" />{t('openProviderDesk')}</Link>
          </div>
          {projects.length === 0 ? (
            <div className="grid gap-8 border-y border-black/[0.09] py-10 sm:grid-cols-[1fr_auto] sm:items-center sm:py-14">
              <div className="max-w-xl"><FolderKanban size={25} className="text-[#0075de]" aria-hidden="true" /><h3 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">{t('emptyTitle')}</h3><p className="mt-3 text-sm leading-6 text-[#615d59]">{t('emptyDesc')}</p></div>
              <Link href="/projects/new" className="inline-flex min-h-11 items-center justify-center gap-2 justify-self-start rounded-lg bg-[#0075de] px-4 text-sm font-bold text-white hover:bg-[#005fb5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02093a]">{t('emptyCta')} <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          ) : (
            <div className="border-y border-black/[0.09]">
              <div className="hidden grid-cols-[minmax(190px,1.4fr)_minmax(140px,1fr)_minmax(110px,.8fr)_90px_90px] gap-5 border-b border-black/[0.08] py-3 text-xs font-semibold text-[#757575] md:grid"><span>{t('project')}</span><span>{t('state')}</span><span>{t('type')} / {t('agent')}</span><span className="text-right">{t('docs')}</span><span className="text-right">{t('updated')}</span></div>
              <ul className="divide-y divide-black/[0.08]">{projects.map((project: Awaited<ReturnType<typeof getUserProjects>>[number]) => (
                <li key={project.id}><Link href={`/projects/${project.id}`} className="group grid gap-3 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de] md:grid-cols-[minmax(190px,1.4fr)_minmax(140px,1fr)_minmax(110px,.8fr)_90px_90px] md:items-center md:gap-5">
                  <div className="min-w-0"><p className="truncate text-base font-semibold tracking-[-0.02em] group-hover:text-[#0075de]">{project.name}</p><p className="mt-1 line-clamp-2 text-sm leading-5 text-[#757575]">{project.rawIdea.slice(0, 90)}</p><p className="mt-3 text-xs font-medium leading-5 text-[#615d59]">{t(NEXT_ACTION_KEY[project.status] ?? 'nextActionDraft')}</p></div>
                  <div><span className="mb-1 block text-xs text-[#757575] md:hidden">{t('state')}</span><StatusBadge tone={STATUS_TONE[project.status] ?? 'neutral'}>{tStatus(project.status as Parameters<typeof tStatus>[0]) ?? project.status}</StatusBadge></div>
                  <div className="text-xs text-[#615d59]"><span className="md:hidden">{t('type')} / {t('agent')}: </span>{project.classification.toLowerCase().replace(/_/g, '-')}<span className="mx-1 text-[#b0aba6]">/</span>{project.targetAgent.toLowerCase().replace(/_/g, '-')}</div>
                  <div className="text-xs text-[#615d59] md:text-right"><span className="md:hidden">{t('docs')}: </span>{project._count.artifacts}</div><div className="text-xs text-[#757575] md:text-right"><span className="md:hidden">{t('updated')}: </span>{formatRelative(project.updatedAt, t)}</div>
                </Link></li>
              ))}</ul>
            </div>
          )}
        </section>

        <section aria-labelledby="provider-heading" className="grid gap-6 border-t border-black/[0.09] pt-8 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start sm:pt-10">
          <div><p className="text-sm text-[#757575]">{t('providerSettings')}</p><h2 id="provider-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{t('openProviderDesk')}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#615d59]">{t('chapter01Desc')}</p><div className="mt-5"><ProviderSetupPanel /></div></div>
          <div className="sm:border-l sm:border-black/[0.09] sm:pl-6"><p className="text-sm font-semibold">{t('providerSettings')}</p><p className="mt-2 text-sm leading-6 text-[#615d59]">{t('chapter01Desc')}</p><Link href="/dashboard/provider" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0075de] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]">{t('openProviderDesk')} <ArrowRight size={15} aria-hidden="true" /></Link></div>
        </section>
      </div>
    </PageFrame>
  )
}
