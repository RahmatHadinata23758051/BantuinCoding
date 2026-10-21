import type { ReactNode } from 'react'
import { Circle, FileText, Loader2, RefreshCw } from 'lucide-react'
import { MarkdownWorkspace, type WorkspaceArtifactItem } from '@/app/components/MarkdownWorkspace'
import { SectionHeading } from '../components/SectionHeading'
import { EmptyState } from '../components/EmptyState'
import { BUTTON_FOCUS_CLASS } from '../constants'

export interface DocumentsTabProps {
  active: boolean
  isGenerating: boolean
  artifacts: WorkspaceArtifactItem[]
  readyArtifactsCount: number
  attentionArtifactsCount: number
  requiredDocumentCount: number
  retryableDocumentCount: number
  pendingDocuments: Array<{ id: string; filename: string; status: string }>
  handleRegenerateIncompleteDocuments: () => void | Promise<void>
  handleGenerateAll: () => void | Promise<void>
  generateButton: ReactNode
  projectId: string
  onArtifactUpdated: (updatedArtifact: WorkspaceArtifactItem) => void
  t: (key: string, values?: Record<string, string | number | Date>) => string
  tCommon: (key: string) => string
}

export function DocumentsTab({
  active,
  isGenerating,
  artifacts,
  readyArtifactsCount,
  attentionArtifactsCount,
  requiredDocumentCount,
  retryableDocumentCount,
  pendingDocuments,
  handleRegenerateIncompleteDocuments,
  handleGenerateAll,
  generateButton,
  projectId,
  onArtifactUpdated,
  t,
  tCommon,
}: DocumentsTabProps) {
  if (isGenerating) return null

  return (
    <div className={active ? 'space-y-8' : 'hidden'}>
      <SectionHeading
        title={t('generatedDocuments')}
        description={t('generatedDocumentsDesc')}
        divided={false}
      />

      {(requiredDocumentCount > 0 || artifacts.length > 0) && (
        <div className="space-y-4">
          <div
            className="flex flex-col gap-4 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] px-5 py-4 text-[var(--workspace-ink)] sm:flex-row sm:items-center sm:justify-between sm:px-6"
            role="region"
            aria-label={t('regenerateAllBannerLabel')}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-[var(--workspace-ink)] sm:text-base">
                {t('documentsPackProgress', { ready: readyArtifactsCount, total: requiredDocumentCount })}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--workspace-muted)]">
                {t('documentsPendingSummary', { count: attentionArtifactsCount })}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {retryableDocumentCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleRegenerateIncompleteDocuments()}
                  disabled={isGenerating}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-sun)] px-4 py-2.5 font-sans text-sm font-semibold text-[var(--workspace-ink)] shadow-none transition-colors hover:bg-[var(--workspace-yellow-soft)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                  aria-busy={isGenerating}
                >
                  {isGenerating ? <Loader2 className="motion-safe:animate-spin size-4" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
                  {isGenerating ? tCommon('loading') : t('retryIncompleteDocuments', { count: retryableDocumentCount })}
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleGenerateAll()}
                disabled={isGenerating}
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--workspace-primary)]/20 bg-[var(--workspace-primary)] px-4 py-2.5 font-sans text-sm font-semibold text-white shadow-none transition-colors hover:bg-[var(--workspace-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_FOCUS_CLASS}`}
                aria-busy={isGenerating}
              >
                {isGenerating ? <Loader2 className="motion-safe:animate-spin size-4" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
                {isGenerating ? tCommon('loading') : t('markdownRegenerateAll')}
              </button>
            </div>
          </div>

          {pendingDocuments.length > 0 && (
            <section aria-label={t('plannedDocumentListLabel')} className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-5 py-4 sm:px-6">
              <h2 className="text-sm font-semibold text-[var(--workspace-ink)]">{t('plannedDocumentsHeading')}</h2>
              <ul className="mt-3 divide-y divide-[var(--workspace-border-subtle)]">
                {pendingDocuments.map((document) => (
                  <li key={document.id} className="flex min-w-0 items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0 break-all font-mono text-[var(--workspace-ink)]">{document.filename}</span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[var(--workspace-muted)]">
                      <Circle aria-hidden="true" className="size-3.5" />
                      {t('plannedDocumentStatusWaiting')}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {artifacts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('noDocumentationGenerated')}
          description={t('noDocumentationGeneratedDesc')}
          action={pendingDocuments.length === 0 ? generateButton : null}
        />
      ) : (
        <MarkdownWorkspace
          projectId={projectId}
          artifacts={artifacts}
          isGeneratingAll={isGenerating}
          onArtifactUpdated={onArtifactUpdated}
        />
      )}
    </div>
  )
}
