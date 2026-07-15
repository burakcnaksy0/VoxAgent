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
    <div className="min-h-screen bg-background">
      {agency?.brand_color && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --color-primary: ${agency.brand_color} !important;
            --color-ring: ${agency.brand_color} !important;
          }
        `}} />
      )}
      <Sidebar agency={agency as Agency | null} />
      <main className="pl-64">
        <div className="min-h-screen p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
