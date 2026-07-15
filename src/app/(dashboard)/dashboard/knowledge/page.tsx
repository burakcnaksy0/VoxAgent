import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Book, Plus, FileText, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Knowledge Base | VoxAgent' }

export default async function KnowledgeBasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) redirect('/login')

  const { data: knowledgeBases } = await supabase
    .from('knowledge_bases')
    .select('*, knowledge_chunks(id)')
    .eq('agency_id', userData.agency_id)
    .order('created_at', { ascending: false })

  async function createKnowledgeBase(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name) return

    const supabaseServer = await createClient()
    const { data: uData } = await supabaseServer.from('users').select('agency_id').eq('id', user!.id).single()
    
    if (uData?.agency_id) {
      await supabaseServer.from('knowledge_bases').insert({
        name,
        description,
        agency_id: uData.agency_id
      })
      revalidatePath('/dashboard/knowledge')
    }
  }

  async function deleteKnowledgeBase(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    if (!id) return

    const supabaseServer = await createClient()
    // Delete chunks first (foreign key constraints)
    await supabaseServer.from('knowledge_chunks').delete().eq('knowledge_base_id', id)
    // Delete knowledge base
    await supabaseServer.from('knowledge_bases').delete().eq('id', id)

    revalidatePath('/dashboard/knowledge')
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Knowledge Bases</h1>
          <p className="text-muted-foreground mt-1">Provide custom data for your AI agents to learn from</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>New Knowledge Base</CardTitle>
              <CardDescription>Create a new repository for your documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createKnowledgeBase} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" placeholder="e.g. Real Estate FAQ" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Brief details about this DB" />
                </div>
                <Button type="submit" variant="gradient" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Knowledge Base
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          {!knowledgeBases || knowledgeBases.length === 0 ? (
            <Card className="glass-card h-full flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Book className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Knowledge Bases</h2>
                <p className="text-muted-foreground max-w-sm">
                  Create your first knowledge base to upload PDFs, TXT, or CSVs.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledgeBases.map((kb: any) => (
                <Card key={kb.id} className="glass-card hover:border-primary/40 transition-all group">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="truncate pr-2">{kb.name}</span>
                      <div className="flex items-center gap-1.5">
                        <form action={deleteKnowledgeBase} className="inline">
                          <input type="hidden" name="id" value={kb.id} />
                          <button 
                            type="submit"
                            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded hover:bg-destructive/10"
                            title="Delete Knowledge Base"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                        <Book className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {kb.description || 'No description provided.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/30 rounded-md px-2 py-1">
                        <FileText className="w-3.5 h-3.5" />
                        {kb.knowledge_chunks?.length || 0} Chunks
                      </div>
                      <Link 
                        href={`/dashboard/knowledge/${kb.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Manage Files &rarr;
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
