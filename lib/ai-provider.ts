// Multi-provider LLM support using Vercel AI SDK v4
// Supports OpenAI and Anthropic, configurable via environment variables

import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import type { LanguageModel } from "ai"

// Provider type definition
export type AIProvider = "openai" | "anthropic"

// Model configuration
const MODEL_CONFIG = {
  openai: {
    default: "gpt-4o-mini",
    advanced: "gpt-4o",
  },
  anthropic: {
    default: "claude-3-5-haiku-20241022",
    advanced: "claude-3-5-sonnet-20241022",
  },
}

/**
 * Get the configured AI provider from environment
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase() as AIProvider
  if (provider === "anthropic" || provider === "openai") {
    return provider
  }
  return "openai" // Default to OpenAI
}

/**
 * Get the language model instance based on configuration
 * @param useAdvanced - Use the advanced model (GPT-4o or Claude Sonnet)
 */
export function getLanguageModel(useAdvanced = false): LanguageModel {
  const provider = getAIProvider()

  if (provider === "anthropic") {
    const model = useAdvanced
      ? MODEL_CONFIG.anthropic.advanced
      : MODEL_CONFIG.anthropic.default
    return anthropic(model)
  }

  // Default to OpenAI
  const model = useAdvanced
    ? MODEL_CONFIG.openai.advanced
    : MODEL_CONFIG.openai.default
  return openai(model)
}

/**
 * Get model info for logging/debugging
 */
export function getModelInfo(useAdvanced = false): {
  provider: AIProvider
  model: string
} {
  const provider = getAIProvider()
  const config = MODEL_CONFIG[provider]
  const model = useAdvanced ? config.advanced : config.default
  return { provider, model }
}
