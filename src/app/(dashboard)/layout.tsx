import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import type { Agency } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch agency details
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', (await supabase.from('users').select('agency_id').eq('id', user.id).single()).data?.agency_id)
    .single()

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-hidden text-slate-100">
      {/* Dynamic background glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03] blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/[0.02] blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] rounded-full bg-rose-600/[0.02] blur-[150px] pointer-events-none -z-10" />

      {agency?.brand_color && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --color-primary: ${agency.brand_color} !important;
            --color-ring: ${agency.brand_color} !important;
          }
        `}} />
      )}
      <Sidebar agency={agency as Agency | null} />
      <main className="pl-64 relative z-10">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
