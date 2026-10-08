'use client'

import { ArrowRight, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { loginAction } from '@/lib/auth/actions'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { Button, Caption, Input, Panel, StatusBadge } from '@/app/components/ui'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageContent registered={false} />}>
      <RegisteredLoginPage />
    </Suspense>
  )
}

function RegisteredLoginPage() {
  const searchParams = useSearchParams()
  return <LoginPageContent registered={searchParams.get('registered') === '1'} />
}

function LoginPageContent({ registered }: { registered: boolean }) {
  const t = useTranslations('Auth')
  const tCommon = useTranslations('Common')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await loginAction(formData)

    if (!result.success) {
      setError(result.error ?? 'Invalid email or password')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 font-sans text-[#303055] sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl overflow-hidden rounded-lg border border-[#e8e8f2] bg-white lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="flex flex-col justify-between gap-12 bg-[#e8e8f2] p-6 sm:p-10 lg:p-12">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-mono text-sm font-semibold text-[#303055] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#303055]">
              bantuin.dev
            </Link>
            <LanguageSwitcher />
          </div>
          <div>
            <Caption className="border-[#303055] bg-white text-[#303055]">{t('loginCaption')}</Caption>
            <h1 className="mt-5 max-w-md text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#303055] sm:text-5xl">{t('loginHeading')}</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#403f53]">{t('loginDesc')}</p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 rounded-lg border border-white bg-white p-4">
              <KeyRound className="mt-0.5 shrink-0 text-[#303055]" size={19} aria-hidden="true" />
              <div><p className="text-sm font-semibold">{t('yourModelKey')}</p><p className="mt-1 text-sm leading-6 text-[#767682]">{t('yourModelKeyDesc')}</p></div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-[#303055] bg-[#303055] p-4 text-white">
              <ShieldCheck className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
              <div><p className="text-sm font-semibold">{t('safeExport')}</p><p className="mt-1 text-sm leading-6 text-white/80">{t('safeExportDesc')}</p></div>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center p-6 sm:p-12">
          <Panel className="w-full max-w-md rounded-lg border border-[#e8e8f2] shadow-none">
            <div className="border-b border-[#e8e8f2] bg-white px-5 py-5 sm:px-7">
              <StatusBadge tone="neutral">{t('memberAccess')}</StatusBadge>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#303055]">{t('signInTitle')}</h2>
            </div>
            <div className="p-5 sm:p-7">
              {registered && !error && <div role="status" className="mb-5 flex items-start gap-3 rounded-lg border border-[#e8e8f2] bg-[#e8e8f2] p-3 text-sm text-[#303055]"><CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" /><p>{t('accountCreated')}</p></div>}
              {error && <div role="alert" className="mb-5 rounded-lg border border-[#984e4d] bg-white p-3 text-sm text-[#984e4d]">{error}</div>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-busy={loading}>
                <div className="flex flex-col gap-2"><label htmlFor="email" className="text-sm font-medium">{t('emailLabel')}</label><Input id="email" name="email" type="email" required autoComplete="email" className="rounded border-[#e8e8f2]" /></div>
                <div className="flex flex-col gap-2"><label htmlFor="password" className="text-sm font-medium">{t('passwordLabel')}</label><Input id="password" name="password" type="password" required autoComplete="current-password" className="rounded border-[#e8e8f2]" /></div>
                <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full rounded bg-[#303055] text-white hover:bg-[#403f53]">{loading ? tCommon('loading') : t('submitLoginBtn')}{!loading && <ArrowRight size={18} aria-hidden="true" />}</Button>
              </form>
              <p className="mt-6 text-center text-sm text-[#767682]"><Link href="/register" className="font-medium text-[#303055] underline underline-offset-4">{t('needAccount')}</Link></p>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  )
}
