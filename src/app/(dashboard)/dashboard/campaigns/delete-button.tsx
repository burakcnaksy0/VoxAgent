'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'

export function DeleteCampaignButton({ id }: { id: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete campaign')
      toast.success('Campaign deleted successfully')
      setIsModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button 
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsModalOpen(true)
        }}
        disabled={isDeleting}
        className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
        title="Delete Campaign"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        description="Are you sure you want to delete this campaign? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </>
  )
}
