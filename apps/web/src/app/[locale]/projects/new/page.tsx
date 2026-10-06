import { ArrowRight, KeyRound, Lightbulb, ListChecks } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { redirect } from 'next/navigation'

import { PipelineSpine } from '@/app/components/PipelineSpine'
import { Caption, Input, PageFrame, Panel, Select, StatusBadge, Textarea, TopBar, buttonClassName } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { createProject } from '@/lib/projects/project-service'

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

const NEXT_STEPS = [
  'nextStep1',
  'nextStep2',
  'nextStep3',
  'nextStep4',
  'nextStep5',
  'nextStep6',
]

import { getTranslations } from 'next-intl/server'

export default async function NewProjectPage() {
  const t = await getTranslations('NewProject')
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <PageFrame width="7xl">
      <TopBar>
        <div className="flex items-center gap-2 font-mono text-xs font-black sm:text-sm">
          <Link href="/dashboard" className="underline decoration-2 underline-offset-4">
            {t('backDashboard')}
          </Link>
          <span>{t('breadcrumb')}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone="neutral">{t('initialStateDraft')}</StatusBadge>
        </div>
      </TopBar>

      <div className="border-b-2 border-[var(--ink)] bg-[var(--paper)] p-4 sm:p-6">
          <PipelineSpine current="idea" compact />
        </div>

        <section className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="border-b-2 border-[var(--ink)] bg-[var(--paper-raised)] p-5 sm:p-8 lg:border-b-0 lg:border-r-2">
            <Caption>{t('caption')}</Caption>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--paper-muted)]">
              {t('subtitle')}
            </p>

            <form action={handleCreateProject} className="mt-8 grid gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-black">
                  {t('projectName')}
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder={t('projectNamePlaceholder')}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="rawIdea" className="text-sm font-black">
                  {t('projectIdea')}
                </label>
                <Textarea
                  id="rawIdea"
                  name="rawIdea"
                  rows={10}
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder={t('projectIdeaPlaceholder')}
                  className="min-h-64 leading-6"
                />
                <p className="text-xs leading-5 text-[var(--paper-muted)]">
                  {t('projectIdeaNote')}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="classification" className="text-sm font-black">
                    {t('classification')}
                  </label>
                  <Select id="classification" name="classification" defaultValue="SAAS">
                    {CLASSIFICATIONS.map((classification) => (
                      <option key={classification.value} value={classification.value}>
                        {classification.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="targetAgent" className="text-sm font-black">
                    {t('targetAgent')}
                  </label>
                  <Select id="targetAgent" name="targetAgent" defaultValue="CLAUDE_CODE">
                    {AGENTS.map((agent) => (
                      <option key={agent.value} value={agent.value}>
                        {agent.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="language" className="text-sm font-black">
                    {t('language')}
                  </label>
                  <Select id="language" name="language" defaultValue="id">
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t-[3px] border-[var(--ink)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--paper-muted)]">
                  <Lightbulb size={17} className="text-[var(--proof-amber)]" aria-hidden="true" />
                  {t('refineNote')}
                </div>
                <button
                  type="submit"
                  className={buttonClassName({ variant: 'primary', size: 'lg', className: 'w-full sm:w-auto' })}
                >
                  {t('createBtn')} <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>

          <aside className="bg-[var(--lavender)] p-5 sm:p-8">
            <Panel tone="yellow" className="p-5">
              <ListChecks size={28} strokeWidth={2.5} aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">{t('whatHappensNext')}</h2>
              <ol className="mt-5 grid gap-4">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step} className="grid grid-cols-[34px_1fr] gap-3">
                    <span className="flex size-8 items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper-raised)] font-mono text-xs font-black shadow-[var(--shadow-xs)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="pt-1 text-sm font-bold leading-5">{t(step as Parameters<typeof t>[0])}</span>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel raised={false} className="mt-6 p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 shrink-0" size={21} aria-hidden="true" />
                <div>
                  <p className="font-mono text-xs font-black">{t('prerequisite')}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--paper-muted)]">
                    {t('prerequisiteDesc')}
                  </p>
                  <Link
                    href="/dashboard/provider"
                    className="mt-3 inline-block text-sm font-black underline decoration-2 underline-offset-4"
                  >
                    {t('openProviderDesk')}
                  </Link>
                </div>
              </div>
            </Panel>
          </aside>
        </section>
    </PageFrame>
  )
}
