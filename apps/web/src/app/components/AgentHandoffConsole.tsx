'use client'

import { Check, Copy, FileArchive, FileText, TerminalSquare } from 'lucide-react'
import { useState } from 'react'

interface AgentHandoffConsoleProps {
  ariaLabel: string
  title: string
  status: string
  packLabel: string
  packMeta: string
  contextLabel: string
  contextMeta: string
  agentLabel: string
  agentMeta: string
  connectorLabel: string
  command: string
  prompt: string
  notice: string
  copyLabel: string
  copiedLabel: string
  copyFailedLabel: string
}

const stageIcons = [FileArchive, FileText, TerminalSquare]

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()

  if (!copied) {
    throw new Error('Clipboard is unavailable')
  }
}

export function AgentHandoffConsole({
  ariaLabel,
  title,
  status,
  packLabel,
  packMeta,
  contextLabel,
  contextMeta,
  agentLabel,
  agentMeta,
  connectorLabel,
  command,
  prompt,
  notice,
  copyLabel,
  copiedLabel,
  copyFailedLabel,
}: AgentHandoffConsoleProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const stages = [
    { label: packLabel, meta: packMeta },
    { label: contextLabel, meta: contextMeta },
    { label: agentLabel, meta: agentMeta },
  ]
  const handleCopy = async () => {
    setCopyState('idle')
    try {
      await copyText(`${command}\n\n${prompt}`)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const feedback = copyState === 'copied' ? copiedLabel : copyState === 'failed' ? copyFailedLabel : ''

  return (
    <figure
      aria-label={ariaLabel}
      className="overflow-hidden border border-white/15 bg-[#171714] shadow-[10px_10px_0_rgba(0,0,0,.18)]"
    >
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">{title}</span>
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#f4a261]">
          <span className="size-1.5 rounded-full bg-[#f4a261] shadow-[0_0_0_4px_rgba(244,162,97,.12)]" aria-hidden="true" />
          {status}
        </span>
      </figcaption>

      <div className="px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center" role="list" aria-label={title}>
          {stages.map((stage, index) => {
            const Icon = stageIcons[index] ?? TerminalSquare
            return (
              <div key={stage.label} className="contents">
                <div className="min-w-0 border border-white/12 bg-[#22221e] p-4" role="listitem">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center border border-white/10 bg-[#2b2a25] text-[#f4a261]" aria-hidden="true">
                      <Icon size={16} strokeWidth={1.7} />
                    </span>
                    <span className="font-mono text-[10px] text-white/30">0{index + 1}</span>
                  </div>
                  <strong className="mt-5 block break-normal font-mono text-[10px] leading-4 tracking-[0.08em] text-white/90">{stage.label}</strong>
                  <span className="mt-2 block break-normal font-mono text-[9px] leading-4 text-white/45">{stage.meta}</span>
                </div>
                {index < stages.length - 1 && (
                  <div className="flex items-center justify-center gap-2 py-1 text-[#f4a261] md:px-1 md:py-0" aria-hidden="true">
                    <span className="hidden h-px w-5 bg-[#f4a261]/45 md:block" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/40 md:hidden">↓ {connectorLabel}</span>
                    <span className="hidden font-mono text-lg leading-none md:block">→</span>
                    <span className="hidden font-mono text-[9px] uppercase tracking-[0.08em] text-white/35 md:block">{connectorLabel}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-7 border border-white/10 bg-[#10110f]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
              <TerminalSquare size={14} className="text-[#f4a261]" aria-hidden="true" />
              <span>{title}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-white/70 transition-colors hover:border-[#f4a261] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]"
            >
              {copyState === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              <span>{copyState === 'copied' ? copiedLabel : copyLabel}</span>
            </button>
          </div>
          <div className="space-y-4 px-4 py-5 font-mono text-xs leading-6 sm:px-5 sm:py-6">
            <p className="break-words text-[#f4a261]">$ {command}</p>
            <p className="break-words text-white/70">{prompt}</p>
            <p className="border-t border-white/10 pt-4 text-[10px] leading-5 text-white/35">{notice}</p>
          </div>
        </div>
        <p className="sr-only" aria-live="polite" role="status">{feedback}</p>
      </div>
    </figure>
  )
}
