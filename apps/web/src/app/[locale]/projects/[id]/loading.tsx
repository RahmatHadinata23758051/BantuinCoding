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
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-10 xl:px-12">
          <div className="grid gap-8 border-b border-[#dedbd5] pb-8 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] xl:gap-12">
            <div>
              <div className="h-5 w-64 rounded bg-[#dedbd5] motion-safe:animate-pulse" />
              <div className="mt-5 h-14 w-full max-w-4xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
              <div className="mt-5 h-14 w-full max-w-3xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            </div>
            <div className="h-[27rem] rounded-[20px] border border-[#dedbd5] bg-[#fffdfa] p-5 motion-safe:animate-pulse sm:p-6" />
          </div>
          <div className="mt-6 h-12 w-full rounded bg-[#dedbd5] motion-safe:animate-pulse" />
          <div className="mt-8 h-72 rounded-[20px] border border-[#dedbd5] bg-[#fffdfa] motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  )
}
