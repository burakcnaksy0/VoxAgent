'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  CreditCard, 
  PhoneCall, 
  PlusCircle, 
  History, 
  ExternalLink,
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [billingData, setBillingData] = useState<{
    agency: any
    usage: any
    availableMinutes: number
    remainingAllowance: number
    totalLimit: number
  } | null>(null)

  const fetchBillingInfo = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's agency
      const { data: userData } = await supabase
        .from('users')
        .select('agency_id')
        .eq('id', user.id)
        .single()

      if (!userData?.agency_id) return

      // Fetch agency
      const { data: agency } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', userData.agency_id)
        .single()

      if (!agency) return

      // Get current period (YYYY-MM)
      const period = new Date().toISOString().slice(0, 7)

      // Fetch current month's usage
      const { data: usage } = await supabase
        .from('billing_usage')
        .select('*')
        .eq('agency_id', userData.agency_id)
        .eq('period', period)
        .maybeSingle()

      // Determine standard monthly limit
      let standardLimit = 10 // Trial
      if (agency.plan === 'starter') standardLimit = 500
      else if (agency.plan === 'growth') standardLimit = 1500
      else if (agency.plan === 'pro') standardLimit = 3000
      else if (agency.plan === 'enterprise') standardLimit = 10000

      const currentUsed = Number(usage?.minutes_used || 0)
      const currentLimit = Number(usage?.minutes_limit || standardLimit)
      
      const remainingAllowance = Math.max(0, currentLimit - currentUsed)
      const additional = Number(agency.additional_minutes || 0)
      const availableMinutes = remainingAllowance + additional
      const totalLimit = currentLimit + additional

      setBillingData({
        agency,
        usage: usage || { minutes_used: 0, minutes_limit: currentLimit },
        availableMinutes,
        remainingAllowance,
        totalLimit
      })

    } catch (error) {
      console.error('Failed to load billing info:', error)
      toast.error('Billing information could not be retrieved.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBillingInfo()
  }, [fetchBillingInfo])

  useEffect(() => {
    // Show success toast on checkout complete
    if (searchParams.get('success') === 'true') {
      toast.success('Payment completed successfully! Your balance has been updated.')
      // Clean query params
      router.replace('/dashboard/billing')
    } else if (searchParams.get('success') === 'false') {
      toast.error('Payment cancelled or failed.')
      router.replace('/dashboard/billing')
    }
  }, [searchParams, router])

  const handleCheckout = async (type: 'subscription' | 'topup', planId?: string, minutes?: number) => {
    const loadingKey = type === 'subscription' ? planId! : `topup-${minutes}`
    try {
      setCheckoutLoading(loadingKey)
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, planId, minutes }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate checkout.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleOpenPortal = async () => {
    try {
      setPortalLoading(true)
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No billing portal URL returned')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to open customer portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  const planNames: Record<string, string> = {
    trial: 'Trial Plan',
    starter: 'Starter Plan',
    growth: 'Growth Plan',
    pro: 'Pro Plan',
    enterprise: 'Enterprise Plan',
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
          Billing & Usage
        </h1>
        <p className="text-zinc-400 mt-1">
          Manage your subscriptions, view usage analytics, and buy minute packages.
        </p>
      </div>

      {/* Overview Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Plan Status Card */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-500/15 rounded-lg text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-zinc-100">Subscription Status</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-zinc-500 block uppercase tracking-wider">Current Plan</span>
              <span className="text-xl font-bold text-zinc-200 capitalize">
                {planNames[billingData?.agency.plan || 'trial']}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-500 block uppercase tracking-wider">Plan Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1 capitalize ${
                billingData?.agency.plan_status === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {billingData?.agency.plan_status || 'active'}
              </span>
            </div>
            {billingData?.agency.stripe_subscription_id && (
              <button
                onClick={handleOpenPortal}
                disabled={portalLoading}
                className="w-full mt-4 flex items-center justify-center space-x-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 px-4 text-sm font-semibold transition-all disabled:opacity-50"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                <span>Stripe Customer Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Available Credit Card */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-xl md:col-span-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/15 rounded-lg text-purple-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Minutes Balance</h3>
            </div>
            <span className="text-xs text-zinc-500">Current Month</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="sm:col-span-2 space-y-4">
              <div>
                <span className="text-3xl font-extrabold text-white">
                  {billingData?.availableMinutes.toFixed(1)} <span className="text-sm font-normal text-zinc-400">mins left</span>
                </span>
                <span className="text-zinc-500 text-xs block mt-1">
                  (Monthly Allowance: {billingData?.remainingAllowance.toFixed(1)} mins + Top-up: {Number(billingData?.agency.additional_minutes || 0).toFixed(1)} mins)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (Number(billingData?.usage.minutes_used || 0) / (billingData?.totalLimit || 1)) * 100)}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Used: {Number(billingData?.usage.minutes_used || 0).toFixed(1)} mins</span>
                  <span>Limit: {billingData?.totalLimit.toFixed(1)} mins</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/40 flex flex-col justify-center space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Top-up Balance:</span>
                <span className="font-bold text-purple-400">+{Number(billingData?.agency.additional_minutes || 0).toFixed(1)} mins</span>
              </div>
              <div className="border-t border-zinc-800/60 my-1" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Monthly Limit:</span>
                <span className="font-semibold text-zinc-300">{billingData?.usage.minutes_limit} mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Pricing Tiers */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center space-x-2">
          <span>Change Subscription Plan</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
            billingData?.agency.plan === 'starter' 
              ? 'border-indigo-500/50 bg-indigo-500/[0.02] shadow-indigo-500/5' 
              : 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Starter Plan</h3>
                {billingData?.agency.plan === 'starter' && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Active</span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white">$99</span>
                <span className="text-zinc-400 text-sm">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>500</strong> Outbound Call Minutes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Unlimited Campaigns</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>SMS Omnichannel Fallback</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('subscription', 'starter')}
              disabled={billingData?.agency.plan === 'starter' || checkoutLoading !== null}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
                billingData?.agency.plan === 'starter'
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
              }`}
            >
              {checkoutLoading === 'starter' && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{billingData?.agency.plan === 'starter' ? 'Current Plan' : 'Subscribe'}</span>
            </button>
          </div>

          {/* Growth Plan */}
          <div className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all ${
            billingData?.agency.plan === 'growth' 
              ? 'border-purple-500/50 bg-purple-500/[0.02]' 
              : 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700'
          }`}>
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Growth Plan</h3>
                {billingData?.agency.plan === 'growth' && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">Active</span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white">$199</span>
                <span className="text-zinc-400 text-sm">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>1,500</strong> Outbound Call Minutes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Unlimited Campaigns</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Priority WhatsApp & SMS Fallback</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('subscription', 'growth')}
              disabled={billingData?.agency.plan === 'growth' || checkoutLoading !== null}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
                billingData?.agency.plan === 'growth'
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/10'
              }`}
            >
              {checkoutLoading === 'growth' && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{billingData?.agency.plan === 'growth' ? 'Current Plan' : 'Subscribe'}</span>
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
            billingData?.agency.plan === 'pro' 
              ? 'border-indigo-500/50 bg-indigo-500/[0.02]' 
              : 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zinc-200">Pro Plan</h3>
                {billingData?.agency.plan === 'pro' && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Active</span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-white">$299</span>
                <span className="text-zinc-400 text-sm">/month</span>
              </div>
              <ul className="space-y-2.5 text-sm text-zinc-400 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>3,000</strong> Outbound Call Minutes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Dedicated Support Channel</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>API Access & Webhooks</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleCheckout('subscription', 'pro')}
              disabled={billingData?.agency.plan === 'pro' || checkoutLoading !== null}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
                billingData?.agency.plan === 'pro'
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
              }`}
            >
              {checkoutLoading === 'pro' && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{billingData?.agency.plan === 'pro' ? 'Current Plan' : 'Subscribe'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top-up Minutes Packages */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center space-x-2">
              <PlusCircle className="w-6 h-6 text-purple-400" />
              <span>Purchase Minute Top-ups</span>
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Need more minutes right now? Buy one-time packages that carry over and never expire.
            </p>
          </div>
          <span className="text-xs text-zinc-500 flex items-center gap-1.5 border border-zinc-800 bg-zinc-900/30 rounded-lg px-3 py-1.5 self-start">
            <Clock className="w-3.5 h-3.5" /> No expiration date
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 100 Minutes Bundle */}
          <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950/20 p-6 flex flex-col justify-between hover:border-purple-500/40 hover:bg-purple-500/[0.01] transition-all hover:scale-[1.01]">
            <div>
              <h3 className="text-lg font-bold text-zinc-200 group-hover:text-purple-300 transition-colors">100 Minutes</h3>
              <p className="text-xs text-zinc-500 mt-1">Perfect for small test runs</p>
              <div className="my-6">
                <span className="text-4xl font-black text-white">$25</span>
                <span className="text-zinc-500 text-xs block mt-1">$0.25 per minute</span>
              </div>
            </div>
            <button
              onClick={() => handleCheckout('topup', undefined, 100)}
              disabled={checkoutLoading !== null}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 group-hover:bg-purple-600 group-hover:text-white group-hover:border-transparent py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2"
            >
              {checkoutLoading === 'topup-100' && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Buy 100 Minutes</span>
            </button>
          </div>

          {/* 500 Minutes Bundle */}
          <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950/20 p-6 flex flex-col justify-between hover:border-purple-500/40 hover:bg-purple-500/[0.01] transition-all hover:scale-[1.01]">
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full shadow-md">
              Best Value
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-200 group-hover:text-purple-300 transition-colors">500 Minutes</h3>
              <p className="text-xs text-zinc-500 mt-1">Great for regular campaigns</p>
              <div className="my-6">
                <span className="text-4xl font-black text-white">$100</span>
                <span className="text-zinc-500 text-xs block mt-1">$0.20 per minute (Save 20%)</span>
              </div>
            </div>
            <button
              onClick={() => handleCheckout('topup', undefined, 500)}
              disabled={checkoutLoading !== null}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 group-hover:bg-purple-600 group-hover:text-white group-hover:border-transparent py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2"
            >
              {checkoutLoading === 'topup-500' && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Buy 500 Minutes</span>
            </button>
          </div>

          {/* 1000 Minutes Bundle */}
          <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950/20 p-6 flex flex-col justify-between hover:border-purple-500/40 hover:bg-purple-500/[0.01] transition-all hover:scale-[1.01]">
            <div>
              <h3 className="text-lg font-bold text-zinc-200 group-hover:text-purple-300 transition-colors">1,000 Minutes</h3>
              <p className="text-xs text-zinc-500 mt-1">High volume calling needs</p>
              <div className="my-6">
                <span className="text-4xl font-black text-white">$180</span>
                <span className="text-zinc-500 text-xs block mt-1">$0.18 per minute (Save 28%)</span>
              </div>
            </div>
            <button
              onClick={() => handleCheckout('topup', undefined, 1000)}
              disabled={checkoutLoading !== null}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 group-hover:bg-purple-600 group-hover:text-white group-hover:border-transparent py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2"
            >
              {checkoutLoading === 'topup-1000' && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Buy 1,000 Minutes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
