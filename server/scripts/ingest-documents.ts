#!/usr/bin/env tsx
/**
 * Document Ingestion Script
 *
 * Usage:
 *   npm run ingest              # Ingest all documents in /documents folder
 *   npm run ingest -- --file path/to/file.pdf   # Ingest specific file
 *   npm run ingest -- --clear   # Clear all documents before ingesting
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

import { parseDocument, getSupportedFiles, getFileType } from '../src/utils/parsers.js'
import { chunkDocument } from '../src/utils/chunker.js'
import { generateBatchEmbeddings, getEmbeddingDimension } from '../src/services/embeddings.js'
import { getSupabase, insertDocumentChunks, deleteDocumentChunksBySource } from '../src/services/supabase.js'
import { checkOllamaHealth } from '../src/services/ollama.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOCUMENTS_DIR = path.join(__dirname, '../documents')

async function clearAllDocuments(): Promise<void> {
  console.log('Clearing all documents from database...')
  const supabase = getSupabase()

  const { error } = await supabase
    .from('document_chunks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (error) {
    throw new Error(`Failed to clear documents: ${error.message}`)
  }

  console.log('All documents cleared.')
}

async function ingestFile(filePath: string): Promise<{ chunks: number; characters: number }> {
  const filename = path.basename(filePath)
  const fileType = getFileType(filename)

  if (fileType === 'unknown') {
    throw new Error(`Unsupported file type: ${path.extname(filename)}`)
  }

  console.log(`\nProcessing: ${filename}`)

  // Parse document
  const content = await parseDocument(filePath)
  console.log(`  - Parsed: ${content.length} characters`)

  if (content.trim().length === 0) {
    console.log(`  - Skipping: Empty content`)
    return { chunks: 0, characters: 0 }
  }

  // Chunk document
  const chunks = chunkDocument(content)
  console.log(`  - Chunked: ${chunks.length} chunks`)

  // Generate embeddings
  const embeddings = await generateBatchEmbeddings(chunks)
  console.log(`  - Embedded: ${embeddings.length} embeddings`)

  // Delete existing chunks for this file
  await deleteDocumentChunksBySource(filename)

  // Insert into database
  const records = chunks.map((chunk, i) => ({
    content: chunk,
    embedding: embeddings[i],
    source_file: filename,
    source_type: fileType,
    chunk_index: i,
    metadata: {
      originalPath: filePath,
      originalSize: content.length,
      totalChunks: chunks.length,
      ingestedAt: new Date().toISOString(),
    },
  }))

  await insertDocumentChunks(records)
  console.log(`  - Stored in database`)

  return { chunks: chunks.length, characters: content.length }
}

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║     STEM Center Document Ingestion         ║')
  console.log('╚════════════════════════════════════════════╝')

  // Parse command line arguments
  const args = process.argv.slice(2)
  const clearFlag = args.includes('--clear')
  const fileIndex = args.indexOf('--file')
  const specificFile = fileIndex !== -1 ? args[fileIndex + 1] : null

  // Check prerequisites
  console.log('\nChecking prerequisites...')

  // Check Ollama
  const ollamaStatus = await checkOllamaHealth()
  if (!ollamaStatus.available) {
    console.error('Error: Ollama is not available.')
    console.error('Make sure Ollama is running: ollama serve')
    process.exit(1)
  }
  console.log(`  - Ollama: OK (${ollamaStatus.models.length} models available)`)

  // Check embedding model
  const embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text'
  if (!ollamaStatus.models.some(m => m.includes(embeddingModel.split(':')[0]))) {
    console.log(`  - Embedding model ${embeddingModel} not found, pulling...`)
    // Note: You may need to pull the model manually first
    console.error(`Error: Embedding model ${embeddingModel} not available.`)
    console.error(`Run: ollama pull ${embeddingModel}`)
    process.exit(1)
  }
  console.log(`  - Embedding model: ${embeddingModel}`)

  // Check embedding dimension
  try {
    const dim = await getEmbeddingDimension()
    console.log(`  - Embedding dimension: ${dim}`)
  } catch (error) {
    console.error('Error: Failed to get embedding dimension')
    console.error(error)
    process.exit(1)
  }

  // Check Supabase
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('document_chunks').select('id').limit(1)
    if (error) throw error
    console.log('  - Supabase: OK')
  } catch (error) {
    console.error('Error: Supabase connection failed')
    console.error(error)
    process.exit(1)
  }

  // Clear if requested
  if (clearFlag) {
    await clearAllDocuments()
  }

  // Get files to process
  let filesToProcess: string[] = []

  if (specificFile) {
    // Process specific file
    const fullPath = path.isAbsolute(specificFile)
      ? specificFile
      : path.join(process.cwd(), specificFile)

    if (!fs.existsSync(fullPath)) {
      console.error(`Error: File not found: ${fullPath}`)
      process.exit(1)
    }

    filesToProcess = [fullPath]
  } else {
    // Process all files in documents directory
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      fs.mkdirSync(DOCUMENTS_DIR, { recursive: true })
      console.log(`\nCreated documents directory: ${DOCUMENTS_DIR}`)
      console.log('Add PDF, Markdown, or text files to this directory and run again.')
      process.exit(0)
    }

    filesToProcess = await getSupportedFiles(DOCUMENTS_DIR)

    if (filesToProcess.length === 0) {
      console.log(`\nNo supported files found in ${DOCUMENTS_DIR}`)
      console.log('Supported formats: .pdf, .md, .markdown, .txt')
      process.exit(0)
    }
  }

  console.log(`\nFound ${filesToProcess.length} file(s) to process`)

  // Process files
  let totalChunks = 0
  let totalCharacters = 0
  let successCount = 0
  let errorCount = 0

  for (const filePath of filesToProcess) {
    try {
      const result = await ingestFile(filePath)
      totalChunks += result.chunks
      totalCharacters += result.characters
      successCount++
    } catch (error) {
      console.error(`  - Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      errorCount++
    }
  }

  // Summary
  console.log('\n════════════════════════════════════════════')
  console.log('Ingestion Complete')
  console.log('════════════════════════════════════════════')
  console.log(`Files processed: ${successCount}/${filesToProcess.length}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Total chunks: ${totalChunks}`)
  console.log(`Total characters: ${totalCharacters.toLocaleString()}`)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
