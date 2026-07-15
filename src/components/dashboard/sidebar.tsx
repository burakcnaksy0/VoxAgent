'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bot,
  Phone,
  Users,
  Megaphone,
  BarChart2,
  CreditCard,
  Settings,
  Zap,
  LogOut,
  Radio,
  Database,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Agency } from '@/types'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Assistants', href: '/dashboard/assistants', icon: Bot },
  { label: 'Live Calls', href: '/dashboard/calls/live', icon: Radio, badge: 'LIVE' },
  { label: 'Call History', href: '/dashboard/calls', icon: Phone },
  { label: 'Clients', href: '/dashboard/clients', icon: Users },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { label: 'Knowledge Base', href: '/dashboard/knowledge', icon: Database },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
]

const bottomItems = [
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  agency: Agency | null
}

export function Sidebar({ agency }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col glass border-r border-border z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        {agency?.logo_url ? (
          <img
            src={agency.logo_url}
            alt={agency.name}
            className="h-8 object-contain"
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">
              {agency?.name || 'VoxAgent'}
            </span>
          </div>
        )}
      </div>

      {/* Plan badge */}
      {agency && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="w-2 h-2 rounded-full bg-violet-400 pulse-green" />
            <span className="text-xs font-medium text-violet-300 capitalize">
              {agency.plan === 'trial' ? '14-day Trial' : `${agency.plan} Plan`}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 rounded px-1.5 py-0.5">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom items */}
      <div className="px-3 pb-4 space-y-1 border-t border-border pt-3">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
