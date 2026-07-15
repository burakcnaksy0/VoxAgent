'use client'

import React, { useState, MouseEvent } from 'react'

export interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  radialGradientSize?: number
  spotlightColor?: string
}

export function CardSpotlight({
  children,
  className = '',
  radialGradientSize = 350,
  spotlightColor = 'rgba(124, 58, 237, 0.15)',
  ...props
}: CardSpotlightProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-6 transition-all duration-300 hover:border-violet-500/35 ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition duration-300"
        style={{
          background: isHovered
            ? `radial-gradient(${radialGradientSize}px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 80%)`
            : '',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
