import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '30', 10)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabase.from('users').select('agency_id').eq('id', user.id).single()
    if (!userData?.agency_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    // Fetch calls in the period
    const { data: calls } = await supabase
      .from('calls')
      .select('status, duration_seconds, cost, created_at, assistants(name)')
      .eq('agency_id', userData.agency_id)
      .gte('created_at', startDateStr)

    const rawCalls = calls || []

    // 1. Daily Volume (Line Chart)
    const dailyVolumeMap: Record<string, number> = {}
    // Initialize past N days with 0
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().split('T')[0]
      dailyVolumeMap[dateKey] = 0
    }

    // 2. Status Distribution (Pie Chart)
    const statusMap: Record<string, number> = {
      completed: 0,
      'no-answer': 0,
      failed: 0,
      other: 0
    }

    // 3. Assistant Performance
    const assistantStats: Record<string, { calls: number; minutes: number }> = {}

    let totalMinutes = 0
    let totalCost = 0

    rawCalls.forEach((call: any) => {
      // Daily volume
      const dateKey = call.created_at.split('T')[0]
      if (dailyVolumeMap[dateKey] !== undefined) {
        dailyVolumeMap[dateKey] += 1
      }

      // Status
      if (call.status === 'completed') statusMap.completed += 1
      else if (call.status === 'no-answer') statusMap['no-answer'] += 1
      else if (call.status === 'failed') statusMap.failed += 1
      else statusMap.other += 1

      // Cost & Minutes
      const mins = (call.duration_seconds || 0) / 60
      totalMinutes += mins
      totalCost += (call.cost || 0)

      // Assistant Stats
      const astName = call.assistants?.name || 'Unknown'
      if (!assistantStats[astName]) {
        assistantStats[astName] = { calls: 0, minutes: 0 }
      }
      assistantStats[astName].calls += 1
      assistantStats[astName].minutes += mins
    })

    const chartData = Object.keys(dailyVolumeMap).sort().map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: dailyVolumeMap[date]
    }))

    const statusData = Object.keys(statusMap).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: statusMap[status]
    }))

    const topAssistants = Object.keys(assistantStats).map(name => ({
      name,
      calls: assistantStats[name].calls,
      minutes: Math.round(assistantStats[name].minutes)
    })).sort((a, b) => b.calls - a.calls)

    return NextResponse.json({
      summary: {
        totalCalls: rawCalls.length,
        totalMinutes: Math.round(totalMinutes),
        totalCost: totalCost.toFixed(2)
      },
      chartData,
      statusData,
      topAssistants
    })

  } catch (error: any) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
