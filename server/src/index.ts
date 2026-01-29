import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { config, validateConfig } from './config/env.js'
import { corsMiddleware } from './middleware/cors.js'
import { authMiddleware } from './middleware/auth.js'
import health from './routes/health.js'
import chat from './routes/chat.js'
import ingest from './routes/ingest.js'

// Validate configuration on startup
validateConfig()

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', corsMiddleware)

// Public routes (no auth required)
app.route('/api', health)

// Protected routes (require JWT)
app.use('/api/chat', authMiddleware)
app.use('/api/ingest', authMiddleware)
app.use('/api/ingest/*', authMiddleware)

app.route('/api', chat)
app.route('/api', ingest)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'STEM Center Backend',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      ping: '/api/ping',
      chat: '/api/chat (POST, auth required)',
      ingest: '/api/ingest (POST, auth required)',
      ingestText: '/api/ingest/text (POST, auth required)',
    },
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  }, 500)
})

// Start server
console.log(`
╔════════════════════════════════════════════╗
║     STEM Center Backend Server             ║
╠════════════════════════════════════════════╣
║  Port: ${config.port.toString().padEnd(36)}║
║  Environment: ${config.nodeEnv.padEnd(29)}║
║  Ollama: ${config.ollamaHost.padEnd(34)}║
║  Model: ${config.ollamaModel.padEnd(35)}║
╚════════════════════════════════════════════╝
`)

serve({
  fetch: app.fetch,
  port: config.port,
})

console.log(`Server running at http://localhost:${config.port}`)
