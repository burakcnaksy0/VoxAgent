import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!userData?.agency_id) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('name, logo_url, brand_color, custom_domain, vapi_api_key_encrypted')
      .eq('id', userData.agency_id)
      .single()

    return NextResponse.json({
      name: agency?.name,
      logo_url: agency?.logo_url,
      brand_color: agency?.brand_color,
      custom_domain: agency?.custom_domain,
      has_vapi_key: !!agency?.vapi_api_key_encrypted,
    })
  } catch (error: any) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (!userData?.agency_id) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, logo_url, brand_color, custom_domain, vapi_api_key } = body

    const updateData: any = {
      name,
      logo_url,
      brand_color,
      custom_domain: custom_domain || null, // handle empty strings for unique constraints
    }

    if (vapi_api_key) {
      updateData.vapi_api_key_encrypted = encrypt(vapi_api_key)
    }

    const { error } = await supabase
      .from('agencies')
      .update(updateData)
      .eq('id', userData.agency_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
