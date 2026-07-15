import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PhoneOutgoing } from 'lucide-react'
import type { Metadata } from 'next'
import { CallsTable } from '@/components/dashboard/calls-table'

export const metadata: Metadata = { title: 'Call History | VoxAgent' }

export default async function CallsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
  if (!userData?.agency_id) redirect('/login')

  const { data: calls } = await supabase
    .from('calls')
    .select('*, assistants(name), sub_clients(name)')
    .eq('agency_id', userData.agency_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Call History</h1>
          <p className="text-muted-foreground mt-1">Review inbound and outbound AI voice calls</p>
        </div>
        <Link
          href="/dashboard/calls/new"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
        >
          <PhoneOutgoing className="w-4 h-4 mr-2" />
          Make Outbound Call
        </Link>
      </div>

      <CallsTable initialCalls={calls || []} />
    </div>
  )
}
