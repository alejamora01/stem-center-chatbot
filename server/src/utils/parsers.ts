import fs from 'fs/promises'
import path from 'path'
import pdfParse from 'pdf-parse'
import { marked } from 'marked'

export type SupportedFileType = 'pdf' | 'markdown' | 'txt' | 'unknown'

export function getFileType(filename: string): SupportedFileType {
  const ext = path.extname(filename).toLowerCase()

  switch (ext) {
    case '.pdf':
      return 'pdf'
    case '.md':
    case '.markdown':
      return 'markdown'
    case '.txt':
    case '.text':
      return 'txt'
    default:
      return 'unknown'
  }
}

// Parse PDF file to text
async function parsePDF(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath)
  const data = await pdfParse(buffer)
  return data.text
}

// Parse Markdown file to plain text
async function parseMarkdown(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8')

  // Convert markdown to HTML then strip tags for plain text
  const html = await marked(content)

  // Simple HTML tag stripper
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

// Parse plain text file
async function parseText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8')
}

// Main parser function
export async function parseDocument(filePath: string): Promise<string> {
  const fileType = getFileType(filePath)

  switch (fileType) {
    case 'pdf':
      return parsePDF(filePath)
    case 'markdown':
      return parseMarkdown(filePath)
    case 'txt':
      return parseText(filePath)
    default:
      throw new Error(`Unsupported file type: ${path.extname(filePath)}`)
  }
}

// Parse from buffer (for API uploads)
export async function parseDocumentBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const fileType = getFileType(filename)

  switch (fileType) {
    case 'pdf': {
      const data = await pdfParse(buffer)
      return data.text
    }
    case 'markdown': {
      const content = buffer.toString('utf-8')
      const html = await marked(content)
      return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }
    case 'txt':
      return buffer.toString('utf-8')
    default:
      throw new Error(`Unsupported file type: ${path.extname(filename)}`)
  }
}

// Get all supported files in a directory
export async function getSupportedFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  const files = entries
    .filter(entry => entry.isFile())
    .filter(entry => getFileType(entry.name) !== 'unknown')
    .map(entry => path.join(dirPath, entry.name))

  return files
}
