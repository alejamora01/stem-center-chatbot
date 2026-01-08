import { cors } from 'hono/cors'
import { config } from '../config/env.js'

export const corsMiddleware = cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return '*'

    // Check if origin is in allowed list
    if (config.allowedOrigins.includes(origin)) {
      return origin
    }

    // In development, allow localhost
    if (config.nodeEnv === 'development' && origin.includes('localhost')) {
      return origin
    }

    // Block other origins
    return null
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 86400, // 24 hours
})
