import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { campaign_id, agency_id, leads } = body

    if (!campaign_id || !agency_id || !leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    // Verify user belongs to agency
    const { data: userData } = await supabase
      .from('users')
      .select('agency_id')
      .eq('id', user.id)
      .single()

    if (userData?.agency_id !== agency_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Format leads for bulk insert
    const insertData = leads.map(lead => ({
      campaign_id,
      agency_id,
      phone: lead.phone,
      name: lead.name,
      custom_data: lead.custom_data || {},
      call_status: 'pending'
    }))

    // Insert Leads in chunks (Supabase bulk insert usually handles up to 10k rows fine, but we chunk to be safe)
    const chunkSize = 1000
    for (let i = 0; i < insertData.length; i += chunkSize) {
      const chunk = insertData.slice(i, i + chunkSize)
      const { error } = await supabase
        .from('campaign_leads')
        .insert(chunk)

      if (error) {
        console.error('Error inserting leads chunk:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, count: leads.length })

  } catch (error: any) {
    console.error('Upload leads error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
