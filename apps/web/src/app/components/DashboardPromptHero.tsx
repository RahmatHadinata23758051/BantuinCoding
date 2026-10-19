'use client'

import { useState } from 'react'
import LivingContourBackground from './LivingContourBackground'
import { PromptComposer } from './PromptComposer'

type PromptAction = (formData: FormData) => void | Promise<void>

interface DashboardPromptHeroProps {
  eyebrow: string
  title: string
  subtitle: string
  note: string
  action: PromptAction
}

export function DashboardPromptHero({
  eyebrow,
  title,
  subtitle,
  note,
  action,
}: DashboardPromptHeroProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <section aria-labelledby="dashboard-heading" className="relative isolate overflow-hidden">
      <LivingContourBackground quiet={isFocused} />
      <div className="relative z-10 mx-auto max-w-[1180px] px-4 pb-8 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a66142]">{eyebrow}</p>
          <h1 id="dashboard-heading" className="mt-4 text-[clamp(2.4rem,6vw,5.3rem)] font-semibold leading-[.96] tracking-[-.07em]">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#706b64] sm:text-base">{subtitle}</p>
          <div
            className="mx-auto mt-8 max-w-3xl text-left"
            onFocusCapture={() => setIsFocused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsFocused(false)
              }
            }}
          >
            <PromptComposer action={action} />
          </div>
          <p className="mt-4 text-xs text-[#8a8178]">{note}</p>
        </div>
      </div>
    </section>
  )
}
