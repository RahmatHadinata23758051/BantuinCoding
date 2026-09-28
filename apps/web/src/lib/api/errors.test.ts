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
})
