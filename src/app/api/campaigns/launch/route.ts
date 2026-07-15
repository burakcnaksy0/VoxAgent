import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startVapiOutboundCall, getVapiCall } from '@/lib/vapi'
import { decrypt } from '@/lib/encryption'
import { getAvailableMinutes } from '@/lib/billing'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaign_id } = await req.json()
    if (!campaign_id) return NextResponse.json({ error: 'Missing campaign_id' }, { status: 400 })

    const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, assistants(vapi_assistant_id)')
      .eq('id', campaign_id)
      .eq('agency_id', userData.agency_id)
      .single()

    if (!campaign || campaign.status !== 'draft') {
      return NextResponse.json({ error: 'Campaign not found or not in draft state' }, { status: 400 })
    }

    if (!campaign.assistants?.vapi_assistant_id) {
      return NextResponse.json({ error: 'Assistant not synced with VAPI' }, { status: 400 })
    }

    // Fetch agency VAPI key
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

    // Check available minute balance
    const availableMinutes = await getAvailableMinutes(userData.agency_id, supabase)
    if (availableMinutes <= 0) {
      return NextResponse.json({ 
        error: 'Insufficient call balance. Please upgrade your plan or top up your minutes under the Billing section.' 
      }, { status: 402 })
    }

    // Fetch pending leads BEFORE starting campaign
    const { data: leads } = await supabase
      .from('campaign_leads')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('call_status', 'pending')

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: 'No pending leads to call' }, { status: 400 })
    }

    // Update campaign status
    await supabase.from('campaigns').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', campaign_id)

    // Process leads synchronously (MVP: small batch, we can handle inline)
    let successCount = 0
    let failCount = 0
    const results: Array<{ leadId: string; status: string; error?: string }> = []

    for (const lead of leads) {
      try {
        // Format phone to E.164
        let formattedPhone = lead.phone.replace(/[^0-9+]/g, '');
        if (formattedPhone.startsWith('05')) {
          formattedPhone = '+90' + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith('5') && formattedPhone.length === 10) {
          formattedPhone = '+90' + formattedPhone;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }

        // Create call record
        const { data: callRecord } = await supabase.from('calls').insert({
          agency_id: userData.agency_id,
          assistant_id: campaign.assistant_id,
          direction: 'outbound',
          status: 'initiated',
          callee_number: formattedPhone
        }).select().single()

        if (!callRecord) throw new Error('Failed to create call record')

        // Update lead status to calling
        await supabase.from('campaign_leads').update({
          call_status: 'calling',
          call_id: callRecord.id,
          attempted_at: new Date().toISOString()
        }).eq('id', lead.id)

        console.log(`[VAPI] Dispatching call for ${formattedPhone}...`);
        
        // Dispatch VAPI call
        const vapiCall: any = await startVapiOutboundCall(vapiKey, {
          assistantId: campaign.assistants.vapi_assistant_id,
          phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
          customer: {
            number: formattedPhone,
            name: lead.name,
          }
        })

        console.log(`[VAPI] Call dispatched. VAPI Call ID: ${vapiCall.id}, Initial Status: ${vapiCall.status}`);

        // Link VAPI ID to our call record
        await supabase.from('calls').update({
          vapi_call_id: vapiCall.id,
          status: 'ringing'
        }).eq('id', callRecord.id)

        // === CRITICAL: Verify call actually started after a short delay ===
        await new Promise(res => setTimeout(res, 3000))

        try {
          const checkResult: any = await getVapiCall(vapiKey, vapiCall.id)
          console.log(`[VAPI] Call ${vapiCall.id} status after 3s: ${checkResult.status}, endedReason: ${checkResult.endedReason || 'N/A'}`);

          if (checkResult.status === 'ended') {
            // Call failed immediately — update our records
            const endedReason = checkResult.endedReason || 'unknown'
            const failStatus = endedReason.includes('no-answer') ? 'no-answer' : 'failed'

            await supabase.from('calls').update({
              status: failStatus,
              ended_at: new Date().toISOString(),
              summary: `VAPI ended reason: ${endedReason}`
            }).eq('id', callRecord.id)

            await supabase.from('campaign_leads').update({
              call_status: failStatus
            }).eq('id', lead.id)

            failCount++
            results.push({ leadId: lead.id, status: failStatus, error: endedReason })
            console.error(`[VAPI] ❌ Call failed immediately: ${endedReason}`);
          } else {
            successCount++
            results.push({ leadId: lead.id, status: 'dispatched' })
            console.log(`[VAPI] ✅ Call is active: ${checkResult.status}`);
          }
        } catch (checkErr) {
          // Couldn't verify, assume it's running (webhook will handle final status)
          console.warn(`[VAPI] Could not verify call ${vapiCall.id}:`, checkErr);
          successCount++
          results.push({ leadId: lead.id, status: 'dispatched-unverified' })
        }

      } catch (err: any) {
        console.error(`[VAPI] Failed to dispatch call for lead ${lead.id}:`, err)
        await supabase.from('campaign_leads').update({ call_status: 'failed' }).eq('id', lead.id)
        failCount++
        results.push({ leadId: lead.id, status: 'failed', error: err.message })
      }
    }

    // If all leads failed, mark campaign as completed with failure
    if (failCount === leads.length) {
      await supabase.from('campaigns').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', campaign_id)
    }

    console.log(`[CAMPAIGN] Launch summary: ${successCount} dispatched, ${failCount} failed out of ${leads.length} leads`);

    return NextResponse.json({
      success: true,
      message: 'Campaign launched',
      summary: {
        total: leads.length,
        dispatched: successCount,
        failed: failCount,
        results
      }
    })

  } catch (error: any) {
    console.error('Launch campaign error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
