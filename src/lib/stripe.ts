import Stripe from 'stripe'

// Initialize Stripe. If the secret key is missing, we use a placeholder to avoid breaking builds.
const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_please_update_in_env_file'

export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any, // standard API version
  typescript: true,
})

/**
 * Gets or creates a Stripe Customer for an Agency
 */
export async function getOrCreateCustomer(agencyId: string, email: string, name: string, supabaseAdmin: any) {
  // Try fetching existing customer from DB first
  const { data: agency } = await supabaseAdmin
    .from('agencies')
    .select('stripe_customer_id')
    .eq('id', agencyId)
    .single()

  if (agency?.stripe_customer_id) {
    return agency.stripe_customer_id
  }

  // If not exists, create customer in Stripe
  console.log(`[STRIPE] Creating customer for agency ${agencyId} (${email})...`)
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      agency_id: agencyId,
    },
  })

  // Update DB
  await supabaseAdmin
    .from('agencies')
    .update({ stripe_customer_id: customer.id })
    .eq('id', agencyId)

  return customer.id
}
