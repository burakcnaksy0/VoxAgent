import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete all calls belonging to agency
    const { error } = await supabase
      .from('calls')
      .delete()
      .eq('agency_id', userData.agency_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Clear call history error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
