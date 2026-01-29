import 'dotenv/config'

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtIssuer: 'stem-center-vercel',
  jwtAudience: 'stem-center-backend',

  // Ollama
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',

  // CORS
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),

  // Rate limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
}

// Validate required config
export function validateConfig(): void {
  const required = ['jwtSecret', 'supabaseUrl', 'supabaseServiceKey'] as const
  const missing = required.filter(key => !config[key])

  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`)
    console.warn('Some features may not work properly.')
  }
}
