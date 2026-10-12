import { getTranslations } from 'next-intl/server'

export default async function ProjectWorkspaceLoading() {
  const t = await getTranslations('Common')

  return (
    <main
      aria-busy="true"
      aria-describedby="project-workspace-loading-label"
      className="min-h-screen bg-[#f7f6f3] text-[#24231f]"
    >
      <p id="project-workspace-loading-label" role="status" aria-live="polite" className="sr-only">
        {t('loading')}
      </p>
      <div aria-hidden="true">
        <div className="mx-3 flex min-h-[60px] items-center justify-between rounded-2xl border border-white/80 bg-[#f7f6f3]/85 px-4 shadow-[0_12px_30px_rgba(36,35,31,0.08)] sm:mx-5 sm:min-h-[64px] sm:rounded-full sm:px-5">
          <div className="h-5 w-28 rounded-full bg-[#dedbd5] motion-safe:animate-pulse" />
          <div className="h-9 w-24 rounded-full bg-[#dedbd5] motion-safe:animate-pulse" />
        </div>
        <div className="min-h-screen lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="hidden border-r border-[#dedbd5] bg-[#fffdfa] p-6 lg:block">
            <div className="h-7 w-32 rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mt-2 h-4 w-40 rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mt-10 space-y-2">
              <div className="h-10 rounded-lg bg-[#dedbd5] motion-safe:animate-pulse" />
              <div className="h-10 rounded-lg bg-[#dedbd5] motion-safe:animate-pulse" />
              <div className="h-10 rounded-lg bg-[#dedbd5] motion-safe:animate-pulse" />
              <div className="h-10 rounded-lg bg-[#dedbd5] motion-safe:animate-pulse" />
              <div className="h-10 rounded-lg bg-[#dedbd5] motion-safe:animate-pulse" />
            </div>
          </div>
          <div>
            <div className="h-[73px] border-b border-[#dedbd5] bg-[#fffdfa] px-4 py-4 sm:px-6 lg:px-10">
              <div className="h-9 w-28 rounded-lg bg-[#dedbd5] motion-safe:animate-pulse" />
            </div>
            <div className="mx-auto w-full max-w-[1500px] px-4 pb-20 pt-8 sm:px-6 lg:px-10 xl:px-14">
              <div className="border-b border-[#dedbd5] pb-8">
                <div className="h-5 w-64 rounded bg-[#dedbd5] motion-safe:animate-pulse" />
                <div className="mt-5 h-14 w-full max-w-4xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
                <div className="mt-5 h-14 w-full max-w-3xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
              </div>
              <div className="h-24 border-b border-[#dedbd5] motion-safe:animate-pulse" />
              <div className="mt-8 h-72 rounded-[20px] border border-[#dedbd5] bg-[#fffdfa] motion-safe:animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
