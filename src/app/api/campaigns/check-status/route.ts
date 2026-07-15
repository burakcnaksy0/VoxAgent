import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVapiCall } from '@/lib/vapi'
import { decrypt } from '@/lib/encryption'
import { deductCallDuration } from '@/lib/billing'

/**
 * POST /api/campaigns/check-status
 * Polls VAPI to sync the real status of calls that are stuck in 'calling' or 'ringing'.
 * This is a safety net for when webhooks don't arrive.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaign_id } = await req.json()
    if (!campaign_id) return NextResponse.json({ error: 'Missing campaign_id' }, { status: 400 })

    const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Verify campaign belongs to agency
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', campaign_id)
      .eq('agency_id', userData.agency_id)
      .single()

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    // Get VAPI key
    const { data: agency } = await supabase
      .from('agencies')
      .select('vapi_api_key_encrypted')
      .eq('id', userData.agency_id)
      .single()

    let vapiKey = process.env.VAPI_PRIVATE_KEY!;
    if (agency?.vapi_api_key_encrypted) {
      vapiKey = decrypt(agency.vapi_api_key_encrypted);
    }

    if (!vapiKey) {
      return NextResponse.json({ error: 'VAPI API key not configured' }, { status: 400 })
    }

    // Find all calls stuck in non-terminal states
    const { data: stuckCalls } = await supabase
      .from('calls')
      .select('id, vapi_call_id, status')
      .in('status', ['initiated', 'ringing', 'in-progress'])
      .not('vapi_call_id', 'is', null)
      .eq('agency_id', userData.agency_id)

    // Also find campaign_leads in 'calling' state for this campaign
    const { data: stuckLeads } = await supabase
      .from('campaign_leads')
      .select('id, call_id')
      .eq('campaign_id', campaign_id)
      .eq('call_status', 'calling')

    if (!stuckCalls || stuckCalls.length === 0) {
      // Check if campaign should be completed
      const { data: allLeads } = await supabase
        .from('campaign_leads')
        .select('call_status')
        .eq('campaign_id', campaign_id)

      const allDone = allLeads?.every(l =>
        ['completed', 'failed', 'no-answer', 'fallback-sent'].includes(l.call_status)
      )

      if (allDone && campaign.status === 'running') {
        await supabase.from('campaigns').update({
          status: 'completed',
          completed_at: new Date().toISOString()
        }).eq('id', campaign_id)
      }

      return NextResponse.json({ synced: 0, message: 'No stuck calls found', campaignCompleted: allDone })
    }

    let syncedCount = 0
    const syncResults: Array<{ callId: string; oldStatus: string; newStatus: string; reason?: string }> = []

    for (const call of stuckCalls) {
      if (!call.vapi_call_id) continue

      try {
        const vapiResult: any = await getVapiCall(vapiKey, call.vapi_call_id)

        if (vapiResult.status === 'ended') {
          const endedReason = vapiResult.endedReason || 'unknown'
          let newStatus: string = 'completed'

          if (endedReason === 'no-answer' || endedReason === 'customer-did-not-answer' || endedReason === 'voicemail') {
            newStatus = 'no-answer'
          } else if (endedReason.includes('error') || endedReason.includes('failed')) {
            newStatus = 'failed'
          }

          const durationSeconds = Math.round(vapiResult.costBreakdown?.duration || 0)

          // Update call record
          await supabase.from('calls').update({
            status: newStatus,
            ended_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            summary: vapiResult.summary || `VAPI ended: ${endedReason}`,
            transcript: vapiResult.transcript || null,
            cost: vapiResult.cost || null,
          }).eq('id', call.id)

          // Deduct call duration from agency balance
          try {
            await deductCallDuration(userData.agency_id, durationSeconds, supabase)
          } catch (billingErr) {
            console.error('[SYNC BILLING ERROR] Failed to deduct minutes:', billingErr)
          }

          // Update campaign_leads
          const leadStatus = newStatus === 'completed' ? 'completed' : newStatus === 'no-answer' ? 'no-answer' : 'failed'
          await supabase.from('campaign_leads').update({
            call_status: leadStatus
          }).eq('call_id', call.id)

          syncedCount++
          syncResults.push({
            callId: call.id,
            oldStatus: call.status,
            newStatus,
            reason: endedReason
          })

          console.log(`[SYNC] Call ${call.vapi_call_id}: ${call.status} → ${newStatus} (reason: ${endedReason})`)
        }
      } catch (err) {
        console.error(`[SYNC] Failed to check call ${call.vapi_call_id}:`, err)
      }
    }

    // Also fix orphaned leads that are still 'calling' but have no matching stuck call
    if (stuckLeads) {
      for (const lead of stuckLeads) {
        if (!lead.call_id) continue
        // Check if this lead's call was already synced above
        const wasFixed = syncResults.some(r => r.callId === lead.call_id)
        if (wasFixed) continue

        // Check if the call exists and has a terminal status
        const { data: callRecord } = await supabase
          .from('calls')
          .select('status')
          .eq('id', lead.call_id)
          .single()

        if (callRecord && ['completed', 'failed', 'no-answer'].includes(callRecord.status)) {
          const leadStatus = callRecord.status === 'completed' ? 'completed' : callRecord.status === 'no-answer' ? 'no-answer' : 'failed'
          await supabase.from('campaign_leads').update({ call_status: leadStatus }).eq('id', lead.id)
          syncedCount++
        }
      }
    }

    // Check if campaign should be completed after sync
    const { data: allLeads } = await supabase
      .from('campaign_leads')
      .select('call_status')
      .eq('campaign_id', campaign_id)

    const allDone = allLeads?.every(l =>
      ['completed', 'failed', 'no-answer', 'fallback-sent'].includes(l.call_status)
    )

    if (allDone && campaign.status === 'running') {
      await supabase.from('campaigns').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', campaign_id)
    }

    return NextResponse.json({
      synced: syncedCount,
      results: syncResults,
      campaignCompleted: allDone
    })

  } catch (error: any) {
    console.error('Check status error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
