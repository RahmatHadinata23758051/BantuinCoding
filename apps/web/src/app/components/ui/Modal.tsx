import { X } from 'lucide-react'
import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/ui'
import { Panel, PanelBody, PanelHeader } from './Panel'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  title: string
}

export function Modal({ open, onClose, title, children, className, ...props }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Click outside to close (simple overlay handler) */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <Panel raised className={cn("relative z-10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200", className)} {...props}>
        <PanelHeader className="flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-black tracking-tight text-[var(--ink)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="nb-button-press inline-flex size-8 items-center justify-center rounded-[3px] border-2 border-transparent text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--action-red)] hover:shadow-[var(--shadow-xs)] transition-all"
            aria-label="Close modal"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </PanelHeader>
        <PanelBody>
          {children}
        </PanelBody>
      </Panel>
    </div>
  )
}
