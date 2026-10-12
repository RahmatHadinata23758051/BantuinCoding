import { getTranslations } from 'next-intl/server'

export default async function DashboardLoading() {
  const t = await getTranslations('Common')

  return (
    <main aria-busy="true" aria-describedby="dashboard-loading-label" className="min-h-screen bg-[#f7f6f3] text-[#24231f]">
      <p id="dashboard-loading-label" role="status" className="sr-only">{t('loading')}</p>
      <div aria-hidden="true">
        <div className="mx-3 flex min-h-[60px] items-center justify-between rounded-2xl border border-white/80 bg-[#f7f6f3]/85 px-4 shadow-[0_12px_30px_rgba(36,35,31,0.08)] sm:mx-5 sm:min-h-[64px] sm:rounded-full sm:px-5">
          <div className="h-5 w-28 rounded-full bg-[#dedbd5] motion-safe:animate-pulse" />
          <div className="flex gap-2"><div className="h-9 w-20 rounded-full bg-[#dedbd5] motion-safe:animate-pulse" /><div className="h-9 w-9 rounded-full bg-[#dedbd5] motion-safe:animate-pulse" /></div>
        </div>
        <div className="mx-auto max-w-[1180px] px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-20">
          <section className="mx-auto max-w-4xl text-center">
            <div className="mx-auto h-3 w-40 rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mx-auto mt-5 h-16 w-full max-w-3xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mx-auto mt-5 h-5 w-full max-w-2xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mx-auto mt-8 max-w-3xl rounded-[24px] border border-[#35373e] bg-[#17181b] p-4">
              <div className="h-32 rounded-xl bg-white/10 motion-safe:animate-pulse" />
              <div className="mt-4 flex gap-2"><div className="h-7 w-20 rounded-full bg-white/10 motion-safe:animate-pulse" /><div className="h-7 w-24 rounded-full bg-white/10 motion-safe:animate-pulse" /><div className="h-7 w-16 rounded-full bg-white/10 motion-safe:animate-pulse" /></div>
              <div className="mt-4 flex justify-between"><div className="h-8 w-24 rounded bg-white/10 motion-safe:animate-pulse" /><div className="size-12 rounded-full bg-white/20 motion-safe:animate-pulse" /></div>
            </div>
          </section>
          <section className="mt-20 border-t border-[#dedbd5] pt-10"><div className="h-10 w-72 max-w-full rounded bg-[#dedbd5] motion-safe:animate-pulse" /><div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="min-h-[238px] rounded-[20px] border border-[#dedbd5] bg-[#fffdfa] p-5"><div className="flex justify-between"><div className="h-6 w-24 rounded-full bg-[#ece9e2] motion-safe:animate-pulse" /><div className="h-6 w-20 rounded-full bg-[#ece9e2] motion-safe:animate-pulse" /></div><div className="mt-6 h-6 w-3/5 rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="mt-3 h-4 w-full rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="mt-2 h-4 w-4/5 rounded bg-[#ece9e2] motion-safe:animate-pulse" /><div className="mt-12 border-t border-[#ebe7e1] pt-4"><div className="h-3 w-36 rounded bg-[#ece9e2] motion-safe:animate-pulse" /></div></div>)}</div></section>
        </div>
      </div>
    </main>
  )
}
