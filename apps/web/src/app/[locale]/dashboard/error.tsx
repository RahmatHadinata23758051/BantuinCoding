'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button, Caption, PageFrame, Panel, TopBar } from '@/app/components/ui'

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Dashboard')

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
      <section className="bg-white p-5 sm:p-7 lg:p-8">
        <Panel tone="yellow" raised={false} className="max-w-2xl rounded-lg !border-[#e8e8f2] !bg-[#e8e8f2] !p-6 !shadow-none sm:!p-8">
          <Caption className="!border-[#303055] !bg-white !text-[#303055] !shadow-none">{t('errorCaption')}</Caption>
          <AlertTriangle className="mt-6 text-[#984e4d]" size={32} aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#303055]">{t('errorTitle')}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#403f53]">{t('errorDesc')}</p>
          <Button type="button" variant="primary" className="mt-6 !rounded-[4px] !border-[#303055] !bg-[#303055] !text-white !shadow-none" onClick={reset}>
            <RefreshCw size={17} aria-hidden="true" />
            {t('retryDashboard')}
          </Button>
        </Panel>
      </section>
    </PageFrame>
  )
}
