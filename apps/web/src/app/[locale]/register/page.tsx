'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { useRef, useState } from 'react'
import { registerAction } from '@/lib/auth/actions'
import { useTranslations } from 'next-intl'
import { AuthRouteSwitch } from '@/app/components/auth/AuthRouteSwitch'
import { AuthShell } from '@/app/components/auth/AuthShell'
import { Button, Input } from '@/app/components/ui'

const AUTH_ERROR_KEYS = {
  INVALID_EMAIL: 'invalidEmail',
  PASSWORD_TOO_SHORT: 'passwordTooShort',
  PASSWORD_TOO_LONG: 'passwordTooLong',
  NAME_REQUIRED: 'nameRequired',
  INVALID_INPUT: 'invalidInput',
  DUPLICATE_ACCOUNT: 'duplicateAccount',
  REGISTRATION_FAILED: 'registrationFailed',
} as const

function getAuthErrorMessage(error: string | undefined, fallback: string, translate: (key: string) => string) {
  if (!error) return fallback
  const key = AUTH_ERROR_KEYS[error as keyof typeof AUTH_ERROR_KEYS]
  return translate(key ?? 'registrationFailed')
}

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
        setError(getAuthErrorMessage(result.error, t('registrationFailed'), t))
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
    <AuthShell routeKey="register">
      <section aria-labelledby="auth-title">
        <h1 id="auth-title" className="mt-0 text-center text-3xl font-semibold leading-[.97] tracking-[-.07em] sm:text-4xl">{t('registerHeading')}</h1>


        {error && <div ref={errorRef} role="alert" tabIndex={-1} className="mt-5 rounded-xl border border-[#e8b4a4] bg-[#fff1ee] p-3 text-sm font-medium text-[#8e3a25]">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" aria-busy={loading}>
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-[#24231f]">{t('nameOptional')}</label>
            <Input id="name" name="name" type="text" autoComplete="name" placeholder={t('namePlaceholder')} className="rounded-xl border-[#d8d1c7] bg-[#fffdfa] px-4 py-2.5 focus:border-[#a85e3c] focus-visible:outline-[#f4a261]" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[#24231f]">{t('emailLabel')}</label>
            <Input id="email" name="email" type="email" required autoComplete="email" placeholder={t('emailPlaceholder')} className="rounded-xl border-[#d8d1c7] bg-[#fffdfa] px-4 py-2.5 focus:border-[#a85e3c] focus-visible:outline-[#f4a261]" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-[#24231f]">{t('passwordLabel')}</label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" placeholder={t('passwordPlaceholder')} className="rounded-xl border-[#d8d1c7] bg-[#fffdfa] px-4 py-2.5 focus:border-[#a85e3c] focus-visible:outline-[#f4a261]" />
          </div>
          <Button type="submit" size="lg" disabled={loading} className="mt-2 min-h-12 w-full rounded-full bg-[#a85e3c] px-6 py-3 font-semibold text-white shadow-[5px_5px_0_#24231f] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-[#8e4e32] hover:shadow-[7px_7px_0_#24231f] focus-visible:outline-[#24231f]">{!loading && <ArrowLeft size={18} aria-hidden="true" />}{loading ? tCommon('loading') : t('submitRegisterBtn')}</Button>
        </form>

        <p className="mt-7 text-center text-sm text-[#706b64]">
          {t('haveAccountPrefix')}{' '}<AuthRouteSwitch href="/login">{t('haveAccountAction')}</AuthRouteSwitch>
        </p>
        <p className="sr-only" aria-live="polite">{loading ? tCommon('loading') : ''}</p>
      </section>
    </AuthShell>
  )
}
