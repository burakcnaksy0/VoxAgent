import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Plus, MoreVertical, CheckCircle2, XCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Campaigns | VoxAgent' }

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) redirect('/login')

  // Fetch campaigns and their leads for basic stats
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, campaign_leads(id, call_status)')
    .eq('agency_id', userData.agency_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage bulk AI voice campaigns</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 px-4 py-2 text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-orange-500/25 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card className="glass-card mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No campaigns yet</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              Upload a list of phone numbers and start an automated bulk calling campaign.
            </p>
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 px-4 py-2 text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-orange-500/25 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {campaigns.map((campaign: any) => {
            const leads = campaign.campaign_leads || []
            const totalLeads = leads.length
            const completedLeads = leads.filter((l: any) => l.call_status === 'completed').length
            const failedLeads = leads.filter((l: any) => l.call_status === 'failed' || l.call_status === 'no-answer').length
            
            // Calculate progress
            const processedLeads = completedLeads + failedLeads
            const progress = totalLeads > 0 ? Math.round((processedLeads / totalLeads) * 100) : 0

            return (
              <Card key={campaign.id} className="glass-card hover:border-amber-500/40 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg hover:underline cursor-pointer">
                        <Link href={`/dashboard/campaigns/${campaign.id}`}>
                          {campaign.name}
                        </Link>
                      </CardTitle>
                      <div className="mt-1">
                        <Badge variant={
                          campaign.status === 'completed' ? 'success' :
                          campaign.status === 'running' ? 'info' :
                          'secondary'
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </CardHeader>
                
                <CardContent>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-accent rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          campaign.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs bg-accent/30 rounded-md px-2 py-1.5 border border-border">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>{totalLeads} Total</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-accent/30 rounded-md px-2 py-1.5 border border-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span>{completedLeads} Success</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <Link 
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      View Details &rarr;
                    </Link>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">Created</span>
                      <span className="text-xs font-medium text-foreground">
                        {new Date(campaign.created_at).toLocaleDateString()}
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
