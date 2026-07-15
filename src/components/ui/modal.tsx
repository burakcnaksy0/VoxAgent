'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Animated Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              mass: 0.8
            }}
            className="relative z-50 w-full max-w-lg bg-[#0F172A] border border-[#7C3AED]/30 shadow-2xl rounded-2xl overflow-hidden glass-card glow-primary"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                {description && (
                  <p className="text-sm text-[#94A3B8] mt-1">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-white/10 transition-colors text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

