import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, Plus, MoreVertical, Mic, Globe, Cpu } from 'lucide-react'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'AI Assistants | VoxAgent' }

export default async function AssistantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) redirect('/login')

  const { data: assistants } = await supabase
    .from('assistants')
    .select('*, calls(id, status)')
    .eq('agency_id', userData.agency_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Assistants</h1>
          <p className="text-muted-foreground mt-1">Manage your voice AI agents</p>
        </div>
        <Link
          href="/dashboard/assistants/new"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create Assistant
        </Link>
      </div>

      {!assistants || assistants.length === 0 ? (
        <Card className="glass-card mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No assistants yet</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first AI voice assistant to start handling inbound or outbound calls.
            </p>
            <Link
              href="/dashboard/assistants/new"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Create Assistant
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {assistants.map((assistant: any) => {
            const completedCalls = assistant.calls?.filter((c: any) => c.status === 'completed').length || 0
            
            return (
              <Card key={assistant.id} className="glass-card hover:border-primary/40 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{assistant.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${assistant.is_active ? 'bg-green-400' : 'bg-muted'}`} />
                        {assistant.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {assistant.description || 'No description provided.'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs bg-accent/30 rounded-md px-2 py-1.5 border border-border">
                      <Mic className="w-3.5 h-3.5 text-blue-400" />
                      <span className="capitalize">{assistant.voice_id || 'nova'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-accent/30 rounded-md px-2 py-1.5 border border-border">
                      <Globe className="w-3.5 h-3.5 text-green-400" />
                      <span className="uppercase">{assistant.language || 'en'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Calls</span>
                      <span className="text-sm font-semibold">{completedCalls}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">Created</span>
                      <span className="text-xs font-medium text-foreground">
                        {new Date(assistant.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
