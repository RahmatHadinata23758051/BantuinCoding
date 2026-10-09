'use client'

import { FileArchive, FileCheck2, FileCode2, FileText, FolderOpen, GitBranch, LockKeyhole, TerminalSquare } from 'lucide-react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useState } from 'react'

export interface HeroWorkbenchPrompt {
  label: string
  accent: string
}

interface HeroWorkbenchProps {
  ariaLabel: string
  statusLabel: string
  packMeta: string
  promptLabel: string
  prompts: HeroWorkbenchPrompt[]
  note: string
  filesLabel: string
  validatedLabel: string
  contextReadyLabel: string
  artifactsLabel: string
  handoffReadyLabel: string
  previewOnlyLabel: string
}

const artifacts = [
  { name: 'PRD.md', kind: 'PRODUCT INTENT', icon: FileText },
  { name: 'SRS.md', kind: 'BEHAVIOR CONTRACT', icon: FileCode2 },
  { name: 'ARCHITECTURE.md', kind: 'SYSTEM MAP', icon: GitBranch },
  { name: 'AGENT.md', kind: 'EXECUTION GUIDE', icon: TerminalSquare },
  { name: 'RULES.md', kind: 'PROJECT RULES', icon: LockKeyhole },
  { name: 'SKILLS/', kind: 'CAPABILITIES', icon: FolderOpen },
  { name: 'BACKLOG.md', kind: 'ORDERED WORK', icon: FileCheck2 },
]

const previews = [
  {
    eyebrow: 'PRODUCT REQUIREMENTS',
    title: 'A clear first release for independent teams.',
    lines: [
      ['audience', 'independent teams'],
      ['outcome', 'ship with fewer unknowns'],
      ['boundary', 'documentation before code'],
    ],
  },
  {
    eyebrow: 'API SERVICE CONTRACT',
    title: 'A dependable interface with explicit boundaries.',
    lines: [
      ['consumer', 'authenticated clients'],
      ['contract', 'typed JSON responses'],
      ['boundary', 'rate limits and audit trail'],
    ],
  },
  {
    eyebrow: 'MOBILE APP BRIEF',
    title: 'A focused mobile flow built around one job.',
    lines: [
      ['audience', 'people on the move'],
      ['outcome', 'complete the task quickly'],
      ['boundary', 'offline-friendly first release'],
    ],
  },
]

function StaticWorkbench({ ariaLabel, statusLabel, packMeta, promptLabel, prompts, activePrompt, setActivePrompt, note, filesLabel, validatedLabel, contextReadyLabel, artifactsLabel, handoffReadyLabel, previewOnlyLabel }: HeroWorkbenchProps & { activePrompt: number; setActivePrompt: (index: number) => void }) {
  const preview = previews[activePrompt] ?? previews[0]

  return (
    <div className="relative min-h-[430px] overflow-hidden border border-[#3e3c35] bg-[#25241f] p-4 shadow-[10px_10px_0_rgba(36,35,31,.16)] sm:min-h-[500px] sm:p-6" role="img" aria-label={ariaLabel}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(244,162,97,.13),transparent_40%),linear-gradient(135deg,rgba(255,255,255,.04),transparent_45%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[650px] overflow-hidden border border-white/15 bg-[#151612] shadow-[16px_16px_0_rgba(0,0,0,.22)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="size-2 rounded-full bg-[#e27d60]" />
          <span className="size-2 rounded-full bg-[#f4a261]" />
          <span className="size-2 rounded-full bg-[#b8d8bd]" />
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">bantuin / bootstrap workspace</span>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-[#f4a261]">{packMeta}</span>
        </div>
        <div className="grid min-h-[330px] md:grid-cols-[150px_1fr]">
          <aside className="border-b border-white/10 bg-[#1c1d19] p-3 md:border-b-0 md:border-r" aria-label="Project artifacts">
            <div className="mb-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40"><FolderOpen size={12} /> {filesLabel}</div>
            <div className="space-y-1">
              {artifacts.map(({ name, icon: Icon }, index) => (
                <div key={name} className={`flex items-center gap-2 border px-2 py-2 ${index === 0 ? 'border-[#f4a261]/40 bg-[#f4a261]/10 text-[#f4a261]' : 'border-transparent text-white/55'}`}>
                  <Icon size={12} aria-hidden="true" />
                  <span className="min-w-0 truncate font-mono text-[9px]">{name}</span>
                </div>
              ))}
            </div>
          </aside>
          <div className="min-w-0 bg-[#11120f] p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40"><span>{preview.eyebrow}</span><span className="text-[#b8d8bd]">{validatedLabel}</span></div>
            <h3 className="mt-7 max-w-md text-xl font-semibold leading-tight tracking-[-.04em] text-white sm:text-2xl">{preview.title}</h3>
            <div className="mt-7 space-y-3">
              {preview.lines.map(([label, value]) => <div key={label} className="grid grid-cols-[74px_1fr] gap-3 border-b border-white/10 pb-2 font-mono text-[10px]"><span className="text-[#f4a261]">{label}</span><span className="text-white/60">{value}</span></div>)}
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="border border-[#b8d8bd]/35 bg-[#b8d8bd]/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.08em] text-[#b8d8bd]">{contextReadyLabel}</span>
              <span className="border border-[#b9d7ff]/35 bg-[#b9d7ff]/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[.08em] text-[#b9d7ff]">{artifactsLabel}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#1b1c18] px-4 py-3">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.1em] text-white/45"><FileArchive size={12} className="text-[#f4a261]" /> {handoffReadyLabel}</span>
          <span className="font-mono text-[9px] uppercase tracking-[.1em] text-white/30">{statusLabel}</span>
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className="font-mono text-[9px] uppercase tracking-[.13em] text-white/45">{note}</p><div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={promptLabel}>{prompts.map((prompt, index) => <button key={prompt.label} type="button" onClick={() => setActivePrompt(index)} className={`border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] ${activePrompt === index ? 'border-[#f4a261] bg-[#f4a261] text-[#25241f]' : 'border-white/25 text-white/65 hover:border-white/60 hover:text-white'}`}>{prompt.label}</button>)}</div></div>
        <span className="font-mono text-[9px] uppercase tracking-[.1em] text-white/35">{previewOnlyLabel}</span>
      </div>
    </div>
  )
}

export function HeroWorkbench({ ariaLabel, statusLabel, packMeta, promptLabel, prompts, note, filesLabel, validatedLabel, contextReadyLabel, artifactsLabel, handoffReadyLabel, previewOnlyLabel }: HeroWorkbenchProps) {
  const [activePrompt, setActivePrompt] = useState(0)
  const reducedMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [3.5, -3.5]), { stiffness: 160, damping: 22 })
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-4.5, 4.5]), { stiffness: 160, damping: 22 })
  const glowX = useTransform(pointerX, [-0.5, 0.5], ['22%', '78%'])
  const glowY = useTransform(pointerY, [-0.5, 0.5], ['18%', '82%'])

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5)
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5)
  }

  const handlePointerLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <motion.div
      className="relative"
      style={{ perspective: 1200 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div className="relative" style={reducedMotion ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        <motion.div className="absolute -inset-3 opacity-70 blur-2xl" style={reducedMotion ? undefined : { background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(244,162,97,.22), transparent 42%)` }} aria-hidden="true" />
        <StaticWorkbench ariaLabel={ariaLabel} statusLabel={statusLabel} packMeta={packMeta} promptLabel={promptLabel} prompts={prompts} note={note} filesLabel={filesLabel} validatedLabel={validatedLabel} contextReadyLabel={contextReadyLabel} artifactsLabel={artifactsLabel} handoffReadyLabel={handoffReadyLabel} previewOnlyLabel={previewOnlyLabel} activePrompt={activePrompt} setActivePrompt={setActivePrompt} />
      </motion.div>
    </motion.div>
  )
}
