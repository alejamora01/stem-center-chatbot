#!/usr/bin/env tsx
/**
 * Test Ollama Connection
 *
 * Usage: npm run test-ollama
 */

import 'dotenv/config'
import { checkOllamaHealth, chat, pullModel } from '../src/services/ollama.js'
import { generateEmbedding, getEmbeddingDimension } from '../src/services/embeddings.js'
import { config } from '../src/config/env.js'

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║     Ollama Connection Test                 ║')
  console.log('╚════════════════════════════════════════════╝')

  console.log(`\nOllama Host: ${config.ollamaHost}`)
  console.log(`Chat Model: ${config.ollamaModel}`)
  console.log(`Embedding Model: ${config.embeddingModel}`)

  // Check Ollama availability
  console.log('\n1. Checking Ollama availability...')
  const health = await checkOllamaHealth()

  if (!health.available) {
    console.error('   ❌ Ollama is not available')
    console.error(`   Error: ${health.error}`)
    console.log('\n   Make sure Ollama is running:')
    console.log('   $ ollama serve')
    process.exit(1)
  }

  console.log('   ✓ Ollama is available')
  console.log(`   Available models: ${health.models.join(', ') || 'none'}`)

  // Check if chat model is available
  console.log(`\n2. Checking chat model (${config.ollamaModel})...`)
  const chatModelName = config.ollamaModel.split(':')[0]
  const hasChatModel = health.models.some(m => m.includes(chatModelName))

  if (!hasChatModel) {
    console.log(`   ⚠ Chat model not found, pulling ${config.ollamaModel}...`)
    try {
      await pullModel(config.ollamaModel)
      console.log('   ✓ Model pulled successfully')
    } catch (error) {
      console.error(`   ❌ Failed to pull model: ${error}`)
      process.exit(1)
    }
  } else {
    console.log('   ✓ Chat model available')
  }

  // Check if embedding model is available
  console.log(`\n3. Checking embedding model (${config.embeddingModel})...`)
  const embeddingModelName = config.embeddingModel.split(':')[0]
  const hasEmbeddingModel = health.models.some(m => m.includes(embeddingModelName))

  if (!hasEmbeddingModel) {
    console.log(`   ⚠ Embedding model not found, pulling ${config.embeddingModel}...`)
    try {
      await pullModel(config.embeddingModel)
      console.log('   ✓ Model pulled successfully')
    } catch (error) {
      console.error(`   ❌ Failed to pull model: ${error}`)
      process.exit(1)
    }
  } else {
    console.log('   ✓ Embedding model available')
  }

  // Test chat completion
  console.log('\n4. Testing chat completion...')
  try {
    const response = await chat([
      { role: 'user', content: 'Say "Hello, STEM Center!" in exactly those words.' }
    ], { maxTokens: 50 })
    console.log(`   ✓ Response: ${response.trim()}`)
  } catch (error) {
    console.error(`   ❌ Chat failed: ${error}`)
    process.exit(1)
  }

  // Test embeddings
  console.log('\n5. Testing embedding generation...')
  try {
    const embedding = await generateEmbedding('Test embedding for STEM Center')
    console.log(`   ✓ Generated embedding with ${embedding.length} dimensions`)

    const dimension = await getEmbeddingDimension()
    console.log(`   ✓ Embedding dimension: ${dimension}`)
  } catch (error) {
    console.error(`   ❌ Embedding failed: ${error}`)
    process.exit(1)
  }

  console.log('\n════════════════════════════════════════════')
  console.log('All tests passed! Ollama is ready.')
  console.log('════════════════════════════════════════════')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
