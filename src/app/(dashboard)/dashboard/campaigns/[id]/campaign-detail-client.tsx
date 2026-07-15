'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Megaphone, RefreshCw, Zap } from 'lucide-react'
import { LaunchButton } from './launch-button'
import { StaggerWrapper, StaggerItem } from '@/components/ui/stagger-wrapper'
import { toast } from 'sonner'

interface Lead {
  id: string
  phone: string
  name: string | null
  call_status: string
  attempted_at: string | null
}

interface CampaignDetailClientProps {
  campaign: any
  initialLeads: Lead[]
}

export default function CampaignDetailClient({ campaign, initialLeads }: CampaignDetailClientProps) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const safeLeads = leads || []
  const totalLeads = safeLeads.length
  const completedLeads = safeLeads.filter(l => l.call_status === 'completed').length
  const failedLeads = safeLeads.filter(l => l.call_status === 'failed' || l.call_status === 'no-answer').length
  const pendingLeads = safeLeads.filter(l => l.call_status === 'pending').length
  const callingLeads = safeLeads.filter(l => l.call_status === 'calling' || l.call_status === 'in-progress').length

  const processedLeads = completedLeads + failedLeads
  const progress = totalLeads > 0 ? Math.round((processedLeads / totalLeads) * 100) : 0

  const isActive = campaign.status === 'running' || callingLeads > 0

  // Auto-refresh every 5 seconds when campaign is active
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      router.refresh()
    }, 5000)

    return () => clearInterval(interval)
  }, [isActive, router])

  // Update leads when server re-fetches
  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  // Sync status with VAPI (polling fallback)
  const handleSyncStatus = useCallback(async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/campaigns/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaign.id })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')

      setLastSyncTime(new Date())

      if (data.synced > 0) {
        toast.success(`${data.synced} call(s) synced with VAPI`)
        router.refresh()
      } else {
        toast.info('All calls are already up to date')
      }

      if (data.campaignCompleted) {
        toast.success('Campaign completed!')
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSyncing(false)
    }
  }, [campaign.id, router])

  // Auto-sync when there are stuck calls and campaign is running
  useEffect(() => {
    if (campaign.status !== 'running' || callingLeads === 0) return
    
    // Auto-sync every 15 seconds when there are calls in 'calling' state
    const interval = setInterval(() => {
      handleSyncStatus()
    }, 15000)

    return () => clearInterval(interval)
  }, [campaign.status, callingLeads, handleSyncStatus])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'calling': case 'in-progress': return 'info'
      case 'failed': case 'no-answer': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <StaggerWrapper className="space-y-8 p-2">
      <StaggerItem>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/campaigns"
              className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-extrabold text-white flex items-center gap-4 tracking-tight">
                {campaign.name}
                <Badge variant={
                  campaign.status === 'completed' ? 'success' :
                  campaign.status === 'running' ? 'info' : 'secondary'
                } className="px-3 py-1 text-sm font-medium">
                  {campaign.status.toUpperCase()}
                </Badge>
              </h1>
              <p className="text-[#94A3B8] mt-1 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#7C3AED]" />
                Powered by AI Assistant: <span className="font-semibold text-white">{campaign.assistants?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Status Button — always visible when campaign has been launched */}
            {campaign.status !== 'draft' && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleSyncStatus}
                disabled={isSyncing}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Status'}
              </Button>
            )}

            {campaign.status === 'draft' && pendingLeads > 0 && (
              <LaunchButton campaignId={campaign.id} />
            )}
          </div>
        </div>

        {/* Auto-sync indicator */}
        {isActive && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[#64748B]">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Auto-refreshing every 5s{callingLeads > 0 ? ' • Auto-syncing with VAPI every 15s' : ''}</span>
            {lastSyncTime && (
              <span>• Last sync: {lastSyncTime.toLocaleTimeString()}</span>
            )}
          </div>
        )}
      </StaggerItem>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* STATS BENTO BLOCKS */}
        <StaggerItem className="glass-card rounded-2xl p-6 glow-primary flex flex-col justify-between">
          <p className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Total Leads</p>
          <p className="text-5xl font-black text-white mt-4">{totalLeads}</p>
        </StaggerItem>
        
        <StaggerItem className="glass-card rounded-2xl p-6 border-t-[#059669]/50 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16 text-[#059669]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Completed</p>
          <p className="text-5xl font-black text-[#34D399] mt-4">{completedLeads}</p>
        </StaggerItem>
        
        <StaggerItem className="glass-card rounded-2xl p-6 border-t-[#DC2626]/50 flex flex-col justify-between relative overflow-hidden">
          <p className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Failed / No Answer</p>
          <p className="text-5xl font-black text-[#F87171] mt-4">{failedLeads}</p>
        </StaggerItem>
        
        <StaggerItem className="glass-card rounded-2xl p-6 border-t-[#3B82F6]/50 flex flex-col justify-between relative overflow-hidden">
          <p className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">In Progress</p>
          <p className="text-5xl font-black text-[#60A5FA] mt-4">{callingLeads}</p>
          {callingLeads > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs text-blue-300">Active calls</span>
            </div>
          )}
        </StaggerItem>

        {/* PROGRESS AND DIRECTORY BENTO BLOCKS */}
        <StaggerItem className="md:col-span-1">
          <Card className="glass-card rounded-2xl h-full border-t-[#7C3AED]/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Campaign Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" className="stroke-current text-white/10" strokeWidth="12" fill="none" />
                    <circle cx="64" cy="64" r="56" className="stroke-current text-[#7C3AED]" strokeWidth="12" fill="none" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * progress) / 100} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                  </svg>
                  <span className="absolute text-2xl font-bold text-white">{progress}%</span>
                </div>
                <p className="mt-4 text-sm text-[#94A3B8] font-medium text-center">
                  Processed {processedLeads} out of {totalLeads} leads
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem className="md:col-span-3">
          <Card className="glass-card rounded-2xl h-full flex flex-col">
            <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-lg text-white flex items-center justify-between">
                Leads Directory
                {callingLeads > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1.5 text-blue-300 hover:text-blue-200"
                    onClick={handleSyncStatus}
                    disabled={isSyncing}
                  >
                    <Zap className="w-3 h-3" />
                    Force Sync
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="overflow-x-auto h-full max-h-[400px] custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#94A3B8] uppercase bg-black/20 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wider">Phone</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                      <th className="px-6 py-4 font-semibold tracking-wider">Attempted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {safeLeads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-white/5 transition-colors group cursor-default">
                        <td className="px-6 py-4 font-mono text-[#E2E8F0] font-medium group-hover:text-white transition-colors">{lead.phone}</td>
                        <td className="px-6 py-4 text-[#CBD5E1]">{lead.name || '-'}</td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusColor(lead.call_status)} className="px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-bold">
                            {lead.call_status === 'calling' && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5" />
                            )}
                            {lead.call_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-[#64748B] text-xs">
                          {lead.attempted_at ? new Date(lead.attempted_at).toLocaleString() : 'Not attempted'}
                        </td>
                      </tr>
                    ))}
                    {safeLeads.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[#64748B]">
                          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-lg font-medium">No leads found</p>
                          <p className="text-sm mt-1">Upload a CSV to get started.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        
      </div>
    </StaggerWrapper>
  )
}
