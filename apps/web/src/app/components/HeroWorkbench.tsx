'use client'

import { Boxes, Bot, Check, FileCheck2, FileCode2, FileText, FolderOpen, GitBranch, LockKeyhole, TerminalSquare } from 'lucide-react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useState } from 'react'

export interface HeroWorkbenchPrompt {
  label: string
  accent: string
}

export interface HeroWorkbenchPreview {
  eyebrow: string
  title: string
  lines: [string, string][]
}

export interface HeroWorkbenchFloatingFile {
  name: string
  subtitle: string
}

interface HeroWorkbenchProps {
  ariaLabel: string
  statusLabel: string
  packMeta: string
  workspaceLabel: string
  promptLabel: string
  prompts: HeroWorkbenchPrompt[]
  note: string
  filesLabel: string
  artifactsAriaLabel: string
  validatedLabel: string
  contextReadyLabel: string
  artifactsLabel: string
  handoffReadyLabel: string
  previewOnlyLabel: string
  previews: HeroWorkbenchPreview[]
  floatingFiles: HeroWorkbenchFloatingFile[]
}

const artifacts = [
  { name: 'PRD.md', icon: FileText },
  { name: 'SRS.md', icon: FileCode2 },
  { name: 'ARCHITECTURE.md', icon: GitBranch },
  { name: 'AGENT.md', icon: TerminalSquare },
  { name: 'RULES.md', icon: LockKeyhole },
  { name: 'SKILLS/', icon: FolderOpen },
  { name: 'BACKLOG.md', icon: FileCheck2 },
]

const floatingIcons = [FileText, Boxes, FileCode2, Bot]
const floatingPositions = [
  'left-[0%] top-[14%]',
  'right-[0%] top-[14%]',
  'left-[2%] top-[55%]',
  'right-[2%] top-[55%]',
]
const floatingTones = [
  'bg-[#fff0e4] text-[#b45f34]',
  'bg-[#f1e9ff] text-[#7751b4]',
  'bg-[#e8f2ff] text-[#3470b9]',
  'bg-[#e6f6eb] text-[#39774c]',
]

function FloatingArtifact({ file, index, reducedMotion }: { file: HeroWorkbenchFloatingFile; index: number; reducedMotion: boolean | null }) {
  const Icon = floatingIcons[index % floatingIcons.length]
  const position = floatingPositions[index % floatingPositions.length]
  const tone = floatingTones[index % floatingTones.length]

  return (
    <motion.div
      className={`pointer-events-none absolute z-20 hidden md:block ${position}`}
      style={{ transform: 'translateZ(100px)' }}
      animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
      transition={reducedMotion ? undefined : { duration: 4.8, delay: index * 0.32, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <div className="flex min-w-[132px] items-center gap-2.5 rounded-xl border border-black/[0.07] bg-white/95 px-2.5 py-2.5 shadow-[0_16px_35px_rgba(0,0,0,0.11)] backdrop-blur sm:min-w-[145px] sm:gap-3 sm:px-3 sm:py-3">
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9 ${tone}`}>
          <Icon size={16} strokeWidth={1.7} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold text-[#26231f] sm:text-[11px]">{file.name}</p>
          <p className="mt-0.5 truncate text-[8px] text-black/45 sm:text-[9px]">{file.subtitle}</p>
        </div>
      </div>
    </motion.div>
  )
}

function StaticWorkbench({
  ariaLabel,
  statusLabel,
  packMeta,
  workspaceLabel,
  activePrompt,
  filesLabel,
  artifactsAriaLabel,
  validatedLabel,
  contextReadyLabel,
  artifactsLabel,
  handoffReadyLabel,
  previews,
  floatingFiles,
  reducedMotion,
}: Omit<HeroWorkbenchProps, 'promptLabel' | 'prompts' | 'note' | 'previewOnlyLabel'> & {
  activePrompt: number
  reducedMotion: boolean | null
}) {
  const preview = previews[activePrompt] ?? previews[0]

  return (
    <div className="relative min-h-[530px] px-2 py-4 sm:min-h-[610px] sm:px-4 sm:py-5" role="group" aria-label={ariaLabel}>
      <div className="pointer-events-none absolute inset-[14%_12%_11%] rounded-[50%] bg-[#f4a261]/15 blur-[70px]" aria-hidden="true" />
      <motion.div
        className="pointer-events-none absolute inset-[10%_12%_12%] rounded-[50%] border border-[#a85e3c]/20"
        style={{ rotateX: 67, rotateZ: -9 }}
        animate={reducedMotion ? undefined : { rotateZ: [-9, -5, -9] }}
        transition={reducedMotion ? undefined : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute bottom-[8%] left-[20%] h-12 w-[60%] rounded-[50%] bg-black/10 blur-xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[8%] left-[29%] h-12 w-[42%] rounded-full bg-[#f4a261]/25 blur-3xl" aria-hidden="true" />

      <div className="absolute left-[13%] top-[13%] h-[62%] w-[74%] rounded-[22px] border border-[#d9c6b6]/70 bg-[#ead9cc]/45" style={{ transform: 'translateZ(-95px) translateX(42px) translateY(-28px)' }} aria-hidden="true" />
      <div className="absolute left-[13%] top-[13%] h-[62%] w-[74%] rounded-[22px] border border-[#d9c6b6]/60 bg-[#d9c6b6]/25" style={{ transform: 'translateZ(-58px) translateX(25px) translateY(-17px)' }} aria-hidden="true" />
      <div className="absolute left-[13%] top-[13%] h-[62%] w-[74%] rounded-[22px] border border-white/60 bg-white/20" style={{ transform: 'translateZ(-28px) translateX(11px) translateY(-7px)', backdropFilter: 'blur(4px)' }} aria-hidden="true" />

      {floatingFiles.slice(0, 4).map((file, index) => <FloatingArtifact key={`${file.name}-${index}`} file={file} index={index} reducedMotion={reducedMotion} />)}

      <motion.div
        className="absolute left-[10%] top-[16%] z-10 w-[80%] overflow-hidden rounded-[18px] border border-white/10 bg-[#11120f] shadow-[0_35px_90px_rgba(20,18,15,0.34)]"
        style={{ transform: 'translateZ(45px)', transformStyle: 'preserve-3d' }}
      >
        <div className="flex h-10 items-center justify-between border-b border-white/[0.08] px-3 sm:h-11 sm:px-4">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <span className="size-2 rounded-full bg-[#f08c68]" />
            <span className="size-2 rounded-full bg-[#efbf6f]" />
            <span className="size-2 rounded-full bg-[#9bcda9]" />
            <span className="ml-1.5 truncate font-mono text-[8px] uppercase tracking-[0.14em] text-white/35 sm:ml-3 sm:text-[9px] sm:tracking-[0.18em]">{workspaceLabel}</span>
          </div>
          <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.14em] text-[#f4a261] sm:text-[9px] sm:tracking-[0.18em]">{packMeta}</span>
        </div>

        <div className="grid min-h-[300px] md:grid-cols-[32%_1fr]">
          <aside className="border-b border-white/[0.08] bg-[#1c1d19] p-2.5 sm:p-3 md:border-b-0 md:border-r" aria-label={artifactsAriaLabel}>
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/30 sm:mb-3 sm:gap-2 sm:text-[9px] sm:tracking-[0.14em]"><FolderOpen size={12} /> {filesLabel}</div>
            <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
              {artifacts.map(({ name, icon: Icon }, index) => (
                <div key={name} className={`flex min-w-0 items-center gap-1.5 rounded-md border px-1.5 py-1.5 sm:gap-2 sm:px-2 sm:py-2 ${index === 0 ? 'border-[#f4a261]/35 bg-[#f4a261]/10 text-[#f4a261]' : 'border-transparent text-white/45'}`}>
                  <Icon size={11} aria-hidden="true" />
                  <span className="min-w-0 truncate font-mono text-[8px] sm:text-[9px]">{name}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 bg-[#11120f] p-3.5 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3 font-mono text-[8px] uppercase tracking-[0.12em] text-white/35 sm:text-[9px] sm:tracking-[0.15em]">
              <span className="truncate">{preview.eyebrow}</span>
              <motion.span
                animate={reducedMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
                transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity }}
                className="shrink-0 rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-1 font-mono text-[7px] uppercase tracking-widest text-emerald-300 sm:px-2 sm:text-[8px]"
              >
                {validatedLabel}
              </motion.span>
            </div>
            <h3 className="mt-6 max-w-md text-[1.1rem] font-semibold leading-[1.08] tracking-[-.04em] text-white sm:mt-7 sm:text-2xl">{preview.title}</h3>
            <div className="mt-5 space-y-3 font-mono text-[8px] sm:mt-6 sm:text-[9px]">
              {preview.lines.map(([label, value]) => <div key={label} className="grid grid-cols-[62px_1fr] gap-2 border-b border-white/[0.07] pb-2 sm:grid-cols-[76px_1fr]"><span className="text-[#f4a261]">{label}</span><span className="text-white/45">{value}</span></div>)}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 sm:mt-7">
              <span className="rounded border border-emerald-300/25 bg-emerald-400/[0.07] px-2 py-1.5 font-mono text-[7px] uppercase tracking-[0.13em] text-emerald-200 sm:px-2.5 sm:text-[8px]">{contextReadyLabel}</span>
              <span className="rounded border border-blue-300/20 bg-blue-300/[0.06] px-2 py-1.5 font-mono text-[7px] uppercase tracking-[0.13em] text-blue-200/70 sm:px-2.5 sm:text-[8px]">{artifactsLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] bg-white/[0.015] px-3 py-2 sm:h-9 sm:px-4 sm:py-0">
          <div className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.12em] text-emerald-300/70 sm:gap-2 sm:text-[8px] sm:tracking-[0.14em]"><Check size={11} /> {handoffReadyLabel}</div>
          <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-white/25 sm:text-[8px] sm:tracking-[0.14em]">{statusLabel}</span>
        </div>
      </motion.div>
    </div>
  )
}

export function HeroWorkbench({
  ariaLabel,
  statusLabel,
  packMeta,
  workspaceLabel,
  promptLabel,
  prompts,
  note,
  filesLabel,
  artifactsAriaLabel,
  validatedLabel,
  contextReadyLabel,
  artifactsLabel,
  handoffReadyLabel,
  previewOnlyLabel,
  previews,
  floatingFiles,
}: HeroWorkbenchProps) {
  const [activePrompt, setActivePrompt] = useState(0)
  const reducedMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [3.5, -3.5]), { stiffness: 130, damping: 18 })
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-5, 5]), { stiffness: 130, damping: 18 })
  const glowX = useTransform(pointerX, [-0.5, 0.5], ['22%', '78%'])
  const glowY = useTransform(pointerY, [-0.5, 0.5], ['18%', '82%'])
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, rgba(244,162,97,.23), transparent 42%)`

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
    <motion.div className="relative" style={{ perspective: 1400 }} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <motion.div className="relative" style={reducedMotion ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        <motion.div className="pointer-events-none absolute -inset-5 opacity-80 blur-2xl" style={reducedMotion ? undefined : { background: glow }} aria-hidden="true" />
        <StaticWorkbench
          ariaLabel={ariaLabel}
          statusLabel={statusLabel}
          packMeta={packMeta}
          workspaceLabel={workspaceLabel}
          filesLabel={filesLabel}
          artifactsAriaLabel={artifactsAriaLabel}
          validatedLabel={validatedLabel}
          contextReadyLabel={contextReadyLabel}
          artifactsLabel={artifactsLabel}
          handoffReadyLabel={handoffReadyLabel}
          previews={previews}
          floatingFiles={floatingFiles}
          activePrompt={activePrompt}
          reducedMotion={reducedMotion}
        />
      </motion.div>
      <div className="relative z-30 -mt-1 flex flex-wrap items-end justify-between gap-3 px-[10%] pb-2 sm:mt-0 sm:pb-0">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#6f6860] sm:text-[9px]">{note}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2" role="group" aria-label={promptLabel}>
            {prompts.map((prompt, index) => <button key={prompt.label} type="button" onClick={() => setActivePrompt(index)} className={`border px-2 py-1.5 font-mono text-[8px] uppercase tracking-[.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a261] sm:px-2.5 sm:text-[10px] ${activePrompt === index ? 'border-[#f4a261] bg-[#f4a261] text-[#25241f]' : 'border-[#b9a99b] bg-white/70 text-[#665b52] hover:border-[#a85e3c] hover:text-[#25241f]'}`}>{prompt.label}</button>)}
          </div>
        </div>
        <span className="font-mono text-[8px] uppercase tracking-[.1em] text-[#8c8175] sm:text-[9px]">{previewOnlyLabel}</span>
      </div>
    </motion.div>
  )
}
