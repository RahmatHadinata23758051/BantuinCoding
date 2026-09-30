import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Project Bootstrapper — Bantuin Coding',
  description:
    'Transform raw project ideas into structured documentation packs for coding agents. BYOK — your API keys never leave your session.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="flex h-full flex-col"
        style={{ background: 'var(--bg-page)', color: 'var(--ink)' }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
