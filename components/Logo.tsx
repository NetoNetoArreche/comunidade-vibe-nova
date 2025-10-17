'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Rocket } from 'lucide-react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'medium', showText = true, className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  
  const sizeClasses = {
    small: {
      container: 'h-16 w-auto',
      image: { width: 64, height: 64 },
      text: 'text-lg',
      spacing: 'ml-3'
    },
    medium: {
      container: 'h-28 w-auto',
      image: { width: 140, height: 140 },
      text: 'text-xl',
      spacing: 'ml-4'
    },
    large: {
      container: 'h-20 w-auto',
      image: { width: 80, height: 80 },
      text: 'text-2xl',
      spacing: 'ml-5'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image */}
      <div className={`${currentSize.container} flex items-center justify-center transform hover:scale-105 transition-transform duration-200`}>
        {!imageError ? (
          <Image
            src="/logo/logo.png"
            alt="Comunidade IA Code"
            width={currentSize.image.width}
            height={currentSize.image.height}
            className="object-contain"
            priority
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          // Fallback icon se a imagem não carregar
          <div className={`${currentSize.container} rounded-xl bg-gradient-to-r from-primary-600 to-primary-800 flex items-center justify-center shadow-lg`}>
            <Rocket className={`${currentSize.image.width < 50 ? 'h-7 w-7' : currentSize.image.width < 70 ? 'h-10 w-10' : 'h-12 w-12'} text-white transform rotate-45`} />
          </div>
        )}
      </div>
      
      {/* Brand Text */}
      {showText && (
        <div className={currentSize.spacing}>
          <span className={`${currentSize.text} font-bold text-gray-900 dark:text-white`}>
            Vibe Coding
          </span>
        </div>
      )}
    </div>
  )
}
