import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Verify campaign belongs to agency
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', id)
      .eq('agency_id', userData.agency_id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Delete leads first (if no cascade)
    await supabase.from('campaign_leads').delete().eq('campaign_id', id)
    
    // Delete campaign
    const { error } = await supabase.from('campaigns').delete().eq('id', id)
    
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete campaign error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Verify campaign belongs to agency
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', id)
      .eq('agency_id', userData.agency_id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Update campaign
    const { error } = await supabase
      .from('campaigns')
      .update({ name, description })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update campaign error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
