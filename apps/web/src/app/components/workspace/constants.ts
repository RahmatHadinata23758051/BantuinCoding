import type { CSSProperties } from 'react'
import {
  Braces,
  ClipboardCheck,
  Files,
  ListChecks,
  Network,
  Package,
} from 'lucide-react'
import type { ContextCategoryDefinition, WorkspaceSectionItem } from './types'

export const ALL_SECTIONS: WorkspaceSectionItem[] = [
  { id: 'overview', labelKey: 'sectionOverview', descriptionKey: 'sectionOverviewDesc', icon: ClipboardCheck },
  { id: 'context', labelKey: 'sectionContext', descriptionKey: 'sectionContextDesc', icon: Braces },
  { id: 'documents', labelKey: 'sectionDocuments', descriptionKey: 'sectionDocumentsDesc', icon: Files },
  { id: 'design-system', labelKey: 'sectionDesignSystem', descriptionKey: 'sectionDesignSystemDesc', icon: Network },
  { id: 'backlog', labelKey: 'sectionBacklog', descriptionKey: 'sectionBacklogDesc', icon: ListChecks },
  { id: 'export', labelKey: 'sectionExport', descriptionKey: 'sectionExportDesc', icon: Package },
]

export const WORKSPACE_STYLE = {
  '--workspace-paper': 'var(--color-workspace-paper)',
  '--workspace-ink': 'var(--color-workspace-ink)',
  '--workspace-canvas': 'var(--color-workspace-canvas)',
  '--workspace-panel': 'var(--color-workspace-paper)',
  '--workspace-border': 'var(--color-workspace-border)',
  '--workspace-border-subtle': 'var(--color-workspace-border-subtle)',
  '--workspace-border-muted': 'var(--color-workspace-border-muted)',
  '--workspace-card-shadow': 'var(--color-workspace-card-shadow)',
  '--workspace-body': 'var(--color-workspace-body)',
  '--workspace-muted': 'var(--color-workspace-muted)',
  '--workspace-faint': 'var(--color-workspace-faint)',
  '--workspace-primary': 'var(--color-workspace-primary)',
  '--workspace-primary-hover': 'var(--color-workspace-primary-hover)',
  '--workspace-deep': 'var(--color-workspace-deep)',
  '--workspace-mint': 'var(--color-workspace-mint)',
  '--workspace-rose': 'var(--color-workspace-rose)',
  '--workspace-blue-soft': 'var(--color-workspace-blue-soft)',
  '--workspace-yellow-soft': 'var(--color-workspace-yellow-soft)',
  '--workspace-mint-soft': 'var(--color-workspace-mint-soft)',
  '--workspace-rose-soft': 'var(--color-workspace-rose-soft)',
  '--workspace-sun': 'var(--color-workspace-sun)',
  '--workspace-peach': 'var(--color-workspace-peach)',
} as CSSProperties

export const PANEL_CLASS =
  'rounded-[20px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-[0_10px_28px_rgba(36,35,31,0.045)]'
export const PANEL_SOFT_CLASS =
  'rounded-[16px] bg-[var(--workspace-paper)]'
export const BUTTON_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--workspace-canvas)]'

export const SENSITIVE_CONTEXT_KEY =
  /(api.?key|access.?token|authorization|credential|password|private.?key|secret|token)/i
export const SENSITIVE_CONTEXT_VALUE =
  /^(?:bearer\s+|sk-[a-z0-9_-]{12,}|AIza[a-z0-9_-]{20,}|gh[pousr]_[a-z0-9_]{20,}|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$)/i

export const CONTEXT_CATEGORY_DEFINITIONS: readonly ContextCategoryDefinition[] = [
  {
    id: 'intent',
    labelKey: 'contextCategoryIntent',
    descriptionKey: 'contextCategoryIntentDesc',
    keys: ['goals', 'non_goals'],
  },
  {
    id: 'audience',
    labelKey: 'contextCategoryAudience',
    descriptionKey: 'contextCategoryAudienceDesc',
    keys: ['target_users'],
  },
  {
    id: 'experience',
    labelKey: 'contextCategoryExperience',
    descriptionKey: 'contextCategoryExperienceDesc',
    keys: ['design_direction', 'core_entities'],
  },
  {
    id: 'scope',
    labelKey: 'contextCategoryScope',
    descriptionKey: 'contextCategoryScopeDesc',
    keys: ['functional_requirements'],
  },
  {
    id: 'constraints',
    labelKey: 'contextCategoryConstraints',
    descriptionKey: 'contextCategoryConstraintsDesc',
    keys: [
      'non_functional_requirements',
      'technical_constraints',
      'stack_preferences',
      'security_requirements',
      'integrations',
      'deployment_target',
      'agent_target',
    ],
  },
  {
    id: 'decisions',
    labelKey: 'contextCategoryDecisions',
    descriptionKey: 'contextCategoryDecisionsDesc',
    keys: ['confirmed_decisions', 'assumptions', 'open_questions'],
  },
] as const
