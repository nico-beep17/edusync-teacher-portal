// In-memory rate limiter — module-scoped Map shared across all API routes

type Bucket = { count: number; resetTime: number }

const buckets = new Map<string, Bucket>()

/** Check if a request from `ip` to `route` is within the rate limit.
 *  Returns `true` if allowed, `false` if rate-limited.
 *  Default: max 10 requests per 60s window per IP+route. */
export function checkRateLimit(ip: string, route: string, maxReqs = 10, windowMs = 60_000): boolean {
  const key = `${ip}:${route}`
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetTime) {
    // No record or window expired — start fresh
    buckets.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (bucket.count >= maxReqs) {
    return false // rate limited
  }

  bucket.count++
  return true
}

/** Periodic cleanup of expired entries (call from a route handler whenever convenient). */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetTime) buckets.delete(key)
  }
}
