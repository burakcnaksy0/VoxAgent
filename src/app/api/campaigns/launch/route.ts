import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startVapiOutboundCall } from '@/lib/vapi'
import { decrypt } from '@/lib/encryption'

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

    let vapiKey = process.env.VAPI_PRIVATE_KEY;
    if (agency?.vapi_api_key_encrypted) {
      vapiKey = decrypt(agency.vapi_api_key_encrypted);
    }

    if (!vapiKey) {
      return NextResponse.json({ error: 'VAPI API key not configured' }, { status: 400 })
    }

    // Update campaign status
    await supabase.from('campaigns').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', campaign_id)

    // Background processing (Do not await in serverless for thousands of rows, but for this MVP we'll fire them asynchronously)
    // Next.js might kill the background process if it exits early, but we will return the response and let the promise run
    
    // Self-invoking async function for background processing
    ;(async () => {
      try {
        const { data: leads } = await supabase
          .from('campaign_leads')
          .select('*')
          .eq('campaign_id', campaign_id)
          .eq('call_status', 'pending')

        if (!leads || leads.length === 0) {
          await supabase.from('campaigns').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', campaign_id)
          return
        }

        // Process leads in batches of 10 to avoid VAPI rate limits
        const BATCH_SIZE = 10
        for (let i = 0; i < leads.length; i += BATCH_SIZE) {
          const batch = leads.slice(i, i + BATCH_SIZE)
          
          await Promise.all(batch.map(async (lead) => {
            try {
              // Create call record
              const { data: callRecord } = await supabase.from('calls').insert({
                agency_id: userData.agency_id,
                assistant_id: campaign.assistant_id,
                direction: 'outbound',
                status: 'initiated',
                callee_number: lead.phone
              }).select().single()

              if (!callRecord) throw new Error('Failed to create call record')

              // Update lead status to calling
              await supabase.from('campaign_leads').update({
                call_status: 'calling',
                call_id: callRecord.id,
                attempted_at: new Date().toISOString()
              }).eq('id', lead.id)

              let formattedPhone = lead.phone.trim();
              if (formattedPhone.startsWith('05')) {
                formattedPhone = '+90' + formattedPhone.slice(1);
              } else if (formattedPhone.startsWith('5') && formattedPhone.length === 10) {
                formattedPhone = '+90' + formattedPhone;
              } else if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+' + formattedPhone;
              }

              // Dispatch VAPI call
              const vapiCall: any = await startVapiOutboundCall(vapiKey, {
                assistantId: campaign.assistants.vapi_assistant_id,
                phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
                customer: {
                  number: formattedPhone,
                  name: lead.name,
                }
              })

              // Link VAPI ID
              await supabase.from('calls').update({
                vapi_call_id: vapiCall.id,
                status: 'ringing'
              }).eq('id', callRecord.id)

            } catch (err) {
              console.error(`Failed to dispatch call for lead ${lead.id}:`, err)
              await supabase.from('campaign_leads').update({ call_status: 'failed' }).eq('id', lead.id)
            }
          }))

          // Sleep 1 second between batches
          await new Promise(res => setTimeout(res, 1000))
        }

        // Check if all leads are done (or at least attempted)
        // Note: Actual completion relies on webhooks completing the calls, but we mark campaign as running
      } catch (err) {
        console.error('Campaign background processor error:', err)
      }
    })()

    return NextResponse.json({ success: true, message: 'Campaign launched' })

  } catch (error: any) {
    console.error('Launch campaign error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
