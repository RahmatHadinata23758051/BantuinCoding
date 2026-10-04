import { KeyRound, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ProviderSetupPanel } from '@/app/components/ProviderSetupPanel'
import { Caption, Panel, buttonClassName } from '@/app/components/ui'
import { auth } from '@/lib/auth'

export default async function ProviderSettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <main className="min-h-screen px-4 py-5 text-[var(--ink)] sm:px-6">
      <div className="mx-auto max-w-5xl border-2 border-[var(--ink)] bg-[var(--paper-raised)] shadow-[var(--shadow-hero)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--ink)] bg-[var(--electric-yellow)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-mono text-xs font-black sm:text-sm">
            <Link href="/dashboard" className="underline decoration-2 underline-offset-4">
              ← Dashboard
            </Link>
            <span>/ provider desk</span>
          </div>
          <span className="max-w-56 truncate font-mono text-xs font-bold">{session.user.email}</span>
        </header>

        <section className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="border-b-2 border-[var(--ink)] bg-[var(--cobalt)] p-6 text-white sm:p-8 lg:border-b-0 lg:border-r-2">
            <Caption className="bg-[var(--electric-yellow)] text-[var(--ink)]">BYOK checkpoint</Caption>
            <h1 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.06em]">
              Wire the model without leaking the key.
            </h1>
            <p className="mt-5 text-sm leading-6 text-white/85">
              This screen only configures the current server session. Provider secrets do not belong in
              generated Markdown, browser-visible errors, fixtures, telemetry, or ZIP exports.
            </p>
            <Link
              href="/projects/new"
              className={buttonClassName({ variant: 'secondary', size: 'lg', className: 'mt-8' })}
            >
              Capture a project idea
            </Link>
          </aside>

          <div className="bg-[var(--paper)] p-5 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center border-2 border-[var(--ink)] bg-[var(--mint)] shadow-[var(--shadow-sm)]">
                <KeyRound size={24} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">AI provider</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--paper-muted)]">
                  Choose a provider, confirm the model ID, and test the connection before running
                  analysis or document generation.
                </p>
              </div>
            </div>

            <ProviderSetupPanel />

            <Panel raised={false} className="mt-6 p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--pass-teal)]" size={20} aria-hidden="true" />
                <div>
                  <p className="font-mono text-xs font-black">Security note</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--paper-muted)]">
                    Responses expose safe provider/model metadata only. If a provider rejects the key,
                    the UI shows an actionable typed failure without printing the raw SDK payload.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  )
}
