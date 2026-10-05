import { ArrowRight, KeyRound, Lightbulb, ListChecks } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PipelineSpine } from '@/app/components/PipelineSpine'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { Caption, Input, Panel, Select, StatusBadge, Textarea, buttonClassName } from '@/app/components/ui'
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

  const project = await createProject(session.user.id, {
    name,
    rawIdea,
    classification,
    targetAgent,
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
  'Analyze the raw idea and expose requirement gaps.',
  'Ask only the clarification questions that affect implementation.',
  'Normalize confirmed decisions into canonical project context.',
  'Plan and generate the right documentation depth.',
  'Resolve relevant skills and build a dependency-aware backlog.',
  'Review the Markdown and export a secret-safe ZIP.',
]

export default async function NewProjectPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <main className="min-h-screen px-4 py-5 text-[var(--ink)] sm:px-6">
      <div className="mx-auto max-w-7xl border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hero)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--ink)] bg-[var(--electric-yellow)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-mono text-xs font-black sm:text-sm">
            <Link href="/dashboard" className="underline decoration-2 underline-offset-4">
              ← Dashboard
            </Link>
            <span>/ new project</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <StatusBadge tone="neutral">initial state · DRAFT</StatusBadge>
          </div>
        </header>

        <div className="border-b-2 border-[var(--ink)] bg-[var(--paper)] p-4 sm:p-6">
          <PipelineSpine current="idea" compact />
        </div>

        <section className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="border-b-2 border-[var(--ink)] bg-[var(--paper-raised)] p-5 sm:p-8 lg:border-b-0 lg:border-r-2">
            <Caption>Chapter 01 · capture intent</Caption>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl">
              Give the system a useful raw idea—not a perfect spec.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--paper-muted)]">
              Describe the users, the core job, important features, and known constraints. Missing
              high-impact decisions become focused clarification questions later.
            </p>

            <form action={handleCreateProject} className="mt-8 grid gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-black">
                  Project name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Example: Kost Management"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="rawIdea" className="text-sm font-black">
                  Project idea
                </label>
                <Textarea
                  id="rawIdea"
                  name="rawIdea"
                  rows={10}
                  required
                  minLength={10}
                  maxLength={5000}
                  placeholder="Who is this for? What must they be able to do? What business or technical constraints are already known?"
                  className="min-h-64 leading-6"
                />
                <p className="text-xs leading-5 text-[var(--paper-muted)]">
                  Do not paste API keys or other secrets. This text becomes long-lived project context.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="classification" className="text-sm font-black">
                    Starting classification
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
                    Target coding agent
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

              <div className="flex flex-col gap-4 border-t-[3px] border-[var(--ink)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--paper-muted)]">
                  <Lightbulb size={17} className="text-[var(--proof-amber)]" aria-hidden="true" />
                  You can refine context before final generation.
                </div>
                <button
                  type="submit"
                  className={buttonClassName({ variant: 'primary', size: 'lg', className: 'w-full sm:w-auto' })}
                >
                  Create project <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>

          <aside className="bg-[var(--lavender)] p-5 sm:p-8">
            <Panel tone="yellow" className="p-5">
              <ListChecks size={28} strokeWidth={2.5} aria-hidden="true" />
              <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">What happens next</h2>
              <ol className="mt-5 grid gap-4">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step} className="grid grid-cols-[34px_1fr] gap-3">
                    <span className="flex size-8 items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper-raised)] font-mono text-xs font-black shadow-[var(--shadow-xs)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="pt-1 text-sm font-bold leading-5">{step}</span>
                  </li>
                ))}
              </ol>
            </Panel>

            <Panel raised={false} className="mt-6 p-5 shadow-[var(--shadow-sm)]">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 shrink-0" size={21} aria-hidden="true" />
                <div>
                  <p className="font-mono text-xs font-black">Generation prerequisite</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--paper-muted)]">
                    A valid provider session is required before AI analysis. You can create this draft
                    now and configure the key separately.
                  </p>
                  <Link
                    href="/dashboard/provider"
                    className="mt-3 inline-block text-sm font-black underline decoration-2 underline-offset-4"
                  >
                    Open provider desk →
                  </Link>
                </div>
              </div>
            </Panel>
          </aside>
        </section>
      </div>
    </main>
  )
}
