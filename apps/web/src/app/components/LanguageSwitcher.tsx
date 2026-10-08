'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale() {
    const nextLocale = locale === 'en' ? 'id' : 'en'
    // Mempertahankan rute saat ini, hanya mengganti locale
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      aria-label={locale === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
      className="inline-flex h-9 items-center justify-center gap-2 border border-black/10 bg-white px-3 text-xs font-semibold text-[#111] transition-colors hover:bg-[#fafaf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0075de] focus-visible:ring-offset-2"
    >
      <Languages size={14} strokeWidth={2} aria-hidden="true" />
      <span className="uppercase tracking-wider">{locale}</span>
    </button>
  )
}
