'use client'

import { Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRef } from 'react'
import { useFormStatus } from 'react-dom'

type PromptAction = (formData: FormData) => void | Promise<void>

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('Dashboard')

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={pending ? t('promptCreating') : t('promptSubmit')}
      className="group relative flex size-12 shrink-0 items-center justify-center rounded-full bg-[#a85e3c] text-white shadow-[0_8px_24px_rgba(168,94,60,0.28)] transition-colors hover:bg-[#8e4e32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdfa] disabled:cursor-wait disabled:opacity-65 motion-reduce:transition-none"
    >
      <Send size={18} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
    </button>
  )
}

export function PromptComposer({ action }: { action: PromptAction }) {
  const t = useTranslations('Dashboard')
  const locale = useLocale()
  const formRef = useRef<HTMLFormElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  function handleTitleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
    event.preventDefault()
    descriptionRef.current?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={action} className="prompt-composer-shell relative overflow-hidden rounded-[24px] border border-[#dedbd5] bg-[#fffdfa] p-3 text-[#24231f] shadow-[0_12px_30px_rgba(36,35,31,0.08)] sm:p-4">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
        <div className="prompt-composer-orb absolute -right-14 -top-16 size-40 rounded-full bg-[#f4a261]/20 blur-3xl" />
        <div className="prompt-composer-signal absolute left-0 top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-[#a85e3c]/70 to-transparent" />
      </div>
      <div className="relative z-10">
        <div className="px-2 pb-3 pt-1">
          <label htmlFor="dashboard-title" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a85e3c]">
            {t('promptTitleLabel')}
          </label>
          <input
            id="dashboard-title"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            onKeyDown={handleTitleKeyDown}
            placeholder={t('promptTitlePlaceholder')}
            className="w-full bg-transparent py-1 text-lg font-semibold tracking-[-0.02em] text-[#24231f] outline-none placeholder:font-normal placeholder:text-[#a9a29a] focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdfa] focus:placeholder:text-[#706b64] sm:text-xl"
          />
        </div>

        <div className="border-t border-[#dedbd5] px-2 pb-2 pt-3">
          <label htmlFor="dashboard-prompt" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#a85e3c]">
            {t('promptDescriptionLabel')}
          </label>
          <textarea
            ref={descriptionRef}
            id="dashboard-prompt"
            name="prompt"
            required
            minLength={10}
            maxLength={5000}
            rows={4}
            onKeyDown={handleKeyDown}
            placeholder={t('promptDescriptionPlaceholder')}
            className="min-h-28 w-full resize-none bg-transparent py-1 text-base leading-7 text-[#24231f] outline-none placeholder:text-[#a9a29a] focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdfa] focus:placeholder:text-[#706b64] sm:min-h-32 sm:text-lg"
          />
        </div>

        <input type="hidden" name="language" value={locale === 'id' ? 'id' : 'en'} />

        <div className="mt-3 flex items-center justify-end gap-3 border-t border-[#dedbd5] pt-3">
          <span className="hidden text-[11px] text-[#a9a29a] sm:inline">{t('promptSendHint')}</span>
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}
