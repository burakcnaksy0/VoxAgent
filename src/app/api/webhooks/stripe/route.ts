import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: any

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Missing Stripe webhook signature or secret in production environment!')
        return NextResponse.json({ error: 'Signature verification required in production' }, { status: 401 })
      }
      // If we are developing locally and webhook secret is not set yet, parse directly
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set. Skipping signature verification (ONLY FOR DEV MODE).')
      event = JSON.parse(body)
    }
  } catch (err: any) {
    console.error(`❌ Stripe webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`)
  const supabase = await createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const agencyId = session.metadata?.agency_id
        const checkoutType = session.metadata?.type

        if (!agencyId) {
          console.error('[STRIPE WEBHOOK] Missing agency_id in session metadata')
          break
        }

        if (checkoutType === 'topup') {
          const topupMinutes = Number(session.metadata?.minutes || 0)
          console.log(`[STRIPE WEBHOOK] Top-up checkout completed for agency ${agencyId}. Adding ${topupMinutes} minutes.`)

          // 1. Try calling the atomic PostgreSQL increment function first
          const { error: rpcError } = await supabase.rpc('increment_agency_additional_minutes', {
            target_agency_id: agencyId,
            minutes_to_add: topupMinutes
          })

          if (!rpcError) {
            console.log(`[STRIPE WEBHOOK] Successfully added minutes atomically via RPC.`)
          } else {
            console.warn(`[STRIPE WEBHOOK] RPC failed (code: ${rpcError.code}). Falling back to manual memory update...`)

            // 2. Fallback: Retrieve current additional_minutes
            const { data: agency } = await supabase
              .from('agencies')
              .select('additional_minutes')
              .eq('id', agencyId)
              .single()

            const currentAdditional = Number(agency?.additional_minutes || 0)
            const newAdditional = currentAdditional + topupMinutes

            const { error: updateError } = await supabase
              .from('agencies')
              .update({ additional_minutes: newAdditional })
              .eq('id', agencyId)

            if (updateError) throw updateError
            console.log(`[STRIPE WEBHOOK FALLBACK] Successfully added minutes. New balance: ${newAdditional} mins.`)
          }
        } else if (checkoutType === 'subscription') {
          const plan = session.metadata?.plan || 'starter'
          const subscriptionId = session.subscription

          console.log(`[STRIPE WEBHOOK] Subscription checkout completed for agency ${agencyId}. Plan: ${plan}`)

          const { error } = await supabase
            .from('agencies')
            .update({
              stripe_subscription_id: subscriptionId,
              plan: plan,
              plan_status: 'active',
            })
            .eq('id', agencyId)

          if (error) throw error
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer
        const planStatus = subscription.status // e.g. active, past_due, trialing, unpaid
        
        // Find agency by Stripe customer ID
        const { data: agency } = await supabase
          .from('agencies')
          .select('id, plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (agency) {
          console.log(`[STRIPE WEBHOOK] Subscription updated for agency ${agency.id}. Status: ${planStatus}`)
          
          await supabase
            .from('agencies')
            .update({
              plan_status: planStatus === 'active' || planStatus === 'trialing' ? 'active' : 'past_due',
            })
            .eq('id', agency.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        const { data: agency } = await supabase
          .from('agencies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (agency) {
          console.log(`[STRIPE WEBHOOK] Subscription cancelled/deleted for agency ${agency.id}`)
          
          await supabase
            .from('agencies')
            .update({
              plan: 'trial',
              plan_status: 'cancelled',
              stripe_subscription_id: null,
            })
            .eq('id', agency.id)
        }
        break
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error(`[STRIPE WEBHOOK ERROR]:`, error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
