'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft, PhoneOutgoing, Bot, Users } from 'lucide-react'

export default function NewCallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [assistants, setAssistants] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [fetchingData, setFetchingData] = useState(true)

  const [formData, setFormData] = useState({
    assistantId: '',
    customerId: '',
    customerNumber: '',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [assistantsRes, clientsRes] = await Promise.all([
          fetch('/api/assistants'),
          // Simulate clients endpoint for now, ideally we have /api/clients
          fetch('/api/assistants') // temporary placeholder
        ])
        
        if (assistantsRes.ok) {
          const data = await assistantsRes.json()
          setAssistants(data || [])
          if (data?.length > 0) {
            setFormData(prev => ({ ...prev, assistantId: data[0].id }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setFetchingData(false)
      }
    }
    
    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId: formData.assistantId,
          customerNumber: formData.customerNumber,
          // If customerId is selected, we could pass it to track which sub-client it belongs to
          // customerId: formData.customerId
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate call')
      }

      toast.success('Call initiated successfully!')
      router.push('/dashboard/calls')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/calls"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 h-10 w-10 text-sm hover:bg-accent hover:text-accent-foreground text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            Make Outbound Call
            <PhoneOutgoing className="w-6 h-6 text-blue-400" />
          </h1>
          <p className="text-muted-foreground mt-1">Trigger an AI agent to call a specific number</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
          <CardDescription>Select an assistant and enter the destination phone number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="assistantId" className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Select AI Assistant *
              </Label>
              <Select 
                id="assistantId" 
                name="assistantId" 
                required 
                value={formData.assistantId} 
                onChange={handleChange}
                disabled={fetchingData || assistants.length === 0}
              >
                {fetchingData ? (
                  <option>Loading assistants...</option>
                ) : assistants.length === 0 ? (
                  <option>No assistants found. Create one first.</option>
                ) : (
                  assistants.map(assistant => (
                    <option key={assistant.id} value={assistant.id}>
                      {assistant.name} ({assistant.voice_id})
                    </option>
                  ))
                )}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerNumber">Destination Phone Number *</Label>
              <Input 
                id="customerNumber" 
                name="customerNumber" 
                required 
                placeholder="+1234567890"
                value={formData.customerNumber} 
                onChange={handleChange} 
              />
              <p className="text-xs text-muted-foreground">
                Must include country code (e.g., +1 for US/Canada, +90 for Turkey).
              </p>
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              className="w-full h-12 text-base mt-4" 
              loading={loading}
              disabled={!formData.assistantId || !formData.customerNumber}
            >
              <PhoneOutgoing className="w-4 h-4 mr-2" />
              Initiate Call
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
