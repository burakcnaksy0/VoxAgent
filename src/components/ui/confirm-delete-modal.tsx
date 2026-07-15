'use client'

import { Modal } from './modal'
import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  isDeleting?: boolean
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting = false
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center pb-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
