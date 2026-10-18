import { useRef, type KeyboardEvent } from 'react'
import { Link } from '@/i18n/routing'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { BrandLogo } from '@/app/components/BrandLogo'
import { BUTTON_FOCUS_CLASS } from '../constants'
import {
  formatStatus,
  getSectionPanelId,
  getSectionTabId,
  getSectionTabKey,
  statusTone,
} from '../helpers'
import type { WorkspaceSectionItem } from '../types'
import type { WorkspaceSection } from '@/lib/navigation/workspace'

export interface WorkspaceSidebarProps {
  variant: 'desktop' | 'mobile'
  projectName: string
  projectStatus: string
  sectionItems: WorkspaceSectionItem[]
  activeTab: WorkspaceSection
  onSelectTab: (section: WorkspaceSection) => void
  onOpenSettings: () => void
  onCloseMobileNavigation?: () => void
  t: (key: string) => string
  tStatus: (key: string) => string | undefined
}

export function WorkspaceSidebar({
  variant,
  projectName,
  projectStatus,
  sectionItems,
  activeTab,
  onSelectTab,
  onOpenSettings,
  onCloseMobileNavigation,
  t,
  tStatus,
}: WorkspaceSidebarProps) {
  const sectionTabRefs = useRef(new Map<WorkspaceSection, HTMLButtonElement>())

  const handleSectionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentSection: WorkspaceSection,
  ) => {
    const currentIndex = sectionItems.findIndex((section) => section.id === currentSection)
    const lastIndex = sectionItems.length - 1
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = lastIndex
    }

    if (nextIndex === null) return

    event.preventDefault()
    const nextSection = sectionItems[nextIndex].id
    onSelectTab(nextSection)
    const container = event.currentTarget.closest('[role="tablist"]')
    const targetElement = container?.querySelector<HTMLButtonElement>(`button[data-section="${nextSection}"]`)
    if (targetElement) {
      targetElement.focus()
    } else {
      sectionTabRefs.current.get(nextSection)?.focus()
    }
  }

  return (
    <>
      <div className="min-w-0 border-b border-[var(--workspace-border)] pb-5">
        <BrandLogo imageSize={28} textClassName="text-xl font-semibold tracking-[-0.04em]" />
        <p className="mt-1 truncate text-xs text-[var(--workspace-muted)]" title={projectName}>
          {projectName}
        </p>
        {projectStatus !== 'EXPORTABLE' && (
          <span
            className={`mt-3 inline-flex max-w-full rounded-full border border-[var(--workspace-border)] px-3 py-1.5 text-center text-xs font-semibold leading-4 ${statusTone(projectStatus)}`}
            title={tStatus(projectStatus) ?? formatStatus(projectStatus)}
          >
            {tStatus(projectStatus) ?? formatStatus(projectStatus)}
          </span>
        )}
      </div>

      <div className="mt-6">
        <Link
          href="/dashboard"
          className={`inline-flex items-center gap-2 text-sm font-semibold text-[var(--workspace-muted)] transition-colors hover:text-[var(--workspace-primary)] ${BUTTON_FOCUS_CLASS}`}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('backProjects')}
        </Link>
      </div>

      <div className="mt-8">
        <p className="text-xs font-bold text-[var(--workspace-muted)]">{t('workspaceSections')}</p>
        <nav
          role="tablist"
          aria-orientation="vertical"
          aria-label={t('workspaceSections')}
          className="mt-3 space-y-1"
        >
          {sectionItems.map((section) => {
            const Icon = section.icon
            const isActive = activeTab === section.id
            return (
              <button
                key={section.id}
                ref={(element) => {
                  if (variant === 'desktop') {
                    if (element) sectionTabRefs.current.set(section.id, element)
                    else sectionTabRefs.current.delete(section.id)
                  }
                }}
                id={variant === 'desktop' ? getSectionTabId(section.id) : `mobile-${getSectionTabId(section.id)}`}
                data-section={section.id}
                type="button"
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                aria-controls={getSectionPanelId(section.id)}
                onClick={() => {
                  onSelectTab(section.id)
                  onCloseMobileNavigation?.()
                }}
                onKeyDown={(event) => handleSectionKeyDown(event, section.id)}
                title={t(section.descriptionKey)}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${BUTTON_FOCUS_CLASS} ${
                  isActive
                    ? 'bg-[var(--workspace-yellow-soft)] text-[var(--workspace-ink)]'
                    : 'text-[var(--workspace-muted)] hover:bg-[var(--workspace-blue-soft)] hover:text-[var(--workspace-ink)]'
                }`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(getSectionTabKey(section.id))}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-[var(--workspace-border)] pt-5">
        <button
          type="button"
          onClick={() => {
            onOpenSettings()
            onCloseMobileNavigation?.()
          }}
          className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-paper)] px-3 py-2.5 text-left text-sm font-semibold text-[var(--workspace-ink)] transition-colors hover:bg-[var(--workspace-blue-soft)] ${BUTTON_FOCUS_CLASS}`}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          <span>{t('projectSettings')}</span>
        </button>
      </div>
    </>
  )
}
