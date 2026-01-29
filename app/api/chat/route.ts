import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stemCenterInfo } from "@/lib/stem-center-data"
import { generateText } from "@/lib/openai"
import { rateLimit } from "@/lib/rate-limit"

const MAX_MESSAGE_LENGTH = 500

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const headersList = await headers()
    const ip =
      headersList.get("cf-connecting-ip") ||
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"

    const { allowed, remaining } = rateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      )
    }

    // Validate request body
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const userMessage = body.messages[body.messages.length - 1]?.content
    if (typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    // Truncate overly long messages
    const trimmedMessage = userMessage.slice(0, MAX_MESSAGE_LENGTH)

    const { text } = await generateText({
      system: `You are a virtual assistant for the STEM Center. Use this information to answer questions:
Location: ${stemCenterInfo.location}
Hours: ${stemCenterInfo.hours}
Services: ${JSON.stringify(stemCenterInfo.services)}
Tutors: ${JSON.stringify(stemCenterInfo.tutors)}
Events: ${JSON.stringify(stemCenterInfo.events)}

If you don't have specific information about something, suggest that the user visit the STEM Center or contact the staff.
Be friendly, concise, and helpful. Keep responses under 200 words.`,
      prompt: trimmedMessage,
    })

    return NextResponse.json(
      { response: text },
      {
        headers: { "X-RateLimit-Remaining": String(remaining) },
      }
    )
  } catch (error) {
    console.error("Error in chat route:", error)
    return NextResponse.json({ error: "Error processing request" }, { status: 500 })
  }
}
