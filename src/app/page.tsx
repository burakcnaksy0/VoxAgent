'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot, PhoneCall, Zap } from 'lucide-react'
import { HeroGeometric } from '@/components/ui/shape-landing-hero'
import { CardSpotlight } from '@/components/ui/card-spotlight'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen overflow-hidden selection:bg-[#6366F1]/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b-0 border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#c084fc] flex items-center justify-center glow-primary">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">VoxAgent</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="btn-primary text-sm px-4 py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroGeometric
        badge="VoxAgent v2.0 is now live"
        title1="Launch Your"
        title2="AI Voice Agency"
        subtitle="White-label AI voice agents that automate calls, book appointments, and scale your business globally. Seamlessly integrate with your existing workflow."
        buttons={{
          primary: {
            text: 'Start Free Trial',
            onClick: () => router.push('/login')
          },
          secondary: {
            text: 'View Features',
            onClick: () => {
              const el = document.getElementById('features')
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' })
              }
            }
          }
        }}
      />

      {/* Features Section - Scroll Triggered */}
      <section id="features" className="py-24 relative px-6 bg-slate-950/80">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why choose VoxAgent?</h2>
            <p className="text-[#94a3b8] max-w-2xl mx-auto">Everything you need to run a modern, automated calling agency without the overhead.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <PhoneCall className="w-6 h-6 text-[#6366F1]" />,
                title: 'Human-like Voice AI',
                desc: 'Our models are trained to pause, breathe, and react naturally in real-time conversations.',
                spotlight: 'rgba(99, 102, 241, 0.15)'
              },
              {
                icon: <Zap className="w-6 h-6 text-[#059669]" />,
                title: 'Instant Integrations',
                desc: 'Connect with your CRM, calendar, and payment systems in just a few clicks.',
                spotlight: 'rgba(5, 150, 105, 0.15)'
              },
              {
                icon: <Bot className="w-6 h-6 text-[#c084fc]" />,
                title: 'White-Label Dashboard',
                desc: 'Provide your clients with their own branded dashboard to track call analytics and ROI.',
                spotlight: 'rgba(192, 132, 252, 0.15)'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className="h-full"
              >
                <CardSpotlight 
                  spotlightColor={feature.spotlight}
                  className="h-full border border-white/5 bg-slate-900/20 p-8"
                >
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-[#94a3b8] leading-relaxed">{feature.desc}</p>
                </CardSpotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="py-24 px-6 bg-slate-950">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl rounded-3xl glass-card border-[#059669]/30 p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#059669]/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to scale your agency?</h2>
            <p className="text-[#94a3b8] mb-10 text-lg max-w-xl mx-auto">
              Join hundreds of agencies already using VoxAgent to automate their sales and support.
            </p>
            <Link href="/login" className="btn-primary text-lg glow-accent !bg-[#059669] hover:!bg-[#047857]">
              Start Building Today
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
