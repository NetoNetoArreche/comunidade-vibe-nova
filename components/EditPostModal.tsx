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

interface EditPostModalProps {
  post: Post
  user: User
  profile: Profile | null
  spaces: Space[]
  onPostUpdated: (post: Post) => void
  onClose: () => void
}

export default function EditPostModal({ post, user, profile, spaces, onPostUpdated, onClose }: EditPostModalProps) {
  console.log('EditPostModal rendered', { 
    post: post.id, 
    user: user.id, 
    profile: profile?.id, 
    spaces: spaces.length,
    hasTitle: !!post.title,
    hasVideo: !!post.video_url,
    hasSpace: !!post.space_id,
    hasImage: !!post.image_url
  })
  
  const [content, setContent] = useState(post.content || '')
  const [title, setTitle] = useState(post.title || '')
  const [selectedSpace, setSelectedSpace] = useState<string | null>(post.space_id)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(post.image_url)
  const [videoUrl, setVideoUrl] = useState(post.video_url || '')
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(!!post.title || !!post.video_url || !!post.space_id)
  
  // Sistema de menções
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionUsers, setMentionUsers] = useState<Profile[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

    // Detectar menções
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
    
    if (!content.trim() && !title.trim()) {
      toast.error('Escreva algo para atualizar!')
      return
    }

    setLoading(true)

    try {
      let imageUrl = imagePreview // Manter imagem atual se não mudou
      
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
        space_id: selectedSpace,
        image_url: imageUrl,
        video_url: videoUrl.trim() || null,
        updated_at: new Date().toISOString()
      }

      console.log('Updating post:', post.id, postData)

      const { data: postResult, error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', post.id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating post:', error)
        toast.error('Erro ao atualizar post: ' + error.message)
        setLoading(false)
        return
      }

      console.log('Post updated:', postResult)

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
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          user_has_liked: post.user_has_liked || false
        }

        toast.success('Post atualizado com sucesso!')
        onPostUpdated(completePost)
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro inesperado')
    }

    setLoading(false)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Editar Post
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Title Input */}
          {showAdvanced && (
            <div className="mb-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do post (opcional)"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold text-lg"
              />
            </div>
          )}

          {/* Content Input */}
          <div className="mb-4 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="O que você está pensando? Use @ para mencionar alguém"
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
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
                <option value="">Feed Principal</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          {/* Video URL */}
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium"
                title="Adicionar/alterar imagem"
              >
                <ImageIcon className="h-4 w-4" />
                <span>{imagePreview ? 'Alterar imagem' : 'Adicionar imagem'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium"
              >
                <span>{showAdvanced ? 'Menos opções' : 'Mais opções'}</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (!content.trim() && !title.trim())}
                className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Send className="h-4 w-4" />
                <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </form>
      </div>
    </div>
  )
}
