import type { Metadata } from 'next'
import { Bot, CheckCircle, Sparkles } from 'lucide-react'
import { ElegantShape } from '@/components/ui/shape-landing-hero'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your VoxAgent agency dashboard',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#030303] text-white">
      {/* Left: Tech Showcase Panel */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 flex-col justify-between p-12 bg-gradient-to-b from-[#080808] to-[#030303] border-r border-white/5 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/[0.03] blur-[120px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-rose-500/[0.03] blur-[120px] -z-10" />
        
        {/* Floating geometric shapes on left panel */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ElegantShape
            delay={0.3}
            width={450}
            height={100}
            rotate={8}
            gradient="from-indigo-500/[0.12]"
            className="left-[-10%] top-[20%]"
          />
          <ElegantShape
            delay={0.6}
            width={250}
            height={60}
            rotate={-20}
            gradient="from-rose-500/[0.12]"
            className="right-[5%] bottom-[20%]"
          />
        </div>
        
        {/* Tech Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VoxAgent
          </span>
        </div>

        {/* Center: Interactive AI Visual / Stats Card */}
        <div className="my-auto space-y-12 relative z-10 max-w-lg">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-300">Outbound Call Campaigns</span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Scale Your Voice Operations with <span className="text-indigo-400">AI Agents</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Launch human-like voice agents that dial thousands of leads, qualify them in real-time, and schedule meetings directly into your calendar.
            </p>
          </div>

          {/* Live Call Activity widget */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-xl p-6 space-y-4 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-slate-200">Live Campaign Status</span>
              </div>
              <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">98% Success Rate</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Outbound Calls Today</span>
                <span className="font-semibold text-slate-200">12,482</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <div className="flex-1 bg-white/5 rounded-lg p-2.5 text-center border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Active Agents</p>
                <p className="text-lg font-bold text-indigo-400">150</p>
              </div>
              <div className="flex-1 bg-white/5 rounded-lg p-2.5 text-center border border-white/5">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Connected</p>
                <p className="text-lg font-bold text-emerald-400">42</p>
              </div>
            </div>
          </div>

          {/* Feature bullet points */}
          <ul className="space-y-3">
            {[
              'Fully white-labeled custom portals',
              'Advanced RAG knowledge base integration',
              'Automated billing and Stripe analytics',
            ].map((text, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom Footer */}
        <div className="text-xs text-slate-500 relative z-10">
          © {new Date().getFullYear()} VoxAgent. All rights reserved.
        </div>
      </div>

      {/* Right: Authentication Form Area */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-6 flex flex-col justify-center items-center p-8 lg:p-16 relative bg-[#030303] overflow-hidden">
        {/* Ambient glows behind card */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03] blur-3xl pointer-events-none" />
        
        {/* Floating geometric shapes on right panel */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ElegantShape
            delay={0.5}
            width={320}
            height={80}
            rotate={-12}
            gradient="from-indigo-500/[0.12]"
            className="right-[-5%] top-[10%]"
          />
          <ElegantShape
            delay={0.8}
            width={220}
            height={60}
            rotate={15}
            gradient="from-rose-500/[0.12]"
            className="left-[5%] bottom-[15%]"
          />
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Logo only visible on mobile (hidden on lg screens) */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              VoxAgent
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
