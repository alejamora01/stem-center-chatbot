// Chat API Route with streaming, tool calling, and rate limiting
// Supports both self-hosted Ollama backend and cloud providers (OpenAI/Anthropic)

import { streamText, convertToCoreMessages, type Message } from "ai"
import { SignJWT } from "jose"
import { getLanguageModel, getModelInfo } from "@/lib/ai-provider"
import { chatTools } from "@/lib/tools"
import { SYSTEM_PROMPT, RATE_LIMIT_MESSAGE, ERROR_MESSAGE } from "@/lib/system-prompt"
import {
  checkRateLimit,
  getIdentifier,
  getRateLimitHeaders,
} from "@/lib/rate-limit"

// Configuration
const BACKEND_URL = process.env.BACKEND_URL
const BACKEND_JWT_SECRET = process.env.BACKEND_JWT_SECRET
const USE_BACKEND = process.env.AI_PROVIDER === "backend"

// Create JWT token for backend authentication
async function createBackendToken(identifier: string): Promise<string> {
  if (!BACKEND_JWT_SECRET) {
    throw new Error("BACKEND_JWT_SECRET is not configured")
  }

  const secret = new TextEncoder().encode(BACKEND_JWT_SECRET)

  return new SignJWT({ sub: identifier })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("stem-center-vercel")
    .setAudience("stem-center-backend")
    .setExpirationTime("5m")
    .setJti(crypto.randomUUID())
    .sign(secret)
}

// Proxy request to self-hosted backend
async function proxyToBackend(
  messages: Message[],
  identifier: string
): Promise<Response> {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL is not configured")
  }

  const token = await createBackendToken(identifier)

  const response = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Backend error: ${response.status} - ${error}`)
  }

  return response
}

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

    // Use self-hosted backend if configured
    if (USE_BACKEND && BACKEND_URL) {
      console.log(`Chat request from ${identifier} using self-hosted backend`)

      try {
        const backendResponse = await proxyToBackend(messages, identifier)

        // Transform backend SSE to Vercel AI SDK format
        const transformedStream = new TransformStream({
          transform(chunk, controller) {
            const text = new TextDecoder().decode(chunk)
            const lines = text.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") {
                  controller.enqueue(new TextEncoder().encode("0:\n"))
                } else {
                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.content) {
                      // Format as Vercel AI SDK text stream
                      controller.enqueue(
                        new TextEncoder().encode(`0:${JSON.stringify(parsed.content)}\n`)
                      )
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
          },
        })

        const stream = backendResponse.body?.pipeThrough(transformedStream)

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            ...getRateLimitHeaders(rateLimitResult),
          },
        })
      } catch (backendError) {
        console.error("Backend proxy error:", backendError)
        // Fall through to cloud provider if backend fails
        console.log("Falling back to cloud provider...")
      }
    }

    // Use cloud provider (OpenAI/Anthropic)
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
  const usingBackend = USE_BACKEND && BACKEND_URL

  // Check backend health if configured
  let backendStatus = null
  if (usingBackend) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      })
      backendStatus = response.ok ? "ok" : "error"
    } catch {
      backendStatus = "unreachable"
    }
  }

  return new Response(
    JSON.stringify({
      status: "ok",
      service: "STEM Center Chat API",
      mode: usingBackend ? "self-hosted" : "cloud",
      provider: usingBackend ? "ollama" : modelInfo.provider,
      model: usingBackend ? process.env.OLLAMA_MODEL || "llama3.1:8b" : modelInfo.model,
      backendUrl: usingBackend ? BACKEND_URL : null,
      backendStatus,
      features: {
        streaming: true,
        toolCalling: !usingBackend, // Tools handled by backend when using self-hosted
        rateLimiting: !!(
          process.env.UPSTASH_REDIS_REST_URL &&
          process.env.UPSTASH_REDIS_REST_TOKEN
        ),
        rag: usingBackend, // RAG only available with self-hosted backend
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  )
}
