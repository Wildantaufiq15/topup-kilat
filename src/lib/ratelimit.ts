/**
 * Rate Limiting Utility using Upstash Redis
 *
 * Setup:
 * 1. Create free account at https://upstash.com
 * 2. Create a Redis database
 * 3. Copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * 4. Add to Vercel Environment Variables
 *
 * Docs: https://upstash.com/docs/ratelimit/nextjs
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Check if Upstash Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

// Create Redis instance only if configured
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

/**
 * Rate limiter for authentication endpoints (login, register)
 * 5 requests per minute per IP
 */
export const authRateLimiter = isRedisConfigured && redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'rl_auth',
    })
  : null

/**
 * Rate limiter for payment endpoints
 * 10 requests per minute per IP
 */
export const paymentRateLimiter = isRedisConfigured && redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'rl_payment',
    })
  : null

/**
 * Rate limiter for general API endpoints
 * 60 requests per minute per IP
 */
export const apiRateLimiter = isRedisConfigured && redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'rl_api',
    })
  : null

/**
 * Rate limiter for callback/webhook endpoints
 * Higher limit since webhooks call frequently
 * 30 requests per minute per IP
 */
export const callbackRateLimiter = isRedisConfigured && redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: 'rl_callback',
    })
  : null

/**
 * Check rate limit and return response if exceeded
 * Returns null if within limit, or NextResponse if exceeded
 */
export async function checkRateLimit(
  ratelimit: Ratelimit | null,
  identifier: string,
  requestId?: string
): Promise<{ success: boolean; remaining: number; limit: number } | null> {
  // If rate limiter not configured, allow all requests
  if (!ratelimit) {
    console.log(`[${requestId || 'rl'}] Rate limiting not configured, allowing request`)
    return { success: true, remaining: -1, limit: -1 }
  }

  const { success, remaining, limit, reset } = await ratelimit.limit(identifier)

  return { success, remaining, limit }
}

/**
 * Get client IP from request
 * Works with Vercel, standard headers, and proxies
 */
export function getClientIP(request: Request): string {
  // Vercel
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  if (vercelIP) {
    return vercelIP.split(',')[0].trim()
  }

  // Standard headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Other proxies
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Fallback
  return '127.0.0.1'
}

// Export isRedisConfigured for checking in routes
export { isRedisConfigured }
