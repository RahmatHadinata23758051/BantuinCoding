import { describe, expect, it } from 'vitest'
import { getSafeApiErrorMessage } from '@/lib/api/errors'

describe('getSafeApiErrorMessage', () => {
  it('replaces credential errors without echoing provider details', () => {
    const message = getSafeApiErrorMessage(
      new Error('401 unauthorized for api key sk-sensitive-value'),
      'Request failed.',
    )

    expect(message).toBe('Provider rejected the configured credentials. Please verify your API key.')
    expect(message).not.toContain('sk-sensitive-value')
  })

  it('uses the controlled fallback for unknown provider payloads', () => {
    const message = getSafeApiErrorMessage(
      new Error('SDK payload contained private prompt content'),
      'Document generation failed. Please retry.',
    )

    expect(message).toBe('Document generation failed. Please retry.')
    expect(message).not.toContain('private prompt content')
  })

  it('preserves an approved pending-clarification instruction', () => {
    expect(
      getSafeApiErrorMessage(
        new Error('Answer pending clarification questions before generating a new round.'),
        'Request failed.',
      ),
    ).toBe('Answer pending clarification questions before generating a new round.')
  })

  it('maps network failures to an actionable safe message', () => {
    expect(getSafeApiErrorMessage(new Error('fetch failed: ENOTFOUND provider.test'), 'Request failed.')).toBe(
      'Network error while contacting the provider. Check connectivity and retry.',
    )
  })

  it('surfaces safe backlog grounding and missing-reference errors', () => {
    const grounding = 'Generated backlog failed project-grounding checks: BK-001 references unplanned document path "ROADMAP.md".'
    const missing = 'Required PRD reference is not ready for the current context. Generate or repair it, then retry backlog generation.'

    expect(getSafeApiErrorMessage(new Error(grounding), 'Backlog generation failed. Please retry.')).toBe(grounding)
    expect(getSafeApiErrorMessage(new Error(missing), 'Backlog generation failed. Please retry.')).toBe(missing)
  })

  it('surfaces safe backlog reference limit errors', () => {
    const message = 'Backlog reference section labels exceed the 12000-character limit; shorten the source document and retry.'

    expect(getSafeApiErrorMessage(new Error(message), 'Backlog generation failed. Please retry.')).toBe(message)
  })

  it('maps export secret alerts without exposing credential values', () => {
    const message = getSafeApiErrorMessage(
      new Error('SECURITY ALERT: Potential API key leakage detected in ARCHITECTURE.md'),
      'Export failed.',
    )

    expect(message).toContain('Export blocked for security')
    expect(message).toContain('ARCHITECTURE.md')
    expect(message).not.toContain('key value')
  })
})
