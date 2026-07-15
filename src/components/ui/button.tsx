'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
}

const variantStyles = {
  default: 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/25 border border-[#7C3AED]/50',
  gradient: 'bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] border border-white/10',
  destructive: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 shadow-lg shadow-red-500/10',
  outline: 'border border-white/20 bg-transparent hover:bg-white/5 text-white',
  secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-md shadow-lg',
  ghost: 'hover:bg-white/5 text-[#94A3B8] hover:text-white',
  link: 'text-[#7C3AED] underline-offset-4 hover:underline',
}

const sizeStyles = {
  default: 'h-11 px-5 py-2 text-sm',
  sm: 'h-9 px-4 text-xs',
  lg: 'h-14 px-10 text-base',
  icon: 'h-11 w-11',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileTap={{ scale: 0.96 }}
        whileHover={{ y: -1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold',
          'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[#7C3AED] disabled:pointer-events-none disabled:opacity-50',
          'cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
