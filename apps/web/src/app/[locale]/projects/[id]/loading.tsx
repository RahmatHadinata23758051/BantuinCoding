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
          <div className="border-b border-[#dedbd5] pb-7">
            <div className="h-5 w-52 rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mt-4 h-12 w-full max-w-4xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
            <div className="mt-4 h-12 w-full max-w-3xl rounded bg-[#dedbd5] motion-safe:animate-pulse" />
          </div>
          <div className="mt-4 h-20 rounded-2xl bg-[#24231f] p-4 motion-safe:animate-pulse sm:h-16" />
          <div className="mt-4 h-24 rounded-2xl border border-[#dedbd5] bg-[#fffdfa] motion-safe:animate-pulse" />
          <div className="mt-5 h-12 w-full rounded bg-[#dedbd5] motion-safe:animate-pulse" />
          <div className="mt-8 h-72 rounded-[20px] border border-[#dedbd5] bg-[#fffdfa] motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  )
}
