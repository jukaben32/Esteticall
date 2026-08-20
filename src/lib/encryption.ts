import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// AES-256-GCM helpers for encrypting third-party API secrets (Hostaway
// client secret, etc.) before they touch Postgres. Channel-manager
// credentials control real, live Airbnb/Booking/VRBO accounts belonging to
// third-party property owners, not just this business — a database leak
// must not hand those over in plaintext.
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const raw = process.env.CHANNEL_CREDENTIALS_ENCRYPTION_KEY
  if (!raw) throw new Error('CHANNEL_CREDENTIALS_ENCRYPTION_KEY is not configured')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error('CHANNEL_CREDENTIALS_ENCRYPTION_KEY must decode to exactly 32 bytes (base64)')
  }
  return key
}

export function encryptSecret(plainText: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptSecret(encoded: string): string {
  const key = getKey()
  const raw = Buffer.from(encoded, 'base64')
  const iv = raw.subarray(0, IV_LENGTH)
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}
