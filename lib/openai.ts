import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: "ollama", // Ollama doesn't need a real key but the SDK requires one
})

const model = process.env.OLLAMA_MODEL || "llama3"

export async function generateText({
  system,
  prompt,
}: {
  system: string
  prompt: string
}) {
  const chatCompletion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  })

  return {
    text: chatCompletion.choices[0].message.content ?? "",
  }
}
