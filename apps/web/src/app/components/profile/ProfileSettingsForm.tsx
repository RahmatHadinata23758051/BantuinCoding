'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, Input } from '@/app/components/ui'
import { changeUserPasswordAction, updateUserNameAction } from '@/lib/profile/actions'
import type { SafeUserProfile } from '@/lib/profile/actions'

export function ProfileSettingsForm({ profile }: { profile: SafeUserProfile }) {
  const t = useTranslations('Profile')
  const tCommon = useTranslations('Common')
  const [name, setName] = useState(profile.name ?? '')
  const [nameState, setNameState] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [passwordState, setPasswordState] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [nameLoading, setNameLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  function getErrorMessage(error: string): string {
    const messages: Record<string, string> = {
      NAME_REQUIRED: t('nameRequired'),
      NAME_TOO_LONG: t('nameTooLong'),
      CURRENT_PASSWORD_REQUIRED: t('currentPasswordRequired'),
      CURRENT_PASSWORD_INCORRECT: t('currentPasswordIncorrect'),
      PASSWORD_TOO_SHORT: t('passwordTooShort'),
      PASSWORD_TOO_LONG: t('passwordTooLong'),
      PASSWORDS_DO_NOT_MATCH: t('passwordsDoNotMatch'),
      NO_PASSWORD_SET: t('noPasswordSet'),
      USER_NOT_FOUND: t('userNotFound'),
      UPDATE_FAILED: t('updateFailed'),
      UNAUTHORIZED: t('unauthorized'),
    }
    return messages[error] ?? t('updateFailed')
  }

  async function handleNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNameLoading(true)
    setNameState(null)

    try {
      const result = await updateUserNameAction(new FormData(event.currentTarget))
      if (result.success) {
        setName(result.data.name)
        setNameState({ type: 'success', message: t('nameUpdated') })
      } else {
        setNameState({ type: 'error', message: getErrorMessage(result.error) })
      }
    } catch {
      setNameState({ type: 'error', message: t('updateFailed') })
    } finally {
      setNameLoading(false)
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordLoading(true)
    setPasswordState(null)

    try {
      const result = await changeUserPasswordAction(new FormData(event.currentTarget))
      if (result.success) {
        event.currentTarget.reset()
        setPasswordState({ type: 'success', message: t('passwordUpdated') })
      } else {
        setPasswordState({ type: 'error', message: getErrorMessage(result.error) })
      }
    } catch {
      setPasswordState({ type: 'error', message: t('updateFailed') })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section aria-labelledby="profile-details-heading" className="rounded-[var(--radius-cards)] border border-[var(--border-subtle)] bg-[var(--color-pure-white)] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--workspace-primary,#a85e3c)]">01</p>
            <h2 id="profile-details-heading" className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--color-ink-black)]">{t('profileDetails')}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-body-text)]">{t('profileDetailsDescription')}</p>
          </div>
        </div>

        <form onSubmit={handleNameSubmit} className="mt-7 space-y-4" aria-busy={nameLoading}>
          <div className="space-y-2">
            <label htmlFor="profile-name" className="text-sm font-medium text-[var(--color-ink-black)]">{t('displayName')}</label>
            <Input id="profile-name" name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" aria-describedby="profile-name-help" />
            <p id="profile-name-help" className="text-xs text-[var(--color-body-text)]">{t('displayNameHelp', { count: name.length })}</p>
          </div>
          <Button type="submit" disabled={nameLoading} className="w-full sm:w-auto">{nameLoading ? tCommon('loading') : t('saveProfile')}</Button>
          {nameState && <p role={nameState.type === 'error' ? 'alert' : 'status'} className={nameState.type === 'error' ? 'text-sm text-[var(--color-vermillion)]' : 'text-sm text-[#1b6a4e]'}>{nameState.message}</p>}
        </form>
      </section>

      <section aria-labelledby="account-overview-heading" className="rounded-[var(--radius-cards)] border border-[var(--border-subtle)] bg-[var(--color-paper-warmth)] p-5 sm:p-7">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--workspace-primary,#a85e3c)]">02</p>
        <h2 id="account-overview-heading" className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--color-ink-black)]">{t('accountOverview')}</h2>
        <dl className="mt-7 divide-y divide-[var(--border-subtle)] text-sm">
          <div className="grid gap-1 py-3 first:pt-0"><dt className="text-[var(--color-body-text)]">{t('email')}</dt><dd className="break-all font-medium text-[var(--color-ink-black)]">{profile.email}</dd></div>
          <div className="grid gap-1 py-3"><dt className="text-[var(--color-body-text)]">{t('memberSince')}</dt><dd className="font-medium text-[var(--color-ink-black)]">{new Date(profile.createdAt).toLocaleDateString()}</dd></div>
          <div className="grid gap-1 py-3 last:pb-0"><dt className="text-[var(--color-body-text)]">{t('accountStatus')}</dt><dd className="font-medium text-[#1b6a4e]">{t('active')}</dd></div>
        </dl>
      </section>

      {profile.hasPassword && <section aria-labelledby="security-heading" className="rounded-[var(--radius-cards)] border border-[var(--border-subtle)] bg-[var(--color-pure-white)] p-5 sm:p-7 lg:col-span-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--workspace-primary,#a85e3c)]">03</p>
        <h2 id="security-heading" className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--color-ink-black)]">{t('passwordSettings')}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-body-text)]">{t('passwordSettingsDescription')}</p>
        <form onSubmit={handlePasswordSubmit} className="mt-7 grid gap-4 sm:grid-cols-3" aria-busy={passwordLoading}>
          <div className="space-y-2"><label htmlFor="current-password" className="text-sm font-medium text-[var(--color-ink-black)]">{t('currentPassword')}</label><Input id="current-password" name="currentPassword" type="password" required autoComplete="current-password" /></div>
          <div className="space-y-2"><label htmlFor="new-password" className="text-sm font-medium text-[var(--color-ink-black)]">{t('newPassword')}</label><Input id="new-password" name="newPassword" type="password" required autoComplete="new-password" /></div>
          <div className="space-y-2"><label htmlFor="confirm-password" className="text-sm font-medium text-[var(--color-ink-black)]">{t('confirmPassword')}</label><Input id="confirm-password" name="confirmPassword" type="password" required autoComplete="new-password" /></div>
          <div className="sm:col-span-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center"><Button type="submit" disabled={passwordLoading} variant="neutral">{passwordLoading ? tCommon('loading') : t('changePassword')}</Button>{passwordState && <p role={passwordState.type === 'error' ? 'alert' : 'status'} className={passwordState.type === 'error' ? 'text-sm text-[var(--color-vermillion)]' : 'text-sm text-[#1b6a4e]'}>{passwordState.message}</p>}</div>
        </form>
      </section>}
    </div>
  )
}
