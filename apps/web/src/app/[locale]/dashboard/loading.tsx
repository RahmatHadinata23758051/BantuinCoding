import { getTranslations } from 'next-intl/server'

export default async function DashboardLoading() {
  const t = await getTranslations('Common')

  return (
    <main aria-busy="true" aria-describedby="dashboard-loading-label" className="min-h-screen bg-[#f7f6f3] text-[#24231f]">
      <p id="dashboard-loading-label" role="status" className="sr-only">{t('loading')}</p>
      <div aria-hidden="true">
        <div className="flex min-h-16 items-center justify-between border-b border-[#dedbd5] bg-[#fffdfa] px-4 py-3 sm:px-6 lg:px-8">
          <div className="h-7 w-32 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
          <div className="h-9 w-48 rounded-full bg-[#ece9e2] motion-safe:animate-pulse" />
        </div>
        <div className="border-b border-[#dedbd5] px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-3 w-32 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
          <div className="mt-4 h-9 w-72 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" />
          <div className="mt-3 h-4 w-full max-w-2xl rounded bg-[#ece9e2] motion-safe:animate-pulse" />
          <div className="mt-7 grid max-w-3xl grid-cols-3 divide-x divide-[#dedbd5] border-y border-[#dedbd5]">
            {[0, 1, 2].map((item) => (
              <div key={item} className="space-y-2 px-3 py-4 first:pl-0 last:pr-0 sm:px-6">
                <div className="h-3 w-20 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" />
                <div className="h-7 w-8 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 h-7 w-36 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
          <div className="overflow-hidden rounded-xl border border-[#dedbd5] bg-[#fffdfa]">
            <div className="hidden h-11 border-b border-[#dedbd5] bg-[#f0ece6]/45 md:block" />
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid gap-4 border-b border-[#dedbd5] px-4 py-5 last:border-b-0 sm:px-5 md:grid-cols-[2fr_150px_1.25fr_90px_110px_24px] md:items-center lg:px-6">
                <div className="space-y-2"><div className="h-5 w-48 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="h-3 w-72 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" /></div>
                <div className="h-6 w-20 rounded-full bg-[#ece9e2] motion-safe:animate-pulse" />
                <div className="h-4 w-36 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" />
                <div className="h-4 w-8 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
                <div className="h-4 w-16 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
                <div className="hidden h-4 w-4 rounded bg-[#ece9e2] motion-safe:animate-pulse md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
