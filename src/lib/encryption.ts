import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256-bit
const IV_LENGTH = 12  // 96-bit for GCM
const TAG_LENGTH = 16 // 128-bit auth tag

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) throw new Error('ENCRYPTION_SECRET environment variable is required')
  // Derive a fixed 32-byte key from the secret
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns a base64 string: iv:tag:ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

/**
 * Decrypt a ciphertext string produced by encrypt()
 */
export function decrypt(ciphertext: string): string {
  const key = getKey()
  const [ivB64, tagB64, encryptedB64] = ciphertext.split(':')

  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error('Invalid ciphertext format')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8')
}

/**
 * Mask an API key for display (show only last 4 chars)
 */
export function maskApiKey(key: string): string {
  if (key.length <= 4) return '****'
  return '•'.repeat(Math.min(key.length - 4, 20)) + key.slice(-4)
}
