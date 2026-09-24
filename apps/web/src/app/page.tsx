export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <main className="flex flex-col items-start gap-6 px-8 py-16 max-w-2xl w-full">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Project Bootstrapper</span>
          <h1 className="text-2xl font-semibold text-zinc-50">Bantuin Coding</h1>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
          Transform raw project ideas into structured documentation packs for coding agents.
          Bring your own API key — no data leaves your session.
        </p>
        <div className="flex flex-col gap-2 text-xs text-zinc-600 border-t border-zinc-800 pt-4 w-full">
          <span>Status: <span className="text-amber-400">Initializing</span></span>
          <span>Phase: Foundation — BK-001</span>
        </div>
      </main>
    </div>
  )
}
