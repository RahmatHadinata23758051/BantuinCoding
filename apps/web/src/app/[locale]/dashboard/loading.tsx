import { getTranslations } from 'next-intl/server'

export default async function DashboardLoading() {
  const t = await getTranslations('Common')

  return (
    <main aria-busy="true" aria-describedby="dashboard-loading-label" className="min-h-screen bg-[var(--paper)] px-4 py-5 text-[var(--ink)] sm:px-6 lg:px-10">
      <p id="dashboard-loading-label" role="status" className="sr-only">{t('loading')}</p>
      <div aria-hidden="true" className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between border-b border-[var(--ink)]/15 pb-5">
          <div className="h-9 w-40 rounded-lg bg-[var(--lavender)] motion-safe:animate-pulse" />
          <div className="h-9 w-44 rounded-lg bg-[var(--lavender)] motion-safe:animate-pulse" />
        </div>
        <div className="grid gap-6 border-b border-[var(--ink)]/10 py-10 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded bg-[var(--lavender)] motion-safe:animate-pulse" />
            <div className="h-10 w-64 max-w-full rounded bg-[var(--lavender)] motion-safe:animate-pulse" />
            <div className="h-4 w-full max-w-lg rounded bg-[var(--lavender)] motion-safe:animate-pulse" />
          </div>
          <div className="h-10 w-56 max-w-full rounded-lg bg-[var(--lavender)] motion-safe:animate-pulse" />
        </div>
        <div className="my-6 h-20 rounded-xl border border-[var(--ink)]/10 bg-white" />
        <div className="h-8 w-44 rounded bg-[var(--lavender)] motion-safe:animate-pulse" />
        <div className="mt-5 divide-y divide-[var(--ink)]/10 border-y border-[var(--ink)]/10">
          {[0, 1, 2].map((item) => <div key={item} className="space-y-3 py-5">
            <div className="h-5 w-52 max-w-full rounded bg-[var(--lavender)] motion-safe:animate-pulse" />
            <div className="h-4 w-full max-w-xl rounded bg-[var(--lavender)] motion-safe:animate-pulse" />
          </div>)}
        </div>
      </div>
    </main>
  )
}
