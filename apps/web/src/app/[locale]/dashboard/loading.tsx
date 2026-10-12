import { getTranslations } from 'next-intl/server'

export default async function DashboardLoading() {
  const t = await getTranslations('Common')

  return (
    <main aria-busy="true" aria-describedby="dashboard-loading-label" className="min-h-screen bg-[#f7f6f3] text-[#24231f]">
      <p id="dashboard-loading-label" role="status" className="sr-only">{t('loading')}</p>
      <div aria-hidden="true" className="lg:grid lg:min-h-screen lg:grid-cols-[232px_minmax(0,1fr)]">
        <div className="border-b border-[#393832] bg-[#292823] px-4 py-4 sm:px-6 lg:border-b-0 lg:px-5 lg:py-6">
          <div className="h-7 w-32 rounded bg-[#48463e] motion-safe:animate-pulse" />
          <div className="mt-8 hidden space-y-2 lg:block">
            <div className="h-9 rounded-lg bg-[#f7f6f3]/90 motion-safe:animate-pulse" />
            <div className="h-9 rounded-lg bg-[#393832] motion-safe:animate-pulse" />
            <div className="mt-7 h-3 w-16 rounded bg-[#48463e] motion-safe:animate-pulse" />
            <div className="mt-2 h-9 rounded-lg bg-[#393832] motion-safe:animate-pulse" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex min-h-[65px] items-center justify-between border-b border-[#dedbd5] bg-[#fffdfa] px-4 sm:px-6 lg:px-8">
            <div className="space-y-2"><div className="h-3 w-32 rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="h-4 w-28 rounded bg-[#ece9e2] motion-safe:animate-pulse" /></div>
            <div className="h-9 w-28 rounded-lg bg-[#ece9e2] motion-safe:animate-pulse" />
          </div>
          <div className="px-4 pb-16 sm:px-6 lg:px-8">
            <section className="border-b border-[#dedbd5] py-8 sm:py-10">
              <div className="h-3 w-40 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
              <div className="mt-4 h-11 w-80 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" />
              <div className="mt-3 h-4 w-full max-w-2xl rounded bg-[#ece9e2] motion-safe:animate-pulse" />
              <div className="mt-8 grid max-w-4xl gap-px overflow-hidden rounded-xl border border-[#dedbd5] bg-[#dedbd5] sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="space-y-3 bg-[#fffdfa] px-4 py-5 sm:px-5"><div className="h-3 w-24 rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="h-8 w-8 rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="h-3 w-28 rounded bg-[#ece9e2] motion-safe:animate-pulse" /></div>
                ))}
              </div>
            </section>
            <section className="pt-8 sm:pt-10">
              <div className="mb-5 h-7 w-32 rounded bg-[#ece9e2] motion-safe:animate-pulse" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="min-h-[270px] rounded-2xl border border-[#dedbd5] bg-[#fffdfa] p-5"><div className="flex justify-between"><div className="size-9 rounded-lg bg-[#ece9e2] motion-safe:animate-pulse" /><div className="h-6 w-20 rounded-full bg-[#ece9e2] motion-safe:animate-pulse" /></div><div className="mt-5 space-y-2"><div className="h-5 w-40 max-w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="h-4 w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="h-4 w-4/5 rounded bg-[#ece9e2] motion-safe:animate-pulse" /></div><div className="mt-8 h-2 w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="mt-5 border-t border-[#ebe7e1] pt-4"><div className="h-3 w-28 rounded bg-[#ece9e2] motion-safe:animate-pulse" /></div></div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
