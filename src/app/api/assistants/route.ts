import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVapiAssistant, updateVapiAssistant, deleteVapiAssistant } from '@/lib/vapi'
import { decrypt } from '@/lib/encryption'

// GET /api/assistants — List all assistants for the agency
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) return NextResponse.json({ error: 'No agency' }, { status: 403 })

  const { data, error } = await supabase
    .from('assistants')
    .select('*, knowledge_bases(name)')
    .eq('agency_id', userData.agency_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/assistants — Create a new assistant
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) return NextResponse.json({ error: 'No agency' }, { status: 403 })

  const { data: agency } = await supabase
    .from('agencies')
    .select('vapi_api_key_encrypted')
    .eq('id', userData.agency_id)
    .single()

  if (!agency?.vapi_api_key_encrypted) {
    return NextResponse.json({ error: 'VAPI API key not configured. Please add it in Settings.' }, { status: 422 })
  }

  const body = await request.json()
  const {
    name,
    description,
    system_prompt,
    first_message,
    end_call_message,
    voice_id,
    language,
    sector,
    knowledge_base_id,
  } = body

  let vapiAssistantId: string | null = null

  try {
    const vapiKey = decrypt(agency.vapi_api_key_encrypted)
    const vapiResult: any = await createVapiAssistant(vapiKey, {
      name,
      systemPrompt: system_prompt,
      firstMessage: first_message,
      endCallMessage: end_call_message,
      voiceId: voice_id,
      language,
      serverUrl: `${process.env.APP_URL}/api/webhooks/vapi/${userData.agency_id}`,
    })
    vapiAssistantId = vapiResult.id
  } catch (err: any) {
    console.error('VAPI assistant creation failed:', err)
    // Continue to save in DB even if VAPI fails (user might fix key later)
  }

  const { data, error } = await supabase
    .from('assistants')
    .insert({
      agency_id: userData.agency_id,
      name,
      description,
      system_prompt,
      first_message,
      end_call_message,
      voice_id: voice_id || 'nova',
      language: language || 'en',
      sector,
      knowledge_base_id,
      vapi_assistant_id: vapiAssistantId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
