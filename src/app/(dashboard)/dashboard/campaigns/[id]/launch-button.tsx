'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Play, AlertTriangle } from 'lucide-react'

export function LaunchButton({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)

  const handleLaunch = async () => {
    setIsLoading(true)
    setShowModal(false)
    setLaunchError(null)

    try {
      const res = await fetch('/api/campaigns/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to launch campaign')

      // Check launch results
      if (data.summary) {
        const { total, dispatched, failed, results } = data.summary

        if (failed > 0 && dispatched === 0) {
          // All calls failed
          const firstError = results?.[0]?.error || 'Unknown error'
          const isTransportError = firstError.includes('error-get-transport')

          if (isTransportError) {
            setLaunchError(
              'VAPI could not connect to your phone provider (Twilio). ' +
              'Please check: 1) Your VAPI billing is active, 2) Twilio credentials are correct in VAPI Dashboard, ' +
              '3) The destination number is verified in Twilio (trial accounts).'
            )
            toast.error('All calls failed: Phone provider connection error', { duration: 8000 })
          } else {
            setLaunchError(`All ${failed} call(s) failed. Error: ${firstError}`)
            toast.error(`Campaign launch failed: ${firstError}`, { duration: 6000 })
          }
        } else if (failed > 0) {
          toast.warning(`Campaign launched: ${dispatched} dispatched, ${failed} failed`, { duration: 5000 })
        } else {
          toast.success(`Campaign launched! ${dispatched} call(s) dispatched successfully.`)
        }
      } else {
        toast.success('Campaign launched successfully!')
      }

      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
      setLaunchError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button 
        variant="gradient" 
        className="gap-2" 
        onClick={() => setShowModal(true)}
        disabled={isLoading}
      >
        <Play className="w-4 h-4" />
        {isLoading ? 'Launching...' : 'Launch Campaign'}
      </Button>

      {/* Error Details Banner */}
      {launchError && (
        <div className="mt-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">Launch Error</p>
              <p className="text-xs text-red-200/80 mt-1">{launchError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827]/90 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Launch Campaign</h3>
            </div>
            <p className="text-sm text-[#94A3B8] mb-6">
              Are you sure you want to launch this campaign? This will start calling all pending leads immediately.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                onClick={handleLaunch}
                loading={isLoading}
              >
                Yes, Launch Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

