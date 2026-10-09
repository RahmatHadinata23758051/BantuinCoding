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
      className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#dedbd5] bg-white/70 px-3 text-xs font-semibold text-[#24231f] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f6f3]"
    >
      <Languages size={14} strokeWidth={2} aria-hidden="true" />
      <span className="uppercase tracking-wider">{locale}</span>
    </button>
  )
}
