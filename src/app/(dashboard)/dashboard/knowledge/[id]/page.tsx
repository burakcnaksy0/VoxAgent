'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, FileText, Loader2, HardDrive, Trash2 } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'

export default function KnowledgeBaseDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [kb, setKb] = useState<any>(null)
  const [chunks, setChunks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchKBAndChunks = async () => {
    const supabase = createClient()
    try {
      const { data: kbData, error: kbErr } = await supabase
        .from('knowledge_bases')
        .select('*')
        .eq('id', id)
        .single()

      if (kbErr) throw kbErr
      setKb(kbData)

      const { data: chunksData, error: chunksErr } = await supabase
        .from('knowledge_chunks')
        .select('*')
        .eq('knowledge_base_id', id)
        .order('created_at', { ascending: false })

      if (chunksErr) throw chunksErr
      setChunks(chunksData || [])
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load knowledge base: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKBAndChunks()
  }, [id])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Allowed types: txt, csv, pdf
    const validTypes = ['text/plain', 'text/csv', 'application/pdf']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
      toast.error('Only TXT, CSV, and PDF files are supported.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('knowledgeBaseId', id)

    try {
      const res = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file')
      }

      toast.success(`Successfully uploaded! ${data.message}`)
      
      // Refresh chunks list immediately
      await fetchKBAndChunks()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteChunk = async () => {
    if (!selectedChunkId) return
    setIsDeleting(true)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('knowledge_chunks')
        .delete()
        .eq('id', selectedChunkId)

      if (error) throw error

      toast.success('Chunk deleted successfully')
      setChunks(prev => prev.filter(c => c.id !== selectedChunkId))
      setIsDeleteOpen(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to delete chunk: ' + err.message)
    } finally {
      setIsDeleting(false)
      setSelectedChunkId(null)
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/knowledge"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 w-10 text-sm hover:bg-accent hover:text-accent-foreground text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            {kb?.name || 'Manage Documents'}
          </h1>
          <p className="text-muted-foreground mt-1">Upload files to populate the knowledge base.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Card className="glass-card border-dashed border-2 border-border/60">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 text-blue-400">
                <Upload className="w-8 h-8" />
              </div>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>Support for PDF, TXT, and CSV.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".txt,.csv,.pdf,text/plain,text/csv,application/pdf"
                onChange={handleFileChange}
              />
              <Button 
                variant="gradient" 
                className="w-full h-12" 
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing & Embedding...
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4 mr-2" />
                    Select File
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                The file will be read, chunked, and converted to vector embeddings using Hugging Face AI.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data / Chunks Section */}
        <div className="lg:col-span-2">
          <Card className="glass-card h-full min-h-[300px]">
            <CardHeader>
              <CardTitle>Stored Knowledge Chunks ({chunks.length})</CardTitle>
              <CardDescription>
                These chunks are generated from your uploaded files and are searchable by your AI agents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chunks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No chunks available yet.</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Upload a file to start generating data.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {chunks.map((chunk: any, index: number) => (
                    <div key={chunk.id} className="p-4 rounded-lg bg-accent/20 border border-border/50 text-sm space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold">Chunk #{chunks.length - index}</span>
                        <div className="flex items-center gap-2">
                          <span>{chunk.metadata?.source_filename || 'Unknown source'}</span>
                          <button
                            onClick={() => {
                              setSelectedChunkId(chunk.id);
                              setIsDeleteOpen(true);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
                            title="Delete Chunk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-foreground leading-relaxed text-xs whitespace-pre-wrap">{chunk.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedChunkId(null);
        }}
        onConfirm={handleDeleteChunk}
        title="Delete Knowledge Chunk"
        description="Are you sure you want to delete this chunk? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  )
}
