import { Hono } from 'hono'
import { z } from 'zod'
import { parseDocumentBuffer, getFileType } from '../utils/parsers.js'
import { chunkDocument } from '../utils/chunker.js'
import { generateBatchEmbeddings } from '../services/embeddings.js'
import { insertDocumentChunks, deleteDocumentChunksBySource } from '../services/supabase.js'

const ingest = new Hono()

// Ingest a document via file upload
ingest.post('/ingest', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400)
    }

    const fileType = getFileType(file.name)
    if (fileType === 'unknown') {
      return c.json({
        error: 'Unsupported file type',
        supported: ['pdf', 'md', 'markdown', 'txt'],
      }, 400)
    }

    console.log(`Ingesting file: ${file.name} (${fileType})`)

    // Parse document
    const buffer = Buffer.from(await file.arrayBuffer())
    const content = await parseDocumentBuffer(buffer, file.name)
    console.log(`  - Parsed: ${content.length} characters`)

    // Chunk document
    const chunks = chunkDocument(content)
    console.log(`  - Chunked: ${chunks.length} chunks`)

    // Generate embeddings
    const embeddings = await generateBatchEmbeddings(chunks)
    console.log(`  - Embedded: ${embeddings.length} embeddings`)

    // Delete existing chunks for this file (for re-ingestion)
    await deleteDocumentChunksBySource(file.name)

    // Insert into database
    const records = chunks.map((chunk, i) => ({
      content: chunk,
      embedding: embeddings[i],
      source_file: file.name,
      source_type: fileType,
      chunk_index: i,
      metadata: {
        originalSize: content.length,
        totalChunks: chunks.length,
      },
    }))

    await insertDocumentChunks(records)
    console.log(`  - Stored in database`)

    return c.json({
      success: true,
      file: file.name,
      type: fileType,
      chunks: chunks.length,
      characters: content.length,
    })
  } catch (error) {
    console.error('Ingest error:', error)
    return c.json({
      error: 'Failed to ingest document',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

// Ingest text directly
const ingestTextSchema = z.object({
  content: z.string().min(1),
  source: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
})

ingest.post('/ingest/text', async (c) => {
  try {
    const body = await c.req.json()
    const parsed = ingestTextSchema.safeParse(body)

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.issues }, 400)
    }

    const { content, source, metadata } = parsed.data

    console.log(`Ingesting text: ${source}`)

    // Chunk content
    const chunks = chunkDocument(content)
    console.log(`  - Chunked: ${chunks.length} chunks`)

    // Generate embeddings
    const embeddings = await generateBatchEmbeddings(chunks)
    console.log(`  - Embedded: ${embeddings.length} embeddings`)

    // Delete existing chunks for this source
    await deleteDocumentChunksBySource(source)

    // Insert into database
    const records = chunks.map((chunk, i) => ({
      content: chunk,
      embedding: embeddings[i],
      source_file: source,
      source_type: 'text',
      chunk_index: i,
      metadata: {
        ...metadata,
        originalSize: content.length,
        totalChunks: chunks.length,
      },
    }))

    await insertDocumentChunks(records)

    return c.json({
      success: true,
      source,
      chunks: chunks.length,
      characters: content.length,
    })
  } catch (error) {
    console.error('Ingest text error:', error)
    return c.json({
      error: 'Failed to ingest text',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})

export default ingest
