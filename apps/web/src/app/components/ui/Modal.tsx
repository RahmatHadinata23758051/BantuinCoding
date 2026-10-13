'use client'

import { useEffect, useId, useRef, type HTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/ui'
import { Panel, PanelBody, PanelHeader } from './Panel'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  closeLabel?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  closeLabel = 'Close dialog',
  children,
  className,
  ...props
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement as HTMLElement | null

    const html = document.documentElement
    const body = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow
    const previousHtmlOverscrollBehavior = html.style.overscrollBehavior
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior

    // The document element can be the scroll root, so lock both roots while
    // the dialog owns scrolling.
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'
    closeButtonRef.current?.focus()

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      html.style.overscrollBehavior = previousHtmlOverscrollBehavior
      body.style.overscrollBehavior = previousBodyOverscrollBehavior
      previousFocusRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const dialog = document.getElementById(titleId)?.closest('[role="dialog"]')
      if (!dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute('disabled'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, titleId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm motion-reduce:backdrop-blur-none">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <Panel
        role="dialog"
        aria-modal="true"
        data-lenis-prevent
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn('relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden overscroll-contain shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200', className)}
        {...props}
      >
        <PanelHeader className="shrink-0">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-[var(--color-ink-black)]">
              {title}
            </h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-[var(--color-stone)]">{description}</p>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-[var(--radius-buttons)] text-[var(--color-stone)] hover:bg-[#f2f1f0] hover:text-[var(--color-ink-black)] transition-colors"
            aria-label={closeLabel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </PanelHeader>
        <PanelBody className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</PanelBody>
      </Panel>
    </div>
  )
}
