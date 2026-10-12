'use client'

import { Paperclip, Send, Sparkles, Wrench } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

const CLASSIFICATIONS = [
  'SAAS',
  'LANDING_PAGE',
  'DASHBOARD',
  'CRUD_APP',
  'FULLSTACK_COMPLEX',
  'MOBILE_APP',
  'API_SERVICE',
  'AI_APP',
  'OTHER',
] as const

type PromptAction = (formData: FormData) => void | Promise<void>

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('Dashboard')

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={pending ? t('promptCreating') : t('promptSubmit')}
      className="group relative flex size-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#e8e5df] text-[#202126] shadow-[0_0_0_5px_rgba(244,162,97,0.14),0_8px_24px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17181b] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
    >
      <Send size={18} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </button>
  )
}

export function PromptComposer({ action }: { action: PromptAction }) {
  const t = useTranslations('Dashboard')
  const locale = useLocale()
  const [classification, setClassification] = useState<(typeof CLASSIFICATIONS)[number]>('OTHER')
  const formRef = useRef<HTMLFormElement>(null)

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={action} className="relative overflow-hidden rounded-[24px] border border-[#35373e] bg-[linear-gradient(145deg,#23252b_0%,#151619_55%,#101113_100%)] p-3 text-white shadow-[0_22px_60px_rgba(15,16,18,0.28)] sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_32%),linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.035)_50%,transparent_80%)]" aria-hidden="true" />
      <div className="relative">
        <label htmlFor="dashboard-prompt" className="sr-only">{t('promptLabel')}</label>
        <textarea
          id="dashboard-prompt"
          name="prompt"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          onKeyDown={handleKeyDown}
          placeholder={t('promptPlaceholder')}
          className="min-h-32 w-full resize-none bg-transparent px-2 py-2 text-base leading-7 text-white outline-none placeholder:text-white/38 focus:placeholder:text-white/48 sm:min-h-36 sm:text-lg"
        />

        <input type="hidden" name="classification" value={classification} />
        <input type="hidden" name="language" value={locale === 'id' ? 'id' : 'en'} />

        <div className="mt-3 flex gap-2 overflow-x-auto border-t border-white/10 pt-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={t('promptCategoryLabel')}>
          {CLASSIFICATIONS.map((value) => {
            const selected = value === classification
            return (
              <button
                key={value}
                type="button"
                onClick={() => setClassification(value)}
                aria-pressed={selected}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] ${selected ? 'border-[#f4a261]/80 bg-[#f4a261] text-[#25241f]' : 'border-white/12 bg-white/[0.06] text-white/62 hover:border-white/30 hover:text-white'}`}
              >
                {t(`classification${value === 'FULLSTACK_COMPLEX' ? 'FullstackComplex' : value === 'LANDING_PAGE' ? 'LandingPage' : value === 'CRUD_APP' ? 'CrudApp' : value === 'API_SERVICE' ? 'ApiService' : value === 'MOBILE_APP' ? 'MobileApp' : value === 'AI_APP' ? 'AiApp' : value === 'SAAS' ? 'Saas' : value === 'DASHBOARD' ? 'Dashboard' : 'Other'}` as Parameters<typeof t>[0])}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex min-w-0 items-center gap-2 text-white/48">
            <button type="button" disabled aria-label={t('promptAttachment')} className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] disabled:cursor-not-allowed" title={t('promptAttachment')}>
              <Paperclip size={15} aria-hidden="true" />
            </button>
            <span className="hidden items-center gap-1.5 sm:flex" aria-label={t('promptModeLabel')}>
              <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white/75"><Sparkles size={12} className="mr-1 inline" aria-hidden="true" />{t('promptModePrompt')}</span>
              <span className="rounded-md px-2 py-1 text-[11px]">{t('promptModeAuto')}</span>
              <span className="rounded-md px-2 py-1 text-[11px]"><Wrench size={12} className="mr-1 inline" aria-hidden="true" />{t('promptModeTools')}</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-[11px] text-white/35 sm:inline">{t('promptSendHint')}</span>
            <SubmitButton />
          </div>
        </div>
      </div>
    </form>
  )
}
