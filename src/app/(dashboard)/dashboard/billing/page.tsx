'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, CreditCard, Activity, AlertCircle } from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    interval: '/month',
    description: 'Perfect for small agencies getting started with AI.',
    features: ['5 AI Assistants', '1,000 Included Minutes', 'Standard Support', 'Basic Analytics'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$149',
    interval: '/month',
    description: 'For growing agencies with multiple active clients.',
    features: ['20 AI Assistants', '5,000 Included Minutes', 'Priority Support', 'Advanced Analytics', 'Custom Voice Cloning'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$399',
    interval: '/month',
    description: 'Unlimited potential for established enterprises.',
    features: ['Unlimited AI Assistants', '15,000 Included Minutes', 'Dedicated Account Manager', 'White-label Domain', 'API Access'],
  }
]

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [agencyData, setAgencyData] = useState<any>(null)
  
  useEffect(() => {
    // In a real app we fetch the current agency plan and billing usage here via an API or Server Component
    // For MVP, we simulate fetching the data
    setTimeout(() => {
      setAgencyData({
        plan: 'trial', // or 'starter', 'growth'
        plan_status: 'active',
        trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        usage: { minutes_used: 120, minutes_limit: 500 }
      })
    }, 500)
  }, [])

  const handleCheckout = async (planId: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to start checkout')
      }
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  if (!agencyData) {
    return <div className="p-8 text-center animate-pulse">Loading billing details...</div>
  }

  const usagePercent = (agencyData.usage.minutes_used / agencyData.usage.minutes_limit) * 100

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Manage your plan, payment methods, and monitor usage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Current Plan Overview */}
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-border/50 bg-accent/10 rounded-lg p-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Active Plan</p>
                <h3 className="text-2xl font-bold capitalize mt-1 text-foreground">{agencyData.plan} Plan</h3>
                {agencyData.plan === 'trial' && (
                  <p className="text-sm text-amber-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Trial ends in 5 days
                  </p>
                )}
              </div>
              <Button variant="outline" className="shrink-0" onClick={() => toast.info('Portal coming soon!')}>
                Manage Billing Portal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Monthly Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Voice Minutes</span>
                <span className="font-medium text-foreground">
                  {agencyData.usage.minutes_used} / {agencyData.usage.minutes_limit} min
                </span>
              </div>
              <div className="w-full bg-accent rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${usagePercent > 80 ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Overage minutes are billed at $0.15/min at the end of the billing cycle.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Cards */}
      <div className="pt-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={`glass-card flex flex-col relative overflow-hidden ${agencyData.plan === plan.id ? 'border-primary ring-1 ring-primary/50' : 'hover:border-primary/40'} transition-all duration-300`}>
              {agencyData.plan === plan.id && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  CURRENT
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.interval}</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-12" 
                  variant={agencyData.plan === plan.id ? 'outline' : 'gradient'}
                  disabled={agencyData.plan === plan.id || loading}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {agencyData.plan === plan.id ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

    </div>
  )
}
