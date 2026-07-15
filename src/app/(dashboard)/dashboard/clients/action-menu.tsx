'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { EditClientModal } from './edit-modal'

interface ClientActionMenuProps {
  client: any
  onSuccess: () => void
}

export function ClientActionMenu({ client, onSuccess }: ClientActionMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete client')
      
      toast.success('Client deleted successfully')
      setIsDeleteOpen(false)
      onSuccess()
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
        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent"
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
      <EditClientModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        client={client}
        onSuccess={onSuccess}
      />
      
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        description={`Are you sure you want to delete "${client.name}"?`}
        isDeleting={isDeleting}
      />
    </div>
  )
}
