import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Lee la API Key del archivo .env.local
})

export async function generateText({
  system,
  prompt,
}: {
  system: string
  prompt: string
}): Promise<{ text: string }> {
  const chat = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  })

  return { text: chat.choices[0].message.content || "" }
}
