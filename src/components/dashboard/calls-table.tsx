'use client'

import { useState } from 'react'
import { Phone, PhoneOutgoing, PhoneIncoming, Search, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDuration } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'

interface Call {
  id: string
  direction: 'inbound' | 'outbound'
  caller_number: string
  callee_number: string
  duration_seconds: number
  status: string
  created_at: string
  assistants?: {
    name: string
  } | null
  sub_clients?: {
    name: string
  } | null
}

interface CallsTableProps {
  initialCalls: Call[]
}

export function CallsTable({ initialCalls }: CallsTableProps) {
  const [calls, setCalls] = useState<Call[]>(initialCalls)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  // Custom confirmation modal states
  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)

  // Filter logic
  const filteredCalls = calls.filter((call) => {
    const phone = (call.direction === 'inbound' ? call.caller_number : call.callee_number) || ''
    const clientName = call.sub_clients?.name || ''
    const assistantName = call.assistants?.name || ''
    const status = call.status || ''
    const query = searchQuery.toLowerCase()

    return (
      phone.toLowerCase().includes(query) ||
      clientName.toLowerCase().includes(query) ||
      assistantName.toLowerCase().includes(query) ||
      status.toLowerCase().includes(query)
    )
  })

  // Delete a single call
  async function handleDeleteCall() {
    if (!selectedCallId || deletingId) return

    setDeletingId(selectedCallId)
    try {
      const response = await fetch(`/api/calls/${selectedCallId}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete call record')
      }

      setCalls((prev) => prev.filter((c) => c.id !== selectedCallId))
      toast.success('Call record deleted successfully')
      setIsSingleDeleteOpen(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Something went wrong')
    } finally {
      setDeletingId(null)
      setSelectedCallId(null)
    }
  }

  // Clear all call history
  async function handleClearAll() {
    if (clearing || calls.length === 0) return

    setClearing(true)
    try {
      const response = await fetch('/api/calls', {
        method: 'DELETE',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear call history')
      }

      setCalls([])
      toast.success('Call history cleared successfully')
      setIsClearAllOpen(false)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Something went wrong')
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <Card className="glass-card mt-8">
        <CardHeader className="border-b border-border/50 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg">All Calls</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-9 h-9 bg-black/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {calls.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-9 bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-900/30 font-medium active:scale-95"
                onClick={() => setIsClearAllOpen(true)}
                disabled={clearing}
              >
                {clearing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear History'
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No calls found</h2>
              <p className="text-muted-foreground max-w-sm mb-6">
                {searchQuery
                  ? "No call records matched your search query."
                  : "You haven't processed any calls yet. Trigger an outbound call to test your assistant."}
              </p>
              {!searchQuery && (
                <Link
                  href="/dashboard/calls/new"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 px-4 py-2 text-sm border border-white/10 bg-white/5 hover:bg-white/10 text-white shadow-sm active:scale-[0.98]"
                >
                  Test Outbound Call
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Direction</th>
                    <th className="px-6 py-4 font-medium">Client / Number</th>
                    <th className="px-6 py-4 font-medium">Assistant</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Duration</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCalls.map((call) => (
                    <tr key={call.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {call.direction === 'inbound' ? (
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                              <PhoneIncoming className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                              <PhoneOutgoing className="w-4 h-4" />
                            </div>
                          )}
                          <span className="capitalize font-medium text-foreground">
                            {call.direction}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">
                            {call.sub_clients?.name || 'Unknown Client'}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {call.direction === 'inbound' ? call.caller_number : call.callee_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-medium">
                        {call.assistants?.name || 'Deleted Assistant'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            call.status === 'completed' ? 'success' :
                            call.status === 'in-progress' ? 'info' :
                            call.status === 'no-answer' ? 'warning' :
                            'destructive'
                          }
                        >
                          {call.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDuration(call.duration_seconds || 0)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(call.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          onClick={() => {
                            setSelectedCallId(call.id)
                            setIsSingleDeleteOpen(true)
                          }}
                          disabled={deletingId === call.id}
                        >
                          {deletingId === call.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row-level delete confirm modal */}
      <ConfirmDeleteModal
        isOpen={isSingleDeleteOpen}
        onClose={() => {
          setIsSingleDeleteOpen(false)
          setSelectedCallId(null)
        }}
        onConfirm={handleDeleteCall}
        title="Delete Call Record"
        description="Are you sure you want to delete this call record? This action cannot be undone."
        isDeleting={deletingId !== null}
      />

      {/* Clear all call history confirm modal */}
      <ConfirmDeleteModal
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        onConfirm={handleClearAll}
        title="Clear Call History"
        description="Are you sure you want to clear ALL call history? This action cannot be undone."
        isDeleting={clearing}
      />
    </>
  )
}
