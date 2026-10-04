import { describe, expect, it } from 'vitest'
import { decryptSecret, encryptSecret, maskSecret } from './encryption'

describe('Secret Encryption Utility', () => {
  it('encrypts and decrypts secret correctly', () => {
    const original = 'sk-or-v1-my-secret-test-key-123456789'
    const encrypted = encryptSecret(original)
    expect(encrypted).not.toEqual(original)
    expect(typeof encrypted).toBe('string')

    const decrypted = decryptSecret(encrypted)
    expect(decrypted).toBe(original)
  })

  it('masks secret safely', () => {
    expect(maskSecret('sk-1234567890abcdef')).toBe('sk-1••••cdef')
    expect(maskSecret('short')).toBe('••••••••')
  })
})
