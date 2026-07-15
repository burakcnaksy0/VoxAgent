import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Phone, Clock, AlertCircle, CheckCircle2, Megaphone } from 'lucide-react'
import { LaunchButton } from './launch-button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Campaign Details | VoxAgent' }

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) redirect('/login')

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, assistants(name)')
    .eq('id', id)
    .eq('agency_id', userData.agency_id)
    .single()

  if (!campaign) redirect('/dashboard/campaigns')

  const { data: leads } = await supabase
    .from('campaign_leads')
    .select('*')
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })

  const safeLeads = leads || []
  const totalLeads = safeLeads.length
  const completedLeads = safeLeads.filter(l => l.call_status === 'completed').length
  const failedLeads = safeLeads.filter(l => l.call_status === 'failed' || l.call_status === 'no-answer').length
  const pendingLeads = safeLeads.filter(l => l.call_status === 'pending').length
  const callingLeads = safeLeads.filter(l => l.call_status === 'calling').length

  const processedLeads = completedLeads + failedLeads
  const progress = totalLeads > 0 ? Math.round((processedLeads / totalLeads) * 100) : 0

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/campaigns"
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {campaign.name}
              <Badge variant={
                campaign.status === 'completed' ? 'success' :
                campaign.status === 'running' ? 'info' : 'secondary'
              }>
                {campaign.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Using assistant: <span className="font-medium text-foreground">{campaign.assistants?.name}</span>
            </p>
          </div>
        </div>

        {campaign.status === 'draft' && pendingLeads > 0 && (
          <LaunchButton campaignId={campaign.id} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-3xl font-bold text-foreground mt-1">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-green-500/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{completedLeads}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-red-500/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Failed / No Answer</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{failedLeads}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-blue-500/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{callingLeads}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Campaign Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Processed: {processedLeads} / {totalLeads}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Leads Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Attempted At</th>
                  </tr>
                </thead>
                <tbody>
                  {safeLeads.map((lead: any) => (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-foreground">{lead.phone}</td>
                      <td className="px-4 py-3">{lead.name || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          lead.call_status === 'completed' ? 'success' :
                          lead.call_status === 'calling' ? 'info' :
                          lead.call_status === 'failed' || lead.call_status === 'no-answer' ? 'destructive' :
                          'secondary'
                        }>
                          {lead.call_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.attempted_at ? new Date(lead.attempted_at).toLocaleString() : 'Not attempted'}
                      </td>
                    </tr>
                  ))}
                  {safeLeads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No leads found in this campaign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
