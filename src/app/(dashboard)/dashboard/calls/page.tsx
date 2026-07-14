import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOutgoing, PhoneIncoming, Search, Filter } from 'lucide-react'
import type { Metadata } from 'next'
import { formatDuration } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export const metadata: Metadata = { title: 'Call History | VoxAgent' }

export default async function CallsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) redirect('/login')

  const { data: calls } = await supabase
    .from('calls')
    .select('*, assistants(name), sub_clients(name)')
    .eq('agency_id', userData.agency_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Call History</h1>
          <p className="text-muted-foreground mt-1">Review inbound and outbound AI voice calls</p>
        </div>
        <Link
          href="/dashboard/calls/new"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 active:scale-[0.98]"
        >
          <PhoneOutgoing className="w-4 h-4 mr-2" />
          Make Outbound Call
        </Link>
      </div>

      <Card className="glass-card mt-8">
        <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">All Calls</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search phone numbers..." className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!calls || calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No calls yet</h2>
              <p className="text-muted-foreground max-w-sm mb-6">
                You haven't processed any calls yet. Trigger an outbound call to test your assistant.
              </p>
              <Link
                href="/dashboard/calls/new"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 px-4 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm active:scale-[0.98]"
              >
                Test Outbound Call
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-accent/20 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Direction</th>
                    <th className="px-6 py-4 font-medium">Client / Number</th>
                    <th className="px-6 py-4 font-medium">Assistant</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Duration</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {calls.map((call: any) => (
                    <tr key={call.id} className="hover:bg-accent/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {call.direction === 'inbound' ? (
                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                              <PhoneIncoming className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
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
                          <span className="font-medium text-foreground">
                            {call.sub_clients?.name || 'Unknown Client'}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {call.direction === 'inbound' ? call.caller_number : call.callee_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground font-medium">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
