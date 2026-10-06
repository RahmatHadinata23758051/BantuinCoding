export const WORKSPACE_SECTIONS = [
  'overview',
  'context',
  'documents',
  'skills',
  'backlog',
  'export',
] as const

export type WorkspaceSection = (typeof WORKSPACE_SECTIONS)[number]

export function parseWorkspaceTab(value: string | null | undefined): WorkspaceSection {
  return WORKSPACE_SECTIONS.includes(value as WorkspaceSection)
    ? (value as WorkspaceSection)
    : 'overview'
}

export function workspaceHref(projectId: string, section: WorkspaceSection = 'overview') {
  const query = section === 'overview' ? '' : `?tab=${encodeURIComponent(section)}`
  return `/projects/${encodeURIComponent(projectId)}${query}`
}
