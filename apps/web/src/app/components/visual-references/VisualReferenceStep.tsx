'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Eye, Sparkles, ArrowRight, Palette, Sun, Moon } from 'lucide-react'
import { VISUAL_REFERENCES, type VisualReferenceItem } from '@/lib/visual-references/catalog'
import { Modal } from '@/app/components/ui'
import { BUTTON_FOCUS_CLASS, WORKSPACE_STYLE } from '@/app/components/workspace/constants'

export interface VisualReferenceStepProps {
  projectName: string
  onSelect: (referenceId: string) => void
  onSkip: () => void
}

export function VisualReferenceStep({
  projectName,
  onSelect,
  onSkip,
}: VisualReferenceStepProps) {
  const t = useTranslations('Workspace')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<VisualReferenceItem | null>(null)

  const handleCardClick = (id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }

  const handleContinue = () => {
    if (selectedId) {
      onSelect(selectedId)
    } else {
      onSkip()
    }
  }

  return (
    <div
      className="min-h-screen bg-[var(--workspace-canvas)] text-[var(--workspace-ink)]"
      style={WORKSPACE_STYLE}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header block */}
        <header className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-3 py-1 text-xs font-semibold text-[var(--workspace-muted)] mb-3">
            <Palette className="size-3.5 text-[var(--workspace-primary)]" aria-hidden="true" />
            <span>{projectName}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
            {t('visualReferenceTitle')}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--workspace-muted)] sm:text-base sm:leading-7">
            {t('visualReferenceDescription')}
          </p>
        </header>

        {/* Gallery grid */}
        <section
          aria-label={t('visualReferenceTitle')}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {VISUAL_REFERENCES.map((item) => {
            const isSelected = selectedId === item.id
            const isDark = item.theme === 'dark'

            return (
              <article
                key={item.id}
                aria-labelledby={`visual-reference-${item.id}-title`}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 ${isSelected ? 'border-[var(--workspace-primary)] bg-[var(--workspace-paper)] ring-2 ring-[var(--workspace-primary)] ring-offset-2 ring-offset-[var(--workspace-canvas)] shadow-md' : 'border-[var(--workspace-border)] bg-[var(--workspace-paper)] shadow-sm'}`}
              >
                <div>
                  {/* Top row: Name & Theme tag & Selection badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h2 id={`visual-reference-${item.id}-title`} className="text-lg font-semibold tracking-tight text-[var(--workspace-ink)]">
                        {item.name}
                      </h2>
                      <p className="mt-1 text-xs font-medium text-[var(--workspace-muted)] leading-snug">
                        {item.tagline}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="inline-flex size-6 items-center justify-center rounded-full border border-[var(--workspace-border)] bg-white/60 text-[var(--workspace-muted)]"
                        title={isDark ? t('visualReferenceDarkTheme') : t('visualReferenceLightTheme')}
                        aria-label={isDark ? t('visualReferenceDarkTheme') : t('visualReferenceLightTheme')}
                      >
                        {isDark ? (
                          <Moon className="size-3" aria-hidden="true" />
                        ) : (
                          <Sun className="size-3" aria-hidden="true" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs leading-5 text-[var(--workspace-body)] mb-4">
                    {item.description}
                  </p>

                  {/* Color swatches preview */}
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] p-2">
                    <span className="text-[11px] font-medium text-[var(--workspace-muted)] mr-1">
                      {t('visualReferencePalette')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-5 rounded border border-black/10 shadow-xs"
                        style={{ backgroundColor: item.canvasColor }}
                        title={t('visualReferenceCanvasColor', { color: item.canvasColor })}
                        aria-label={t('visualReferenceCanvasColor', { color: item.canvasColor })}
                      />
                      <span
                        className="size-5 rounded border border-black/10 shadow-xs"
                        style={{ backgroundColor: item.surfaceColor }}
                        title={t('visualReferenceSurfaceColor', { color: item.surfaceColor })}
                        aria-label={t('visualReferenceSurfaceColor', { color: item.surfaceColor })}
                      />
                      <span
                        className="size-5 rounded border border-black/10 shadow-xs"
                        style={{ backgroundColor: item.accentColor }}
                        title={t('visualReferenceAccentColor', { color: item.accentColor })}
                        aria-label={t('visualReferenceAccentColor', { color: item.accentColor })}
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-[var(--workspace-border)] bg-white/50 px-2 py-0.5 text-[11px] font-medium text-[var(--workspace-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card actions */}
                <div className="mt-auto pt-4 border-t border-[var(--workspace-border-subtle)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewItem(item)
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] px-2.5 py-1.5 text-xs font-semibold text-[var(--workspace-ink)] hover:bg-[var(--workspace-paper)] transition-colors ${BUTTON_FOCUS_CLASS}`}
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    <span>{t('visualReferencePreview')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCardClick(item.id)
                    }}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${BUTTON_FOCUS_CLASS} ${
                      isSelected
                        ? 'bg-[var(--workspace-primary)] text-white shadow-xs'
                        : 'border border-[var(--workspace-border)] bg-[var(--workspace-paper)] text-[var(--workspace-ink)] hover:bg-[var(--workspace-yellow-soft)]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="size-3.5" aria-hidden="true" />
                        <span>{t('visualReferenceSelected')}</span>
                      </>
                    ) : (
                      <span>{t('visualReferenceUse')}</span>
                    )}
                  </button>
                </div>
              </article>
            )
          })}
        </section>

        {/* Bottom bar actions */}
        <footer className="mt-12 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-paper)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--workspace-ink)]">
                {selectedId
                  ? t('visualReferenceContinueSelected')
                  : t('visualReferenceNoSelection')}
              </p>
              <p className="mt-1 text-xs text-[var(--workspace-muted)]">
                {t('visualReferenceSkipNote')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSkip}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-canvas)] px-4 py-2 text-sm font-semibold text-[var(--workspace-ink)] hover:bg-[var(--workspace-yellow-soft)] transition-colors ${BUTTON_FOCUS_CLASS}`}
              >
                <Sparkles className="size-4 text-[var(--workspace-primary)]" aria-hidden="true" />
                <span>{t('visualReferenceLetModelChoose')}</span>
              </button>

              <button
                type="button"
                onClick={handleContinue}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--workspace-primary)] px-6 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity ${BUTTON_FOCUS_CLASS}`}
              >
                <span>
                  {selectedId
                    ? t('visualReferenceContinueSelected')
                    : t('visualReferenceContinue')}
                </span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Full preview modal */}
      {previewItem && (
        <Modal
          open={Boolean(previewItem)}
          onClose={() => setPreviewItem(null)}
          title={t('visualReferencePreviewTitle', { name: previewItem.name })}
          description={previewItem.tagline}
          closeLabel={t('visualReferenceClosePreview')}
          className="max-w-6xl w-[95vw] h-[90vh] border-[var(--workspace-border)] bg-[var(--workspace-paper)] shadow-2xl"
        >
          <div className="flex flex-col h-full w-full">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--workspace-border-subtle)] pb-2 text-xs text-[var(--workspace-muted)]">
              <span>{previewItem.description}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(previewItem.id)
                  setPreviewItem(null)
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg bg-[var(--workspace-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity ${BUTTON_FOCUS_CLASS}`}
              >
                <Check className="size-3.5" aria-hidden="true" />
                <span>{t('visualReferenceUse')}</span>
              </button>
            </div>
            <div className="flex-1 min-h-0 w-full overflow-hidden rounded-xl border border-[var(--workspace-border)] bg-white">
              <iframe
                src={previewItem.previewUrl}
                title={t('visualReferencePreviewTitle', { name: previewItem.name })}
                sandbox="allow-scripts"
                className="w-full h-full min-h-[60vh] border-0"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
