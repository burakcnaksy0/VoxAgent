'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export function LaunchButton({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLaunch = async () => {
    if (!confirm('Are you sure you want to launch this campaign? This will start calling all pending leads.')) return
    
    setIsLoading(true)
    try {
      const res = await fetch('/api/campaigns/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to launch campaign')
      
      toast.success('Campaign launched successfully!')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="gradient" 
      className="gap-2" 
      onClick={handleLaunch}
      loading={isLoading}
    >
      <Play className="w-4 h-4" />
      {isLoading ? 'Launching...' : 'Launch Campaign'}
    </Button>
  )
}
