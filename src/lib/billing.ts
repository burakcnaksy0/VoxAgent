/**
 * Billing and Minutes Allowance Helper functions
 */

/**
 * Deducts call duration in minutes from agency's allowance & topup minutes.
 */
export async function deductCallDuration(agencyId: string, durationSeconds: number, supabase: any) {
  if (durationSeconds <= 0) return

  const minutesUsed = durationSeconds / 60
  const period = new Date().toISOString().slice(0, 7) // YYYY-MM

  console.log(`[BILLING] Processing deduction of ${minutesUsed.toFixed(2)} minutes for agency ${agencyId}...`)

  try {
    // 1. Fetch agency plan details first to map limit (needed for both RPC default and fallback)
    const { data: agency, error: agencyErr } = await supabase
      .from('agencies')
      .select('plan, additional_minutes')
      .eq('id', agencyId)
      .single()

    if (agencyErr || !agency) {
      console.error('[BILLING ERROR] Could not fetch agency for deduction:', agencyErr)
      return
    }

    // Map plan to monthly limit
    let limit = 10 // default trial
    if (agency.plan === 'starter') limit = 450
    else if (agency.plan === 'growth') limit = 1100
    else if (agency.plan === 'pro') limit = 1800
    else if (agency.plan === 'enterprise') limit = 10000

    // 2. Try calling the atomic PostgreSQL function first
    const { error: rpcError } = await supabase.rpc('deduct_agency_minutes', {
      target_agency_id: agencyId,
      minutes_to_add: minutesUsed,
      current_period: period,
      default_limit: limit
    })

    if (!rpcError) {
      console.log(`[BILLING] Successfully completed atomic database deduction via RPC.`)
      return
    }

    // If function does not exist (code 42883 or PGRST202), fall back to manual memory logic
    console.warn(`[BILLING] RPC execution failed (code: ${rpcError.code || 'unknown'}). Falling back to manual calculation...`)

    // 3. Fallback: Fetch or create current month's billing usage
    const { data: usage } = await supabase
      .from('billing_usage')
      .select('minutes_used, minutes_limit')
      .eq('agency_id', agencyId)
      .eq('period', period)
      .maybeSingle()

    const currentUsed = Number(usage?.minutes_used || 0)
    const currentLimit = Number(usage?.minutes_limit || limit)
    const targetUsed = currentUsed + minutesUsed

    // 4. Fallback: Update the monthly usage table
    await supabase
      .from('billing_usage')
      .upsert({
        agency_id: agencyId,
        period,
        minutes_used: targetUsed,
        minutes_limit: currentLimit,
      }, { onConflict: 'agency_id,period' })

    // 5. Fallback: Calculate if we need to deduct from top-up (additional_minutes)
    const prevMax = Math.max(currentUsed, currentLimit)
    const overageToDeduct = targetUsed - prevMax

    if (overageToDeduct > 0) {
      const currentAdditional = Number(agency.additional_minutes || 0)
      const newAdditional = Math.max(0, currentAdditional - overageToDeduct)

      await supabase
        .from('agencies')
        .update({ additional_minutes: newAdditional })
        .eq('id', agencyId)

      console.log(`[BILLING FALLBACK] Deducted ${overageToDeduct.toFixed(2)} mins from additional balance. Remaining: ${newAdditional.toFixed(2)} mins.`)
    }
  } catch (error) {
    console.error('[BILLING ERROR] Failed to deduct call duration:', error)
  }
}

/**
 * Calculates remaining available minutes (monthly allowance + topup balance)
 */
export async function getAvailableMinutes(agencyId: string, supabase: any): Promise<number> {
  try {
    const { data: agency } = await supabase
      .from('agencies')
      .select('plan, additional_minutes')
      .eq('id', agencyId)
      .single()

    if (!agency) return 0

    let limit = 10
    if (agency.plan === 'starter') limit = 450
    else if (agency.plan === 'growth') limit = 1100
    else if (agency.plan === 'pro') limit = 1800
    else if (agency.plan === 'enterprise') limit = 10000

    const period = new Date().toISOString().slice(0, 7)
    const { data: usage } = await supabase
      .from('billing_usage')
      .select('minutes_used, minutes_limit')
      .eq('agency_id', agencyId)
      .eq('period', period)
      .maybeSingle()

    const currentUsed = Number(usage?.minutes_used || 0)
    const currentLimit = Number(usage?.minutes_limit || limit)

    const remainingAllowance = Math.max(0, currentLimit - currentUsed)
    const additional = Number(agency.additional_minutes || 0)

    return remainingAllowance + additional
  } catch (error) {
    console.error('[BILLING ERROR] Failed to calculate available minutes:', error)
    return 0
  }
}
