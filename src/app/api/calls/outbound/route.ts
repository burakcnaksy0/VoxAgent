import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startVapiOutboundCall } from '@/lib/vapi'
import { decrypt } from '@/lib/encryption'

// POST /api/calls/outbound — Initiate a single outbound call
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) return NextResponse.json({ error: 'No agency' }, { status: 403 })

  const body = await request.json()
  const { assistantId, phoneNumber, subClientId, customerName } = body

  if (!assistantId || !phoneNumber) {
    return NextResponse.json({ error: 'assistantId and phoneNumber are required' }, { status: 400 })
  }

  // Fetch assistant
  const { data: assistant } = await supabase
    .from('assistants')
    .select('vapi_assistant_id')
    .eq('id', assistantId)
    .eq('agency_id', userData.agency_id)
    .single()

  if (!assistant?.vapi_assistant_id) {
    return NextResponse.json({ error: 'Assistant not found or not synced with VAPI' }, { status: 404 })
  }

  // Fetch agency VAPI key
  const { data: agency } = await supabase
    .from('agencies')
    .select('vapi_api_key_encrypted')
    .eq('id', userData.agency_id)
    .single()

  if (!agency?.vapi_api_key_encrypted) {
    return NextResponse.json({ error: 'VAPI API key not configured' }, { status: 422 })
  }

  // Create call record first
  const { data: callRecord, error: callError } = await supabase
    .from('calls')
    .insert({
      agency_id: userData.agency_id,
      assistant_id: assistantId,
      sub_client_id: subClientId || null,
      direction: 'outbound',
      status: 'initiated',
      callee_number: phoneNumber,
    })
    .select()
    .single()

  if (callError || !callRecord) {
    return NextResponse.json({ error: 'Failed to create call record' }, { status: 500 })
  }

  try {
    const vapiKey = decrypt(agency.vapi_api_key_encrypted)
    const vapiCall: any = await startVapiOutboundCall(vapiKey, {
      assistantId: assistant.vapi_assistant_id,
      customer: {
        number: phoneNumber,
        name: customerName,
      },
    })

    // Update call with VAPI call ID
    await supabase
      .from('calls')
      .update({
        vapi_call_id: vapiCall.id,
        status: 'ringing',
        started_at: new Date().toISOString(),
      })
      .eq('id', callRecord.id)

    return NextResponse.json({ callId: callRecord.id, vapiCallId: vapiCall.id })
  } catch (err: any) {
    // Mark call as failed
    await supabase.from('calls').update({ status: 'failed' }).eq('id', callRecord.id)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
