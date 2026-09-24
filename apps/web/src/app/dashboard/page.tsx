import { auth } from '@/lib/auth'
import { getUserProjects } from '@/lib/projects/project-service'
import { redirect } from 'next/navigation'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-zinc-400 bg-zinc-900 border-zinc-800',
  CONFIGURED: 'text-blue-400 bg-blue-950/40 border-blue-900/60',
  ANALYZING: 'text-amber-400 bg-amber-950/40 border-amber-900/60',
  CLARIFYING: 'text-purple-400 bg-purple-950/40 border-purple-900/60',
  CONTEXT_READY: 'text-cyan-400 bg-cyan-950/40 border-cyan-900/60',
  GENERATING: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/60',
  READY: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/60',
  EXPORTABLE: 'text-emerald-300 bg-emerald-950/60 border-emerald-800',
  GENERATION_FAILED: 'text-red-400 bg-red-950/40 border-red-900/60',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const projects = await getUserProjects(session.user.id)

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3 bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">
            BantuinCoding
          </span>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-semibold text-zinc-200">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-zinc-500">{session.user.email}</span>
          <a
            href="/projects/new"
            className="rounded bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            + New Project
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Projects</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          /* Meaningful Empty State */
          <div className="flex flex-col items-center justify-center rounded border border-dashed border-zinc-800 bg-zinc-900/20 py-16 text-center">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              No Projects Yet
            </div>
            <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed">
              Transform your raw project ideas into structured documentation packs for
              coding agents (Claude Code, Cursor, Codex).
            </p>
            <a
              href="/projects/new"
              className="rounded bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              Bootstrap First Project →
            </a>
          </div>
        ) : (
          /* Project List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const statusClass =
                STATUS_COLORS[p.status] ?? STATUS_COLORS['DRAFT']
              return (
                <a
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="group flex flex-col justify-between rounded border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-zinc-50 truncate">
                        {p.name}
                      </h3>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusClass}`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                      {p.rawIdea}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500">
                    <span className="font-mono text-zinc-400">{p.classification}</span>
                    <div className="flex items-center gap-3">
                      <span>{p._count.artifacts} docs</span>
                      <span>{p.targetAgent}</span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
