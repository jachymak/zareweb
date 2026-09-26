import { createHash, randomBytes } from 'node:crypto'

// Renewal links carry a random token; only its hash is stored
// (`waitlist.renewalTokenHash`), so a leaked database doesn't leak working links.

export function newRenewalToken() {
  return randomBytes(32).toString('base64url')
}

export function hashRenewalToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function isWellFormedToken(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)
}
