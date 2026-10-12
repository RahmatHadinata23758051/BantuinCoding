import { getTranslations } from 'next-intl/server'

export default async function DashboardLoading() {
  const t = await getTranslations('Common')

  return (
    <main aria-busy="true" aria-describedby="dashboard-loading-label" className="min-h-screen bg-[#f7f6f3] px-4 py-5 text-[#24231f] sm:px-6 lg:px-10">
      <p id="dashboard-loading-label" role="status" className="sr-only">{t('loading')}</p>
      <div aria-hidden="true" className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[#dedbd5] bg-[#fffdfa]">
        <div className="flex items-center justify-between border-b border-[#dedbd5] px-5 py-4 sm:px-8">
          <div className="h-7 w-32 rounded-full bg-[#ece9e2] motion-safe:animate-pulse" />
          <div className="h-9 w-44 rounded-full bg-[#ece9e2] motion-safe:animate-pulse" />
        </div>
        <div className="flex flex-col gap-6 border-b border-[#dedbd5] px-5 py-10 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="h-10 w-64 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" />
            <div className="h-4 w-full max-w-lg rounded bg-[#ece9e2] motion-safe:animate-pulse" />
          </div>
          <div className="h-11 w-44 max-w-full rounded-full bg-[#ece9e2] motion-safe:animate-pulse" />
        </div>
        <div className="px-5 py-10 sm:px-8">
          <div className="mb-6 h-8 w-44 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
          <div className="overflow-hidden rounded-2xl border border-[#dedbd5]">
            {[0, 1, 2].map((item) => (
              <div key={item} className="space-y-3 border-b border-[#dedbd5] px-5 py-5 last:border-b-0 sm:px-6">
                <div className="h-5 w-52 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" />
                <div className="h-4 w-full max-w-xl rounded bg-[#ece9e2] motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
