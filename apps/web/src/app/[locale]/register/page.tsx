'use client'

import { ArrowRight } from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { useRef, useState } from 'react'
import { registerAction } from '@/lib/auth/actions'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { Button, Input } from '@/app/components/ui'

export default function RegisterPage() {
  const t = useTranslations('Auth')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await registerAction(formData)
      if (!result.success) {
        setError(result.error ?? t('registrationFailed'))
        requestAnimationFrame(() => errorRef.current?.focus())
        return
      }

      router.push('/login?registered=1')
    } catch {
      setError(t('registrationFailed'))
      requestAnimationFrame(() => errorRef.current?.focus())
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f5f4] px-5 text-[#171715] sm:px-8">
      <header className="mx-auto flex h-[76px] max-w-6xl items-center justify-between border-b border-black/10">
        <Link href="/" className="text-[15px] font-semibold tracking-[-0.04em]">bantuin.dev</Link>
        <LanguageSwitcher />
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-77px)] max-w-6xl items-center gap-14 py-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-24">
        <section aria-labelledby="auth-title" className="order-2 w-full max-w-md lg:order-1">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#77736e]">{t('newMember')}</p>
            <h1 id="auth-title" className="mt-3 text-3xl font-semibold tracking-[-.05em]">{t('createAccountTitle')}</h1>
          </div>
          {error && <div ref={errorRef} role="alert" tabIndex={-1} className="mb-5 border-l-2 border-[#bd4b3f] bg-[#fff1ee] p-4 text-sm font-medium text-[#8f2416]">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={loading}>
            <div className="flex flex-col gap-2"><label htmlFor="name" className="text-sm font-medium">{t('nameOptional')}</label><Input id="name" name="name" type="text" autoComplete="name" placeholder={t('namePlaceholder')} className="rounded-md border-black/20 bg-white px-4 py-3" /></div>
            <div className="flex flex-col gap-2"><label htmlFor="email" className="text-sm font-medium">{t('emailLabel')}</label><Input id="email" name="email" type="email" required autoComplete="email" placeholder={t('emailPlaceholder')} className="rounded-md border-black/20 bg-white px-4 py-3" /></div>
            <div className="flex flex-col gap-2"><label htmlFor="password" className="text-sm font-medium">{t('passwordLabel')}</label><Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder={t('passwordPlaceholder')} className="rounded-md border-black/20 bg-white px-4 py-3" /></div>
            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">{loading ? tCommon('loading') : t('submitRegisterBtn')}{!loading && <ArrowRight size={18} aria-hidden="true" />}</Button>
          </form>
          <p className="mt-7 text-sm text-[#757575]"><Link href="/login" className="font-medium text-[#176fc0] underline-offset-4 hover:underline">{t('haveAccount')}</Link></p>
        </section>
        <aside className="order-1 max-w-xl lg:order-2 lg:justify-self-end">
          <p className="text-xs font-semibold uppercase tracking-[.17em] text-[#77736e]">{t('openNewProject')}</p>
          <h2 className="mt-6 max-w-lg text-5xl font-semibold leading-[.99] tracking-[-.065em] sm:text-7xl">{t('oneAccount')}</h2>
          <p className="mt-7 max-w-md text-base leading-7 text-[#615d59]">{t('oneAccountDesc')}</p>
          <div className="mt-12 max-w-md border-l-2 border-[#edc6a4] pl-5">
            <p className="text-sm font-semibold">{t('bringOwnKey')}</p>
            <p className="mt-1 text-sm leading-6 text-[#757575]">{t('bringOwnKeyDesc')}</p>
            <p className="mt-5 text-sm font-semibold">{t('leavePack')}</p>
            <p className="mt-1 text-sm leading-6 text-[#757575]">{t('leavePackDesc')}</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
