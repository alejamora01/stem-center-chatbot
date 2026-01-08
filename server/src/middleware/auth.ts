import { Context, Next } from 'hono'
import { jwtVerify, JWTPayload } from 'jose'
import { config } from '../config/env.js'

export interface AuthPayload extends JWTPayload {
  sub?: string
  metadata?: {
    rateLimitRemaining?: number
  }
}

// JWT Authentication middleware
export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  // Skip auth in development if no secret is set
  if (config.nodeEnv === 'development' && !config.jwtSecret) {
    console.warn('Warning: JWT auth disabled in development mode')
    await next()
    return
  }

  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      { error: 'Missing or invalid authorization header' },
      401
    )
  }

  const token = authHeader.slice(7) // Remove 'Bearer ' prefix

  try {
    const secret = new TextEncoder().encode(config.jwtSecret)

    const { payload } = await jwtVerify(token, secret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    })

    // Store payload in context for use in routes
    c.set('authPayload', payload as AuthPayload)

    await next()
  } catch (error) {
    console.error('JWT verification failed:', error)

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return c.json({ error: 'Token expired' }, 401)
      }
      if (error.message.includes('signature')) {
        return c.json({ error: 'Invalid token signature' }, 401)
      }
    }

    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}

// Optional auth - doesn't fail if no token, but validates if present
export async function optionalAuthMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without auth
    await next()
    return
  }

  // Token provided, validate it
  return authMiddleware(c, next)
}
