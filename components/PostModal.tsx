'use client'

import { useState, useEffect } from 'react'
import { supabase, type Post } from '@/lib/supabase'
import PostCard from './PostCard'
import { X } from 'lucide-react'

interface PostModalProps {
  postId: string
  currentUser: any
  profile: any
  spaces: any[]
  onClose: () => void
  onPostUpdated?: () => void
}

export default function PostModal({ postId, currentUser, profile, spaces, onClose, onPostUpdated }: PostModalProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [postId])

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  async function fetchPost() {
    try {
      // Buscar post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (postError || !postData) {
        console.error('Erro ao buscar post:', postError)
        setLoading(false)
        return
      }

      // Buscar autor
      const { data: authorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', postData.author_id)
        .single()

      // Buscar espaço se existir
      let spaceData = null
      if (postData.space_id) {
        const { data } = await supabase
          .from('spaces')
          .select('*')
          .eq('id', postData.space_id)
          .single()
        spaceData = data
      }

      // Buscar stats
      const { data: statsData } = await supabase
        .from('post_stats')
        .select('like_count, comment_count')
        .eq('post_id', postData.id)
        .single()

      // Verificar se usuário curtiu
      let userHasLiked = false
      if (currentUser) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postData.id)
          .eq('user_id', currentUser.id)
          .single()
        userHasLiked = !!likeData
      }

      const fullPost: Post = {
        ...postData,
        author: authorData,
        space: spaceData,
        like_count: statsData?.like_count || 0,
        comment_count: statsData?.comment_count || 0,
        user_has_liked: userHasLiked
      }

      setPost(fullPost)
    } catch (error) {
      console.error('Erro ao carregar post:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">Post não encontrado</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-transparent w-full max-w-2xl my-8">
        {/* Botão Fechar */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 z-10"
            title="Fechar"
          >
            <X className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        {/* Post Card */}
        <PostCard
          post={post}
          currentUser={currentUser}
          profile={profile}
          spaces={spaces}
          onPostUpdated={() => {
            fetchPost()
            onPostUpdated?.()
          }}
        />
      </div>
    </div>
  )
}
