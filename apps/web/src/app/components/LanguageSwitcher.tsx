'use client'

import { Check, ChevronDown, Languages } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from '@/i18n/routing'

const LOCALES = [
  { value: 'id', labelKey: 'indonesian' },
  { value: 'en', labelKey: 'english' },
] as const

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations('Common')
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(LOCALES.findIndex((option) => option.value === locale), 0))
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    optionRefs.current[activeIndex]?.focus()
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [activeIndex, open])

  function switchLocale(nextLocale: (typeof LOCALES)[number]['value']) {
    setOpen(false)
    if (nextLocale !== locale) router.replace(pathname, { locale: nextLocale })
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const currentIndex = LOCALES.findIndex((option) => option.value === locale)
      setActiveIndex(currentIndex >= 0 ? currentIndex : 0)
      setOpen(true)
    }
  }

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      rootRef.current?.querySelector('button')?.focus()
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => (current + delta + LOCALES.length) % LOCALES.length)
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : LOCALES.length - 1)
    }
  }

  function handleMenuFocus(index: number) {
    setActiveIndex(index)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('language')}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#dedbd5] bg-white/70 px-3 text-xs font-semibold text-[#24231f] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]"
      >
        <Languages size={14} strokeWidth={2} aria-hidden="true" />
        <span className="uppercase tracking-wider">{locale}</span>
        <ChevronDown size={13} className={`transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={t('language')}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-44 rounded-2xl border border-[#dedbd5] bg-[#fffdfa] p-1.5 shadow-[0_16px_35px_rgba(36,35,31,0.14)]"
        >
          {LOCALES.map((option, index) => {
            const selected = option.value === locale
            return (
              <button
                key={option.value}
                ref={(element) => { optionRefs.current[index] = element }}
                type="button"
                role="menuitemradio"
                tabIndex={index === activeIndex ? 0 : -1}
                aria-checked={selected}
                onFocus={() => handleMenuFocus(index)}
                onClick={() => switchLocale(option.value)}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-[#24231f] transition-colors hover:bg-[#f0ece6] focus-visible:bg-[#f0ece6] focus-visible:outline-none"
              >
                <span className="flex items-center gap-2.5"><span className="w-5 font-mono text-[10px] uppercase text-[#a66142]">{option.value}</span>{t(option.labelKey)}</span>
                {selected && <Check size={14} className="text-[#a66142]" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
