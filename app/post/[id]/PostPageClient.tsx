'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Post, type Profile, type Space } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import PostCard from '@/components/PostCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { ArrowLeft } from 'lucide-react'

interface PostPageClientProps {
  id: string
}

export default function PostPageClient({ id }: PostPageClientProps) {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      // Buscar usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Buscar perfil se usuário logado
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        }
      }

      // Buscar spaces
      const { data: spacesData } = await supabase
        .from('spaces')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (spacesData) {
        setSpaces(spacesData)
      }

      // Buscar o post específico
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*),
          space:spaces(*)
        `)
        .eq('id', id)
        .single()

      if (postError) {
        console.error('Erro ao buscar post:', postError)
        setError('Post não encontrado')
        return
      }

      if (!postData) {
        setError('Post não encontrado')
        return
      }

      // Buscar estatísticas do post
      const [likesResult, commentsResult, userLikeResult] = await Promise.all([
        // Contar likes
        supabase
          .from('likes')
          .select('*', { count: 'exact' })
          .eq('post_id', postData.id)
          .is('comment_id', null),
        
        // Contar comentários
        supabase
          .from('comments')
          .select('*', { count: 'exact' })
          .eq('post_id', postData.id),
        
        // Verificar se usuário curtiu (se logado)
        currentUser ? supabase
          .from('likes')
          .select('*')
          .eq('post_id', postData.id)
          .eq('user_id', currentUser.id)
          .is('comment_id', null)
          .single() : Promise.resolve({ data: null })
      ])

      // Montar post com estatísticas
      const postWithStats = {
        ...postData,
        like_count: likesResult.count || 0,
        comment_count: commentsResult.count || 0,
        user_has_liked: !!userLikeResult.data
      }

      setPost(postWithStats)

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar post')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Post não encontrado'}
          </h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o início</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header com botão voltar */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
        </div>

        {/* Post */}
        <div className="max-w-2xl mx-auto">
          <PostCard
            post={post}
            currentUser={user}
            profile={profile}
            spaces={spaces}
            onPostUpdated={(updatedPost) => setPost(updatedPost)}
            onDelete={() => router.push('/')}
          />
        </div>
      </div>
    </div>
  )
}

