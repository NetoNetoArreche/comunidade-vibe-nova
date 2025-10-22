'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, type Post, type Profile, type Space } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import PostCard from '@/components/PostCard'
import CreatePost from '@/components/CreatePost'
import LoadingSpinner from '@/components/LoadingSpinner'
import FeaturedProjects from '@/components/FeaturedProjects'
import ActiveMembers from '@/components/ActiveMembers'
import PopularPosts from '@/components/PopularPosts'
import toast from 'react-hot-toast'

interface HomePageProps {
  user: User | null
  profile: Profile | null
  spaces: Space[]
  selectedSpace: string | null
  onSpaceSelect: (spaceId: string | null) => void
}

export default function HomePage({ user, profile, spaces, selectedSpace, onSpaceSelect }: HomePageProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const subscriptionsRef = useRef<{ posts: any, likes: any, comments: any } | null>(null)
  const processedPostsRef = useRef<Set<string>>(new Set())

  // Debug: Log quando posts mudam
  useEffect(() => {
    console.log('📊 Posts state mudou:', {
      count: posts.length,
      ids: posts.map(p => p.id.substring(0, 8))
    })
  }, [posts])

  useEffect(() => {
    console.log('🔄 HomePage useEffect executado:', { selectedSpace, userId: user?.id })
    
    // Limpar subscriptions anteriores se existirem
    if (subscriptionsRef.current) {
      console.log('🧹 Limpando subscriptions anteriores')
      subscriptionsRef.current.posts?.unsubscribe()
      subscriptionsRef.current.likes?.unsubscribe()
      subscriptionsRef.current.comments?.unsubscribe()
      subscriptionsRef.current = null
    }
    
    // Limpar posts processados quando o espaço muda
    processedPostsRef.current.clear()
    
    // Carregar posts baseado no espaço selecionado
    if (selectedSpace) {
      getPostsBySpace(selectedSpace)
    } else {
      getPosts()
    }

    // Configurar Realtime para posts
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('📡 Post event:', payload)
          
          if (payload.eventType === 'INSERT') {
            handleNewPost(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            handleUpdatePost(payload.new)
          } else if (payload.eventType === 'DELETE') {
            handleDeletePost(payload.old.id)
          }
        }
      )
      .subscribe()

    // Configurar Realtime para curtidas
    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: 'post_id=neq.null'
        },
        async (payload) => {
          console.log('❤️ Like event:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            // Atualizar contagem de curtidas do post
            const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id
            if (postId) {
              const { data: statsData } = await supabase
                .from('post_stats')
                .select('like_count')
                .eq('id', postId)
                .single()

              if (statsData) {
                setPosts(prevPosts =>
                  prevPosts.map(post =>
                    post.id === postId
                      ? { ...post, like_count: statsData.like_count }
                      : post
                  )
                )
              }
            }
          }
        }
      )
      .subscribe()

    // Configurar Realtime para comentários
    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          console.log('💬 Comment event:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            // Atualizar contagem de comentários do post
            const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id
            if (postId) {
              const { data: statsData } = await supabase
                .from('post_stats')
                .select('comment_count')
                .eq('id', postId)
                .single()

              if (statsData) {
                setPosts(prevPosts =>
                  prevPosts.map(post =>
                    post.id === postId
                      ? { ...post, comment_count: statsData.comment_count }
                      : post
                  )
                )
              }
            }
          }
        }
      )
      .subscribe()

    // Armazenar referências das subscriptions
    subscriptionsRef.current = {
      posts: postsChannel,
      likes: likesChannel,
      comments: commentsChannel
    }

    return () => {
      // Limpar subscriptions para evitar duplicação
      console.log('🧹 Cleanup: removendo subscriptions')
      postsChannel.unsubscribe()
      likesChannel.unsubscribe()
      commentsChannel.unsubscribe()
      subscriptionsRef.current = null
    }
  }, [selectedSpace, user?.id])

  async function getPosts() {
    console.log('Fetching posts...')
    
    try {
      // Buscar posts básicos primeiro
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        toast.error('Erro ao carregar posts: ' + postsError.message)
        setLoading(false)
        return
      }

      if (!postsData || postsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      console.log('Posts fetched:', postsData.length)

      // Buscar autores dos posts
      const authorIds = Array.from(new Set(
        postsData
          .map(post => post.author_id)
          .filter(id => id !== null && id !== undefined)
      ))
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', authorIds)

      // Buscar espaços dos posts (se existirem)
      const spaceIds = Array.from(new Set(
        postsData
          .filter(post => post.space_id) // Filtrar posts com space_id
          .map(post => post.space_id)
          .filter(id => id !== null && id !== undefined) // Filtrar IDs válidos
      ))
      let spacesData: any[] = []
      if (spaceIds.length > 0) {
        const { data, error } = await supabase
          .from('spaces')
          .select('id, name, description, icon_color')
          .in('id', spaceIds)
        
        if (error) {
          console.error('Erro ao buscar spaces:', error)
        }
        spacesData = data || []
      }

      // Buscar estatísticas dos posts
      const postIds = postsData
        .map(post => post.id)
        .filter(id => id !== null && id !== undefined)
      const { data: statsData } = await supabase
        .from('post_stats')
        .select('id, like_count, comment_count')
        .in('id', postIds)

      // Verificar se o usuário curtiu os posts (se logado)
      let userLikes: any[] = []
      if (user && postIds.length > 0) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)
        
        userLikes = likesData || []
      }

      // Transformar os dados para o formato esperado
      const transformedData = postsData.map((post: any) => {
        const author = authorsData?.find(a => a.id === post.author_id)
        const space = spacesData?.find(s => s.id === post.space_id)
        const stats = statsData?.find(s => s.id === post.id)
        const userHasLiked = userLikes.some(like => like.post_id === post.id)
        
        return {
          ...post,
          author: author || null,
          space: space || null,
          like_count: stats?.like_count || 0,
          comment_count: stats?.comment_count || 0,
          user_has_liked: userHasLiked
        }
      })
      
      console.log('Posts loaded:', transformedData.length, transformedData)
      setPosts(transformedData)
    } catch (error) {
      console.error('Error in getPosts:', error)
      toast.error('Erro inesperado ao carregar posts')
    } finally {
      setLoading(false)
    }
  }

  const handleNewPost = useCallback(async (newPostData: any) => {
    console.log('🆕 Novo post detectado:', newPostData)
    
    // Verificar se o post já foi processado
    if (processedPostsRef.current.has(newPostData.id)) {
      console.log('🔄 Post já foi processado, ignorando:', newPostData.id)
      return
    }
    
    // Verificar se o post pertence ao filtro atual
    if (selectedSpace && newPostData.space_id !== selectedSpace) {
      return // Ignorar se não for do espaço selecionado
    }

    try {
      // Buscar dados completos do post
      const { data: authorData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .eq('id', newPostData.author_id)
        .single()

      let spaceData = null
      if (newPostData.space_id) {
        const { data } = await supabase
          .from('spaces')
          .select('id, name, description, color')
          .eq('id', newPostData.space_id)
          .single()
        spaceData = data
      }

      const { data: statsData } = await supabase
        .from('post_stats')
        .select('id, like_count, comment_count')
        .eq('id', newPostData.id)
        .single()

      let userHasLiked = false
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', newPostData.id)
          .eq('user_id', user.id)
          .single()
        userHasLiked = !!likeData
      }

      const fullPost: Post = {
        ...newPostData,
        author: authorData,
        space: spaceData,
        like_count: statsData?.like_count || 0,
        comment_count: statsData?.comment_count || 0,
        user_has_liked: userHasLiked
      }

      // Adicionar no topo da lista apenas se não existir
      setPosts(prevPosts => {
        // Verificar se o post já existe na lista
        const exists = prevPosts.some(post => post.id === fullPost.id)
        console.log(`🔍 Verificando duplicata para post ${fullPost.id}:`, {
          exists,
          totalPosts: prevPosts.length,
          existingIds: prevPosts.map(p => p.id.substring(0, 8))
        })
        
        if (exists) {
          console.log('🔄 Post já existe na lista, ignorando duplicata:', fullPost.id)
          return prevPosts
        }
        
        console.log('✅ Adicionando novo post na lista:', fullPost.id)
        // Marcar como processado
        processedPostsRef.current.add(fullPost.id)
        // Usar uma nova referência para forçar re-render
        const newPosts = [fullPost, ...prevPosts]
        console.log('📊 Nova lista de posts:', newPosts.map(p => p.id.substring(0, 8)))
        return newPosts
      })
      
      // Mostrar notificação toast
      if (authorData && authorData.id !== user?.id) {
        toast.success(`${authorData.full_name || authorData.username} publicou um novo post!`, {
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Erro ao processar novo post:', error)
    }
  }, [selectedSpace, user?.id])

  function handleUpdatePost(updatedPostData: any) {
    console.log('✏️ Post atualizado:', updatedPostData)
    
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPostData.id
          ? { ...post, ...updatedPostData }
          : post
      )
    )
  }

  function handleDeletePost(deletedPostId: string) {
    console.log('🗑️ Post deletado:', deletedPostId)
    
    setPosts(prevPosts =>
      prevPosts.filter(post => post.id !== deletedPostId)
    )
    
    toast.success('Post removido')
  }

  async function getPostsBySpace(spaceId: string) {
    console.log('Fetching posts by space:', spaceId)
    
    try {
      // Buscar posts do espaço
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsError) {
        console.error('Error fetching posts by space:', postsError)
        toast.error('Erro ao carregar posts do espaço: ' + postsError.message)
        return
      }

      if (!postsData || postsData.length === 0) {
        setPosts([])
        return
      }

      // Usar a mesma lógica de transformação da função getPosts
      const authorIds = Array.from(new Set(
        postsData
          .map(post => post.author_id)
          .filter(id => id !== null && id !== undefined)
      ))
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', authorIds)

      // Buscar dados do espaço específico
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('id, name, description, icon_color')
        .eq('id', spaceId)
        .single()

      // Buscar estatísticas dos posts
      const postIds = postsData
        .map(post => post.id)
        .filter(id => id !== null && id !== undefined)
      const { data: statsData } = await supabase
        .from('post_stats')
        .select('id, like_count, comment_count')
        .in('id', postIds)

      // Verificar se o usuário curtiu os posts (se logado)
      let userLikes: any[] = []
      if (user && postIds.length > 0) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)
        
        userLikes = likesData || []
      }

      // Transformar os dados para o formato esperado
      const transformedData = postsData.map((post: any) => {
        const author = authorsData?.find(a => a.id === post.author_id)
        const stats = statsData?.find(s => s.id === post.id)
        const userHasLiked = userLikes.some(like => like.post_id === post.id)
        
        return {
          ...post,
          author: author || null,
          space: spaceData || null,
          like_count: stats?.like_count || 0,
          comment_count: stats?.comment_count || 0,
          user_has_liked: userHasLiked
        }
      })
      
      console.log('Posts by space loaded:', transformedData.length, transformedData)
      setPosts(transformedData)
    } catch (error) {
      console.error('Error in getPostsBySpace:', error)
      toast.error('Erro inesperado ao carregar posts do espaço')
    }
  }

  const handlePostCreated = (newPost: Post) => {
    // Não adicionar manualmente - deixar o sistema de realtime gerenciar
    // Isso evita duplicação de posts
    console.log('📝 Post criado via callback, ignorando para evitar duplicação:', newPost.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 lg:px-4 py-4 lg:py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-4 lg:p-8 mb-6 lg:mb-8 text-white">
        <h1 className="text-xl lg:text-3xl font-bold mb-2">
          Bem-vindo ao Vibe Coding! 🚀
        </h1>
        <p className="text-primary-100 text-sm lg:text-lg">
          Conecte-se com desenvolvedores apaixonados por IA e tecnologia. 
          Compartilhe projetos, aprenda e cresça junto com a comunidade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content - Posts Feed */}
        <div className="lg:col-span-2">
          {/* Create Post */}
          {user && (
            <div className="mb-6 lg:mb-8">
              <CreatePost 
                user={user} 
                profile={profile}
                spaces={spaces}
                onPostCreated={handlePostCreated}
              />
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-4 lg:space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  Nenhum post encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedSpace 
                    ? 'Este espaço ainda não tem posts. Seja o primeiro a compartilhar algo!'
                    : 'Seja o primeiro a compartilhar algo com a comunidade!'
                  }
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={user}
                  profile={profile}
                  spaces={spaces}
                  onPostUpdated={(updatedPost) => {
                    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p))
                  }}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar - Featured Projects, Popular Posts & Active Members */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <FeaturedProjects />
            <PopularPosts />
            <ActiveMembers />
          </div>
        </div>
      </div>
    </div>
  )
}
