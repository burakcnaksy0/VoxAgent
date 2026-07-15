'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardSpotlight } from '@/components/ui/card-spotlight'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      console.error('Supabase signup error:', error)
      toast.error(error.message || 'An error occurred during signup: ' + JSON.stringify(error))
      setLoading(false)
      return
    }

    toast.success('Account created! Redirecting to your dashboard...')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <CardSpotlight 
      spotlightColor="rgba(124, 58, 237, 0.12)"
      className="fade-in bg-slate-900/30 border-white/5 shadow-2xl p-8"
    >
      <div className="text-center pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">14-day free trial</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Start your agency</h2>
        <p className="text-sm text-slate-400 mt-1">Launch your AI calling platform in minutes</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-300">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="name"
              type="text"
              placeholder="John Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">Work Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          className="w-full mt-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-violet-500/20 font-semibold"
          loading={loading}
        >
          Create Free Account <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      {/* Feature bullets */}
      <div className="mt-6 space-y-2 bg-white/5 p-3 rounded-xl border border-white/5">
        {[
          'No credit card required',
          'White-label your own dashboard',
          '100 free call minutes included',
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {feature}
          </div>
        ))}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0A0F1D] px-3 text-slate-400 font-medium">Already have an account?</span>
        </div>
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center w-full h-11 px-4 rounded-xl border border-white/10 bg-transparent text-sm font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all duration-200"
      >
        Sign in instead
      </Link>
    </CardSpotlight>
  )
}
