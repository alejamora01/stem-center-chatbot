import { NextResponse } from "next/server"
import { stemCenterInfo } from "@/lib/stem-center-data"
import { generateText } from "@/lib/openai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const userMessage = messages[messages.length - 1].content

    const { text } = await generateText({
      system: `You are a virtual assistant for the STEM Center. Use this information to answer questions:
Location: ${stemCenterInfo.location}
Hours: ${stemCenterInfo.hours}
Services: ${JSON.stringify(stemCenterInfo.services)}
Tutors: ${JSON.stringify(stemCenterInfo.tutors)}
Events: ${JSON.stringify(stemCenterInfo.events)}

If you don't have specific information about something, suggest that the user visit the STEM Center or contact the staff.
Be friendly, concise, and helpful.`,
      prompt: userMessage,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in chat route:", error)
    return NextResponse.json({ error: "Error processing request" }, { status: 500 })
  }
}