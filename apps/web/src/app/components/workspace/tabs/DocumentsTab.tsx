import type { ReactNode } from 'react'
import { FileText, Loader2, RefreshCw } from 'lucide-react'
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
  retryableDocumentCount: number
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
  retryableDocumentCount,
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

      {artifacts.length > 0 && (
        <div
          className="flex flex-col gap-4 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-yellow-soft)] px-5 py-4 text-[var(--workspace-ink)] sm:flex-row sm:items-center sm:justify-between sm:px-6"
          role="region"
          aria-label={t('regenerateAllBannerLabel')}
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: Math.min(5, Math.max(1, artifacts.length)) }).map((_, index) => (
                <span
                  key={index}
                  className={`size-2.5 rounded-full ${index < readyArtifactsCount ? 'bg-[var(--pass-teal)]' : 'bg-[var(--workspace-muted)]/40'}`}
                />
              ))}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-[var(--workspace-ink)] sm:text-base">
                {t('documentsReadySummary', { count: readyArtifactsCount })}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--workspace-muted)]">
                {t('attentionCount', { count: attentionArtifactsCount })} · {t('regenerateAllHint')}
              </p>
            </div>
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
      )}

      {artifacts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('noDocumentationGenerated')}
          description={t('noDocumentationGeneratedDesc')}
          action={generateButton}
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
