'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { BarChart3, TrendingUp, Phone, Clock, DollarSign, Bot } from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280']

export default function AnalyticsPage() {
  const [days, setDays] = useState('30')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics?days=${days}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch analytics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [days])

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Detailed performance metrics and costs</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <div className="w-40">
            <Select value={days} onChange={(e) => setDays(e.target.value)}>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </Select>
          </div>
        </div>
      </div>

      {!data || loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="animate-pulse flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Loading analytics data...
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Calls</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{data.summary.totalCalls}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Minutes Used</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{data.summary.totalMinutes}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Cost</p>
                    <p className="text-3xl font-bold text-foreground mt-1">${data.summary.totalCost}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Call Volume Chart */}
            <Card className="lg:col-span-2 glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Call Volume
                </CardTitle>
                <CardDescription>Number of calls made over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        dx={-10} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="calls" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="glass-card flex flex-col">
              <CardHeader>
                <CardTitle>Call Outcomes</CardTitle>
                <CardDescription>Status distribution of all calls</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center relative">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.statusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Assistants */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-500" />
                Assistant Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topAssistants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No assistant data available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3">Assistant Name</th>
                        <th className="px-4 py-3 text-right">Total Calls</th>
                        <th className="px-4 py-3 text-right">Minutes Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topAssistants.map((ast: any, idx: number) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4 font-medium text-foreground flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                              <Bot className="w-4 h-4 text-muted-foreground" />
                            </div>
                            {ast.name}
                          </td>
                          <td className="px-4 py-4 text-right">{ast.calls}</td>
                          <td className="px-4 py-4 text-right">{ast.minutes} min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
