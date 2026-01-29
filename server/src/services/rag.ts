import { getSupabase } from './supabase.js'
import { generateEmbedding } from './embeddings.js'
import { RAG_CONTEXT_TEMPLATE } from '../config/prompts.js'

export interface RetrievedContext {
  content: string
  source: string
  similarity: number
}

// Retrieve relevant context for a query
export async function retrieveContext(
  query: string,
  topK: number = 5,
  threshold: number = 0.5
): Promise<RetrievedContext[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)

    // Search Supabase for similar documents
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: topK,
    })

    if (error) {
      console.error('Error searching documents:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((row: { content: string; source_file: string; similarity: number }) => ({
      content: row.content,
      source: row.source_file,
      similarity: row.similarity,
    }))
  } catch (error) {
    console.error('Error in retrieveContext:', error)
    return []
  }
}

// Format retrieved context for inclusion in prompt
export function formatContext(contexts: RetrievedContext[]): string {
  if (contexts.length === 0) {
    return ''
  }

  const formattedChunks = contexts
    .map((ctx, i) => {
      const sourceLabel = ctx.source ? `[Source: ${ctx.source}]` : `[Chunk ${i + 1}]`
      return `${sourceLabel}\n${ctx.content}`
    })
    .join('\n\n---\n\n')

  return RAG_CONTEXT_TEMPLATE.replace('{context}', formattedChunks)
}

// Build the augmented prompt with RAG context
export function buildAugmentedPrompt(
  systemPrompt: string,
  contexts: RetrievedContext[],
  _userQuery: string
): string {
  const contextSection = formatContext(contexts)

  if (contextSection) {
    return systemPrompt + '\n' + contextSection
  }

  return systemPrompt
}

// Check if RAG is available (Supabase configured and has documents)
export async function checkRAGHealth(): Promise<{
  available: boolean
  documentCount: number
  error?: string
}> {
  try {
    const supabase = getSupabase()

    const { count, error } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return {
        available: false,
        documentCount: 0,
        error: error.message,
      }
    }

    return {
      available: true,
      documentCount: count || 0,
    }
  } catch (error) {
    return {
      available: false,
      documentCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
