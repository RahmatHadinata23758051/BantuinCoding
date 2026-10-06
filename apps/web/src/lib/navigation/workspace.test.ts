import { describe, expect, it } from 'vitest'

import { parseWorkspaceTab, workspaceHref } from './workspace'

describe('workspace navigation', () => {
  it('parses valid tabs and defaults invalid values', () => {
    expect(parseWorkspaceTab('documents')).toBe('documents')
    expect(parseWorkspaceTab('unknown')).toBe('overview')
    expect(parseWorkspaceTab(undefined)).toBe('overview')
  })

  it('builds stable project workspace URLs', () => {
    expect(workspaceHref('project-1')).toBe('/projects/project-1')
    expect(workspaceHref('project-1', 'backlog')).toBe('/projects/project-1?tab=backlog')
    expect(workspaceHref('a/b', 'documents')).toBe('/projects/a%2Fb?tab=documents')
  })
})
