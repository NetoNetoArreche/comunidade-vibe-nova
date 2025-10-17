'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, type ChatMessage, type ChatParticipant } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Users,
  Circle,
  ImageIcon,
  Trash2,
  X
} from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface ChatPageProps {
  user: User | null
  profile: any
  onViewProfile: (profile: any) => void
}

export default function ChatPage({ user, profile, onViewProfile }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [participants, setParticipants] = useState<ChatParticipant[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionStartPos, setMentionStartPos] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<{name: string, url: string, size: number, type: string} | null>(null)
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false)
  const [hashtagSearch, setHashtagSearch] = useState('')
  const [hashtagStartPos, setHashtagStartPos] = useState(0)
  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [displayMembersCount, setDisplayMembersCount] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('ChatPage useEffect - User:', user)
    if (user) {
      console.log('User authenticated, loading chat data...')
      getMessages()
      getParticipants()
      updateUserOnlineStatus(true)
      loadAvailableTags()
      
      // Subscribe to new messages
      const messagesSubscription = supabase
        .channel('chat_messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          async (payload) => {
            const newMessage = payload.new as ChatMessage
            
            // Buscar dados completos da mensagem incluindo perfil do usuário
            const { data: fullMessage } = await supabase
              .from('chat_messages')
              .select(`
                *,
                profiles!fk_chat_messages_user_id(
                  id,
                  full_name,
                  username,
                  avatar_url
                )
              `)
              .eq('id', newMessage.id)
              .single()
            
            if (fullMessage) {
              const transformedMessage = {
                ...fullMessage,
                user: fullMessage.profiles
              }
              setMessages(prev => [...prev, transformedMessage])
            } else {
              setMessages(prev => [...prev, newMessage])
            }
            
            // Scroll suave apenas para novas mensagens em tempo real
            setTimeout(() => scrollToBottom(true), 100)
          }
        )
        .subscribe()

      // Subscribe to participant changes
      const participantsSubscription = supabase
        .channel('chat_participants')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'chat_participants' },
          () => {
            getParticipants()
          }
        )
        .subscribe()

      return () => {
        messagesSubscription.unsubscribe()
        participantsSubscription.unsubscribe()
        updateUserOnlineStatus(false)
      }
    }
  }, [user])

  useEffect(() => {
    // Scroll instantâneo no carregamento inicial, suave para novas mensagens
    if (messages.length > 0) {
      scrollToBottom(false) // Sempre instantâneo
    }
  }, [messages])

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'instant' 
    })
  }

  async function getMessages() {
    console.log('Fetching messages for user:', user?.id)
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles!fk_chat_messages_user_id(
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: true })
      .limit(1000) // Aumentado para 1000 mensagens

    console.log('Messages query result:', { data, error })

    if (error) {
      console.error('Error fetching messages:', error)
      toast.error('Erro ao carregar mensagens: ' + error.message)
    } else if (data) {
      // Transformar os dados para o formato esperado
      const transformedData = data.map(message => ({
        ...message,
        user: message.profiles
      }))
      console.log('Messages loaded:', transformedData.length, transformedData)
      setMessages(transformedData)
    }
    setLoading(false)
  }

  async function getParticipants() {
    console.log('Fetching all community members...')
    
    // Buscar todos os usuários da comunidade
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        username,
        avatar_url,
        created_at
      `)
      .order('full_name', { ascending: true })
      .limit(500) // Garantir que pegue todos os usuários

    if (usersError) {
      console.error('Error fetching users:', usersError)
      toast.error('Erro ao carregar usuários: ' + usersError.message)
      return
    }

    // Buscar status online dos usuários que já participaram do chat
    const { data: chatParticipants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('user_id, is_online, last_seen')

    console.log('Users query result:', { allUsers, chatParticipants })

    if (allUsers) {
      // Combinar dados dos usuários com status do chat
      const transformedData = allUsers.map(user => {
        const chatData = chatParticipants?.find(p => p.user_id === user.id)
        return {
          id: user.id,
          user_id: user.id,
          user: user,
          is_online: chatData?.is_online || false,
          last_seen: chatData?.last_seen || user.created_at
        }
      })
      
      console.log('All community members loaded:', transformedData.length, transformedData)
      setParticipants(transformedData as ChatParticipant[])
      
      // Calcular número a exibir (fake ou real)
      await calculateDisplayCount(transformedData.length)
    }
  }

  async function calculateDisplayCount(realCount: number) {
    try {
      // Verificar se usuário é admin
      let isAdmin = false
      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        isAdmin = userProfile?.role === 'admin'
      }

      // Apenas admin vê o contador
      if (isAdmin) {
        setDisplayMembersCount(realCount)
      } else {
        setDisplayMembersCount(0) // Esconde para usuários comuns
      }
    } catch (error) {
      console.error('Error calculating display count:', error)
      setDisplayMembersCount(0)
    }
  }

  async function loadAvailableTags() {
    const { data, error } = await supabase
      .from('chat_auto_tags')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error loading tags:', error)
    } else {
      setAvailableTags(data || [])
      console.log('Available tags loaded:', data)
    }
  }

  async function updateUserOnlineStatus(isOnline: boolean) {
    if (!user) return

    const { error } = await supabase
      .from('chat_participants')
      .upsert({
        user_id: user.id,
        is_online: isOnline,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error updating online status:', error)
    }
  }

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😭', '😡', '🤯', '👍', '👎', '👏', '🙏', '💪', '🎉', '🔥', '❤️', '💯', '✅']

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    messageInputRef.current?.focus()
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
      toast.error('Erro ao deletar mensagem')
    } else {
      // Remover mensagem localmente
      setMessages(prev => prev.filter(m => m.id !== messageId))
      toast.success('Mensagem deletada')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB')
      return
    }

    setUploadingFile(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `chat-image-${Date.now()}.${fileExt}`
      const filePath = `chat/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('community')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('community')
        .getPublicUrl(filePath)

      setSelectedImage(publicUrl)
      toast.success('Imagem carregada!')
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload da imagem')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB')
      return
    }

    setUploadingFile(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `chat-file-${Date.now()}.${fileExt}`
      const filePath = `chat/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('community')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('community')
        .getPublicUrl(filePath)

      setSelectedFile({
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type
      })
      toast.success('Arquivo carregado!')
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload do arquivo')
    } finally {
      setUploadingFile(false)
    }
  }

  async function sendMessage() {
    if (!user || (!newMessage.trim() && !selectedImage && !selectedFile)) return

    setSending(true)

    const messageContent = newMessage.trim()

    const { data: messageData, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        content: messageContent || (selectedImage ? '📷 Imagem' : '📎 Arquivo'),
        image_url: selectedImage,
        file_url: selectedFile?.url,
        file_name: selectedFile?.name,
        file_size: selectedFile?.size,
        file_type: selectedFile?.type
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      toast.error('Erro ao enviar mensagem')
    } else {
      // Detectar menções e criar notificações
      const mentionRegex = /@(\w+)/g
      const mentions = []
      let match

      while ((match = mentionRegex.exec(messageContent)) !== null) {
        mentions.push(match[1])
      }

      // Criar notificações para usuários mencionados
      if (mentions.length > 0) {
        // Buscar IDs dos usuários mencionados
        const { data: mentionedUsers } = await supabase
          .from('profiles')
          .select('id, username')
          .in('username', mentions)

        if (mentionedUsers) {
          const notifications = mentionedUsers
            .filter(u => u.id !== user.id) // Não notificar a si mesmo
            .map(mentionedUser => ({
              user_id: mentionedUser.id,
              type: 'mention',
              content: `${profile?.full_name || profile?.username || 'Alguém'} mencionou você no chat`,
              related_user_id: user.id,
              is_read: false
            }))

          if (notifications.length > 0) {
            await supabase
              .from('notifications')
              .insert(notifications)
          }
        }
      }

      // Detectar hashtags e criar posts automaticamente
      const hashtagRegex = /#(\w+)/g
      const hashtags = []
      let hashMatch

      while ((hashMatch = hashtagRegex.exec(messageContent)) !== null) {
        hashtags.push(hashMatch[1])
      }

      // Criar posts para hashtags válidas
      if (hashtags.length > 0) {
        console.log('Hashtags detectadas:', hashtags)
        console.log('Tags disponíveis:', availableTags)
        
        for (const hashtag of hashtags) {
          const tag = availableTags.find(t => t.tag_name.toLowerCase() === hashtag.toLowerCase())
          
          if (tag) {
            console.log('Tag encontrada:', tag)
            
            // Criar post automaticamente
            const postData = {
              author_id: user.id,
              space_id: tag.target_space_id,
              content: messageContent,
              image_url: selectedImage || null
            }
            
            console.log('Criando post com dados:', postData)
            
            const { data: postResult, error: postError } = await supabase
              .from('posts')
              .insert(postData)
              .select()

            if (postError) {
              console.error('Erro ao criar post:', postError)
              toast.error(`Erro ao criar post: ${postError.message}`)
            } else {
              console.log('Post criado com sucesso:', postResult)
              toast.success(`Post criado em ${tag.tag_name}!`)
            }
          } else {
            console.log(`Tag #${hashtag} não encontrada nas tags disponíveis`)
          }
        }
      }

      setNewMessage('')
      setSelectedImage(null)
      setSelectedFile(null)
      messageInputRef.current?.focus()
    }

    setSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!showMentionSuggestions && !showHashtagSuggestions) {
        sendMessage()
      }
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    
    setNewMessage(value)
    
    // Detectar @ para menções
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@')
    const lastHashSymbol = textBeforeCursor.lastIndexOf('#')
    
    // Verificar qual símbolo está mais próximo do cursor
    if (lastHashSymbol > lastAtSymbol && lastHashSymbol !== -1) {
      // Detectar # para hashtags
      const textAfterHash = textBeforeCursor.substring(lastHashSymbol + 1)
      
      if (!textAfterHash.includes(' ') && textAfterHash.length >= 0) {
        setHashtagSearch(textAfterHash.toLowerCase())
        setHashtagStartPos(lastHashSymbol)
        setShowHashtagSuggestions(true)
        setShowMentionSuggestions(false)
      } else {
        setShowHashtagSuggestions(false)
      }
    } else if (lastAtSymbol !== -1 && lastAtSymbol > lastHashSymbol) {
      // Detectar @ para menções
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1)
      
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt.toLowerCase())
        setMentionStartPos(lastAtSymbol)
        setShowMentionSuggestions(true)
        setShowHashtagSuggestions(false)
      } else {
        setShowMentionSuggestions(false)
      }
    } else {
      setShowMentionSuggestions(false)
      setShowHashtagSuggestions(false)
    }
  }

  const insertMention = (username: string) => {
    const beforeMention = newMessage.substring(0, mentionStartPos)
    const afterMention = newMessage.substring(messageInputRef.current?.selectionStart || newMessage.length)
    
    const newText = `${beforeMention}@${username} ${afterMention}`
    setNewMessage(newText)
    setShowMentionSuggestions(false)
    
    // Focar no input
    setTimeout(() => {
      messageInputRef.current?.focus()
      const newCursorPos = mentionStartPos + username.length + 2
      messageInputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertHashtag = (tagName: string) => {
    const beforeHashtag = newMessage.substring(0, hashtagStartPos)
    const afterHashtag = newMessage.substring(messageInputRef.current?.selectionStart || newMessage.length)
    
    const newText = `${beforeHashtag}#${tagName} ${afterHashtag}`
    setNewMessage(newText)
    setShowHashtagSuggestions(false)
    
    setTimeout(() => {
      messageInputRef.current?.focus()
      const newCursorPos = hashtagStartPos + tagName.length + 2
      messageInputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const filteredParticipants = participants.filter(p => 
    p.user?.username?.toLowerCase().includes(mentionSearch) ||
    p.user?.full_name?.toLowerCase().includes(mentionSearch)
  ).slice(0, 5)

  const filteredTags = availableTags.filter(tag =>
    tag.tag_name.toLowerCase().includes(hashtagSearch)
  )

  const handleMentionClick = async (username: string) => {
    // Buscar usuário completo pelo username
    const { data: mentionedUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (mentionedUser) {
      // Navegar para o perfil usando SPA
      onViewProfile(mentionedUser)
    } else {
      toast.error('Usuário não encontrado')
    }
  }

  const renderMessageContent = (content: string) => {
    // Detectar menções (@username) e hashtags (#tag)
    const combinedRegex = /(@\w+)|(#\w+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = combinedRegex.exec(content)) !== null) {
      // Adicionar texto antes da menção/hashtag
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }
      
      if (match[1]) {
        // É uma menção @username
        const username = match[1].substring(1)
        parts.push(
          <button
            key={match.index}
            onClick={() => handleMentionClick(username)}
            className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-1 rounded font-medium hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors cursor-pointer inline-flex items-center"
            title={`Ver perfil de @${username}`}
          >
            @{username}
          </button>
        )
      } else if (match[2]) {
        // É uma hashtag #tag
        const tagName = match[2].substring(1)
        const tag = availableTags.find(t => t.tag_name.toLowerCase() === tagName.toLowerCase())
        
        parts.push(
          <span
            key={match.index}
            className={`px-1 rounded font-medium ${
              tag 
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title={tag ? `Tag: ${tag.tag_name} (criou post)` : 'Tag não reconhecida'}
          >
            #{tagName}
          </span>
        )
      }
      
      lastIndex = match.index + match[0].length
    }
    
    // Adicionar texto restante
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }
    
    return parts.length > 0 ? parts : content
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Faça login para acessar o chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Conecte-se com outros membros da comunidade em tempo real
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 top-16 lg:top-20 lg:left-64 flex flex-col lg:flex-row overflow-hidden z-0 lg:z-10">
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 lg:p-4 flex-shrink-0 mt-2 lg:mt-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">
                Chat Geral da Comunidade
              </h1>
              <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                {participants.filter(p => p.is_online).length} online
                {displayMembersCount > 0 && ` • ${displayMembersCount} total`}
              </p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              <button
                onClick={() => {
                  console.log('Manual refresh triggered')
                  getMessages()
                  getParticipants()
                }}
                className="px-2 lg:px-3 py-1 bg-primary-600 text-white rounded text-xs lg:text-sm hover:bg-primary-700"
              >
                Recarregar
              </button>
              {displayMembersCount > 0 && (
                <span className="hidden lg:inline text-sm text-gray-500">{displayMembersCount}</span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 lg:p-4 space-y-3 lg:space-y-4 overscroll-contain w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Carregando mensagens...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  Nenhuma mensagem ainda
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Seja o primeiro a enviar uma mensagem para a comunidade!
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
            const isOwn = message.user_id === user.id
            const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`flex max-w-[85%] sm:max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'} relative`}>
                  {showAvatar && !isOwn && (
                    <div className="flex-shrink-0 mr-3">
                      {message.user?.avatar_url ? (
                        <Image
                          src={message.user.avatar_url}
                          alt={message.user.full_name || 'Avatar'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(message.user?.full_name || message.user?.username || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`${showAvatar && isOwn ? 'mr-3' : showAvatar ? '' : 'ml-11'}`}>
                    {showAvatar && !isOwn && (
                      <div className="mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {message.user?.full_name || message.user?.username || 'Usuário'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    )}
                    
                    <div className="relative">
                      {/* Botão de deletar (apenas para mensagens próprias) */}
                      {isOwn && (
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                          title="Deletar mensagem"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                      
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                      {message.image_url && (
                        <div className="mb-2">
                          <Image
                            src={message.image_url}
                            alt="Imagem compartilhada"
                            width={300}
                            height={200}
                            className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => message.image_url && window.open(message.image_url, '_blank')}
                          />
                        </div>
                      )}
                      
                      {message.file_url && (
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-600 rounded mb-2 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Paperclip className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{message.file_name}</p>
                            <p className="text-xs opacity-75">
                              {message.file_size ? `${(message.file_size / 1024).toFixed(1)} KB` : 'Arquivo'}
                            </p>
                          </div>
                        </a>
                      )}
                      
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
                      )}
                      </div>
                    </div>
                    
                    {isOwn && (
                      <div className="text-right mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          }))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 lg:p-4 flex-shrink-0 w-full">
          {/* Preview de imagem selecionada */}
          {selectedImage && (
            <div className="mb-2 lg:mb-3 relative inline-block">
              <Image
                src={selectedImage}
                alt="Preview"
                width={150}
                height={150}
                className="rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Preview de arquivo selecionado */}
          {selectedFile && (
            <div className="mb-2 lg:mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
              <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-600 rounded">
                <Paperclip className="h-4 w-4" />
                <span className="text-xs lg:text-sm flex-1 truncate">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-600 flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-end space-x-1 lg:space-x-3">
            <div className="flex-1 relative">
              {/* Mention Suggestions Dropdown */}
              {showMentionSuggestions && filteredParticipants.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                  {filteredParticipants.map((participant) => (
                    <button
                      key={participant.id}
                      onClick={() => insertMention(participant.user?.username || '')}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      {participant.user?.avatar_url ? (
                        <Image
                          src={participant.user.avatar_url}
                          alt={participant.user.full_name || 'Avatar'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(participant.user?.full_name || participant.user?.username || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {participant.user?.full_name || participant.user?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{participant.user?.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Hashtag Suggestions Dropdown */}
              {showHashtagSuggestions && filteredTags.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Tags disponíveis (cria post automaticamente)
                    </p>
                  </div>
                  {filteredTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => insertHashtag(tag.tag_name)}
                      className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">#</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          #{tag.tag_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cria post automaticamente
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={handleMessageChange}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="w-full p-2 lg:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm lg:text-base"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
            </div>
            
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Input oculto para imagens */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Input oculto para arquivos */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Botão de anexar arquivo */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="p-1.5 lg:p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                title="Anexar arquivo"
              >
                <Paperclip className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
              
              {/* Botão de anexar imagem */}
              <button 
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingFile}
                className="p-1.5 lg:p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                title="Anexar imagem"
              >
                <ImageIcon className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
              
              {/* Botão de emoji */}
              <div className="relative">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 lg:p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Adicionar emoji"
                >
                  <Smile className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
                
                {/* Seletor de emojis */}
                {showEmojiPicker && (
                  <>
                    {/* Overlay para fechar ao clicar fora */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-3 z-50 w-64">
                      <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                        {emojis.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Botão de enviar */}
              <button
                onClick={sendMessage}
                disabled={(!newMessage.trim() && !selectedImage && !selectedFile) || sending || uploadingFile}
                className="p-1.5 lg:p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {sending || uploadingFile ? (
                  <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="h-4 w-4 lg:h-5 lg:w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 hidden lg:flex lg:flex-col">
        {/* Header fixo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Membros{displayMembersCount > 0 && ` (${displayMembersCount})`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {participants.filter(p => p.is_online).length} online
          </p>
        </div>
        
        {/* Lista com scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {participants
              .sort((a, b) => {
                // Ordenar: online primeiro, depois por last_seen
                if (a.is_online && !b.is_online) return -1
                if (!a.is_online && b.is_online) return 1
                return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
              })
              .map((participant) => (
              <div key={participant.id} className="flex items-center space-x-3 py-1">
                <div className="relative flex-shrink-0">
                  {participant.user?.avatar_url ? (
                    <Image
                      src={participant.user.avatar_url}
                      alt={participant.user.full_name || 'Avatar'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {(participant.user?.full_name || participant.user?.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <Circle className={`absolute -bottom-1 -right-1 h-3 w-3 fill-current ${
                    participant.is_online ? 'text-green-500' : 'text-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {participant.user?.full_name || participant.user?.username || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {participant.is_online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
