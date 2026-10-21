import type { ReactNode } from 'react'
import {
  Check,
  Copy,
  Download,
  FileCheck,
  FileText,
  Loader2,
  Lock,
  Package,
  ShieldCheck,
  Terminal,
} from 'lucide-react'
import { SectionHeading } from '../components/SectionHeading'
import { EmptyState } from '../components/EmptyState'
import { BUTTON_FOCUS_CLASS, PANEL_CLASS } from '../constants'
import type { WorkspaceArtifactItem } from '@/app/components/MarkdownWorkspace'
import type { ExportBlockedReason } from '@/app/components/workspace/helpers'

export interface ExportTabProps {
  active: boolean
  isGenerating: boolean
  canExport: boolean
  blockedReason: ExportBlockedReason
  readyRequiredCount: number
  totalRequiredCount: number
  exportManifestArtifacts: WorkspaceArtifactItem[]
  exportFileCount: number
  includesReadme: boolean
  genMessage: { type: 'status' | 'error'; text: string } | null
  validationWarnings: string[]
  validationAuditMode: 'ai-assisted' | 'deterministic-only' | null
  generateButton: ReactNode
  handleDownloadZip: () => void | Promise<void>
  isExporting: boolean
  isDownloadComplete: boolean
  copiedPrompt: boolean
  handleCopyOneShotPrompt: () => void
  oneShotKickoffPrompt: string
  t: (key: string, values?: Record<string, string | number | Date>) => string
}

function getExportArtifactDescriptionKey(type: string):
  | 'fileDescAgent'
  | 'fileDescBacklog'
  | 'fileDescPrd'
  | 'fileDescDesign'
  | 'fileDescArchitecture'
  | 'fileDescGeneric' {
  switch (type) {
    case 'AGENT':
      return 'fileDescAgent'
    case 'BACKLOG':
      return 'fileDescBacklog'
    case 'PRD':
      return 'fileDescPrd'
    case 'DESIGN':
      return 'fileDescDesign'
    case 'ARCHITECTURE':
      return 'fileDescArchitecture'
    default:
      return 'fileDescGeneric'
  }
}

function renderPromptPreviewContent(promptText: string) {
  const lines = promptText.split('\n')
  return lines.map((line, index) => {
    if (line.startsWith('# ')) {
      return (
        <div key={index} className="font-bold text-amber-300 text-sm py-0.5">
          {line}
        </div>
      )
    }
    if (line.startsWith('## ')) {
      return (
        <div key={index} className="font-semibold text-amber-200 text-xs pt-3 pb-1">
          {line}
        </div>
      )
    }
    const numberedMatch = line.match(/^(\d+\.\s)(.*)$/)
    if (numberedMatch) {
      return (
        <div key={index} className="flex items-start text-xs text-neutral-200 pl-2 py-0.5">
          <span className="font-semibold text-sky-300 shrink-0 w-6">{numberedMatch[1]}</span>
          <span className="min-w-0">{numberedMatch[2]}</span>
        </div>
      )
    }
    if (line.startsWith('- ')) {
      return (
        <div key={index} className="flex items-start text-xs text-neutral-200 pl-2 py-0.5">
          <span className="text-neutral-400 shrink-0 mr-2">•</span>
          <span className="min-w-0">{line.slice(2)}</span>
        </div>
      )
    }
    if (!line.trim()) {
      return <div key={index} className="h-2" />
    }
    return (
      <div key={index} className="text-xs text-neutral-300 py-0.5">
        {line}
      </div>
    )
  })
}

export function ExportTab({
  active,
  isGenerating,
  canExport,
  blockedReason,
  readyRequiredCount,
  totalRequiredCount,
  exportManifestArtifacts,
  exportFileCount,
  includesReadme,
  genMessage,
  validationWarnings = [],
  validationAuditMode = null,
  generateButton,
  handleDownloadZip,
  isExporting,
  isDownloadComplete,
  copiedPrompt,
  handleCopyOneShotPrompt,
  oneShotKickoffPrompt,
  t,
}: ExportTabProps) {
  return (
    <div className={active && !isGenerating ? 'space-y-8' : 'hidden'}>
      <SectionHeading
        title={t('exportAgentPrompt')}
        description={t('exportAgentPromptDesc')}
        divided={false}
        action={
          <span
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-semibold sm:self-auto ${
              canExport
                ? 'border-[#2d8d6b]/35 bg-[var(--workspace-mint-soft)] text-[#1b6a4e]'
                : 'border-[var(--workspace-border)] bg-[var(--workspace-paper)] text-[var(--workspace-muted)]'
            }`}
          >
            {canExport && <Check aria-hidden="true" className="size-4" />}
            {canExport
              ? t('readyToDownloadFiles', { count: exportFileCount })
              : t('notReady')}
          </span>
        }
      />
      {genMessage?.type === 'error' && (
        <p role="alert" className="-mt-4 text-sm font-medium text-[var(--workspace-rose)]">
          {genMessage.text}
        </p>
      )}
      {validationWarnings.length > 0 && (
        <section aria-label={t('exportWarningsHeading')} className="-mt-4 space-y-2 border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-950">
          <h3 className="font-semibold">{t('exportWarningsHeading')}</h3>
          <p>{t('exportWarningsDesc')}</p>
          {validationAuditMode === 'deterministic-only' && <p>{t('exportAuditFallbackNote')}</p>}
          <ul className="list-disc space-y-1 pl-5">
            {validationWarnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}
          </ul>
        </section>
      )}

      {!canExport ? (
        <EmptyState
          icon={Package}
          title={t(
            blockedReason === 'incomplete-pack'
              ? 'exportMissingDocumentsTitle'
              : blockedReason === 'project-not-ready'
                ? 'exportProjectNotReadyTitle'
                : 'exportNoReadyDocumentsTitle',
          )}
          description={t(
            blockedReason === 'incomplete-pack'
              ? 'exportMissingDocumentsDesc'
              : blockedReason === 'project-not-ready'
                ? 'exportProjectNotReadyDesc'
                : 'exportNoReadyDocumentsDesc',
            blockedReason === 'incomplete-pack'
              ? { ready: readyRequiredCount, total: totalRequiredCount }
              : undefined,
          )}
          action={blockedReason === 'project-not-ready' ? null : generateButton}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <section aria-labelledby="pack-export-title" className={`${PANEL_CLASS} flex h-full flex-col overflow-hidden`}>
              <div className="border-b border-[var(--workspace-border-subtle)] bg-[var(--workspace-yellow-soft)] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--workspace-border)] bg-[var(--workspace-paper)] text-[var(--workspace-deep)]">
                      <Package aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                      <h3 id="pack-export-title" className="text-xl font-semibold tracking-tight text-[var(--workspace-ink)]">
                        {t('bootstrapPack')}
                      </h3>
                      <p className="mt-0.5 font-sans text-xs text-[var(--workspace-muted)]">
                        {t('preparedForUniversal')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDownloadZip()}
                    disabled={isExporting}
                    aria-busy={isExporting}
                    aria-label={isExporting ? t('validatingPack') : isDownloadComplete ? t('downloaded') : t('downloadZipPack')}
                    className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-ink)] px-4 py-2.5 text-sm font-semibold text-white shadow-none transition-colors hover:bg-black disabled:pointer-events-none disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                  >
                    {isExporting ? (
                      <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                    ) : isDownloadComplete ? (
                      <Check aria-hidden="true" className="size-4 text-emerald-400" />
                    ) : (
                      <Download aria-hidden="true" className="size-4" />
                    )}
                    <span>
                      {isExporting
                        ? t('validatingPack')
                        : isDownloadComplete
                          ? t('downloaded')
                          : t('downloadZipPack')}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col bg-[var(--workspace-paper)]">
                <div className="flex-1 p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="font-sans text-xs font-bold uppercase tracking-[0.08em] text-[var(--workspace-muted)]">
                      {t('archiveContents')}
                    </h4>
                    <span className="font-sans text-xs font-semibold text-[var(--workspace-muted)]">
                      {t('filesCount', { count: exportFileCount })}
                    </span>
                  </div>
                  <ul className="divide-y divide-[var(--workspace-border-subtle)] border-y border-[var(--workspace-border-subtle)]">
                    {exportManifestArtifacts.map((artifact) => (
                      <li key={artifact.id || artifact.type} className="flex items-start gap-3 py-3">
                        <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--workspace-ink)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-sm font-bold text-[var(--workspace-ink)]">
                            {artifact.path}
                          </p>
                          <p className="mt-0.5 font-sans text-xs text-[var(--workspace-muted)]">
                            {t(getExportArtifactDescriptionKey(artifact.type))}
                          </p>
                        </div>
                      </li>
                    ))}
                    {!includesReadme && (
                      <li className="flex items-start gap-3 py-3">
                        <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--workspace-ink)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-mono text-sm font-bold text-[var(--workspace-ink)]">
                              README.md
                            </span>
                            <span className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--workspace-ink)]">
                              {t('addedDuringExport')}
                            </span>
                          </div>
                          <p className="mt-0.5 font-sans text-xs text-[var(--workspace-muted)]">
                            {t('fileDescReadme')}
                          </p>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-auto border-t border-[var(--workspace-border-subtle)] bg-[var(--workspace-paper)] p-5 sm:p-6">
                  <div className="space-y-2.5 font-sans text-xs text-[var(--workspace-muted)]">
                    <div className="flex items-start gap-2.5">
                      <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span>{t('assuranceSecrets')}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span>{t('assuranceScanned')}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <FileCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span>{t('assuranceFilenames')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="kickoff-prompt-title" className={`${PANEL_CLASS} flex h-full flex-col overflow-hidden bg-[var(--workspace-paper)]`}>
              <div className="border-b border-[var(--workspace-border-subtle)] bg-[var(--workspace-blue-soft)] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--workspace-border)] bg-[var(--workspace-paper)] text-[var(--workspace-deep)]">
                      <Terminal aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                      <h3 id="kickoff-prompt-title" className="text-xl font-semibold tracking-tight text-[var(--workspace-ink)]">
                        {t('oneShotAgentPrompt')}
                      </h3>
                      <p className="mt-0.5 font-sans text-xs text-[var(--workspace-muted)]">
                        {t('oneShotAgentPromptDesc')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyOneShotPrompt}
                    aria-label={copiedPrompt ? t('copied') : t('copyPrompt')}
                    className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-4 py-2.5 text-sm font-semibold text-[var(--workspace-ink)] shadow-none transition-colors hover:bg-[var(--workspace-blue-soft)] ${BUTTON_FOCUS_CLASS}`}
                  >
                    {copiedPrompt ? (
                      <>
                        <Check aria-hidden="true" className="size-4 text-emerald-600" />
                        <span>{t('copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" className="size-4 text-[var(--workspace-ink)]" />
                        <span>{t('copyPrompt')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <p className="mb-2 font-sans text-xs text-[var(--workspace-muted)]">
                  {t('promptPreviewCaption')}
                </p>
                <div
                  role="region"
                  aria-label={t('promptPreviewRegionLabel')}
                  tabIndex={0}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg border border-black/20 bg-[#18181b] p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--workspace-primary)]"
                  style={{ maxHeight: '440px', minHeight: '340px' }}
                >
                  {renderPromptPreviewContent(oneShotKickoffPrompt)}
                </div>
              </div>
            </section>
          </div>

          <div className="rounded-[20px] border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-5 sm:p-6 shadow-[0_8px_22px_rgba(36,35,31,0.06)]">
            <h4 className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.08em] text-[var(--workspace-muted)]">
              {t('howToUse')}
            </h4>
            <ol className="grid gap-4 sm:grid-cols-3">
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] font-sans text-xs font-bold text-[var(--workspace-ink)]">
                  1
                </span>
                <p className="font-sans text-sm font-semibold text-[var(--workspace-ink)]">
                  {t('exportStepDownload')}
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] font-sans text-xs font-bold text-[var(--workspace-ink)]">
                  2
                </span>
                <p className="font-sans text-sm font-semibold text-[var(--workspace-ink)]">
                  {t('exportStepExtract')}
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] font-sans text-xs font-bold text-[var(--workspace-ink)]">
                  3
                </span>
                <p className="font-sans text-sm font-semibold text-[var(--workspace-ink)]">
                  {t('exportStepPaste')}
                </p>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
