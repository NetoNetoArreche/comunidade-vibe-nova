'use client'

import { useState } from 'react'
import { 
  Home, 
  MessageCircle, 
  Briefcase, 
  Trophy, 
  Users, 
  Calendar,
  Folder
} from 'lucide-react'

export type PageType = 'home' | 'chat' | 'jobs' | 'leaderboard' | 'events' | 'members' | 'projects' | 'lessons' | 'profile' | 'admin' | 'kiwify-settings'

interface NavigationProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
  className?: string
}

export default function Navigation({ currentPage, onPageChange, className = '' }: NavigationProps) {
  const navigationItems = [
    { id: 'home' as PageType, label: 'Home', icon: Home },
    { id: 'chat' as PageType, label: 'Chat', icon: MessageCircle },
    { id: 'jobs' as PageType, label: 'Vagas', icon: Briefcase },
    { id: 'leaderboard' as PageType, label: 'Ranking', icon: Trophy },
    { id: 'events' as PageType, label: 'Eventos', icon: Calendar },
    { id: 'members' as PageType, label: 'Membros', icon: Users },
    { id: 'projects' as PageType, label: 'Projetos', icon: Folder },
  ]

  const isMobile = className.includes('flex-col')

  return (
    <nav className={`${isMobile ? 'flex flex-col space-y-1' : 'flex items-center space-x-1'} ${className}`}>
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = currentPage === item.id
        
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors w-full text-left ${
              isActive
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="h-5 w-5 mr-2" />
            <span className={isMobile ? 'block' : 'hidden md:block'}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
