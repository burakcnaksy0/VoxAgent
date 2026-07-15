import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendFallbackMessage } from '@/lib/twilio'
import { decrypt } from '@/lib/encryption'

/**
 * VAPI Webhook Handler
 * Receives events from VAPI for a specific agency
 * POST /api/webhooks/vapi/[agencyId]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  const { agencyId } = await params

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body?.message
  if (!event) {
    return NextResponse.json({ error: 'No message in payload' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const vapiCall = event.call

  try {
    switch (event.type) {
      case 'call-started': {
        // Create or update call record
        const { data: existingCall } = await supabase
          .from('calls')
          .select('id')
          .eq('vapi_call_id', vapiCall.id)
          .single()

        if (!existingCall) {
          await supabase.from('calls').insert({
            agency_id: agencyId,
            vapi_call_id: vapiCall.id,
            direction: vapiCall.type === 'inbound' ? 'inbound' : 'outbound',
            status: 'in-progress',
            caller_number: vapiCall.customer?.number || null,
            callee_number: vapiCall.phoneNumber?.number || null,
            started_at: new Date().toISOString(),
          })
        } else {
          await supabase.from('calls').update({ status: 'in-progress' }).eq('vapi_call_id', vapiCall.id)
        }

        // Log event
        const { data: callRecord } = await supabase
          .from('calls')
          .select('id')
          .eq('vapi_call_id', vapiCall.id)
          .single()

        if (callRecord) {
          await supabase.from('call_events').insert({
            call_id: callRecord.id,
            agency_id: agencyId,
            event_type: 'call-started',
            payload: event,
          })
        }
        break
      }

      case 'end-of-call-report': {
        const endedReason = event.endedReason || 'unknown'
        const duration = event.durationSeconds || 0
        const cost = event.cost || 0

        // Map ended reason to our status
        let status: string = 'completed'
        if (endedReason === 'no-answer') status = 'no-answer'
        else if (endedReason === 'customer-did-not-answer') status = 'no-answer'
        else if (endedReason === 'voicemail') status = 'no-answer'
        else if (['error', 'pipeline-error', 'server-error'].includes(endedReason)) status = 'failed'

        // Update call record
        await supabase
          .from('calls')
          .update({
            status,
            duration_seconds: Math.round(duration),
            transcript: event.transcript || null,
            summary: event.summary || null,
            cost,
            ended_at: new Date().toISOString(),
          })
          .eq('vapi_call_id', vapiCall.id)

        // Fetch full call for fallback logic
        const { data: callRecord } = await supabase
          .from('calls')
          .select('*, sub_clients(phone, name, fallback_channel)')
          .eq('vapi_call_id', vapiCall.id)
          .single()

        // Log event
        if (callRecord) {
          await supabase.from('call_events').insert({
            call_id: callRecord.id,
            agency_id: agencyId,
            event_type: 'call-ended',
            payload: { endedReason, duration, cost },
          })

          // Update billing usage
          const period = new Date().toISOString().slice(0, 7) // YYYY-MM
          const minutes = duration / 60
          try {
            await supabase.from('billing_usage').upsert(
              {
                agency_id: agencyId,
                period,
                minutes_used: minutes,
              },
              { onConflict: 'agency_id,period', ignoreDuplicates: false }
            )
          } catch (billingErr) {
            console.error('Billing usage update failed:', billingErr)
          }

          // Omnichannel fallback: send WhatsApp/SMS if unanswered
          if (status === 'no-answer' && callRecord.sub_clients) {
            const subClient = callRecord.sub_clients as any
            const channel = subClient.fallback_channel as 'none' | 'sms' | 'whatsapp'

            if (channel !== 'none' && subClient.phone) {
              // Fetch agency name
              const { data: agencyData } = await supabase
                .from('agencies')
                .select('name')
                .eq('id', agencyId)
                .single()

              try {
                const messageSid = await sendFallbackMessage({
                  to: subClient.phone,
                  channel,
                  agencyName: agencyData?.name || 'Your service',
                  callerName: subClient.name,
                })

                await supabase
                  .from('calls')
                  .update({
                    fallback_sent: true,
                    fallback_status: `${channel}:${messageSid}`,
                  })
                  .eq('id', callRecord.id)
              } catch (err) {
                console.error('Fallback message failed:', err)
              }
            }
          }
        }

        // Update campaign lead if applicable
        await supabase
          .from('campaign_leads')
          .update({
            call_status: status === 'completed' ? 'completed' : status === 'no-answer' ? 'no-answer' : 'failed',
            attempted_at: new Date().toISOString(),
          })
          .eq('call_id', callRecord?.id)

        break
      }

      case 'transcript': {
        // Log real-time transcript
        const { data: callRecord } = await supabase
          .from('calls')
          .select('id')
          .eq('vapi_call_id', vapiCall.id)
          .single()

        if (callRecord) {
          await supabase.from('call_events').insert({
            call_id: callRecord.id,
            agency_id: agencyId,
            event_type: 'transcript',
            payload: event,
          })
        }
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error('VAPI webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
