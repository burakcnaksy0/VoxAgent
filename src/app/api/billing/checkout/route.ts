import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, getOrCreateCustomer } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch user details
    const { data: userData } = await supabase.from('users').select('agency_id, email, full_name').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch agency details to name the customer
    const { data: agency } = await supabase.from('agencies').select('name').eq('id', userData.agency_id).single()
    const agencyName = agency?.name || userData.full_name || 'Agency Owner'

    const body = await req.json()
    const { type, planId, minutes } = body

    if (!type || !['subscription', 'topup'].includes(type)) {
      return NextResponse.json({ error: 'Invalid checkout type' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${appUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`
    const cancelUrl = `${appUrl}/dashboard/billing?success=false`

    // Get or create Stripe Customer
    const stripeCustomerId = await getOrCreateCustomer(
      userData.agency_id,
      userData.email,
      agencyName,
      supabase
    )

    let sessionParams: any = {
      customer: stripeCustomerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ['card'],
      metadata: {
        agency_id: userData.agency_id,
        type,
      },
    }

    if (type === 'subscription') {
      // Plan mapping
      let planName = 'Starter Plan'
      let amount = 9900 // $99
      let setupFee = 30000 // $300 (Optional setup fee)

      if (planId === 'growth') {
        planName = 'Growth Plan'
        amount = 19900 // $199
      } else if (planId === 'pro') {
        planName = 'Pro Plan'
        amount = 29900 // $299
      }

      sessionParams.mode = 'subscription'
      sessionParams.metadata.plan = planId
      sessionParams.line_items = [
        {
          price_data: {
            currency: 'usd',
            recurring: { interval: 'month' },
            product_data: {
              name: planName,
              description: `VoxAgent subscription - includes monthly voice assistant minute allowance.`
            },
            unit_amount: amount,
          },
          quantity: 1,
        }
      ]
    } else {
      // Top-up mapping
      let bundleName = '100 Minutes Bundle'
      let amount = 2500 // $25
      let topupMinutes = 100

      if (Number(minutes) === 500) {
        bundleName = '500 Minutes Bundle'
        amount = 10000 // $100
        topupMinutes = 500
      } else if (Number(minutes) === 1000) {
        bundleName = '1,000 Minutes Bundle'
        amount = 18000 // $180
        topupMinutes = 1000
      }

      sessionParams.mode = 'payment'
      sessionParams.metadata.type = 'topup'
      sessionParams.metadata.minutes = topupMinutes.toString()
      sessionParams.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: bundleName,
              description: `One-time top-up pack. Minutes will be credited to your balance instantly.`
            },
            unit_amount: amount,
          },
          quantity: 1,
        }
      ]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return NextResponse.json({ url: session.url })

  } catch (error: any) {
    console.error('[STRIPE CHECKOUT ERROR]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
