import { getOllama } from './ollama.js'
import { config } from '../config/env.js'

// Generate embedding for a single text
export async function generateEmbedding(text: string): Promise<number[]> {
  const ollama = getOllama()

  const response = await ollama.embeddings({
    model: config.embeddingModel,
    prompt: text,
  })

  return response.embedding
}

// Generate embeddings for multiple texts (batched for efficiency)
export async function generateBatchEmbeddings(
  texts: string[],
  batchSize: number = 10
): Promise<number[][]> {
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    )
    embeddings.push(...batchEmbeddings)

    // Log progress for large batches
    if (texts.length > batchSize) {
      console.log(`Embedded ${Math.min(i + batchSize, texts.length)}/${texts.length} chunks`)
    }
  }

  return embeddings
}

// Get the dimension of the embedding model
export async function getEmbeddingDimension(): Promise<number> {
  const testEmbedding = await generateEmbedding('test')
  return testEmbedding.length
}
