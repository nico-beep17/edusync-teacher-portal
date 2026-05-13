import { randomBytes } from 'crypto'

// Server-side token store: token → timestamp (ms)
const tokenStore = new Map<string, number>()

// Cleanup expired tokens (older than 1 hour)
function cleanupExpired(): void {
  const now = Date.now()
  for (const [token, ts] of tokenStore) {
    if (now - ts > 3_600_000) tokenStore.delete(token)
  }
}

/** Generate a new CSRF token (32 hex chars) and store server-side. */
export function generateToken(): string {
  cleanupExpired()
  const token = randomBytes(16).toString('hex')
  tokenStore.set(token, Date.now())
  return token
}

/** Validate a CSRF token against the server-side store. */
export function validateToken(token: string): boolean {
  cleanupExpired()
  return tokenStore.has(token)
}
