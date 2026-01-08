// Chat API Route with streaming, tool calling, and rate limiting
// Uses Vercel AI SDK v4 for multi-provider LLM support
// Includes jailbreak-resistant system prompt and Upstash rate limiting

import { streamText, convertToCoreMessages, type Message } from "ai"
import { getLanguageModel, getModelInfo } from "@/lib/ai-provider"
import { chatTools } from "@/lib/tools"
import { SYSTEM_PROMPT, RATE_LIMIT_MESSAGE, ERROR_MESSAGE } from "@/lib/system-prompt"
import {
  checkRateLimit,
  getIdentifier,
  getRateLimitHeaders,
} from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    // Get user identifier for rate limiting
    const identifier = getIdentifier(req)

    // Check rate limits
    const rateLimitResult = await checkRateLimit(identifier)

    if (!rateLimitResult.success) {
      console.log(`Rate limit exceeded for ${identifier}:`, rateLimitResult.limitType)

      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: RATE_LIMIT_MESSAGE,
          limitType: rateLimitResult.limitType,
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimitResult),
            "Retry-After": Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    const { messages }: { messages: Message[] } = await req.json()

    // Get the configured language model
    const model = getLanguageModel()
    const modelInfo = getModelInfo()

    console.log(
      `Chat request from ${identifier} using ${modelInfo.provider}/${modelInfo.model}`
    )

    // Stream the response with tool calling
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: convertToCoreMessages(messages),
      tools: chatTools,
      maxSteps: 5, // Allow up to 5 tool calls per response
      temperature: 0.7,
      onFinish: ({ usage, finishReason }) => {
        console.log("Chat completed:", { finishReason, usage })
      },
    })

    // Return streaming response with rate limit headers
    const response = result.toDataStreamResponse()

    // Add rate limit headers to the streaming response
    const headers = new Headers(response.headers)
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      headers.set(key, value)
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (error) {
    console.error("Chat API error:", error)

    // Return error response
    return new Response(
      JSON.stringify({
        error: "An error occurred processing your request",
        message: ERROR_MESSAGE,
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

// Health check endpoint
export async function GET() {
  const modelInfo = getModelInfo()
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "STEM Center Chat API",
      provider: modelInfo.provider,
      model: modelInfo.model,
      features: {
        streaming: true,
        toolCalling: true,
        rateLimiting: !!(
          process.env.UPSTASH_REDIS_REST_URL &&
          process.env.UPSTASH_REDIS_REST_TOKEN
        ),
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  )
}
