import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendFallbackMessage } from '@/lib/twilio'
import { decrypt } from '@/lib/encryption'
import { deductCallDuration } from '@/lib/billing'

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

  // 1. Secure Webhook Source: Validate x-vapi-secret header if configured
  const vapiSecretHeader = request.headers.get('x-vapi-secret')
  const configuredSecret = process.env.VAPI_WEBHOOK_SECRET
  if (configuredSecret && vapiSecretHeader !== configuredSecret) {
    console.error(`[WEBHOOK SECURITY ALERT] Unauthorized VAPI webhook attempt for agency ${agencyId}. Invalid x-vapi-secret.`)
    return NextResponse.json({ error: 'Unauthorized webhook source' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = body?.message
  
  console.log(`[WEBHOOK][${new Date().toISOString()}] Received event from VAPI for agency ${agencyId}. Event type:`, event?.type || 'UNKNOWN');

  if (!event) {
    console.error('[WEBHOOK] No message in payload. Body was:', body);
    return NextResponse.json({ error: 'No message in payload' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const vapiCall = event.call
  console.log(`[WEBHOOK] Call ID: ${vapiCall?.id}, Event type: ${event.type}, Call status: ${vapiCall?.status || 'N/A'}`);

  try {
    switch (event.type) {
      case 'tool-calls':
      case 'function-call': {
        const message = event || body?.message
        const toolCalls = message.toolCalls || (message.functionCall ? [message.functionCall] : [])
        const results = []

        for (const toolCall of toolCalls) {
          const name = toolCall.name || toolCall.function?.name
          const toolCallId = toolCall.id
          const args = toolCall.arguments || (toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {})
          const query = args.query

          if (name === 'search_knowledge_base' && query) {
            try {
              // 1. Fetch assistant and its knowledge base ID
              const vapiAssistantId = vapiCall?.assistantId
              if (vapiAssistantId) {
                const { data: assistant } = await supabase
                  .from('assistants')
                  .select('knowledge_base_id')
                  .eq('vapi_assistant_id', vapiAssistantId)
                  .single()

                if (assistant?.knowledge_base_id) {
                  // 2. Generate embedding for query
                  const { generateEmbedding } = await import('@/lib/embeddings')
                  const queryEmbedding = await generateEmbedding(query)

                  // 3. Fetch all chunks
                  const { data: chunks } = await supabase
                    .from('knowledge_chunks')
                    .select('content, embedding')
                    .eq('knowledge_base_id', assistant.knowledge_base_id)

                  if (chunks && chunks.length > 0) {
                    // 4. Calculate similarity in JS
                    const chunksWithSimilarity = chunks.map(chunk => {
                      const chunkEmbedding = typeof chunk.embedding === 'string'
                        ? JSON.parse(chunk.embedding)
                        : chunk.embedding

                      let similarity = 0
                      if (Array.isArray(chunkEmbedding) && chunkEmbedding.length === queryEmbedding.length) {
                        for (let i = 0; i < queryEmbedding.length; i++) {
                          similarity += queryEmbedding[i] * chunkEmbedding[i]
                        }
                      }
                      return { content: chunk.content, similarity }
                    })

                    // Sort desc by similarity
                    chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity)

                    // Take top 3 chunks with similarity > 0.3
                    const topChunks = chunksWithSimilarity
                      .filter(c => c.similarity > 0.3)
                      .slice(0, 3)

                    const context = topChunks.map(c => c.content).join('\n\n')

                    results.push({
                      toolCallId,
                      name,
                      result: context || 'No relevant information found in the knowledge base.'
                    })
                    continue
                  }
                }
              }
            } catch (err) {
              console.error('RAG Search failed:', err)
            }
          }

          results.push({
            toolCallId,
            name,
            result: 'Failed to query the knowledge base.'
          })
        }

        return NextResponse.json({ results })
      }

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
        
        // Also update campaign_leads if applicable
        const { data: leadRecord } = await supabase.from('calls').select('id').eq('vapi_call_id', vapiCall.id).single()
        if (leadRecord) {
          await supabase.from('campaign_leads').update({ call_status: 'in-progress' }).eq('call_id', leadRecord.id)
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

        // 1. Guard against duplicate webhook deliveries/retries
        const { data: existingCall } = await supabase
          .from('calls')
          .select('status')
          .eq('vapi_call_id', vapiCall.id)
          .maybeSingle()

        if (existingCall && ['completed', 'no-answer', 'failed'].includes(existingCall.status)) {
          console.log(`[WEBHOOK] Call ${vapiCall.id} is already in terminal state (${existingCall.status}). Skipping duplicate billing & SMS fallback.`)
          break
        }

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

          // Update billing usage and deduct minutes
          try {
            await deductCallDuration(agencyId, duration, supabase)
          } catch (billingErr) {
            console.error('Billing usage update failed:', billingErr)
          }

          // Omnichannel fallback: send WhatsApp/SMS if unanswered
          if (status === 'no-answer' && callRecord.sub_clients) {
            const subClient = callRecord.sub_clients as any
            let channel = subClient.fallback_channel as 'none' | 'sms' | 'whatsapp'

            if (channel !== 'none' && subClient.phone) {
              // Fetch agency details to verify plan constraints (WhatsApp fallback is Growth/Pro only)
              const { data: agencyData } = await supabase
                .from('agencies')
                .select('name, plan')
                .eq('id', agencyId)
                .single()

              const agencyPlan = agencyData?.plan || 'trial'
              
              if (channel === 'whatsapp' && (agencyPlan === 'trial' || agencyPlan === 'starter')) {
                console.log(`[FALLBACK ENFORCEMENT] Agency ${agencyId} is on '${agencyPlan}' plan. WhatsApp is restricted. Downgrading to SMS.`)
                channel = 'sms'
              }

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

        // Update campaign lead if applicable (safely guard against null/undefined callRecord.id)
        if (callRecord?.id) {
          await supabase
            .from('campaign_leads')
            .update({
              call_status: status === 'completed' ? 'completed' : status === 'no-answer' ? 'no-answer' : 'failed',
              attempted_at: new Date().toISOString(),
            })
            .eq('call_id', callRecord.id)
        }

        break;
      }

      case 'status-update': {
        const callStatus = event.status || vapiCall?.status;
        console.log(`[WEBHOOK] Status update: ${callStatus}`);
        
        const { data: statusCallRecord } = await supabase
          .from('calls')
          .select('id')
          .eq('vapi_call_id', vapiCall.id)
          .single()

        if (statusCallRecord) {
          if (callStatus === 'ringing') {
            await supabase.from('calls').update({ status: 'ringing' }).eq('id', statusCallRecord.id)
            await supabase.from('campaign_leads').update({ call_status: 'calling' }).eq('call_id', statusCallRecord.id)
          } else if (callStatus === 'in-progress') {
            await supabase.from('calls').update({ status: 'in-progress', started_at: new Date().toISOString() }).eq('id', statusCallRecord.id)
            await supabase.from('campaign_leads').update({ call_status: 'in-progress' }).eq('call_id', statusCallRecord.id)
          } else if (callStatus === 'forwarding') {
            await supabase.from('calls').update({ status: 'in-progress' }).eq('id', statusCallRecord.id)
          } else if (callStatus === 'ended' || callStatus === 'failed') {
            await supabase.from('calls').update({ status: 'failed', ended_at: new Date().toISOString() }).eq('id', statusCallRecord.id)
            await supabase.from('campaign_leads').update({ call_status: 'failed' }).eq('call_id', statusCallRecord.id)
          }
          
          // Log the event
          await supabase.from('call_events').insert({
            call_id: statusCallRecord.id,
            agency_id: agencyId,
            event_type: 'status-update',
            payload: { status: callStatus, timestamp: new Date().toISOString() },
          })
        }
        break
      }

      case 'hang': {
        console.log(`[WEBHOOK] Hang event for call ${vapiCall?.id}`);
        const { data: hangCallRecord } = await supabase
          .from('calls')
          .select('id')
          .eq('vapi_call_id', vapiCall.id)
          .single()

        if (hangCallRecord) {
          await supabase.from('calls').update({
            status: 'failed',
            ended_at: new Date().toISOString(),
            summary: 'Call connection lost (hang event)'
          }).eq('id', hangCallRecord.id)
          
          await supabase.from('campaign_leads').update({ call_status: 'failed' }).eq('call_id', hangCallRecord.id)
          
          await supabase.from('call_events').insert({
            call_id: hangCallRecord.id,
            agency_id: agencyId,
            event_type: 'hang',
            payload: event,
          })
        }
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
