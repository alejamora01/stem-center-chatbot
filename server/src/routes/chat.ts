import { Hono } from 'hono'
import { streamText } from 'hono/streaming'
import { z } from 'zod'
import { streamChat, ChatMessage } from '../services/ollama.js'
import { retrieveContext, buildAugmentedPrompt } from '../services/rag.js'
import { getTutorAvailability, searchTutorsBySubject } from '../services/supabase.js'
import { SYSTEM_PROMPT } from '../config/prompts.js'

const chat = new Hono()

// Request schema
const chatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  stream: z.boolean().optional().default(true),
})

// Helper to detect if query is about tutor availability
function isAvailabilityQuery(query: string): boolean {
  const keywords = ['available', 'availability', 'schedule', 'open', 'slot', 'when', 'today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const lowerQuery = query.toLowerCase()
  return keywords.some(kw => lowerQuery.includes(kw))
}

// Helper to detect if query is about finding tutors
function isTutorSearchQuery(query: string): boolean {
  const keywords = ['tutor', 'help with', 'who can', 'teaches', 'expert in', 'calculus', 'physics', 'chemistry', 'programming', 'math', 'statistics']
  const lowerQuery = query.toLowerCase()
  return keywords.some(kw => lowerQuery.includes(kw))
}

// Extract subject from query
function extractSubject(query: string): string | null {
  const subjects = ['calculus', 'algebra', 'physics', 'chemistry', 'biology', 'programming', 'python', 'java', 'statistics', 'math', 'computer science']
  const lowerQuery = query.toLowerCase()

  for (const subject of subjects) {
    if (lowerQuery.includes(subject)) {
      return subject
    }
  }
  return null
}

chat.post('/chat', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = chatRequestSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400)
    }

    const { messages, stream } = parsed.data

    // Get the last user message for context retrieval
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    const userQuery = lastUserMessage?.content || ''

    // Build context from various sources
    let additionalContext = ''

    // 1. Check for tutor availability queries
    if (isAvailabilityQuery(userQuery)) {
      try {
        const today = new Date()
        const availability = await getTutorAvailability(today)
        if (availability.length > 0) {
          additionalContext += '\n\n## TODAY\'S TUTOR AVAILABILITY\n'
          for (const slot of availability) {
            additionalContext += `- ${slot.tutor_name} (${slot.subjects.join(', ')}): ${slot.start_time} - ${slot.end_time} at ${slot.location}\n`
          }
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
      }
    }

    // 2. Check for tutor search queries
    if (isTutorSearchQuery(userQuery)) {
      const subject = extractSubject(userQuery)
      if (subject) {
        try {
          const tutors = await searchTutorsBySubject(subject)
          if (tutors.length > 0) {
            additionalContext += `\n\n## TUTORS FOR ${subject.toUpperCase()}\n`
            for (const tutor of tutors) {
              additionalContext += `- ${tutor.name}: ${tutor.subjects.join(', ')}${tutor.bio ? ` - ${tutor.bio}` : ''}\n`
            }
          }
        } catch (error) {
          console.error('Error searching tutors:', error)
        }
      }
    }

    // 3. Retrieve RAG context from document embeddings
    let ragContext: Awaited<ReturnType<typeof retrieveContext>> = []
    try {
      ragContext = await retrieveContext(userQuery, 3, 0.5)
    } catch (error) {
      console.error('Error retrieving RAG context:', error)
    }

    // Build augmented system prompt
    let augmentedPrompt = buildAugmentedPrompt(SYSTEM_PROMPT, ragContext, userQuery)

    // Add additional context if any
    if (additionalContext) {
      augmentedPrompt += additionalContext
    }

    // Prepare messages for Ollama
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: augmentedPrompt },
      ...messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    if (stream) {
      // Streaming response
      return streamText(c, async (stream) => {
        try {
          for await (const chunk of streamChat(chatMessages)) {
            // Format as Vercel AI SDK compatible SSE
            const data = JSON.stringify({ content: chunk })
            await stream.write(`data: ${data}\n\n`)
          }
          await stream.write('data: [DONE]\n\n')
        } catch (error) {
          console.error('Streaming error:', error)
          const errorData = JSON.stringify({ error: 'Stream interrupted' })
          await stream.write(`data: ${errorData}\n\n`)
        }
      }, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Non-streaming response
      let fullResponse = ''
      for await (const chunk of streamChat(chatMessages)) {
        fullResponse += chunk
      }

      return c.json({
        role: 'assistant',
        content: fullResponse,
      })
    }
  } catch (error) {
    console.error('Chat error:', error)
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

export default chat
