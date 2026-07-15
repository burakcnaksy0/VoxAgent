import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import CampaignDetailClient from './campaign-detail-client'

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

  return (
    <CampaignDetailClient 
      campaign={campaign} 
      initialLeads={leads || []} 
    />
  )
}
