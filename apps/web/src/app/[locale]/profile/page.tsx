import { ArrowLeft, LogOut } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'

import { BrandLogo } from '@/app/components/BrandLogo'
import { LanguageSwitcher } from '@/app/components/LanguageSwitcher'
import { ProfileSettingsForm } from '@/app/components/profile/ProfileSettingsForm'
import { auth } from '@/lib/auth'
import { logoutAction } from '@/lib/auth/actions'
import { getUserProfile } from '@/lib/profile/profile-service'

export default async function ProfilePage() {
  const t = await getTranslations('Profile')
  const tNew = await getTranslations('NewProject')
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect('/login')

  const profile = await getUserProfile(userId)
  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#1e1d1a]">
      {/* Top Navigation Bar matching screenshot */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/dashboard"
            aria-label={tNew('backDashboard')}
            className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f4a261]"
          >
            <BrandLogo imageSize={28} textClassName="text-[19px] font-bold tracking-[-0.07em]" />
          </Link>
          <div className="flex items-center gap-1.5 text-sm font-normal text-[#1e1d1a]">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-[#1e1d1a] transition-colors hover:text-[#736e65] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
            <span aria-hidden="true" className="text-[#a39e94]">/</span>
            <span className="font-normal text-[#1e1d1a]">{t('breadcrumb')}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <LanguageSwitcher />
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label={t('signOut')}
              className="inline-flex size-9 items-center justify-center rounded-full border border-[#dedcd7] bg-white text-[#5c574f] transition-colors hover:border-[#b8b3a8] hover:text-[#1e1d1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]"
            >
              <LogOut size={15} aria-hidden="true" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-2 sm:px-8 sm:pb-24 sm:pt-4">
        <ProfileSettingsForm profile={profile} />
      </main>
    </div>
  )
}
