import { Hono } from 'hono'
import { checkOllamaHealth } from '../services/ollama.js'
import { checkRAGHealth } from '../services/rag.js'
import { config } from '../config/env.js'

const health = new Hono()

health.get('/health', async (c) => {
  const [ollamaStatus, ragStatus] = await Promise.all([
    checkOllamaHealth(),
    checkRAGHealth(),
  ])

  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      ollama: {
        status: ollamaStatus.available ? 'ok' : 'error',
        host: config.ollamaHost,
        model: config.ollamaModel,
        embeddingModel: config.embeddingModel,
        availableModels: ollamaStatus.models,
        error: ollamaStatus.error,
      },
      rag: {
        status: ragStatus.available ? 'ok' : 'error',
        documentCount: ragStatus.documentCount,
        error: ragStatus.error,
      },
      supabase: {
        status: ragStatus.available ? 'ok' : 'error',
        configured: !!(config.supabaseUrl && config.supabaseServiceKey),
      },
    },
  }

  // Overall status is error if any critical service is down
  const allOk = ollamaStatus.available && ragStatus.available
  status.status = allOk ? 'ok' : 'degraded'

  return c.json(status, allOk ? 200 : 503)
})

// Simple ping endpoint
health.get('/ping', (c) => {
  return c.text('pong')
})

export default health
