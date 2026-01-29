export interface ChunkOptions {
  maxChars: number      // Max characters per chunk (approx 512 tokens = ~2000 chars)
  overlapChars: number  // Overlap between chunks
  separators: string[]  // Separators to split on (in order of preference)
}

const DEFAULT_OPTIONS: ChunkOptions = {
  maxChars: 2000,
  overlapChars: 200,
  separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '],
}

// Split text into chunks while preserving semantic boundaries
export function chunkDocument(
  text: string,
  options: Partial<ChunkOptions> = {}
): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const chunks: string[] = []

  // Clean the text
  let cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (cleanedText.length <= opts.maxChars) {
    return [cleanedText]
  }

  // Split recursively using separators
  const splitRecursively = (text: string, separatorIndex: number): string[] => {
    if (text.length <= opts.maxChars) {
      return [text]
    }

    if (separatorIndex >= opts.separators.length) {
      // No more separators, force split at maxChars
      const results: string[] = []
      for (let i = 0; i < text.length; i += opts.maxChars - opts.overlapChars) {
        results.push(text.slice(i, i + opts.maxChars))
      }
      return results
    }

    const separator = opts.separators[separatorIndex]
    const parts = text.split(separator)

    if (parts.length === 1) {
      // Separator not found, try next
      return splitRecursively(text, separatorIndex + 1)
    }

    const results: string[] = []
    let currentChunk = ''

    for (const part of parts) {
      const potentialChunk = currentChunk
        ? currentChunk + separator + part
        : part

      if (potentialChunk.length <= opts.maxChars) {
        currentChunk = potentialChunk
      } else {
        if (currentChunk) {
          results.push(currentChunk)
        }

        if (part.length > opts.maxChars) {
          // Part is too big, split it further
          const subParts = splitRecursively(part, separatorIndex + 1)
          results.push(...subParts.slice(0, -1))
          currentChunk = subParts[subParts.length - 1] || ''
        } else {
          currentChunk = part
        }
      }
    }

    if (currentChunk) {
      results.push(currentChunk)
    }

    return results
  }

  const rawChunks = splitRecursively(cleanedText, 0)

  // Add overlap between chunks
  for (let i = 0; i < rawChunks.length; i++) {
    let chunk = rawChunks[i].trim()

    // Add overlap from previous chunk
    if (i > 0 && opts.overlapChars > 0) {
      const prevChunk = rawChunks[i - 1]
      const overlapStart = Math.max(0, prevChunk.length - opts.overlapChars)
      const overlap = prevChunk.slice(overlapStart).trim()
      if (overlap && !chunk.startsWith(overlap)) {
        chunk = overlap + ' ' + chunk
      }
    }

    if (chunk) {
      chunks.push(chunk)
    }
  }

  return chunks
}

// Estimate token count (rough approximation)
export function estimateTokens(text: string): number {
  // Average English word is ~4-5 chars, average token is ~4 chars
  return Math.ceil(text.length / 4)
}
