'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'

interface EditCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: any
}

export function EditCampaignModal({ isOpen, onClose, campaign }: EditCampaignModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
      })
    }
  }, [campaign, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update campaign')
      }

      toast.success('Campaign updated successfully!')
      onClose()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Campaign" description="Update campaign details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Campaign Name *</Label>
          <Input 
            required 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
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
