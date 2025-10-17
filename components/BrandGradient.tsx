'use client'

import { ReactNode } from 'react'

interface BrandGradientProps {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'accent'
}

export default function BrandGradient({ 
  children, 
  className = '', 
  variant = 'primary' 
}: BrandGradientProps) {
  const gradientClasses = {
    primary: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600',
    secondary: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    accent: 'bg-gradient-to-r from-blue-500 to-purple-600'
  }

  return (
    <div className={`${gradientClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}
