import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateText({
  system,
  prompt,
}: {
  system: string
  prompt: string
}) {
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
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
