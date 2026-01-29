// Rate Limiting with Upstash Redis
// Implements sliding window rate limiting for chat API

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Check if Upstash is configured
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

// Create Redis client only if configured
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Standard rate limiter: 20 requests per minute
export const standardRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "stem-chatbot:standard",
    })
  : null

// Burst rate limiter: 5 requests per 10 seconds (prevents rapid fire)
export const burstRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "stem-chatbot:burst",
    })
  : null

// Daily rate limiter: 200 requests per 24 hours (prevents abuse)
export const dailyRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "24 h"),
      analytics: true,
      prefix: "stem-chatbot:daily",
    })
  : null

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
  limitType?: "burst" | "standard" | "daily"
}

/**
 * Check all rate limits for an identifier
 * Returns the most restrictive limit that was hit
 */
export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  // If Upstash is not configured, allow all requests
  if (!isUpstashConfigured || !burstRateLimiter || !standardRateLimiter || !dailyRateLimiter) {
    console.log("Rate limiting disabled: Upstash not configured")
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: 0,
    }
  }

  try {
    // Check burst limit first (most restrictive short-term)
    const burstResult = await burstRateLimiter.limit(identifier)
    if (!burstResult.success) {
      return {
        success: false,
        limit: burstResult.limit,
        remaining: burstResult.remaining,
        reset: burstResult.reset,
        limitType: "burst",
      }
    }

    // Check standard rate limit
    const standardResult = await standardRateLimiter.limit(identifier)
    if (!standardResult.success) {
      return {
        success: false,
        limit: standardResult.limit,
        remaining: standardResult.remaining,
        reset: standardResult.reset,
        limitType: "standard",
      }
    }

    // Check daily limit
    const dailyResult = await dailyRateLimiter.limit(identifier)
    if (!dailyResult.success) {
      return {
        success: false,
        limit: dailyResult.limit,
        remaining: dailyResult.remaining,
        reset: dailyResult.reset,
        limitType: "daily",
      }
    }

    // All limits passed - return the most restrictive remaining
    const minRemaining = Math.min(
      burstResult.remaining,
      standardResult.remaining,
      dailyResult.remaining
    )

    return {
      success: true,
      limit: standardResult.limit,
      remaining: minRemaining,
      reset: standardResult.reset,
    }
  } catch (error) {
    console.error("Rate limit check failed:", error)
    // On error, allow the request but log it
    return {
      success: true,
      limit: 20,
      remaining: 20,
      reset: 0,
    }
  }
}

/**
 * Get a user identifier from request headers
 * Uses IP address or falls back to a default for local development
 */
export function getIdentifier(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  // Use the first available IP
  const ip = forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp

  if (ip) {
    return ip
  }

  // Fallback for local development
  return "local-dev"
}

/**
 * Format rate limit info for response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  }
}
