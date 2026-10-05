import { ArrowRight, FolderKanban, KeyRound, Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { PipelineSpine } from '@/app/components/PipelineSpine'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { Caption, Panel, StatusBadge, buttonClassName } from '@/app/components/ui'
import { auth } from '@/lib/auth'
import { logoutAction } from '@/lib/auth/actions'
import { getUserProjects } from '@/lib/projects/project-service'

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

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  CONFIGURED: 'Configured',
  ANALYZING: 'Analyzing',
  CLARIFYING: 'Clarifying',
  CONTEXT_READY: 'Context ready',
  GENERATING: 'Generating',
  READY: 'Ready',
  EXPORTABLE: 'Exportable',
  GENERATION_FAILED: 'Failed',
}

function formatRelative(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const projects = await getUserProjects(session.user.id)

  return (
    <main className="min-h-screen px-4 py-4 text-[var(--ink)] sm:px-6">
      <div className="mx-auto max-w-7xl border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hero)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--ink)] bg-[var(--electric-yellow)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-mono text-xs font-black sm:text-sm">
            <span className="inline-flex size-7 items-center justify-center border-2 border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-raised)]">
              BC
            </span>
            <span>bantuin.dev / dashboard</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="hidden max-w-56 truncate font-mono text-xs font-bold sm:inline">
              {session.user.email}
            </span>
            <LanguageSwitcher />
            <form action={logoutAction}>
              <button type="submit" className={buttonClassName({ variant: 'neutral', size: 'sm' })}>
                Sign out
              </button>
            </form>
            <Link href="/projects/new" className={buttonClassName({ variant: 'primary', size: 'sm' })}>
              <Plus size={16} aria-hidden="true" /> New project
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b-2 border-[var(--ink)] bg-[var(--lavender)] p-4 sm:p-6 lg:border-b-0 lg:border-r-2">
            <Caption>Control desk</Caption>
            <h1 className="mt-5 text-4xl font-black leading-[0.92] tracking-[-0.055em]">
              Your project files.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">
              Configure a provider, open a project, and move its context toward an exportable pack.
            </p>

            <nav className="mt-8 grid gap-3" aria-label="Dashboard actions">
              <Link
                href="/projects/new"
                className={buttonClassName({ variant: 'secondary', className: 'w-full justify-between' })}
              >
                Capture an idea <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/dashboard/provider"
                className={buttonClassName({ variant: 'neutral', className: 'w-full justify-between' })}
              >
                Provider settings <KeyRound size={17} aria-hidden="true" />
              </Link>
            </nav>

            <div className="mt-8 border-t-2 border-[var(--ink)] pt-5">
              <p className="font-mono text-xs font-black">Current chapter</p>
              <p className="mt-2 text-sm font-bold">01 · Idea</p>
              <p className="mt-1 text-xs leading-5 text-[var(--paper-muted)]">
                Start or reopen a project. Each workspace advances independently.
              </p>
            </div>
          </aside>

          <section className="min-w-0 bg-[var(--paper)] p-4 sm:p-6 lg:p-8">
            <PipelineSpine current="idea" compact className="mb-6" />

            <ProviderSetupPanel />

            <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-[var(--ink)] pb-3">
              <div>
                <p className="font-mono text-xs font-black text-[var(--paper-muted)]">Project ledger</p>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="text-3xl font-black tracking-[-0.045em]">Projects</h2>
                  <StatusBadge tone="accent">{projects.length} total</StatusBadge>
                </div>
              </div>
              <Link
                href="/dashboard/provider"
                className="text-sm font-black underline decoration-2 underline-offset-4"
              >
                Open provider desk →
              </Link>
            </div>

            {projects.length === 0 ? (
              <Panel tone="yellow" className="mt-5 p-6 sm:p-8">
                <FolderKanban size={34} strokeWidth={2.5} aria-hidden="true" />
                <h2 className="mt-5 text-3xl font-black tracking-[-0.045em]">The ledger is empty.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6">
                  Add a raw project idea. BantuinCoding will identify missing decisions, build a canonical
                  context, and prepare the documents your coding agent needs.
                </p>
                <Link
                  href="/projects/new"
                  className={buttonClassName({ variant: 'primary', size: 'lg', className: 'mt-6' })}
                >
                  Bootstrap first project <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Panel>
            ) : (
              <div className="mt-5 overflow-hidden border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hard)]">
                <div className="hidden grid-cols-12 border-b-2 border-[var(--ink)] bg-[var(--ink)] px-4 py-2 font-mono text-[11px] font-bold text-[var(--paper-raised)] md:grid">
                  <span className="col-span-2">State</span>
                  <span className="col-span-4">Project</span>
                  <span className="col-span-2">Type</span>
                  <span className="col-span-2">Agent</span>
                  <span className="col-span-1 text-right">Docs</span>
                  <span className="col-span-1 text-right">Updated</span>
                </div>

                <div className="divide-y-2 divide-[var(--ink)]">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group grid gap-4 bg-[var(--paper-raised)] px-4 py-4 transition-colors hover:bg-[var(--cobalt-dim)] md:grid-cols-12 md:items-center"
                    >
                      <div className="md:col-span-2">
                        <StatusBadge tone={STATUS_TONE[project.status] ?? 'neutral'}>
                          {STATUS_LABEL[project.status] ?? project.status}
                        </StatusBadge>
                      </div>

                      <div className="min-w-0 md:col-span-4">
                        <p className="truncate text-base font-black group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                          {project.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-[var(--paper-muted)]">
                          {project.rawIdea.slice(0, 90)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs md:contents">
                        <span className="font-mono font-bold text-[var(--paper-muted)] md:col-span-2">
                          {project.classification.toLowerCase().replace(/_/g, '-')}
                        </span>
                        <span className="font-mono font-bold text-[var(--paper-muted)] md:col-span-2">
                          {project.targetAgent.toLowerCase().replace(/_/g, '-')}
                        </span>
                        <span className="font-mono font-bold md:col-span-1 md:text-right">
                          {project._count.artifacts} docs
                        </span>
                        <span className="font-mono text-[var(--paper-muted)] md:col-span-1 md:text-right">
                          {formatRelative(project.updatedAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
