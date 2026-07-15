import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateVapiAssistant, deleteVapiAssistant } from '@/lib/vapi'
import { decrypt } from '@/lib/encryption'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Verify assistant belongs to agency
    const { data: assistant } = await supabase
      .from('assistants')
      .select('id, vapi_assistant_id')
      .eq('id', id)
      .eq('agency_id', userData.agency_id)
      .single()

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 })
    }

    // Try to delete from VAPI if it has an ID
    if (assistant.vapi_assistant_id) {
      try {
        const { data: agency } = await supabase
          .from('agencies')
          .select('vapi_api_key_encrypted')
          .eq('id', userData.agency_id)
          .single()

        let vapiKey = process.env.VAPI_PRIVATE_KEY
        if (agency?.vapi_api_key_encrypted) {
          vapiKey = decrypt(agency.vapi_api_key_encrypted)
        }

        if (vapiKey) {
          await deleteVapiAssistant(vapiKey, assistant.vapi_assistant_id)
        }
      } catch (err) {
        console.error('Failed to delete from VAPI, proceeding with DB delete', err)
      }
    }

    // Delete from DB
    const { error } = await supabase.from('assistants').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete assistant error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, description, system_prompt, first_message, end_call_message, voice_id, language, knowledge_base_id } = body

    // Verify assistant belongs to agency
    const { data: assistant } = await supabase
      .from('assistants')
      .select('id, vapi_assistant_id')
      .eq('id', id)
      .eq('agency_id', userData.agency_id)
      .single()

    if (!assistant) return NextResponse.json({ error: 'Assistant not found' }, { status: 404 })

    // Update VAPI if connected
    if (assistant.vapi_assistant_id) {
      try {
        const { data: agency } = await supabase
          .from('agencies')
          .select('vapi_api_key_encrypted')
          .eq('id', userData.agency_id)
          .single()

        let vapiKey = process.env.VAPI_PRIVATE_KEY
        if (agency?.vapi_api_key_encrypted) {
          vapiKey = decrypt(agency.vapi_api_key_encrypted)
        }

        if (vapiKey) {
          await updateVapiAssistant(vapiKey, assistant.vapi_assistant_id, {
            name,
            systemPrompt: system_prompt,
            firstMessage: first_message,
            endCallMessage: end_call_message,
            voiceId: voice_id,
            serverUrl: `${process.env.APP_URL}/api/webhooks/vapi/${userData.agency_id}`,
            hasKnowledgeBase: !!knowledge_base_id,
          })
        }
      } catch (err) {
        console.error('Failed to update VAPI:', err)
        return NextResponse.json({ error: 'Failed to update assistant in VAPI.' }, { status: 422 })
      }
    }

    // Update DB
    const { error } = await supabase
      .from('assistants')
      .update({
        name,
        description,
        system_prompt,
        first_message,
        end_call_message,
        voice_id,
        language,
        knowledge_base_id
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update assistant error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
