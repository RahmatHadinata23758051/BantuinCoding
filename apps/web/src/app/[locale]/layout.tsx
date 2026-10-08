import type { Metadata } from 'next'
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import '../globals.css'

const interSans = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const lyonSerif = Source_Serif_4({
  variable: '--font-lyon-text',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

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

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${interSans.variable} ${lyonSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        className="flex h-full flex-col font-sans"
        style={{ background: 'var(--color-paper-warmth)', color: 'var(--color-ink-black)' }}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
