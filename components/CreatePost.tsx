'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase, type Post, type Profile, type Space } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Image as ImageIcon, 
  Video, 
  Send, 
  X, 
  Hash,
  Globe
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { validateSecureInput, detectUnauthorizedAccess } from '@/lib/security'

interface CreatePostProps {
  user: User
  profile: Profile | null
  spaces: Space[]
  onPostCreated: (post: Post) => void
}

export default function CreatePost({ user, profile, spaces, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Sistema de menções
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionUsers, setMentionUsers] = useState<Profile[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      console.log('Uploading image:', fileName)

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

      console.log('Image uploaded successfully:', data.publicUrl)
      return data.publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erro inesperado no upload')
      return null
    }
  }

  // Sistema de menções
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setMentionUsers([])
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(5)

    if (!error && data) {
      setMentionUsers(data as Profile[])
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    
    setContent(value)
    setCursorPosition(cursorPos)

    // Detectar menções (@)
    const textBeforeCursor = value.substring(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      const query = mentionMatch[1]
      setMentionQuery(query)
      setShowMentions(true)
      searchUsers(query)
    } else {
      setShowMentions(false)
      setMentionUsers([])
    }
  }

  const insertMention = (user: Profile) => {
    const textBeforeCursor = content.substring(0, cursorPosition)
    const textAfterCursor = content.substring(cursorPosition)
    
    // Encontrar o início da menção
    const mentionStart = textBeforeCursor.lastIndexOf('@')
    const beforeMention = textBeforeCursor.substring(0, mentionStart)
    
    // Usar username se existir, senão usar full_name completo
    const mentionText = user.username || user.full_name || user.id
    const newContent = `${beforeMention}@${mentionText} ${textAfterCursor}`
    setContent(newContent)
    setShowMentions(false)
    
    // Atualizar posição do cursor
    const newCursorPos = beforeMention.length + mentionText.length + 2 // +2 para @ e espaço
    setCursorPosition(newCursorPos)
    
    // Focar no textarea
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar autenticação
    if (detectUnauthorizedAccess(user?.id || null)) {
      toast.error('Acesso negado')
      return
    }
    
    if (!content.trim()) {
      toast.error('Por favor, escreva algo antes de postar')
      return
    }

    // Validar segurança do conteúdo
    if (!validateSecureInput(content)) {
      toast.error('Conteúdo inválido detectado. Tentativa bloqueada.')
      return
    }

    if (title && !validateSecureInput(title)) {
      toast.error('Título inválido detectado. Tentativa bloqueada.')
      return
    }

    setLoading(true)

    try {
      let imageUrl = null
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) {
          setLoading(false)
          return
        }
      }

      const postData = {
        content: content.trim(),
        title: title.trim() || null,
        author_id: user.id,
        space_id: selectedSpace,
        image_url: imageUrl,
        video_url: videoUrl.trim() || null
      }

      console.log('Creating post:', postData)

      const { data: postResult, error } = await supabase
        .from('posts')
        .insert(postData)
        .select('*')
        .single()

      if (error) {
        console.error('Error creating post:', error)
        toast.error('Erro ao criar post: ' + error.message)
        setLoading(false)
        return
      }

      console.log('Post created:', postResult)

      // Processar menções e salvar na tabela mentions
      const mentionRegex = /@([^@\n]+?)(?=\s\s|\n|$)/g
      const mentionMatches = Array.from(content.matchAll(mentionRegex))
      
      if (mentionMatches.length > 0 && postResult) {
        console.log('Processing mentions:', mentionMatches.map(m => m[1].trim()))
        
        const mentionPromises = mentionMatches.map(async (match) => {
          const username = match[1].trim() // Remove @ e espaços extras
          console.log('Looking for user:', username)
          
          // Buscar usuário mencionado - busca exata primeiro
          const { data: users, error } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .or(`username.eq.${username},full_name.eq.${username}`)

          console.log('Found users (exact):', users, 'Error:', error)

          let mentionedUser = null
          if (users && users.length > 0) {
            mentionedUser = users[0]
          } else {
            // Tentar busca parcial
            const { data: partialUsers } = await supabase
              .from('profiles')
              .select('id, username, full_name')
              .or(`username.ilike.%${username}%,full_name.ilike.%${username}%`)
            
            console.log('Found users (partial):', partialUsers)
            if (partialUsers && partialUsers.length > 0) {
              mentionedUser = partialUsers[0]
            }
          }

          if (mentionedUser) {
            // Salvar menção
            const { error: mentionError } = await supabase
              .from('mentions')
              .insert({
                post_id: postResult.id,
                user_id: mentionedUser.id
              })
            
            if (mentionError) {
              console.error('Error saving mention:', mentionError)
            } else {
              console.log('Mention saved for user:', mentionedUser.full_name)
            }
          } else {
            console.log('User not found for mention:', username)
          }
        })

        await Promise.all(mentionPromises)
      }

      // Buscar dados completos do post para retornar
      const { data: fullPost } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postResult.id)
        .single()

      if (fullPost) {
        // Buscar autor
        const { data: author } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('id', fullPost.author_id)
          .single()

        // Buscar espaço se existir
        let space = null
        if (fullPost.space_id) {
          const { data: spaceData } = await supabase
            .from('spaces')
            .select('id, name, description, color')
            .eq('id', fullPost.space_id)
            .single()
          space = spaceData
        }

        const completePost = {
          ...fullPost,
          author: author || null,
          space: space,
          likes_count: 0,
          comments_count: 0,
          user_has_liked: false
        }

        toast.success('Post criado com sucesso!')
        // Não chamar onPostCreated para evitar duplicação - deixar realtime gerenciar
        console.log('📝 Post criado, aguardando realtime para adicionar na lista')
        
        // Reset form
        setContent('')
        setTitle('')
        setSelectedSpace(null)
        setImageFile(null)
        setImagePreview(null)
        setVideoUrl('')
        setShowAdvanced(false)
        setShowMentions(false)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro inesperado')
    }

    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
      <form onSubmit={handleSubmit}>
        {/* User Info */}
        <div className="flex items-center space-x-2 lg:space-x-3 mb-3 lg:mb-4">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name || 'Avatar'}
              width={40}
              height={40}
              className="lg:w-12 lg:h-12 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-base lg:text-lg">
                {(profile?.full_name || profile?.username || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white truncate">
              {profile?.full_name || profile?.username || 'Usuário'}
            </p>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
              Compartilhe algo com a comunidade
            </p>
          </div>
        </div>

        {/* Title Input */}
        {showAdvanced && (
          <div className="mb-3 lg:mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do post (opcional)"
              className="w-full p-2 lg:p-3 text-sm lg:text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
            />
          </div>
        )}

        {/* Content Input */}
        <div className="mb-3 lg:mb-4 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="O que você está pensando? Use @ para mencionar alguém"
            className="w-full p-3 lg:p-4 text-sm lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={4}
          />
          
          {/* Dropdown de menções */}
          {showMentions && mentionUsers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {mentionUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => insertMention(user)}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.full_name || 'Avatar'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {(user.full_name || user.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.full_name || user.username}
                    </p>
                    {user.username && user.full_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Space Selection */}
        {showAdvanced && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Postar em:
            </label>
            <select
              value={selectedSpace || ''}
              onChange={(e) => setSelectedSpace(e.target.value || null)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">
                <Globe className="h-4 w-4 mr-2" />
                Feed Principal
              </option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video URL Input */}
        {showAdvanced && (
          <div className="mb-4">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="URL do vídeo (YouTube, etc.)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <Image
              src={imagePreview}
              alt="Preview"
              width={400}
              height={300}
              className="rounded-lg max-h-64 object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm">Imagem</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Video className="h-5 w-5" />
              <span className="text-sm">Mais opções</span>
            </button>

            {selectedSpace && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm">
                <Hash className="h-3 w-3" />
                <span>{spaces.find(s => s.id === selectedSpace)?.name}</span>
              </div>
            )}
          </div>

            <button
              type="submit"
              disabled={(!content.trim() && !title.trim()) || loading}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? 'Postando...' : 'Postar'}</span>
            </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </form>
    </div>
  )
}
