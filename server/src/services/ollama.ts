import { Ollama } from 'ollama'
import { config } from '../config/env.js'

let ollamaClient: Ollama | null = null

export function getOllama(): Ollama {
  if (!ollamaClient) {
    ollamaClient = new Ollama({ host: config.ollamaHost })
  }
  return ollamaClient
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: string
  stream?: boolean
  temperature?: number
  maxTokens?: number
}

// Non-streaming chat completion
export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const ollama = getOllama()

  const response = await ollama.chat({
    model: options.model || config.ollamaModel,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    options: {
      temperature: options.temperature ?? 0.7,
      num_predict: options.maxTokens ?? 2048,
    },
  })

  return response.message.content
}

// Streaming chat completion - returns an async generator
export async function* streamChat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const ollama = getOllama()

  const response = await ollama.chat({
    model: options.model || config.ollamaModel,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: true,
    options: {
      temperature: options.temperature ?? 0.7,
      num_predict: options.maxTokens ?? 2048,
    },
  })

  for await (const chunk of response) {
    if (chunk.message?.content) {
      yield chunk.message.content
    }
  }
}

// Check if Ollama is available and model is loaded
export async function checkOllamaHealth(): Promise<{
  available: boolean
  models: string[]
  error?: string
}> {
  try {
    const ollama = getOllama()
    const response = await ollama.list()
    const models = response.models.map(m => m.name)

    return {
      available: true,
      models,
    }
  } catch (error) {
    return {
      available: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Pull a model if not available
export async function pullModel(model: string): Promise<void> {
  const ollama = getOllama()
  console.log(`Pulling model: ${model}...`)

  const response = await ollama.pull({ model, stream: true })

  for await (const progress of response) {
    if (progress.status) {
      console.log(`  ${progress.status}${progress.completed ? ` ${progress.completed}/${progress.total}` : ''}`)
    }
  }

  console.log(`Model ${model} pulled successfully`)
}
