import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromFile, chunkText, generateEmbeddings } from '@/lib/embeddings'

// This route must run in Node.js runtime for pdf-parse to work
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!userData?.agency_id) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const knowledgeBaseId = formData.get('knowledgeBaseId') as string | null

    if (!file || !knowledgeBaseId) {
      return NextResponse.json({ error: 'Missing file or knowledgeBaseId' }, { status: 400 })
    }

    // Verify the knowledge base belongs to the agency
    const { data: kbCheck, error: kbError } = await supabase
      .from('knowledge_bases')
      .select('id')
      .eq('id', knowledgeBaseId)
      .eq('agency_id', userData.agency_id)
      .single()

    if (kbError || !kbCheck) {
      return NextResponse.json({ error: 'Knowledge base not found or unauthorized' }, { status: 404 })
    }

    // 1. Extract Text
    const extractedText = await extractTextFromFile(file)
    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'Could not extract any text from the file' }, { status: 400 })
    }

    // 2. Chunk Text
    const chunks = chunkText(extractedText, 1000)

    // 3. Generate Embeddings (in batches if there are many to avoid HF rate limits)
    // For MVP, we'll process sequentially to be safe with free tiers.
    const BATCH_SIZE = 5
    const allEmbeddings: number[][] = []
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE)
      const batchEmbeddings = await generateEmbeddings(batchChunks)
      allEmbeddings.push(...batchEmbeddings)
      // Optional slight delay to respect free rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 4. Save to Supabase pgvector
    const insertData = chunks.map((chunk, index) => ({
      knowledge_base_id: knowledgeBaseId,
      content: chunk,
      embedding: allEmbeddings[index],
      metadata: { 
        source_filename: file.name,
        chunk_index: index,
        total_chunks: chunks.length
      }
    }))

    const { error: insertError } = await supabase
      .from('knowledge_chunks')
      .insert(insertData)

    if (insertError) {
      console.error('Supabase Insert Error:', insertError)
      throw new Error('Failed to insert knowledge chunks to database')
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${chunks.length} chunks from ${file.name}` 
    })

  } catch (error: any) {
    console.error('Knowledge Upload Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
