import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, getPriceIdFromPlan } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('agency_id, email')
      .eq('id', user.id)
      .single()

    if (!userData?.agency_id) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    const { data: agency } = await supabase
      .from('agencies')
      .select('stripe_customer_id')
      .eq('id', userData.agency_id)
      .single()

    const body = await request.json()
    const { plan } = body

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 })
    }

    const priceId = getPriceIdFromPlan(plan)
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    let customerId = agency?.stripe_customer_id

    // Create a new Stripe customer if they don't have one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          agency_id: userData.agency_id,
        },
      })
      customerId = customer.id
      
      await supabase
        .from('agencies')
        .update({ stripe_customer_id: customerId })
        .eq('id', userData.agency_id)
    }

    // Create a Stripe Checkout Session
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url: `${origin}/dashboard/billing?canceled=true`,
      subscription_data: {
        metadata: {
          agency_id: userData.agency_id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
