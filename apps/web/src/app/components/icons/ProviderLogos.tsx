'use client'

import type { SVGProps } from 'react'

import { cn } from '@/lib/ui'

type Provider = 'ANTHROPIC' | 'OPENAI' | 'GEMINI' | 'OPENROUTER'

interface ProviderLogoProps extends SVGProps<SVGSVGElement> {
  provider: Provider
  size?: number
}

function AnthropicLogo({ size, className, ...props }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" {...props}>
      <path fill="currentColor" d="M16 3.5 18.15 13 28 16l-9.85 3-2.15 9.5L13.85 19 4 16l9.85-3L16 3.5Z" />
      <path fill="currentColor" d="m8.3 7.4 1.25 5.05L14.5 14l-4.95 1.55L8.3 20.6l-1.25-5.05L2.1 14l4.95-1.55L8.3 7.4Z" opacity=".62" />
    </svg>
  )
}

function OpenAILogo({ size, className, ...props }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" d="M16.2 4.25a5.15 5.15 0 0 1 4.94 3.7 5.15 5.15 0 0 1 3.1 8.6 5.15 5.15 0 0 1-4.98 7.7 5.15 5.15 0 0 1-8.04 1.73 5.15 5.15 0 0 1-5.78-6.95 5.15 5.15 0 0 1 2.3-8.86 5.15 5.15 0 0 1 8.46-5.92Z" />
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" d="m11.35 10.15 9.3 5.36v7.15M11.35 10.15 5.16 13.7m6.19-3.55v7.12l6.17 3.57m-6.17-3.57-6.2-3.57m12.37 3.57 6.2-3.57" />
    </svg>
  )
}

function GeminiLogo({ size, className, ...props }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" {...props}>
      <path fill="currentColor" d="M16 2.75c1.15 6.83 2.92 10.1 5.45 11.65 1.48.9 3.25 1.42 7.8 1.6-4.55.18-6.32.7-7.8 1.6-2.53 1.55-4.3 4.82-5.45 11.65-1.15-6.83-2.92-10.1-5.45-11.65-1.48-.9-3.25-1.42-7.8-1.6 4.55-.18 6.32-.7 7.8-1.6C13.08 12.85 14.85 9.58 16 2.75Z" />
    </svg>
  )
}

function OpenRouterLogo({ size, className, ...props }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M7 10h11.5c3.6 0 6.5 2.4 6.5 5.5S22.1 21 18.5 21H7m0 0 3.8-3.8M7 21l3.8 3.8M25 10l-3.8 3.8M25 10l-3.8-3.8" />
    </svg>
  )
}

export function ProviderLogo({ provider, size = 24, className, ...props }: ProviderLogoProps) {
  const iconProps = { size, className: cn('shrink-0', className), ...props }

  switch (provider) {
    case 'ANTHROPIC':
      return <AnthropicLogo {...iconProps} />
    case 'OPENAI':
      return <OpenAILogo {...iconProps} />
    case 'GEMINI':
      return <GeminiLogo {...iconProps} />
    case 'OPENROUTER':
      return <OpenRouterLogo {...iconProps} />
  }
}
