import { ArrowRight, KeyRound } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

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

const fieldClassName =
  'mt-2 w-full rounded-lg border border-black/[0.12] bg-white px-4 text-base text-[#111111] outline-none transition-colors placeholder:text-black/35 focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/15'

export default async function NewProjectPage() {
  const t = await getTranslations('NewProject')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <main className="min-h-screen bg-[#f6f5f4] px-5 py-5 text-[#111111] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center border-b border-black/[0.08] pb-5">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-black/60 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0075de]"
          >
            {t('backDashboard')}
          </Link>
        </header>

        <div className="grid gap-14 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-20 lg:py-20">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#615d59]">{t('caption')}</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-6xl lg:text-[68px]">
              {t('title')}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#615d59] sm:text-lg sm:leading-8">{t('subtitle')}</p>

            <form action={handleCreateProject} className="mt-12 max-w-2xl">
              <div className="border-b border-black/[0.12] pb-10">
                <label htmlFor="name" className="text-sm font-semibold">
                  {t('projectName')}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder={t('projectNamePlaceholder')}
                  className={`${fieldClassName} h-12`}
                />
              </div>

              <div className="pt-8">
                <label htmlFor="rawIdea" className="text-lg font-semibold tracking-[-0.02em]">
                  {t('projectIdea')}
                </label>
                <textarea
                  id="rawIdea"
                  name="rawIdea"
                  rows={10}
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder={t('projectIdeaPlaceholder')}
                  aria-describedby="project-idea-note"
                  className={`${fieldClassName} min-h-64 resize-y py-3 leading-7`}
                />
                <p id="project-idea-note" className="mt-3 text-sm leading-6 text-[#615d59]">
                  {t('projectIdeaNote')}
                </p>
              </div>

              <details className="group mt-8 border-y border-black/[0.12]">
                <summary className="flex cursor-pointer list-none items-center gap-3 py-5 outline-none focus-visible:ring-2 focus-visible:ring-[#0075de] [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{t('classification')}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#615d59]">{t('refineNote')}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-[#0075de] transition-transform group-open:rotate-90" aria-hidden="true" />
                </summary>

                <div className="grid gap-5 border-t border-black/[0.08] py-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="classification" className="text-sm font-semibold">
                      {t('classification')}
                    </label>
                    <select id="classification" name="classification" defaultValue="SAAS" className={`${fieldClassName} h-12 px-3 text-sm`}>
                      {CLASSIFICATIONS.map((classification) => (
                        <option key={classification.value} value={classification.value}>
                          {classification.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="targetAgent" className="text-sm font-semibold">
                      {t('targetAgent')}
                    </label>
                    <select id="targetAgent" name="targetAgent" defaultValue="CLAUDE_CODE" className={`${fieldClassName} h-12 px-3 text-sm`}>
                      {AGENTS.map((agent) => (
                        <option key={agent.value} value={agent.value}>
                          {agent.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="language" className="text-sm font-semibold">
                      {t('language')}
                    </label>
                    <select id="language" name="language" defaultValue="id" className={`${fieldClassName} h-12 px-3 text-sm`}>
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </details>

              <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm leading-6 text-[#615d59]">
                  <KeyRound size={17} className="mt-1 shrink-0 text-[#0075de]" aria-hidden="true" />
                  {t('projectIdeaNote')}
                </p>
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0075de] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0068c7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0075de] sm:w-auto"
                >
                  {t('createBtn')}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </form>
          </section>

          <aside className="lg:pt-2">
            <section aria-labelledby="next-steps-title">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#615d59]">{t('whatHappensNext')}</p>
              <h2 id="next-steps-title" className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                {t('nextStep1')}
              </h2>
              <ol className="mt-7 divide-y divide-black/[0.08] border-y border-black/[0.08]">
                {NEXT_STEPS.slice(1).map((step, index) => (
                  <li key={step} className="flex gap-4 py-4 text-sm leading-6 text-[#615d59]">
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-[#0075de]">0{index + 2}</span>
                    <span>{t(step as Parameters<typeof t>[0])}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-10 border-t border-black/[0.12] pt-6" aria-labelledby="provider-prerequisite-title">
              <KeyRound size={19} className="text-[#0075de]" aria-hidden="true" />
              <p id="provider-prerequisite-title" className="mt-3 text-sm font-semibold">
                {t('prerequisite')}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#615d59]">{t('prerequisiteDesc')}</p>
              <Link
                href="/dashboard/provider"
                className="mt-4 inline-flex text-sm font-semibold text-[#0075de] underline decoration-[#0075de]/30 underline-offset-4 transition-colors hover:text-[#005cae] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0075de]"
              >
                {t('openProviderDesk')}
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
