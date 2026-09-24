import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
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

export default async function NewProjectPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3 bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Dashboard
          </a>
          <span className="text-zinc-700">/</span>
          <h1 className="text-sm font-semibold text-zinc-200">New Project</h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl w-full mx-auto">
        <div className="mb-6">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">
            Step 1 of 3 — Project Setup
          </span>
          <h2 className="text-xl font-semibold text-zinc-50 mt-1">
            Capture Raw Idea
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Describe what you want to build. The system will analyze requirements,
            ask clarification questions, and generate a complete documentation pack.
          </p>
        </div>

        <form action={handleCreateProject} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-xs font-semibold text-zinc-300 uppercase tracking-wide"
            >
              Project Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Acme SaaS Analytics"
              className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rawIdea"
              className="text-xs font-semibold text-zinc-300 uppercase tracking-wide"
            >
              Raw Idea / Description
            </label>
            <textarea
              id="rawIdea"
              name="rawIdea"
              rows={6}
              required
              minLength={10}
              placeholder="Describe the application, target users, key features, business goals, or tech constraints..."
              className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="classification"
                className="text-xs font-semibold text-zinc-300 uppercase tracking-wide"
              >
                Project Type
              </label>
              <select
                id="classification"
                name="classification"
                defaultValue="SAAS"
                className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="SAAS">SaaS App</option>
                <option value="CRUD_APP">CRUD Application</option>
                <option value="DASHBOARD">Dashboard / Admin</option>
                <option value="API_SERVICE">API Service</option>
                <option value="STATIC_SITE">Static Site</option>
                <option value="LANDING_PAGE">Landing Page</option>
                <option value="MOBILE_APP">Mobile App</option>
                <option value="AI_APP">AI Application</option>
                <option value="IOT_DASHBOARD">IoT Dashboard</option>
                <option value="FULLSTACK_COMPLEX">Fullstack Complex</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="targetAgent"
                className="text-xs font-semibold text-zinc-300 uppercase tracking-wide"
              >
                Target Coding Agent
              </label>
              <select
                id="targetAgent"
                name="targetAgent"
                defaultValue="CLAUDE_CODE"
                className="rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="CLAUDE_CODE">Claude Code</option>
                <option value="CURSOR">Cursor</option>
                <option value="CODEX">OpenAI Codex</option>
                <option value="OPENCODE">OpenCode</option>
                <option value="ANTIGRAVITY">AntiGravity</option>
                <option value="OTHER">Other Agent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              Initial status will be <span className="text-zinc-300">DRAFT</span>
            </span>

            <button
              type="submit"
              className="rounded bg-zinc-100 px-5 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              Create Project →
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
