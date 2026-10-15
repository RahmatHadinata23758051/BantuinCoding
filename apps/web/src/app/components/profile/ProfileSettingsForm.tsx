'use client'

import { Check, Circle, LockKeyhole } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { ProfileAvatarSvg } from '@/app/components/profile/ProfileAvatar'
import { changeUserPasswordAction, updateUserNameAction } from '@/lib/profile/actions'
import type { SafeUserProfile } from '@/lib/profile/actions'

export function ProfileSettingsForm({ profile }: { profile: SafeUserProfile }) {
  const t = useTranslations('Profile')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const initialName = profile.name?.trim() ?? ''
  const fallbackName = profile.email.split('@')[0] || t('unnamed')
  const [name, setName] = useState(initialName)
  const [savedName, setSavedName] = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nameState, setNameState] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [passwordState, setPasswordState] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [nameLoading, setNameLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const displayName = savedName.trim() || fallbackName
  const nameIsDirty = name.trim() !== savedName
  const passwordChecks = [
    { label: t('reqCurrentPassword'), complete: currentPassword.length > 0 },
    { label: t('reqMinLength'), complete: newPassword.length >= 8 },
    { label: t('reqPasswordMatch'), complete: confirmPassword.length > 0 && newPassword === confirmPassword },
  ]
  const memberSince = new Date(profile.createdAt).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

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
        setSavedName(result.data.name)
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
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
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
    <div className="grid items-start gap-8 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-10">
      {/* Left Sidebar Card matching [Image #25] */}
      <aside className="overflow-hidden rounded-[28px] border border-[#2b2a26] border-t-2 border-t-[#9b5134] bg-[#1e1d1a] p-6 text-[#f7f6f2] shadow-[0_16px_40px_rgba(28,27,24,0.12)]">
        {/* Avatar Box */}
        <div className="size-20 overflow-hidden rounded-[20px] border-2 border-[#9b5134] bg-white">
          <ProfileAvatarSvg className="size-full" aria-label={t('avatarLabel')} />
        </div>

        {/* User Info */}
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">{displayName}</h1>
        <p className="mt-1 break-all text-sm text-[#9c978f]">{profile.email}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#9c978f]">
          <LockKeyhole size={13} aria-hidden="true" className="shrink-0" />
          <span>{t('defaultAvatarNotice')}</span>
        </p>

        {/* Divider */}
        <div className="my-5 border-t border-[#2e2d28]" />

        {/* Account Metadata */}
        <div className="space-y-3.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#9c978f]">{t('accountStatus')}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#163323] px-2.5 py-0.5 text-xs font-semibold text-[#4ade80]">
              <span className="size-1.5 rounded-full bg-[#4ade80]" aria-hidden="true" />
              {t('active')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#9c978f]">{t('memberSince')}</span>
            <span className="font-medium text-white">{memberSince}</span>
          </div>
        </div>

      </aside>

      {/* Right Column: Header + Settings Cards */}
      <div className="min-w-0 space-y-6">
        {/* Page Section Header */}
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#9b5134]">
            {t('caption')}
          </p>
          <p className="mt-2 text-base font-medium tracking-[-0.01em] text-[#1e1d1a] sm:text-lg">
            {t('headerSubtitle')}
          </p>
          <p className="mt-0.5 text-sm font-normal text-[#706b64] sm:text-base">
            {t('headerNotice')}
          </p>
        </div>

        {/* Card 01: Detail Profil */}
        <section
          id="profile-details"
          aria-labelledby="profile-details-heading"
          className="scroll-mt-6 rounded-[24px] border border-[#e6e4df] bg-white p-6 shadow-[0_2px_8px_rgba(30,29,26,0.03)] sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
            <div>
              <p className="font-mono text-xs font-medium text-[#8a8178]">01</p>
              <h2 id="profile-details-heading" className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1e1d1a]">
                {t('profileDetails')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#706b64]">
                {t('profileDetailsDescription')}
              </p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-4" aria-busy={nameLoading}>
              <div className="space-y-1.5">
                <label htmlFor="profile-name" className="text-xs font-semibold text-[#1e1d1a]">
                  {t('displayName')}
                </label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  autoComplete="name"
                  aria-describedby="profile-name-help"
                  className="w-full rounded-xl border border-[#dedcd7] bg-white px-3.5 py-2.5 text-sm text-[#1e1d1a] transition-colors placeholder:text-[#9c978f] focus:border-[#f4a261] focus:outline-none focus:ring-1 focus:ring-[#f4a261]"
                />
                <p id="profile-name-help" className="text-xs text-[#8c887f]">
                  {t('displayNameHelp', { count: name.length })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={nameLoading || !nameIsDirty}
                  className="rounded-xl bg-[#e8e6e1] px-5 py-2.5 text-sm font-medium text-[#403d36] transition-colors hover:bg-[#dedcd7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {nameLoading ? tCommon('loading') : t('saveProfile')}
                </button>
                {!nameState && <span className="text-xs text-[#736e65]">{t('noChanges')}</span>}
                {nameState && (
                  <p
                    role={nameState.type === 'error' ? 'alert' : 'status'}
                    className={nameState.type === 'error' ? 'text-sm text-[#b33d2e]' : 'text-sm text-[#286b4f]'}
                  >
                    {nameState.message}
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Card 02: Kata Sandi */}
        {profile.hasPassword && (
          <section
            id="security-settings"
            aria-labelledby="security-heading"
            className="scroll-mt-6 rounded-[24px] border border-[#e6e4df] bg-white p-6 shadow-[0_2px_8px_rgba(30,29,26,0.03)] sm:p-8"
          >
            <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
              <div>
                <p className="font-mono text-xs font-medium text-[#8a8178]">02</p>
                <h2 id="security-heading" className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1e1d1a]">
                  {t('passwordSettings')}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#706b64]">
                  {t('passwordSettingsDescription')}
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4" aria-busy={passwordLoading}>
                <div className="space-y-1.5">
                  <label htmlFor="current-password" className="text-xs font-semibold text-[#1e1d1a]">
                    {t('currentPassword')}
                  </label>
                  <input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-[#dedcd7] bg-white px-3.5 py-2.5 text-sm text-[#1e1d1a] transition-colors placeholder:text-[#9c978f] focus:border-[#f4a261] focus:outline-none focus:ring-1 focus:ring-[#f4a261]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="text-xs font-semibold text-[#1e1d1a]">
                      {t('newPassword')}
                    </label>
                    <input
                      id="new-password"
                      name="newPassword"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-[#dedcd7] bg-white px-3.5 py-2.5 text-sm text-[#1e1d1a] transition-colors placeholder:text-[#9c978f] focus:border-[#f4a261] focus:outline-none focus:ring-1 focus:ring-[#f4a261]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="text-xs font-semibold text-[#1e1d1a]">
                      {t('confirmPassword')}
                    </label>
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-[#dedcd7] bg-white px-3.5 py-2.5 text-sm text-[#1e1d1a] transition-colors placeholder:text-[#9c978f] focus:border-[#f4a261] focus:outline-none focus:ring-1 focus:ring-[#f4a261]"
                    />
                  </div>
                </div>

                {/* Criteria Checklist Box */}
                <ul
                  className="space-y-2 rounded-xl bg-[#f4f2ee] p-4 text-xs text-[#5c574f]"
                  aria-label={t('passwordRequirements')}
                >
                  {passwordChecks.map((check) => (
                    <li key={check.label} className="flex items-center gap-2.5">
                      {check.complete ? (
                        <Check size={14} className="shrink-0 text-[#286b4f]" aria-hidden="true" />
                      ) : (
                        <Circle size={14} className="shrink-0 text-[#a8a39a]" aria-hidden="true" />
                      )}
                      <span className={check.complete ? 'text-[#286b4f]' : undefined}>
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-xl bg-[#e8e6e1] px-5 py-2.5 text-sm font-medium text-[#403d36] transition-colors hover:bg-[#dedcd7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {passwordLoading ? tCommon('loading') : t('changePassword')}
                  </button>
                  {passwordState && (
                    <p
                      role={passwordState.type === 'error' ? 'alert' : 'status'}
                      className={passwordState.type === 'error' ? 'text-sm text-[#b33d2e]' : 'text-sm text-[#286b4f]'}
                    >
                      {passwordState.message}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
