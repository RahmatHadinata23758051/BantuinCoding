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
        <div className="mx-auto max-w-[1180px] px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <div className="border-b border-[#dedbd5] pb-10">
            <div className="h-6 w-52 rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mt-5 h-16 w-full max-w-3xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mt-5 h-6 w-full max-w-2xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
          </div>
          <div className="mt-8 rounded-[24px] bg-[#24231f] p-6 sm:p-8">
            <div className="h-3 w-32 rounded bg-white/20 motion-safe:animate-pulse" />
            <div className="mt-5 h-10 w-full max-w-xl rounded bg-white/15 motion-safe:animate-pulse" />
            <div className="mt-4 h-5 w-full max-w-2xl rounded bg-white/10 motion-safe:animate-pulse" />
          </div>
          <div className="mt-8 h-28 rounded-[20px] border border-[#dedbd5] bg-[#fffdfa] motion-safe:animate-pulse" />
          <div className="mt-8 h-12 w-full rounded bg-[#dedbd5] motion-safe:animate-pulse" />
          <div className="mt-8 h-72 rounded-[20px] border border-[#dedbd5] bg-[#fffdfa] motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  )
}
