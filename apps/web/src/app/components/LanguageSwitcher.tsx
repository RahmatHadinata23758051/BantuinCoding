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
      onClick={switchLocale}
      className="nb-button-press inline-flex h-9 items-center justify-center gap-2 rounded-[4px] border-2 border-[var(--ink)] bg-[var(--paper-raised)] px-3 text-xs font-bold text-[var(--ink)] shadow-[var(--shadow-xs)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[var(--electric-yellow)] hover:shadow-[var(--shadow-sm)]"
      title={locale === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
    >
      <Languages size={14} strokeWidth={2.5} />
      <span className="uppercase tracking-wider">{locale}</span>
    </button>
  )
}
