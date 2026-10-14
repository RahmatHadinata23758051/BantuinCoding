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
          className="min-h-32 w-full resize-none bg-transparent px-2 py-2 text-base leading-7 text-[#24231f] outline-none placeholder:text-[#a9a29a] focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdfa] focus:placeholder:text-[#706b64] sm:min-h-36 sm:text-lg"
        />

        <input type="hidden" name="language" value={locale === 'id' ? 'id' : 'en'} />

        <div className="mt-3 flex items-center justify-end gap-3 border-t border-[#dedbd5] pt-3">
          <span className="hidden text-[11px] text-[#a9a29a] sm:inline">{t('promptSendHint')}</span>
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}
