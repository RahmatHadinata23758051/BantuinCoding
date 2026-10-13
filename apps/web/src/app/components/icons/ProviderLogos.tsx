'use client'

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
    <span
      aria-hidden="true"
      className={cn('block shrink-0 bg-current', className)}
      style={{
        width: size,
        height: size,
        maskImage: `url(${iconPath})`,
        maskPosition: 'center',
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskImage: `url(${iconPath})`,
        WebkitMaskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
      }}
    />
  )
}
