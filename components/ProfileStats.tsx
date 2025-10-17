'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Star, 
  Code, 
  Calendar,
  Award,
  Users
} from 'lucide-react'

interface ProfileStatsProps {
  user: User
  projectsCount: number
  featuredCount: number
}

interface UserStats {
  totalLikes: number
  totalComments: number
  totalPosts: number
  joinedDaysAgo: number
}

export default function ProfileStats({ user, projectsCount, featuredCount }: ProfileStatsProps) {
  const [stats, setStats] = useState<UserStats>({
    totalLikes: 0,
    totalComments: 0,
    totalPosts: 0,
    joinedDaysAgo: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserStats()
  }, [user])

  async function getUserStats() {
    try {
      // Get user's posts
      const { data: posts } = await supabase
        .from('posts')
        .select('id, created_at')
        .eq('author_id', user.id)

      // Get total likes on user's posts
      const { data: likes } = await supabase
        .from('likes')
        .select('id')
        .in('post_id', posts?.map(p => p.id) || [])

      // Get total comments on user's posts
      const { data: comments } = await supabase
        .from('comments')
        .select('id')
        .in('post_id', posts?.map(p => p.id) || [])

      // Get user profile for join date
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single()

      const joinedDate = new Date(profile?.created_at || '')
      const today = new Date()
      const joinedDaysAgo = Math.floor((today.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24))

      setStats({
        totalLikes: likes?.length || 0,
        totalComments: comments?.length || 0,
        totalPosts: posts?.length || 0,
        joinedDaysAgo
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const statItems = [
    {
      label: 'Posts',
      value: stats.totalPosts,
      icon: MessageCircle,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Curtidas',
      value: stats.totalLikes,
      icon: Heart,
      color: 'text-red-600 dark:text-red-400'
    },
    {
      label: 'Comentários',
      value: stats.totalComments,
      icon: Users,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Dias Ativo',
      value: stats.joinedDaysAgo,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-2 h-12"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {statItems.map((item, index) => {
        const Icon = item.icon
        return (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <div className="flex flex-col items-center text-center">
              <Icon className={`h-3 w-3 ${item.color} mb-1`} />
              <div className={`text-sm font-bold text-gray-900 dark:text-white`}>
                {item.value}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {item.label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
