import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Bot, Users, Megaphone, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard Overview' }

async function getStats(agencyId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [callsRes, assistantsRes, clientsRes, campaignsRes, recentCallsRes] = await Promise.all([
    supabase.from('calls').select('status, duration_seconds, created_at', { count: 'exact' })
      .eq('agency_id', agencyId).gte('created_at', startOfMonth),
    supabase.from('assistants').select('id', { count: 'exact' }).eq('agency_id', agencyId).eq('is_active', true),
    supabase.from('sub_clients').select('id', { count: 'exact' }).eq('agency_id', agencyId),
    supabase.from('campaigns').select('id', { count: 'exact' }).eq('agency_id', agencyId).eq('status', 'running'),
    supabase.from('calls').select('*, assistants(name), sub_clients(name)')
      .eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(5),
  ])

  const calls = callsRes.data || []
  const totalMinutes = calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60
  const completedCalls = calls.filter(c => c.status === 'completed').length
  const failedCalls = calls.filter(c => c.status === 'failed' || c.status === 'no-answer').length
  const successRate = calls.length > 0 ? Math.round((completedCalls / calls.length) * 100) : 0

  return {
    totalCalls: callsRes.count || 0,
    totalMinutes: Math.round(totalMinutes),
    completedCalls,
    failedCalls,
    successRate,
    activeAssistants: assistantsRes.count || 0,
    totalClients: clientsRes.count || 0,
    runningCampaigns: campaignsRes.count || 0,
    recentCalls: recentCallsRes.data || [],
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) redirect('/login')

  const stats = await getStats(userData.agency_id, supabase)

  const statCards = [
    {
      label: 'Total Calls (Month)',
      value: stats.totalCalls.toString(),
      sub: `${stats.completedCalls} completed`,
      icon: Phone,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Minutes Used',
      value: stats.totalMinutes.toString(),
      sub: 'this month',
      icon: Clock,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      sub: `${stats.failedCalls} failed`,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      label: 'Active Assistants',
      value: stats.activeAssistants.toString(),
      sub: `${stats.totalClients} clients`,
      icon: Bot,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ]

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Your agency performance at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`border ${stat.border}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Recent Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No calls yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create an assistant and start making calls
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentCalls.map((call: any) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      call.status === 'completed' ? 'bg-green-400' :
                      call.status === 'in-progress' ? 'bg-blue-400 pulse-green' :
                      'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {call.sub_clients?.name || call.callee_number || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {call.assistants?.name || 'No assistant'} · {call.direction}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(call.duration_seconds || 0)}
                    </span>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Create Assistant', desc: 'Build a new AI voice agent', href: '/dashboard/assistants/new', icon: Bot, color: 'from-violet-600 to-purple-600' },
          { title: 'Add Client', desc: 'Onboard a new sub-client', href: '/dashboard/clients/new', icon: Users, color: 'from-blue-600 to-cyan-600' },
          { title: 'New Campaign', desc: 'Launch a batch calling campaign', href: '/dashboard/campaigns/new', icon: Megaphone, color: 'from-amber-600 to-orange-600' },
        ].map((action) => (
          <a
            key={action.title}
            href={action.href}
            className="glass-card rounded-xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
