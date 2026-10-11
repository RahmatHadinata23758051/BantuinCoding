export interface AuthWorkbenchPanelLabels {
  ariaLabel: string
  eyebrow: string
  title: string
  copy: string
  previewLabel: string
  rawIdea: string
  docsPack: string
  agentReady: string
  rawIdeaValue: string
  docsPackValue: string
  agentReadyValue: string
  prdDescription: string
  agentDescription: string
  architectureDescription: string
  rulesDescription: string
  footer: string
}

const artifacts = [
  { name: 'PRD.md', key: 'prdDescription' },
  { name: 'AGENT.md', key: 'agentDescription' },
  { name: 'ARCHITECTURE.md', key: 'architectureDescription' },
  { name: 'RULES.md', key: 'rulesDescription' },
] as const

export function AuthWorkbenchPanel({ labels }: { labels: AuthWorkbenchPanelLabels }) {
  const stages = [
    { label: labels.rawIdea, value: labels.rawIdeaValue },
    { label: labels.docsPack, value: labels.docsPackValue },
    { label: labels.agentReady, value: labels.agentReadyValue },
  ]

  return (
    <aside
      aria-label={labels.ariaLabel}
      className="relative hidden min-h-[520px] overflow-hidden rounded-2xl border border-[#3e3b33] bg-[#25241f] text-[#f7f6f3] shadow-[0_20px_40px_rgba(36,35,31,0.18)] lg:block"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[#a85e3c]/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 size-56 rounded-full bg-[#f4a261]/10 blur-3xl" aria-hidden="true" />

      <div className="relative flex h-full flex-col p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-[#f08c68]" />
            <span className="size-2 rounded-full bg-[#efbf6f]" />
            <span className="size-2 rounded-full bg-[#9bcda9]" />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#c8c1b7]">{labels.previewLabel}</p>
        </div>

        <div className="mt-8 max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#f4a261]">{labels.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold leading-[1.02] tracking-[-0.06em] text-[#fffdfa]">{labels.title}</h2>
          <p className="mt-4 text-sm leading-6 text-[#c8c1b7]">{labels.copy}</p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3" role="list" aria-label={labels.ariaLabel}>
          {artifacts.map((artifact, index) => (
            <div
              key={artifact.name}
              role="listitem"
              className="rounded-xl border border-white/10 bg-[#11120f]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-[#fffdfa]">{artifact.name}</span>
                <span className="font-mono text-[9px] text-[#a7a096]">0{index + 1}</span>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-[#a7a096]">{labels[artifact.key]}</p>
              <div className="mt-4 h-1 rounded-full bg-white/10" aria-hidden="true">
                <div className="h-full rounded-full bg-[#a85e3c]" style={{ width: `${68 + index * 7}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-7">
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#11120f]/70 p-3">
            {stages.map((stage, index) => (
              <div key={stage.label} className="relative min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#f4a261]">0{index + 1}</p>
                <p className="mt-2 text-[11px] font-medium text-[#fffdfa]">{stage.label}</p>
                <p className="mt-1 text-[10px] leading-4 text-[#a7a096]">{stage.value}</p>
                {index < stages.length - 1 && (
                  <span className="absolute -right-2 top-1/2 font-mono text-[12px] text-[#6e6a62]" aria-hidden="true">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[#817a70]">{labels.footer}</p>
        </div>
      </div>
    </aside>
  )
}
