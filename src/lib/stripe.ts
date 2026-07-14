import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
})

/**
 * Create or retrieve a Stripe customer for an agency
 */
export async function getOrCreateStripeCustomer(agencyId: string, email: string, name: string): Promise<string> {
  const existing = await stripe.customers.search({
    query: `metadata['agency_id']:'${agencyId}'`,
    limit: 1,
  })

  if (existing.data.length > 0) {
    return existing.data[0].id
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { agency_id: agencyId },
  })

  return customer.id
}

/**
 * Create a Stripe Checkout session for plan subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  agencyId,
  successUrl,
  cancelUrl,
}: {
  customerId: string
  priceId: string
  agencyId: string
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { agency_id: agencyId },
    subscription_data: {
      metadata: { agency_id: agencyId },
      trial_period_days: 0,
    },
  })
}

/**
 * Create a billing portal session for self-serve plan management
 */
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

/**
 * Get plan name from price ID
 */
export function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID || '']: 'starter',
    [process.env.STRIPE_GROWTH_PRICE_ID || '']: 'growth',
    [process.env.STRIPE_PRO_PRICE_ID || '']: 'pro',
  }
  return priceMap[priceId] || 'trial'
}

/**
 * Get price ID from plan name
 */
export function getPriceIdFromPlan(plan: string): string | null {
  const planMap: Record<string, string> = {
    'starter': process.env.STRIPE_STARTER_PRICE_ID || 'price_dummy_starter',
    'growth': process.env.STRIPE_GROWTH_PRICE_ID || 'price_dummy_growth',
    'pro': process.env.STRIPE_PRO_PRICE_ID || 'price_dummy_pro',
  }
  return planMap[plan] || null
}
