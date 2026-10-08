import { LoaderCircle } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Caption, PageFrame, Panel, TopBar } from '@/app/components/ui'

export default async function DashboardLoading() {
  const t = await getTranslations('Dashboard')

  return (
    <PageFrame width="7xl" className="!border-[#e8e8f2] !bg-white !shadow-none py-4 text-[#303055]" contentClassName="overflow-hidden">
      <TopBar className="!border-[#e8e8f2] !bg-white">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#303055] sm:text-sm">
          <span className="inline-flex size-7 items-center justify-center rounded-[4px] border border-[#303055] bg-[#303055] text-xs text-white">
            BC
          </span>
          <span>{t('workspaceLabel')}</span>
        </div>
      </TopBar>
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-[#e8e8f2] bg-[#e8e8f2] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
          <Caption className="!border-[#303055] !bg-white !text-[#303055] !shadow-none">{t('controlDesk')}</Caption>
          <div className="mt-5 h-12 w-48 motion-safe:animate-pulse rounded bg-white/70" />
          <div className="mt-4 h-16 max-w-xs motion-safe:animate-pulse rounded bg-white/70" />
        </aside>
        <section className="min-w-0 bg-white p-5 sm:p-7 lg:p-8" aria-busy="true" aria-live="polite">
          <div className="flex items-center gap-3 border-b border-[#e8e8f2] pb-5">
            <LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />
            <p className="font-mono text-xs font-semibold text-[#767682]">{t('loadingDashboard')}</p>
          </div>
          <Panel raised={false} className="mt-6 h-40 motion-safe:animate-pulse rounded-lg !border-[#e8e8f2] !bg-[#e8e8f2] !shadow-none" />
        </section>
      </div>
    </PageFrame>
  )
}
