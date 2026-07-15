import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch agency plan
    const { data: agency } = await supabase
      .from('agencies')
      .select('plan')
      .eq('id', userData.agency_id)
      .single()

    const agencyPlan = agency?.plan || 'trial'

    // Enforce client limits based on plan
    if (agencyPlan !== 'pro') {
      const { count, error: countError } = await supabase
        .from('sub_clients')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', userData.agency_id)

      if (countError) {
        return NextResponse.json({ error: 'Failed to verify client limits' }, { status: 500 })
      }

      const currentCount = count || 0
      let maxAllowed = 2
      if (agencyPlan === 'starter') {
        maxAllowed = 3
      } else if (agencyPlan === 'growth') {
        maxAllowed = 15
      }

      if (currentCount >= maxAllowed) {
        return NextResponse.json({
          error: `Client limit reached. Your '${agencyPlan}' plan allows up to ${maxAllowed} client(s). Please upgrade your plan in the Billing & Usage section.`
        }, { status: 403 })
      }
    }

    const body = await req.json()
    const { name, phone, email, fallback_channel } = body

    const { data, error } = await supabase
      .from('sub_clients')
      .insert({
        agency_id: userData.agency_id,
        name,
        phone,
        email,
        fallback_channel: fallback_channel || 'none'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabase
      .from('sub_clients')
      .select('*')
      .eq('agency_id', userData.agency_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
