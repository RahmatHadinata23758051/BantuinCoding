import { ArrowRight, KeyRound, Lightbulb, ListChecks } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { StatusBadge } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { createProject } from '@/lib/projects/project-service'
import { getTranslations } from 'next-intl/server'

async function handleCreateProject(formData: FormData) {
  'use server'
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const name = formData.get('name') as string
  const rawIdea = formData.get('rawIdea') as string
  const classification = (formData.get('classification') as never) ?? 'OTHER'
  const targetAgent = (formData.get('targetAgent') as never) ?? 'CLAUDE_CODE'
  const language = (formData.get('language') as never) ?? 'id'

  const project = await createProject(session.user.id, {
    name,
    rawIdea,
    classification,
    targetAgent,
    language,
  })

  redirect(`/projects/${project.id}`)
}

const CLASSIFICATIONS = [
  { value: 'SAAS', label: 'SaaS app' },
  { value: 'CRUD_APP', label: 'CRUD application' },
  { value: 'DASHBOARD', label: 'Dashboard / admin' },
  { value: 'API_SERVICE', label: 'API service' },
  { value: 'STATIC_SITE', label: 'Static site' },
  { value: 'LANDING_PAGE', label: 'Landing page' },
  { value: 'MOBILE_APP', label: 'Mobile app' },
  { value: 'AI_APP', label: 'AI application' },
  { value: 'IOT_DASHBOARD', label: 'IoT dashboard' },
  { value: 'FULLSTACK_COMPLEX', label: 'Fullstack complex' },
  { value: 'OTHER', label: 'Other' },
]

const AGENTS = [
  { value: 'CLAUDE_CODE', label: 'Claude Code' },
  { value: 'CURSOR', label: 'Cursor' },
  { value: 'CODEX', label: 'OpenAI Codex' },
  { value: 'OPENCODE', label: 'OpenCode' },
  { value: 'ANTIGRAVITY', label: 'AntiGravity' },
  { value: 'OTHER', label: 'Other agent' },
]

const NEXT_STEPS = ['nextStep1', 'nextStep2', 'nextStep3', 'nextStep4', 'nextStep5', 'nextStep6']

const PIPELINE_STEPS = ['Idea', 'Clarify', 'Context', 'Generate', 'Review', 'Export']

export default async function NewProjectPage() {
  const t = await getTranslations('NewProject')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <main className="min-h-screen bg-[#f6f5f4] px-4 py-5 text-[#111111] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
          <Link href="/dashboard" className="text-sm font-medium text-black/60 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0075de]">
            {t('backDashboard')}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-black/45 sm:inline">{t('breadcrumb')}</span>
            <StatusBadge tone="neutral">{t('initialStateDraft')}</StatusBadge>
          </div>
        </header>

        <nav aria-label="Project workflow" className="mt-8 overflow-x-auto border-b border-black/10 pb-5">
          <ol className="flex min-w-[560px] items-center justify-between gap-3">
            {PIPELINE_STEPS.map((step, index) => (
              <li key={step} className="flex flex-1 items-center gap-2 text-xs font-medium text-black/40 last:flex-none">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0075de] text-[11px] font-semibold text-white" aria-current={index === 0 ? 'step' : undefined}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={index === 0 ? 'text-black' : undefined}>{step}</span>
                {index < PIPELINE_STEPS.length - 1 && <span className="mx-2 h-px flex-1 bg-black/10" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-20 lg:py-16">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0075de]">{t('caption')}</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">{t('title')}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#615d59]">{t('subtitle')}</p>

            <form action={handleCreateProject} className="mt-12 max-w-2xl space-y-8">
              <div>
                <label htmlFor="name" className="text-sm font-semibold">{t('projectName')}</label>
                <input id="name" name="name" type="text" required minLength={2} maxLength={100} placeholder={t('projectNamePlaceholder')} className="mt-2 h-12 w-full rounded-lg border border-black/15 bg-white px-4 text-base outline-none transition-colors placeholder:text-black/35 focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15" />
              </div>

              <div>
                <label htmlFor="rawIdea" className="text-sm font-semibold">{t('projectIdea')}</label>
                <textarea id="rawIdea" name="rawIdea" rows={10} required minLength={10} maxLength={5000} placeholder={t('projectIdeaPlaceholder')} className="mt-2 min-h-64 w-full resize-y rounded-lg border border-black/15 bg-white px-4 py-3 text-base leading-7 outline-none transition-colors placeholder:text-black/35 focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15" />
                <p className="mt-2 text-sm leading-6 text-[#615d59]">{t('projectIdeaNote')}</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="classification" className="text-sm font-semibold">{t('classification')}</label>
                  <select id="classification" name="classification" defaultValue="SAAS" className="mt-2 h-12 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15">
                    {CLASSIFICATIONS.map((classification) => <option key={classification.value} value={classification.value}>{classification.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="targetAgent" className="text-sm font-semibold">{t('targetAgent')}</label>
                  <select id="targetAgent" name="targetAgent" defaultValue="CLAUDE_CODE" className="mt-2 h-12 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15">
                    {AGENTS.map((agent) => <option key={agent.value} value={agent.value}>{agent.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="language" className="text-sm font-semibold">{t('language')}</label>
                  <select id="language" name="language" defaultValue="id" className="mt-2 h-12 w-full rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15">
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm leading-6 text-[#615d59]"><Lightbulb size={18} className="mt-1 shrink-0 text-[#e89d01]" aria-hidden="true" />{t('refineNote')}</p>
                <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0075de] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0068c7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0075de] sm:w-auto">{t('createBtn')} <ArrowRight size={17} aria-hidden="true" /></button>
              </div>
            </form>
          </section>

          <aside className="space-y-8 lg:pt-12">
            <section className="rounded-xl bg-white p-6 ring-1 ring-black/8">
              <ListChecks size={24} className="text-[#0075de]" aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{t('whatHappensNext')}</h2>
              <ol className="mt-6 space-y-5">
                {NEXT_STEPS.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-[#615d59]"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e6f3fe] text-xs font-semibold text-[#0075de]">{index + 1}</span><span>{t(step as Parameters<typeof t>[0])}</span></li>)}
              </ol>
            </section>

            <section className="rounded-xl bg-[#e6f3fe] p-6">
              <KeyRound size={21} className="text-[#0075de]" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold">{t('prerequisite')}</p>
              <p className="mt-2 text-sm leading-6 text-[#615d59]">{t('prerequisiteDesc')}</p>
              <Link href="/dashboard/provider" className="mt-4 inline-flex text-sm font-semibold text-[#0075de] underline decoration-[#0075de]/30 underline-offset-4 transition-colors hover:text-[#005cae] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0075de]">{t('openProviderDesk')}</Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
