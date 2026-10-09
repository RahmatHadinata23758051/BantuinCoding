'use client'

import { Check, ClipboardList, Copy, FileArchive, FileText, PackageCheck, TerminalSquare } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
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

interface Stage {
  label: string
  meta: string
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

const pulseKeyframes = {
  borderColor: ['rgba(244,162,97,0.35)', 'rgba(244,162,97,1)', 'rgba(244,162,97,0.35)'],
  boxShadow: ['0 0 0 rgba(244,162,97,0)', '0 0 18px rgba(244,162,97,0.22)', '0 0 0 rgba(244,162,97,0)'],
}

function PulseNode({ delay, reducedMotion, children, className }: { delay: number; reducedMotion: boolean | null; children: ReactNode; className: string }) {
  return (
    <motion.span
      animate={reducedMotion ? undefined : pulseKeyframes}
      transition={reducedMotion ? undefined : { duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
      aria-hidden="true"
    >
      {children}
    </motion.span>
  )
}

function StageCard({ stage, index, reducedMotion, className, connector }: { stage: Stage; index: number; reducedMotion: boolean | null; className: string; connector?: ReactNode }) {
  const Icon = stageIcons[index] ?? TerminalSquare

  return (
    <div className={`relative flex min-h-[124px] min-w-0 flex-col rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-3.5 shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#f4a261]/45 hover:from-white/[0.1] ${className}`} role="listitem">
      <div className="flex items-start justify-between gap-3">
        <PulseNode
          delay={index * 0.6}
          reducedMotion={reducedMotion}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#f4a261]/35 bg-[#2b2a25] text-[#f4a261]"
        >
          <Icon size={16} strokeWidth={1.7} />
        </PulseNode>
        <span className="rounded-full border border-white/[0.1] px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-white/45">0{index + 1}</span>
      </div>
      <strong className="mt-3 block break-normal font-mono text-[10px] leading-4 tracking-[0.1em] text-white/90">{stage.label}</strong>
      <span className="mt-1.5 block break-normal font-mono text-[9px] leading-4 text-white/45">{stage.meta}</span>
      {connector}
    </div>
  )
}

function PipelineConnector({ direction, label, reducedMotion, delay, className }: { direction: 'left' | 'right'; label: string; reducedMotion: boolean | null; delay: number; className: string }) {
  const arrow = direction === 'right' ? '→' : '←'
  const line = direction === 'right' ? 'bg-gradient-to-r from-white/10 via-[#f4a261]/50 to-[#f4a261]/70' : 'bg-gradient-to-l from-white/10 via-[#f4a261]/50 to-[#f4a261]/70'

  return (
    <div className={`relative flex min-w-0 items-center justify-center ${className}`} aria-hidden="true">
      <span className={`absolute inset-x-0 top-1/2 h-px ${line}`} />
      <PulseNode
        delay={delay}
        reducedMotion={reducedMotion}
        className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-[#f4a261]/50 bg-[#171714] font-mono text-xs text-[#f4a261] shadow-[0_0_0_4px_#11120f]"
      >
        {arrow}
      </PulseNode>
      <span className="absolute top-[calc(50%+0.8rem)] z-10 whitespace-nowrap bg-[#11120f] px-1 font-mono text-[7px] uppercase tracking-[0.1em] text-white/40">{label}</span>
    </div>
  )
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
  const reducedMotion = useReducedMotion()
  const stages: Stage[] = [
    { label: briefLabel, meta: briefMeta },
    { label: contextLabel, meta: contextMeta },
    { label: packLabel, meta: packMeta },
    { label: exportLabel, meta: exportMeta },
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
      className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#151613] shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
    >
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-4 sm:px-6">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">{title}</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#f4a261]/20 bg-[#f4a261]/[0.06] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#f4a261]">
          <span className="size-1.5 rounded-full bg-[#f4a261] shadow-[0_0_0_4px_rgba(244,162,97,.12)]" aria-hidden="true" />
          {status}
        </span>
      </figcaption>

      <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6">
        <div className="rounded-xl border border-white/[0.08] bg-[#0f100e]/80 p-3 sm:p-4">
          <div className="hidden grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)] grid-rows-[minmax(124px,auto)_minmax(124px,auto)] gap-x-2 gap-y-8 md:grid" role="list" aria-label={title}>
            <StageCard stage={stages[0]} index={0} reducedMotion={reducedMotion} className="col-start-1 row-start-1" />
            <PipelineConnector direction="right" label={connectorLabel} reducedMotion={reducedMotion} delay={0.6} className="col-start-2 row-start-1" />
            <StageCard stage={stages[1]} index={1} reducedMotion={reducedMotion} className="col-start-3 row-start-1" />
            <PipelineConnector direction="right" label={connectorLabel} reducedMotion={reducedMotion} delay={1.2} className="col-start-4 row-start-1" />
            <StageCard
              stage={stages[2]}
              index={2}
              reducedMotion={reducedMotion}
              className="col-start-5 row-start-1"
              connector={
                <PulseNode
                  delay={1.8}
                  reducedMotion={reducedMotion}
                  className="absolute -bottom-8 left-1/2 z-20 flex h-8 w-6 -translate-x-1/2 items-end justify-center border-l border-[#f4a261]/45 pb-0.5 font-mono text-xs text-[#f4a261]"
                >
                  ↓
                </PulseNode>
              }
            />
            <StageCard stage={stages[3]} index={3} reducedMotion={reducedMotion} className="col-start-5 row-start-2" />
            <PipelineConnector direction="left" label={connectorLabel} reducedMotion={reducedMotion} delay={2.4} className="col-start-4 row-start-2" />
            <StageCard stage={stages[4]} index={4} reducedMotion={reducedMotion} className="col-start-3 row-start-2" />
          </div>

          <div className="space-y-2 md:hidden" role="list" aria-label={title}>
            {stages.map((stage, index) => {
              const isLast = index === stages.length - 1
              return (
                <div key={stage.label} className="relative" role="presentation">
                  <StageCard stage={stage} index={index} reducedMotion={reducedMotion} className="w-full" />
                  {!isLast && (
                    <PulseNode
                      delay={index * 0.6}
                      reducedMotion={reducedMotion}
                      className="absolute -bottom-3 left-5 z-10 flex size-6 items-center justify-center rounded-full border border-[#f4a261]/50 bg-[#171714] font-mono text-xs text-[#f4a261] shadow-[0_0_0_4px_#0f100e]"
                    >
                      ↓
                    </PulseNode>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0c0a]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.02] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
              <span className="flex gap-1" aria-hidden="true">
                <span className="size-1.5 rounded-full bg-[#f4a261]/80" />
                <span className="size-1.5 rounded-full bg-white/25" />
                <span className="size-1.5 rounded-full bg-white/15" />
              </span>
              <TerminalSquare size={14} className="text-[#f4a261]" aria-hidden="true" />
              <span>{title}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.14] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-white/70 transition-colors hover:border-[#f4a261] hover:bg-[#f4a261]/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261]"
            >
              {copyState === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              <span>{copyState === 'copied' ? copiedLabel : copyLabel}</span>
            </button>
          </div>
          <div className="space-y-4 px-4 py-5 font-mono text-xs leading-6 sm:px-5 sm:py-6">
            <p className="break-words text-[#f4a261]">$ {command}</p>
            <p className="break-words text-white/70">{prompt}</p>
            <p className="border-t border-white/[0.08] pt-4 text-[10px] leading-5 text-white/35">{notice}</p>
          </div>
        </div>
        <p className="sr-only" aria-live="polite" role="status">{feedback}</p>
      </div>
    </figure>
  )
}
