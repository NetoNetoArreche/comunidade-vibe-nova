'use client'

import { useState, useEffect } from 'react'
import { supabase, type Post, type Comment, type Profile, type Space } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Pin,
  ExternalLink,
  Play,
  Edit3,
  Trash2,
  X,
  Send
} from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface PostCardProps {
  post: Post
  currentUser: User | null
  profile?: Profile | null
  spaces?: Space[]
  onPostUpdated?: (post: Post) => void
  onDelete?: (postId: string) => void
}

export default function PostCard({ post, currentUser, profile, spaces, onPostUpdated, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.user_has_liked || false)
  const [likesCount, setLikesCount] = useState(post.like_count || 0)
  const [commentsCount, setCommentsCount] = useState(post.comment_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPostMenu, setShowPostMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  
  const router = useRouter()
  
  // Verificar se é o autor do post
  const isAuthor = currentUser && post.author_id === currentUser.id

  useEffect(() => {
    // Usar dados que já vêm do post, mas buscar novamente se necessário
    console.log(`📊 Post ${post.id.substring(0, 8)}... - Likes: ${post.like_count}, Comments: ${post.comment_count}, User liked: ${post.user_has_liked}`)
    
    if (post.like_count !== undefined) {
      setLikesCount(post.like_count)
    } else {
      getLikesCount()
    }
    
    if (post.comment_count !== undefined) {
      setCommentsCount(post.comment_count)
    } else {
      getCommentsCount()
    }
    
    if (post.user_has_liked !== undefined) {
      setLiked(post.user_has_liked)
    } else {
      checkIfLiked()
    }
  }, [post.id, post.like_count, post.comment_count, post.user_has_liked, currentUser])

  // Monitor showEditModal changes
  useEffect(() => {
    console.log('showEditModal mudou para:', showEditModal)
    if (showEditModal) {
      console.log('Modal deveria estar visível agora!')
    }
  }, [showEditModal])

  // Fechar menu de compartilhamento ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showShareOptions) {
        const target = event.target as HTMLElement
        if (!target.closest('.share-menu')) {
          setShowShareOptions(false)
        }
      }
    }

    if (showShareOptions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showShareOptions])

  // useEffect desabilitado temporariamente
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (showPostMenu && !showEditModal) {
  //       const target = event.target as HTMLElement
  //       if (!target.closest('.dropdown-menu')) {
  //         setShowPostMenu(false)
  //       }
  //     }
  //   }

  //   if (showPostMenu && !showEditModal) {
  //     document.addEventListener('mousedown', handleClickOutside)
  //     return () => {
  //       document.removeEventListener('mousedown', handleClickOutside)
  //     }
  //   }
  // }, [showPostMenu, showEditModal])

  // Função para processar menções e links no texto
  const renderContentWithMentions = (content: string) => {
    const elements: (string | JSX.Element)[] = []
    let elementIndex = 0

    // Processar menções e URLs juntos
    // Regex combinada: captura menções @username ou URLs completas
    const combinedRegex = /(@([^\s@\n]+))|(https?:\/\/[^\s]+)/g
    let lastIndex = 0
    let match

    while ((match = combinedRegex.exec(content)) !== null) {
      // Adicionar texto antes do match
      if (match.index > lastIndex) {
        elements.push(content.substring(lastIndex, match.index))
      }

      if (match[1]) {
        // É uma menção @username
        const mentionText = match[2].trim()
        elements.push(
          <button
            key={`mention-${elementIndex++}`}
            onClick={() => handleMentionClick(mentionText)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline cursor-pointer"
          >
            @{mentionText}
          </button>
        )
      } else if (match[3]) {
        // É uma URL
        const url = match[3]
        elements.push(
          <a
            key={`url-${elementIndex++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline break-all"
          >
            {url}
          </a>
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Adicionar texto restante
    if (lastIndex < content.length) {
      elements.push(content.substring(lastIndex))
    }

    return elements.length > 0 ? elements : content
  }

  const handleMentionClick = async (username: string) => {
    try {
      console.log('Searching for user:', username)
      
      // Buscar usuário pelo username exato primeiro, depois por nome
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .or(`username.eq.${username},full_name.eq.${username}`)

      console.log('Search results:', users, 'Error:', error)

      if (error || !users || users.length === 0) {
        // Tentar busca parcial se não encontrou exato
        const { data: partialUsers } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .or(`username.ilike.%${username}%,full_name.ilike.%${username}%`)
        
        if (!partialUsers || partialUsers.length === 0) {
          toast.error('Usuário não encontrado')
          return
        }
        
        const user = partialUsers[0]
        console.log('Found user (partial):', user)
        
        // Navegar para perfil usando SPA
        if ((window as any).navigateToProfile) {
          (window as any).navigateToProfile(user)
        }
        return
      }

      // Pegar o primeiro resultado da busca exata
      const user = users[0]
      console.log('Found user (exact):', user)
      
      // Navegar para perfil usando SPA
      if ((window as any).navigateToProfile) {
        (window as any).navigateToProfile(user)
      }
      
    } catch (error) {
      console.error('Error finding user:', error)
      toast.error('Erro ao buscar usuário')
    }
  }

  const handleEditPost = () => {
    console.log('Abrindo modal, showEditModal:', showEditModal)
    setShowEditModal(true)
    setShowPostMenu(false)
    setImagePreview(post.image_url) // Carregar imagem atual
    console.log('Modal deveria estar aberto agora')
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Imagem muito grande. Máximo 5MB.')
        return
      }
      
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser?.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        toast.error('Erro ao fazer upload: ' + uploadError.message)
        return null
      }

      const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)

      return data.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erro inesperado no upload')
      return null
    }
  }

  const handleUpdatePost = async () => {
    setLoading(true)

    try {
      // Pegar valores dos campos
      const titleInput = document.getElementById('edit-title') as HTMLInputElement
      const contentTextarea = document.getElementById('edit-content') as HTMLTextAreaElement
      
      const newTitle = titleInput?.value.trim() || null
      const newContent = contentTextarea?.value.trim()

      if (!newContent) {
        toast.error('O conteúdo não pode estar vazio')
        setLoading(false)
        return
      }

      // Upload da imagem se houver
      let imageUrl = imagePreview // Manter imagem atual se não mudou
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) {
          setLoading(false)
          return
        }
      }

      // Atualizar no banco
      const { data, error } = await supabase
        .from('posts')
        .update({
          title: newTitle,
          content: newContent,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating post:', error)
        toast.error('Erro ao atualizar post')
      } else {
        toast.success('Post atualizado com sucesso!')
        
        // Atualizar o post na lista se callback existir
        if (onPostUpdated && data) {
          const updatedPost = {
            ...post,
            ...data,
            author: post.author,
            space: post.space,
            like_count: post.like_count,
            comment_count: post.comment_count,
            user_has_liked: post.user_has_liked
          }
          onPostUpdated(updatedPost)
        }
        
        setShowEditModal(false)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro inesperado')
    }

    setLoading(false)
  }

  const handleDeletePost = async () => {
    if (!confirm('Tem certeza que deseja excluir este post?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (error) {
        console.error('Error deleting post:', error)
        toast.error('Erro ao excluir post')
      } else {
        toast.success('Post excluído com sucesso!')
        // Chamar callback para remover da lista sem reload
        if (onDelete) {
          onDelete(post.id)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro inesperado')
    }
    
    setShowPostMenu(false)
  }

  async function getLikesCount() {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact' })
      .eq('post_id', post.id)

    if (!error) {
      setLikesCount(count || 0)
    }
  }

  async function getCommentsCount() {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact' })
      .eq('post_id', post.id)

    if (!error) {
      setCommentsCount(count || 0)
    }
  }

  async function checkIfLiked() {
    if (!currentUser) return

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', currentUser.id)
      .single()

    if (!error && data) {
      setLiked(true)
    }
  }

  async function toggleLike() {
    if (!currentUser) {
      toast.error('Faça login para curtir posts')
      return
    }

    console.log('🔄 Toggle like iniciado:', { 
      postId: post.id, 
      userId: currentUser.id, 
      liked,
      postIdType: typeof post.id,
      userIdType: typeof currentUser.id
    })

    try {
      if (liked) {
        // Remove like
        const { error, data } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id)
          .select()

        console.log('👎 Resultado do delete:', { error, data, errorDetails: error })

        if (error) {
          console.error('❌ Erro ao remover like:', error)
          toast.error(`Erro ao remover curtida: ${error.message}`)
          return
        }

        setLiked(false)
        setLikesCount((prev: number) => {
          const newCount = prev - 1
          console.log(`✅ Like removido. Novo total: ${newCount}`)
          return newCount
        })
        toast.success('Curtida removida')
      } else {
        // Add like - Garantir que apenas post_id e user_id sejam enviados
        const likeData = {
          post_id: post.id,
          user_id: currentUser.id,
          comment_id: null,
          project_id: null
        }
        
        console.log('📤 Dados a serem inseridos:', likeData)
        
        // Tentar sem .select() primeiro
        const { error, data } = await supabase
          .from('likes')
          .insert(likeData)

        console.log('👍 Resultado do insert:', { 
          error, 
          data,
          errorDetails: error,
          errorMessage: error?.message,
          errorCode: error?.code,
          errorHint: error?.hint
        })

        if (error) {
          console.error('❌ Erro ao adicionar like:', error)
          toast.error(`Erro ao curtir post: ${error.message}`)
          return
        }

        setLiked(true)
        setLikesCount((prev: number) => {
          const newCount = prev + 1
          console.log(`✅ Like adicionado. Novo total: ${newCount}`)
          return newCount
        })

        // Criar notificação para o autor do post (se não for o próprio usuário)
        if (post.author_id !== currentUser.id) {
          try {
            await supabase
              .from('notifications')
              .insert({
                user_id: post.author_id,
                type: 'like',
                content: `${profile?.full_name || profile?.username || 'Alguém'} curtiu seu post`,
                related_post_id: post.id,
                related_user_id: currentUser.id,
                is_read: false
              })
            console.log('✅ Notificação de like criada')
          } catch (notifError) {
            console.warn('⚠️ Erro ao criar notificação de like:', notifError)
          }
        }

        toast.success('Post curtido!')
      }
    } catch (error) {
      console.error('❌ Erro geral ao processar curtida:', error)
      toast.error('Erro ao processar curtida')
    }
  }

  function toggleShareOptions() {
    console.log('🔄 Toggle share options:', !showShareOptions)
    setShowShareOptions(!showShareOptions)
  }

  async function copyLink() {
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`
      console.log('🔗 Copiando link:', postUrl)
      await navigator.clipboard.writeText(postUrl)
      toast.success('Link copiado para a área de transferência!')
      setShowShareOptions(false)
      console.log('✅ Link copiado para clipboard')
    } catch (error) {
      console.error('❌ Erro ao copiar link:', error)
      // Fallback: mostrar o link para o usuário copiar manualmente
      const postUrl = `${window.location.origin}/post/${post.id}`
      prompt('Copie este link para compartilhar:', postUrl)
      setShowShareOptions(false)
    }
  }

  async function shareNative() {
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`
      const shareText = `Confira este post: ${post.title || post.content.substring(0, 100)}...`
      
      if (navigator.share) {
        await navigator.share({
          title: post.title || 'Post da Comunidade',
          text: shareText,
          url: postUrl
        })
        setShowShareOptions(false)
        console.log('✅ Post compartilhado via Web Share API')
      } else {
        toast.error('Compartilhamento nativo não suportado')
      }
    } catch (error) {
      console.error('❌ Erro ao compartilhar:', error)
    }
  }

  function shareWhatsApp() {
    const postUrl = `${window.location.origin}/post/${post.id}`
    const shareText = `Confira este post: ${post.title || post.content.substring(0, 100)}...`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`
    console.log('💬 Compartilhando no WhatsApp:', whatsappUrl)
    window.open(whatsappUrl, '_blank')
    setShowShareOptions(false)
  }

  function shareTwitter() {
    const postUrl = `${window.location.origin}/post/${post.id}`
    const shareText = `Confira este post: ${post.title || post.content.substring(0, 100)}...`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`
    console.log('🐦 Compartilhando no Twitter:', twitterUrl)
    window.open(twitterUrl, '_blank')
    setShowShareOptions(false)
  }

  async function loadComments() {
    if (showComments) {
      setShowComments(false)
      return
    }

    const { data: commentsData, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles(*)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    if (!error && commentsData) {
      // Buscar contagem de curtidas para cada comentário
      const commentIds = commentsData.map(c => c.id)
      
      const { data: likesData } = await supabase
        .from('likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds)
      
      // Contar curtidas por comentário e verificar se usuário curtiu
      const commentsWithLikes = commentsData.map(comment => {
        const commentLikes = likesData?.filter(l => l.comment_id === comment.id) || []
        const likesCount = commentLikes.length
        const userHasLiked = currentUser ? commentLikes.some(l => l.user_id === currentUser.id) : false
        
        console.log(`💬 Comentário ${comment.id.substring(0, 8)}:`, { 
          likesCount, 
          userHasLiked,
          totalLikes: commentLikes.length 
        })
        
        return {
          ...comment,
          likes_count: likesCount,
          user_has_liked: userHasLiked
        }
      })
      
      console.log('📝 Comentários carregados:', commentsWithLikes.length)
      setComments(commentsWithLikes)
      setShowComments(true)
    }
  }

  async function toggleCommentLike(commentId: string) {
    if (!currentUser) {
      toast.error('Faça login para curtir comentários')
      return
    }

    const comment = comments.find(c => c.id === commentId)
    if (!comment) return

    console.log('🔄 Toggle comment like iniciado:', { commentId, userId: currentUser.id, liked: comment.user_has_liked })

    try {
      if (comment.user_has_liked) {
        // Remove like
        const { error, data } = await supabase
          .from('likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id)
          .select()

        console.log('👎 Resultado do delete (comentário):', { error, data })

        if (error) {
          console.error('❌ Erro ao remover like do comentário:', error)
          toast.error('Erro ao remover curtida')
          return
        }

        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, likes_count: (c.likes_count || 0) - 1, user_has_liked: false }
            : c
        ))
        toast.success('Curtida removida')
        console.log(`✅ Like removido do comentário ${commentId.substring(0, 8)}`)
      } else {
        // Add like - Garantir que apenas comment_id e user_id sejam enviados
        const { error, data } = await supabase
          .from('likes')
          .insert({
            comment_id: commentId,
            user_id: currentUser.id,
            post_id: null,
            project_id: null
          })
          .select()

        console.log('👍 Resultado do insert (comentário):', { error, data })

        if (error) {
          console.error('❌ Erro ao adicionar like ao comentário:', error)
          toast.error('Erro ao curtir comentário')
          return
        }

        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, likes_count: (c.likes_count || 0) + 1, user_has_liked: true }
            : c
        ))
        toast.success('Comentário curtido!')
        console.log(`✅ Like adicionado ao comentário ${commentId.substring(0, 8)}`)
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao curtir comentário:', error)
      toast.error('Erro ao processar curtida')
    }
  }

  async function submitComment() {
    if (!currentUser || !newComment.trim()) return

    setLoading(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        content: newComment.trim(),
        post_id: post.id,
        author_id: currentUser.id
      })
      .select(`
        *,
        author:profiles(*)
      `)
      .single()

    if (!error && data) {
      setComments([...comments, data])
      setCommentsCount(prev => {
        const newCount = prev + 1
        console.log(`💬 Comentário adicionado. Novo total: ${newCount}`)
        return newCount
      })
      
      // Criar notificação para o autor do post (se não for o próprio usuário)
      if (post.author_id !== currentUser.id) {
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.author_id,
              type: 'comment',
              content: `${profile?.full_name || profile?.username || 'Alguém'} comentou no seu post`,
              related_post_id: post.id,
              related_user_id: currentUser.id,
              is_read: false
            })
          console.log('✅ Notificação de comentário criada')
        } catch (notifError) {
          console.warn('⚠️ Erro ao criar notificação de comentário:', notifError)
        }
      }
      
      setNewComment('')
      toast.success('Comentário adicionado!')
    } else {
      console.error('Erro ao adicionar comentário:', error)
      toast.error('Erro ao adicionar comentário')
    }

    setLoading(false)
  }

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                if ((window as any).navigateToProfile && post.author) {
                  (window as any).navigateToProfile(post.author)
                }
              }}
              className="hover:opacity-80 transition-opacity"
            >
              {post.author?.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.full_name || 'Avatar'}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {(post.author?.full_name || post.author?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </button>
            
            <div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    if ((window as any).navigateToProfile && post.author) {
                      (window as any).navigateToProfile(post.author)
                    }
                  }}
                  className="font-semibold text-gray-900 dark:text-white hover:underline text-left"
                >
                  {post.author?.full_name || post.author?.username || 'Usuário'}
                </button>
                {post.space && (
                  <>
                    <span className="text-gray-400">em</span>
                    <span className="text-primary-600 dark:text-primary-400 font-medium">
                      {post.space.name}
                    </span>
                  </>
                )}
                {post.is_pinned && (
                  <Pin className="h-4 w-4 text-primary-600" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowPostMenu(!showPostMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            
            {/* Dropdown Menu */}
            {showPostMenu && (
              <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {isAuthor ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEditPost()
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                    >
                      <Edit3 className="h-4 w-4 mr-3" />
                      Editar Post
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Excluir Post
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      toast.success('Funcionalidade de denunciar em desenvolvimento')
                      setShowPostMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    Denunciar Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
            {post.title}
          </h2>
        )}

        {/* Content */}
        <div className="text-gray-700 dark:text-gray-300">
          <div 
            className={`whitespace-pre-line leading-relaxed ${
              !isExpanded && (post.content.length > 300 || post.content.split('\n').length > 6)
                ? 'line-clamp-6' 
                : ''
            }`}
          >
            {renderContentWithMentions(post.content)}
          </div>
          {(post.content.length > 300 || post.content.split('\n').length > 6) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm mt-2 hover:underline"
            >
              {isExpanded ? '← Ver menos' : 'Ver mais...'}
            </button>
          )}
        </div>
      </div>

      {/* Media */}
      {(post.image_url || post.video_url) && (
        <div className="px-6 pb-4">
          {post.image_url && (
            <div className="rounded-lg overflow-hidden">
              <Image
                src={post.image_url}
                alt="Post image"
                width={800}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          
          {post.video_url && (
            <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              {isYouTubeUrl(post.video_url) ? (
                <div className="relative aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(post.video_url)}`}
                    title="YouTube video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center p-8">
                  <a
                    href={post.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                  >
                    <Play className="h-6 w-6" />
                    <span>Assistir vídeo</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={toggleLike}
              className={`flex items-center space-x-2 transition-colors ${
                liked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            <button
              onClick={loadComments}
              className="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{commentsCount}</span>
            </button>

            <div className="relative share-menu">
              <button 
                onClick={toggleShareOptions}
                className="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm font-medium">Compartilhar</span>
              </button>

              {/* Menu de opções de compartilhamento */}
              {showShareOptions && (
                <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-48 z-50">
                  <button
                    onClick={copyLink}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <span>🔗</span>
                    <span>Copiar link</span>
                  </button>
                  
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={shareNative}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <span>📱</span>
                      <span>Compartilhar</span>
                    </button>
                  )}
                  
                  <button
                    onClick={shareWhatsApp}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </button>
                  
                  <button
                    onClick={shareTwitter}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <span>🐦</span>
                    <span>Twitter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Add Comment */}
          {currentUser && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                {currentUser && (
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {(currentUser.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={submitComment}
                      disabled={!newComment.trim() || loading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Enviando...' : 'Comentar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="p-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex space-x-3">
                  {comment.author?.avatar_url ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={comment.author.avatar_url}
                        alt={comment.author.full_name || 'Avatar'}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {(comment.author?.full_name || comment.author?.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <button 
                        onClick={() => {
                          if ((window as any).navigateToProfile && comment.author) {
                            (window as any).navigateToProfile(comment.author)
                          }
                        }}
                        className="font-semibold text-gray-900 dark:text-white text-sm hover:underline text-left"
                      >
                        {comment.author?.full_name || comment.author?.username || 'Usuário'}
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {comment.content}
                    </p>
                    {comment.image_url && (
                      <div className="mt-2">
                        <Image
                          src={comment.image_url}
                          alt="Comment image"
                          width={200}
                          height={150}
                          className="rounded-lg"
                        />
                      </div>
                    )}
                    
                    {/* Comment Actions */}
                    <div className="flex items-center space-x-4 mt-2">
                      <button
                        onClick={() => toggleCommentLike(comment.id)}
                        className={`flex items-center space-x-1 transition-colors ${
                          comment.user_has_liked 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-gray-500 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${comment.user_has_liked ? 'fill-current' : ''}`} />
                        <span className="text-xs font-medium">{comment.likes_count || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Editar Post
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              e.preventDefault()
              handleUpdatePost()
            }} className="p-6">
              {/* Title */}
              <div className="mb-4">
                <input
                  type="text"
                  defaultValue={post.title || ''}
                  placeholder="Título do post (opcional)"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  id="edit-title"
                />
              </div>

              {/* Content */}
              <div className="mb-4">
                <textarea
                  defaultValue={post.content}
                  placeholder="O que você está pensando?"
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={4}
                  id="edit-content"
                />
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4 relative">
                  <div className="relative rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={500}
                      height={300}
                      className="w-full h-auto max-h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Image Actions */}
              <div className="mb-4 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => document.getElementById('edit-image-input')?.click()}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium"
                >
                  📷 {imagePreview ? 'Alterar imagem' : 'Adicionar imagem'}
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 transition-colors text-sm font-medium"
                  >
                    ❌ Remover imagem
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="edit-image-input"
              />
            </form>
          </div>
        </div>
      )}
    </article>
  )
}
