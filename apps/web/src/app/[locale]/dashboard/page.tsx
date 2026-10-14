import { ArrowUpRight, ChevronRight, KeyRound, LogOut } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { Link } from '@/i18n/routing'

import { LandingHeader } from '@/app/components/LandingHeader'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { BrandLogo } from '@/app/components/BrandLogo'
import { PromptComposer } from '@/app/components/PromptComposer'
import { StatusBadge } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { logoutAction } from '@/lib/auth/actions'
import { createProject, getUserProjects } from '@/lib/projects/project-service'

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

const CLASSIFICATION_KEYS = {
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
} as const

function formatRelative(value: Date | string, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return t('justNow')
  if (minutes < 60) return t('mAgo', { minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('hAgo', { hours })
  return t('dAgo', { days: Math.floor(hours / 24) })
}

function deriveProjectName(rawIdea: string): string {
  const words = rawIdea.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean).slice(0, 7)
  const name = words.join(' ').replace(/[.!?,;:]+$/, '')
  return name.length >= 2 ? name.slice(0, 100) : 'Untitled project'
}

async function createProjectFromPrompt(formData: FormData) {
  'use server'

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  const rawIdea = String(formData.get('prompt') ?? '').trim()
  const requestedName = String(formData.get('name') ?? '').trim()
  const name = requestedName.length >= 2 ? requestedName.slice(0, 100) : deriveProjectName(rawIdea)
  const language = formData.get('language') === 'id' ? 'id' : 'en'

  const project = await createProject(userId, {
    name,
    rawIdea,
    targetAgent: 'OTHER',
    language,
  })

  after(async () => {
    const { classifyProject } = await import('@/lib/projects/classifier-service')
    await classifyProject({ userId, projectId: project.id })
  })

  redirect(`/projects/${project.id}`)
}

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard')
  const tCommon = await getTranslations('Common')
  const tStatus = await getTranslations('Status')
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')
  const projects = await getUserProjects(userId)

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-[#24231f] selection:bg-[#f4a261] selection:text-[#24231f]">
      <LandingHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="shrink-0 rounded-full px-1 py-1 text-[#24231f] transition-colors hover:text-[#a66142] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]"><BrandLogo imageSize={30} textClassName="text-[19px] font-bold tracking-[-0.07em]" /></Link>
          <span className="hidden truncate border-l border-[#dedbd5] pl-3 text-xs font-medium text-[#706b64] sm:inline">{t('workspaceLabel')}</span>
        </div>
        <nav aria-label={t('dashboardNavigation')} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link href="/dashboard/provider" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dedbd5] bg-white/65 px-3 text-xs font-semibold text-[#24231f] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]">
            <KeyRound size={14} aria-hidden="true" />
            <span className="hidden sm:inline">{t('providerSettings')}</span>
            <span className="sm:hidden">{t('providerShort')}</span>
          </Link>
          <LanguageSwitcher />
          <span className="hidden max-w-36 truncate px-2 text-xs text-[#706b64] lg:inline">{session?.user?.email}</span>
          <form action={logoutAction}>
            <button type="submit" aria-label={tCommon('signOut')} className="inline-flex size-9 items-center justify-center rounded-full border border-[#dedbd5] bg-white/65 text-[#706b64] transition-colors hover:bg-white hover:text-[#24231f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]">
              <LogOut size={14} aria-hidden="true" />
            </button>
          </form>
        </nav>
      </LandingHeader>

      <div className="mx-auto max-w-[1180px] px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <section aria-labelledby="dashboard-heading" className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{t('promptEyebrow')}</p>
          <h1 id="dashboard-heading" className="mt-4 text-[clamp(2.4rem,6vw,5.3rem)] font-semibold leading-[.96] tracking-[-.07em]">{t('promptTitle')}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#706b64] sm:text-base">{t('promptSubtitle')}</p>
          <div className="mx-auto mt-8 max-w-3xl text-left">
            <PromptComposer action={createProjectFromPrompt} />
          </div>
          <p className="mt-4 text-xs text-[#8a8178]">{t('promptNote')}</p>
        </section>

        <section aria-labelledby="projects-heading" className="mt-20 border-t border-[#dedbd5] pt-10 sm:mt-24 sm:pt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{t('projectsEyebrow')}</p>
              <h2 id="projects-heading" className="mt-3 text-3xl font-semibold tracking-[-.06em] sm:text-4xl">{t('projectsHeading')}</h2>
            </div>
            {projects.length > 0 && <span className="font-mono text-[10px] tracking-[0.08em] text-[#8a8178]">{projects.length} {t('total')}</span>}
          </div>

          {projects.length === 0 ? (
            <div className="mt-7 rounded-[22px] border border-dashed border-[#c9c4bc] bg-white/45 px-6 py-10 text-center sm:px-10">
              <h3 className="text-xl font-semibold tracking-[-.04em]">{t('emptyTitle')}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#706b64]">{t('emptyDesc')}</p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const tone = STATUS_TONE[project.status] ?? 'neutral'
                const isPendingClassification = project.classificationStatus === 'PENDING'
                const isFailedClassification = project.classificationStatus === 'FAILED'
                const classificationKey = CLASSIFICATION_KEYS[project.classification as keyof typeof CLASSIFICATION_KEYS] ?? 'classificationOther'
                const classificationText = isPendingClassification
                  ? t('classificationPending')
                  : isFailedClassification
                    ? t('classificationFailed')
                    : t(classificationKey)
                const badgeClass = isFailedClassification
                  ? 'border-[#f0c2bb] bg-[#fdf2f0] text-[#a66142]'
                  : isPendingClassification
                    ? 'border-[#dedbd5] bg-[#f4f1eb] text-[#8a8178] animate-pulse'
                    : 'border-[#dedbd5] bg-[#f4f1eb] text-[#706b64]'
                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="group flex min-h-[238px] flex-col rounded-[20px] border border-[#dedbd5] bg-[#fffdfa] p-5 shadow-[0_8px_22px_rgba(36,35,31,0.035)] transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-[#b9afa4] hover:shadow-[0_16px_30px_rgba(36,35,31,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badgeClass}`}>{classificationText}</span>
                      <StatusBadge tone={tone}>{tStatus(project.status as Parameters<typeof tStatus>[0])}</StatusBadge>
                    </div>
                    <h3 className="mt-6 truncate text-xl font-semibold tracking-[-.045em] transition-colors group-hover:text-[#a66142]">{project.name}</h3>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#706b64]">{project.rawIdea}</p>
                    <p className="mt-4 text-xs font-medium leading-5 text-[#8a8178]">{t(`nextAction${project.status.charAt(0) + project.status.slice(1).toLowerCase()}` as Parameters<typeof t>[0])}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#ebe7e1] pt-4 font-mono text-[10px] text-[#8a8178]">
                      <span>{project._count.artifacts} {t('docs')} · {formatRelative(project.updatedAt, t)}</span>
                      <ChevronRight size={15} className="shrink-0 text-[#c9c4bc] transition-transform group-hover:translate-x-0.5 group-hover:text-[#a66142]" aria-hidden="true" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <div className="mt-10 flex justify-center">
          <Link href="/dashboard/provider" className="inline-flex items-center gap-2 text-xs font-semibold text-[#706b64] underline decoration-[#c9c4bc] underline-offset-4 transition-colors hover:text-[#a66142] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261]">
            {t('providerSummary')} <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  )
}
