'use client'

import Image from 'next/image'
import type { AIProviderType } from '@repo/types'

import { cn } from '@/lib/ui'

type Provider = AIProviderType

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
  DEEPSEEK: '/provider-icons/deepseek.svg',
  GROQ: '/provider-icons/groq.svg',
  MISTRAL: '/provider-icons/mistral.svg',
  XAI: '/provider-icons/xai.svg',
  OLLAMA: '/provider-icons/ollama.svg',
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
