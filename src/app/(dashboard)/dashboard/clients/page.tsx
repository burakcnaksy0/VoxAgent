'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Users, Plus, Phone, MessageSquare, Mail } from 'lucide-react'
import { ClientActionMenu } from './action-menu'
import { toast } from 'sonner'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    fallback_channel: 'none'
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      if (res.ok) setClients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Failed to add client')
      toast.success('Client added successfully')
      setFormData({ name: '', phone: '', email: '', fallback_channel: 'none' })
      fetchClients()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Clients Directory
          </h1>
          <p className="text-muted-foreground mt-1">Manage your contacts and their fallback preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add Client Form */}
        <Card className="glass-card h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              Add New Client
            </CardTitle>
            <CardDescription>Add a contact to receive fallback messages.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input 
                  required 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input 
                  required 
                  placeholder="+1234567890" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input 
                  type="email"
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Fallback Channel</Label>
                <Select 
                  value={formData.fallback_channel}
                  onChange={(e) => setFormData({...formData, fallback_channel: e.target.value})}
                >
                  <option value="none">None (No automatic messages)</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  AI will send a message via this channel if the call is unanswered.
                </p>
              </div>
              <Button type="submit" variant="gradient" className="w-full mt-2" loading={isAdding}>
                Save Client
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading clients...</p>
            ) : clients.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border rounded-lg bg-accent/20">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No clients found</p>
                <p className="text-sm text-muted-foreground">Add your first client from the left panel.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map(client => (
                  <div key={client.id} className="p-4 rounded-lg bg-accent/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-accent/50">
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </span>
                        {client.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="w-3 h-3" /> {client.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-2">
                        {client.fallback_channel === 'whatsapp' ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp Fallback
                          </Badge>
                        ) : client.fallback_channel === 'sms' ? (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <MessageSquare className="w-3 h-3 mr-1" /> SMS Fallback
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No Fallback
                          </Badge>
                        )}
                      </div>
                      <ClientActionMenu client={client} onSuccess={fetchClients} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}
