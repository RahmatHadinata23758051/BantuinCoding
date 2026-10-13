'use client'

import Image from 'next/image'

import { cn } from '@/lib/ui'

type Provider = 'ANTHROPIC' | 'OPENAI' | 'GEMINI' | 'OPENROUTER'

interface ProviderLogoProps {
  provider: Provider
  size?: number
  className?: string
}

const providerIconPaths: Record<Provider, string> = {
  ANTHROPIC: '/provider-icons/anthropic.svg',
  OPENAI: '/provider-icons/openai.svg',
  GEMINI: '/provider-icons/gemini.svg',
  OPENROUTER: '/provider-icons/openrouter.svg',
}

export function ProviderLogo({ provider, size = 24, className }: ProviderLogoProps) {
  const iconPath = providerIconPaths[provider]

  return (
    <Image
      src={iconPath}
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={cn('shrink-0', className)}
      unoptimized
    />
  )
}
