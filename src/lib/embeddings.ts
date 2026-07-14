import { HfInference } from '@huggingface/inference'
import Papa from 'papaparse'

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)
const MODEL = 'sentence-transformers/all-MiniLM-L6-v2' // 384 dimensions

/**
 * Split text into semantic chunks of roughly ~1000 characters
 * This is a basic chunker. For production, consider LangChain's RecursiveCharacterTextSplitter.
 */
export function chunkText(text: string, maxChunkSize = 1000): string[] {
  const paragraphs = text.split(/\n\s*\n/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
      currentChunk = paragraph
    } else {
      currentChunk += '\n\n' + paragraph
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim())
  
  return chunks
}

/**
 * Generate an embedding vector for a given text using HuggingFace Inference API
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model: MODEL,
      inputs: text,
    })
    
    // The response is usually an array of numbers or nested array depending on the model
    // sentence-transformers returns a 1D array of 384 floats when given a single string.
    if (Array.isArray(response) && typeof response[0] === 'number') {
      return response as number[]
    }
    
    if (Array.isArray(response) && Array.isArray(response[0])) {
      return response[0] as number[]
    }

    throw new Error('Unexpected embedding format received from HuggingFace')
  } catch (error) {
    console.error('Embedding generation failed:', error)
    throw error
  }
}

/**
 * Generate embeddings for an array of texts in parallel
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // To avoid rate limits, you might want to batch this, but HF Inference can handle arrays
  // However, featureExtraction signature might expect single strings for some models.
  // We'll map it to avoid type issues.
  const promises = texts.map(text => generateEmbedding(text))
  return Promise.all(promises)
}

/**
 * Extract text from a File object depending on its MIME type
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const type = file.type
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (type === 'application/pdf') {
    // Require dynamically to prevent Next.js build from failing on DOMMatrix/canvas checks
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return data.text
  }

  if (type === 'text/csv' || file.name.endsWith('.csv')) {
    const text = buffer.toString('utf-8')
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        complete: (results) => {
          // Convert CSV rows to a readable text format for RAG
          const formattedText = results.data
            .map((row: any) => Object.entries(row)
              .map(([key, val]) => `${key}: ${val}`)
              .join(', ')
            ).join('\n\n')
          resolve(formattedText)
        },
        error: (err: any) => reject(err)
      })
    })
  }

  // Fallback for .txt or other raw text types
  return buffer.toString('utf-8')
}
