'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { EditCampaignModal } from './edit-modal'

interface CampaignActionMenuProps {
  campaign: any
}

export function CampaignActionMenu({ campaign }: CampaignActionMenuProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete campaign')
      
      toast.success('Campaign deleted successfully')
      setIsDeleteOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.preventDefault(); setIsMenuOpen(!isMenuOpen); }}
        onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
        className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/5"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-background border border-border/50 shadow-xl rounded-lg py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={(e) => { e.preventDefault(); setIsEditOpen(true); }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 text-foreground"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setIsDeleteOpen(true); }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-red-500/10 flex items-center gap-2 text-red-500"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}

      {/* Modals */}
      <EditCampaignModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        campaign={campaign} 
      />
      
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  )
}
