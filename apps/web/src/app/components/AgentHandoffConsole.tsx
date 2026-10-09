'use client'

import { Check, ClipboardList, Copy, FileArchive, FileText, PackageCheck, TerminalSquare } from 'lucide-react'
import { useState } from 'react'

interface AgentHandoffConsoleProps {
  ariaLabel: string
  title: string
  status: string
  briefLabel: string
  briefMeta: string
  contextLabel: string
  contextMeta: string
  packLabel: string
  packMeta: string
  exportLabel: string
  exportMeta: string
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

const stageIcons = [ClipboardList, FileText, FileArchive, PackageCheck, TerminalSquare]

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
  briefLabel,
  briefMeta,
  contextLabel,
  contextMeta,
  packLabel,
  packMeta,
  exportLabel,
  exportMeta,
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
    { label: briefLabel, meta: briefMeta },
    { label: contextLabel, meta: contextMeta },
    { label: packLabel, meta: packMeta },
    { label: exportLabel, meta: exportMeta },
    { label: agentLabel, meta: agentMeta },
  ]

  const rows = [stages.slice(0, 3), stages.slice(3).reverse()]
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
        <div className="relative" role="list" aria-label={title}>
          <div className="hidden md:block">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="relative grid grid-cols-3 gap-3">
                {row.map((stage, stageIndex) => {
                  const originalIndex = rowIndex === 0 ? stageIndex : stages.length - 1 - stageIndex
                  const Icon = stageIcons[originalIndex] ?? TerminalSquare
                  return (
                    <div key={stage.label} className="relative flex min-h-[108px] min-w-0 items-start gap-3 border border-white/12 bg-[#22221e] p-3.5" role="listitem">
                      <span className="flex size-9 shrink-0 items-center justify-center border border-[#f4a261]/35 bg-[#2b2a25] text-[#f4a261]" aria-hidden="true">
                        <Icon size={16} strokeWidth={1.7} />
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-[#f4a261]/70">0{originalIndex + 1}</span>
                        <strong className="mt-1 block break-normal font-mono text-[10px] leading-4 tracking-[0.08em] text-white/90">{stage.label}</strong>
                        <span className="mt-2 block break-normal font-mono text-[9px] leading-4 text-white/45">{stage.meta}</span>
                      </div>
                      {((rowIndex === 0 && stageIndex < 2) || (rowIndex === 1 && stageIndex < 1)) && (
                        <span className="absolute -right-3 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-[#f4a261]/35 bg-[#171714] font-mono text-xs text-[#f4a261]" aria-hidden="true">{rowIndex === 0 ? `→ ${connectorLabel}` : `← ${connectorLabel}`}</span>
                      )}
                      {rowIndex === 0 && stageIndex === 2 && (
                        <span className="absolute -bottom-3 left-1/2 z-10 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#f4a261]/35 bg-[#171714] font-mono text-xs text-[#f4a261]" aria-hidden="true">↓</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="space-y-2 md:hidden">
            {stages.map((stage, index) => {
              const Icon = stageIcons[index] ?? TerminalSquare
              return (
                <div key={stage.label} className="relative flex min-w-0 items-start gap-3 border border-white/12 bg-[#22221e] p-3.5" role="listitem">
                  <span className="flex size-9 shrink-0 items-center justify-center border border-[#f4a261]/35 bg-[#2b2a25] text-[#f4a261]" aria-hidden="true"><Icon size={16} strokeWidth={1.7} /></span>
                  <div className="min-w-0"><span className="font-mono text-[10px] text-[#f4a261]/70">0{index + 1}</span><strong className="mt-1 block font-mono text-[10px] leading-4 tracking-[0.08em] text-white/90">{stage.label}</strong><span className="mt-2 block font-mono text-[9px] leading-4 text-white/45">{stage.meta}</span></div>
                  {index < stages.length - 1 && <span className="absolute -bottom-3 left-5 z-10 flex size-6 items-center justify-center rounded-full border border-[#f4a261]/35 bg-[#171714] font-mono text-xs text-[#f4a261]" aria-hidden="true">↓</span>}
                </div>
              )
            })}
          </div>
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
