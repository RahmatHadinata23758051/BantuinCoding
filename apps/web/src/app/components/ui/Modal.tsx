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

export function Modal({ open, onClose, title, description, closeLabel = 'Close dialog', children, className, ...props }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <Panel
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn('relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto animate-in fade-in zoom-in-95 duration-200', className)}
        {...props}
      >
        <PanelHeader className="flex items-center justify-between">
          <div>
            <h2 id={titleId} className="text-xl font-black tracking-tight text-[var(--ink)]">
              {title}
            </h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-[var(--paper-muted)]">{description}</p>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="nb-button-press inline-flex size-11 items-center justify-center rounded-[3px] border-2 border-transparent text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--action-red)] hover:shadow-[var(--shadow-xs)] transition-all"
            aria-label={closeLabel}
          >
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </PanelHeader>
        <PanelBody>{children}</PanelBody>
      </Panel>
    </div>
  )
}
