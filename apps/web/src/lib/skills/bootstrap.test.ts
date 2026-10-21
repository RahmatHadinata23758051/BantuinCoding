import { describe, it, expect } from 'vitest'
import {
  UI_UX_PRO_MAX_INSTALLATION,
  getVerifiedSkillInstallCommand,
} from './bootstrap'

describe('getVerifiedSkillInstallCommand', () => {
  const validMetadata = {
    installation_mode: UI_UX_PRO_MAX_INSTALLATION.mode,
    installation_source: UI_UX_PRO_MAX_INSTALLATION.source,
    installation_skill_id: UI_UX_PRO_MAX_INSTALLATION.skillId,
    installation_agents: [...UI_UX_PRO_MAX_INSTALLATION.agents],
    prerequisite: UI_UX_PRO_MAX_INSTALLATION.prerequisite,
    installation_hint: UI_UX_PRO_MAX_INSTALLATION.command,
  }

  it('resolves verified command for CLAUDE_CODE', () => {
    const cmd = getVerifiedSkillInstallCommand('ui-ux-pro-max', validMetadata, 'CLAUDE_CODE')
    expect(cmd).toBe('npx ui-ux-pro-max-cli init --ai claude')
  })

  it('resolves verified command for CODEX', () => {
    const cmd = getVerifiedSkillInstallCommand('ui-ux-pro-max', validMetadata, 'CODEX')
    expect(cmd).toBe('npx ui-ux-pro-max-cli init --ai codex')
  })

  it('resolves verified command for CURSOR', () => {
    const cmd = getVerifiedSkillInstallCommand('ui-ux-pro-max', validMetadata, 'CURSOR')
    expect(cmd).toBe('npx ui-ux-pro-max-cli init --ai cursor')
  })

  it('resolves universal command for unknown/OTHER agents', () => {
    const cmd = getVerifiedSkillInstallCommand('ui-ux-pro-max', validMetadata, 'OTHER')
    expect(cmd).toBe('npx ui-ux-pro-max-cli init --ai universal')
    const cmdDefault = getVerifiedSkillInstallCommand('ui-ux-pro-max', validMetadata)
    expect(cmdDefault).toBe('npx ui-ux-pro-max-cli init --ai universal')
  })

  it('returns undefined for non-whitelisted skill name', () => {
    const cmd = getVerifiedSkillInstallCommand('invented-skill', validMetadata, 'CLAUDE_CODE')
    expect(cmd).toBeUndefined()
  })

  it('returns undefined if installation mode is manual or unverified', () => {
    const cmd = getVerifiedSkillInstallCommand('ui-ux-pro-max', {
      ...validMetadata,
      installation_mode: 'manual',
    }, 'CLAUDE_CODE')
    expect(cmd).toBeUndefined()
  })

  it('returns undefined if command hint differs from exact verified template', () => {
    const cmd = getVerifiedSkillInstallCommand('ui-ux-pro-max', {
      ...validMetadata,
      installation_hint: 'npx malicious-package init',
    }, 'CLAUDE_CODE')
    expect(cmd).toBeUndefined()
  })

  it('returns undefined if installation metadata is null or undefined', () => {
    expect(getVerifiedSkillInstallCommand('ui-ux-pro-max', null, 'CLAUDE_CODE')).toBeUndefined()
    expect(getVerifiedSkillInstallCommand('ui-ux-pro-max', undefined, 'CLAUDE_CODE')).toBeUndefined()
  })
})
