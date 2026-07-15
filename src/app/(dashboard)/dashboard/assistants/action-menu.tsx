'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { EditAssistantModal } from './edit-modal'

interface AssistantActionMenuProps {
  assistant: any
}

export function AssistantActionMenu({ assistant }: AssistantActionMenuProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/assistants/${assistant.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete assistant')
      
      toast.success('Assistant deleted successfully')
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
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
        className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/5"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-background border border-border/50 shadow-xl rounded-lg py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => setIsEditOpen(true)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50 flex items-center gap-2 text-foreground"
          >
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-red-500/10 flex items-center gap-2 text-red-500"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}

      {/* Modals */}
      <EditAssistantModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        assistant={assistant} 
      />
      
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Assistant"
        description={`Are you sure you want to delete "${assistant.name}"? This will also remove it from VAPI and cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  )
}
