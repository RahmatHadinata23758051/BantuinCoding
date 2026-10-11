'use client'

import { Link } from '@/i18n/routing'

export function AuthRouteSwitch({
  href,
  children,
}: {
  href: '/login' | '/register'
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      prefetch
      scroll={false}
      className="font-medium text-[#a66142] underline decoration-[#f4a261] underline-offset-4 transition-colors hover:text-[#24231f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]"
    >
      {children}
    </Link>
  )
}
