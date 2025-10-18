'use client'

import { useState, useEffect } from 'react'
import { supabase, type Post } from '@/lib/supabase'
import Image from 'next/image'
import { TrendingUp, Heart, MessageCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PopularPost {
  id: string
  title?: string
  content: string
  image_url?: string
  created_at: string
  author: {
    full_name: string
    username: string
    avatar_url?: string
  }
  likes_count: number
  comments_count: number
  popularity_score?: number
}

export default function PopularPosts() {
  const [posts, setPosts] = useState<PopularPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPopularPosts()
  }, [])

  async function getPopularPosts() {
    try {
      // Buscar posts dos últimos 7 dias
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Buscar posts básicos
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(50)

      if (postsError || !postsData) {
        console.error('Erro ao buscar posts:', postsError)
        setLoading(false)
        return
      }

      // Buscar autores
      const authorIds = Array.from(new Set(postsData.map(post => post.author_id)))
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', authorIds)

      // Buscar estatísticas da view post_stats
      const postIds = postsData.map(post => post.id)
      const { data: statsData } = await supabase
        .from('post_stats')
        .select('post_id, likes_count, comments_count')
        .in('post_id', postIds)

      console.log('📊 Stats dos posts populares:', statsData)

      // Combinar dados e calcular score de popularidade
      const postsWithScore = postsData.map(post => {
        const author = authorsData?.find(a => a.id === post.author_id)
        const stats = statsData?.find(s => s.post_id === post.id)
        const likes = stats?.likes_count || 0
        const comments = stats?.comments_count || 0
        
        return {
          ...post,
          author: author || { full_name: 'Usuário', username: 'user', avatar_url: null },
          likes_count: likes,
          comments_count: comments,
          popularity_score: likes * 2 + comments * 3
        }
      })

      // Ordenar por score de popularidade e pegar top 5
      const sortedPosts = postsWithScore
        .sort((a, b) => b.popularity_score - a.popularity_score)
        .slice(0, 5)

      console.log('🔥 Top 5 posts populares:', sortedPosts.map(p => ({
        id: p.id.substring(0, 8),
        likes: p.likes_count,
        comments: p.comments_count,
        score: p.popularity_score
      })))

      setPosts(sortedPosts)
    } catch (error) {
      console.error('Erro ao buscar posts populares:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <TrendingUp className="h-5 w-5 text-orange-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Posts Populares
        </h3>
      </div>

      <div className="space-y-4">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {/* Ranking Number */}
            <div className="flex-shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 
                  ? 'bg-yellow-500 text-white' 
                  : index === 1 
                  ? 'bg-gray-400 text-white'
                  : index === 2
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                {index + 1}
              </div>
            </div>

            {/* Post Content */}
            <div className="flex-1 min-w-0">
              {/* Title or Content Preview */}
              <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                {post.title || post.content}
              </h4>

              {/* Author and Time */}
              <div className="flex items-center space-x-2 mb-2">
                {post.author?.avatar_url ? (
                  <Image
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'Avatar'}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {(post.author?.full_name || post.author?.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {post.author?.full_name || post.author?.username}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(post.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3" />
                  <span>{post.likes_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{post.comments_count}</span>
                </div>
              </div>
            </div>

            {/* Post Image (if exists) */}
            {post.image_url && (
              <div className="flex-shrink-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src={post.image_url}
                    alt="Post image"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}
