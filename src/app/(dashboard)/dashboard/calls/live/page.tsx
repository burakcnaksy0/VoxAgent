'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Phone, Radio, User, Clock, ArrowRight } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

export default function LiveCallsPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [activeCalls, setActiveCalls] = useState<any[]>([])
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let agencyId: string | null = null

    const fetchActiveCalls = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
      if (!userData?.agency_id) return
      agencyId = userData.agency_id

      const { data: calls } = await supabase
        .from('calls')
        .select('*, assistants(name)')
        .eq('agency_id', agencyId)
        .in('status', ['in-progress', 'ringing', 'initiated'])
        .order('created_at', { ascending: false })

      if (calls) setActiveCalls(calls)
      setLoading(false)
    }

    fetchActiveCalls()

    // Realtime subscriptions
    const callSubscription = supabase
      .channel('live-calls')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calls' 
      }, async (payload) => {
        // Refresh active calls when a call status changes
        // A more optimized way would be to just update the local state, but this ensures we have all relational data
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
        if (!userData) return
        
        const { data: calls } = await supabase
          .from('calls')
          .select('*, assistants(name)')
          .eq('agency_id', userData.agency_id)
          .in('status', ['in-progress', 'ringing', 'initiated'])
          .order('created_at', { ascending: false })
          
        setActiveCalls(calls || [])
      })
      .subscribe()

    const eventSubscription = supabase
      .channel('live-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_events'
      }, (payload) => {
        const newEvent = payload.new
        if (newEvent.event_type === 'transcript') {
          setTranscripts((prev) => {
            const callTranscripts = prev[newEvent.call_id] || []
            return {
              ...prev,
              [newEvent.call_id]: [...callTranscripts, newEvent.payload]
            }
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(callSubscription)
      supabase.removeChannel(eventSubscription)
    }
  }, [supabase])

  const selectedCall = activeCalls.find(c => c.id === selectedCallId)
  const currentTranscripts = selectedCallId ? transcripts[selectedCallId] || [] : []

  return (
    <div className="space-y-6 fade-in h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          Live Calls
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 pulse-red flex gap-2">
            <Radio className="w-3 h-3" />
            LIVE
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1">Monitor your AI agents in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Active Calls List */}
        <Card className="glass-card flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>Active Sessions ({activeCalls.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : activeCalls.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <Radio className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No active calls right now</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeCalls.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => setSelectedCallId(call.id)}
                    className={`w-full text-left p-4 hover:bg-accent/50 transition-colors flex items-center justify-between group ${
                      selectedCallId === call.id ? 'bg-accent/80 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {call.callee_number || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {call.assistants?.name} · {call.direction}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="info" className="text-[10px]">
                        {call.status}
                      </Badge>
                      <ArrowRight className={`w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ${selectedCallId === call.id ? 'opacity-100 text-primary' : ''}`} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Transcript View */}
        <Card className="lg:col-span-2 glass-card flex flex-col overflow-hidden relative">
          {!selectedCall ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <Bot className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Select a call to view live transcript</p>
            </div>
          ) : (
            <>
              <CardHeader className="border-b border-border bg-accent/20">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      {selectedCall.callee_number || 'Unknown Number'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Agent: {selectedCall.assistants?.name}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="pulse-red border-red-500/30 text-red-400">
                    Recording & Transcribing
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {currentTranscripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <p>Listening for speech...</p>
                  </div>
                ) : (
                  currentTranscripts.map((t, idx) => {
                    const isAgent = t.role === 'assistant'
                    return (
                      <div key={idx} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {isAgent ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-blue-400" />}
                          <span className="text-xs text-muted-foreground font-medium">
                            {isAgent ? 'AI Agent' : 'Customer'}
                          </span>
                        </div>
                        <div className={`p-3 rounded-lg max-w-[80%] ${
                          isAgent 
                            ? 'bg-accent text-foreground rounded-tl-none' 
                            : 'bg-primary text-primary-foreground rounded-tr-none'
                        }`}>
                          <p className="text-sm leading-relaxed">{t.transcript || t.text}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
