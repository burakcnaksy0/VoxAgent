import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const agencyId = session.metadata?.agency_id
        if (!agencyId || !session.subscription) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id
        const plan = getPlanFromPriceId(priceId)

        await supabase.from('agencies').update({
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          plan,
          plan_status: 'active',
        }).eq('id', agencyId)

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const agencyId = subscription.metadata?.agency_id
        if (!agencyId) break

        const priceId = subscription.items.data[0]?.price.id
        const plan = getPlanFromPriceId(priceId)

        await supabase.from('agencies').update({
          plan,
          plan_status: subscription.status === 'active' ? 'active' :
            subscription.status === 'past_due' ? 'past_due' :
            subscription.status === 'canceled' ? 'cancelled' : 'active',
          stripe_price_id: priceId,
        }).eq('id', agencyId)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const agencyId = subscription.metadata?.agency_id
        if (!agencyId) break

        await supabase.from('agencies').update({
          plan: 'trial',
          plan_status: 'cancelled',
          stripe_subscription_id: null,
        }).eq('id', agencyId)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase.from('agencies').update({
          plan_status: 'past_due',
        }).eq('stripe_customer_id', customerId)

        break
      }
    }
  } catch (error) {
    console.error('Stripe webhook processing error:', error)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
