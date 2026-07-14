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
    const { name, assistant_id, agency_id } = body

    if (!name || !assistant_id || !agency_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Insert Campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        assistant_id,
        agency_id,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(campaign)

  } catch (error: any) {
    console.error('Campaign creation error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
