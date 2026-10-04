import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || (process.env.NODE_ENV !== 'production' ? 'bantuincoding-dev-encryption-key-fallback' : undefined)
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET is required to access provider credentials in production.')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64url')
}

export function decryptSecret(payload: string): string {
  const packed = Buffer.from(payload, 'base64url')
  if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted credential payload.')
  }
  const iv = packed.subarray(0, IV_LENGTH)
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}
