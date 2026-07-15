'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Save } from 'lucide-react'

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: any
  onSuccess: () => void
}

export function EditClientModal({ isOpen, onClose, client, onSuccess }: EditClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    fallback_channel: 'none'
  })

  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        fallback_channel: client.fallback_channel || 'none'
      })
    }
  }, [client, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update client')
      }

      toast.success('Client updated successfully!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Client" description="Update client details and preferences">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input 
            required 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input 
            required 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Email (Optional)</Label>
          <Input 
            type="email"
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
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
