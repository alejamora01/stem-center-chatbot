const rateMap = new Map<string, { count: number; resetTime: number }>()

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10 // 10 requests per minute per IP

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateMap) {
    if (now > value.resetTime) {
      rateMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function rateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateMap.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  entry.count++
  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count }
}
