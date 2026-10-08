import type { Metadata } from 'next'
import { IBM_Plex_Mono, Rubik } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import '../globals.css'

const rubik = Rubik({
  variable: '--font-rubik-variable',
  subsets: ['latin'],
})

const plexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  weight: ['400', '600'],
  subsets: ['latin'],
})

const geistSans = rubik
const geistMono = plexMono

// SST uses a static CSS fallback when WebGL or future 3D enhancement is unavailable.

export const metadata: Metadata = {
  title: 'Project Bootstrapper — Bantuin Coding',
  description:
    'Transform raw project ideas into structured documentation packs for coding agents. BYOK — your API keys never leave your session.',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  // Providing all messages to the client side
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="flex h-full flex-col"
        style={{ background: 'var(--bg-page)', color: 'var(--ink)' }}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
