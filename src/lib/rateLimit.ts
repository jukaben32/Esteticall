// Best-effort in-memory rate limiter. One bucket per warm serverless
// instance — not perfectly precise across many instances/regions, but it's
// a real deterrent against a single script hammering an endpoint, with zero
// added infrastructure (no Redis/Upstash/KV, no new env vars).
//
// For endpoints where abuse has real cost (e.g. minting OpenAI Realtime
// sessions), pair this with a check against something already persisted in
// Postgres — that check is authoritative across instances, this one just
// stops the fastest, cheapest attacks before they touch the database.

type Hits = number[] // timestamps (ms) of recent requests for one key

const buckets = new Map<string, Hits>()

// Prevents unbounded growth if this instance sees many unique keys (e.g.
// thousands of distinct IPs) over its lifetime.
const MAX_TRACKED_KEYS = 5000

export function isRateLimited(key: string, opts: { windowMs: number; max: number }): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < opts.windowMs)
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > MAX_TRACKED_KEYS) buckets.clear()
  return hits.length > opts.max
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
