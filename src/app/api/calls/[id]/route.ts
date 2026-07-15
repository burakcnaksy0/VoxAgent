import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify call belongs to agency
    const { data: call } = await supabase
      .from('calls')
      .select('id')
      .eq('id', id)
      .eq('agency_id', userData.agency_id)
      .single()

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Delete call from DB
    const { error } = await supabase
      .from('calls')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete call error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
