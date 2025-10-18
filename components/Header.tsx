'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, type Profile } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Bell, 
  Search, 
  Menu, 
  LogOut, 
  Settings, 
  User as UserIcon,
  MessageCircle,
  Briefcase,
  Home
} from 'lucide-react'
import Image from 'next/image'
import Logo from './Logo'
import Navigation, { type PageType } from './Navigation'
import AuthModal from './AuthModal'
import PostModal from './PostModal'

interface HeaderProps {
  user: User | null
  profile: Profile | null
  currentPage: PageType
  onPageChange: (page: PageType) => void
  showMobileMenu?: boolean
  onToggleMobileMenu?: () => void
  onPostClick?: (postId: string) => void
}

export default function Header({ user, profile, currentPage, onPageChange, showMobileMenu: externalShowMobileMenu, onToggleMobileMenu, onPostClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const actualShowMobileMenu = externalShowMobileMenu !== undefined ? externalShowMobileMenu : showMobileMenu
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [spaces, setSpaces] = useState<any[]>([])
  const isInitialLoadRef = useRef(true)

  // Expor função para abrir post
  useEffect(() => {
    if (onPostClick) {
      // Criar uma função global para abrir posts
      (window as any).openPost = onPostClick
    }
  }, [onPostClick])

  // Função para tocar som de notificação
  const playNotificationSound = async () => {
    console.log('🔊 Tentando tocar som de notificação...')
    
    try {
      // Primeiro, tentar com áudio simples (mais compatível)
      const audio = new Audio()
      
      // Criar um som de notificação usando data URL
      const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
      
      audio.src = audioData
      audio.volume = 0.3
      
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        await playPromise
        console.log('✅ Som tocado com sucesso!')
      }
      
    } catch (audioError) {
      console.warn('❌ Áudio simples falhou:', audioError)
      
      // Fallback: Web Audio API
      try {
        console.log('🔄 Tentando Web Audio API...')
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Verificar se o contexto precisa ser resumido (política do navegador)
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }
        
        // Criar oscilador simples
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Som simples e alto
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.type = 'sine'
        
        // Volume mais alto para teste
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
        
        console.log('✅ Web Audio API funcionou!')
        
      } catch (webAudioError) {
        console.error('❌ Web Audio API também falhou:', webAudioError)
        
        // Último recurso: alert (só para debug)
        console.log('🚨 Todos os métodos de áudio falharam. Notificação chegou mas sem som.')
      }
    }
  }

  useEffect(() => {
    if (user) {
      getNotifications()
      getSpaces()
      
      // Realtime subscription para notificações
      console.log('🔄 Configurando realtime para notificações')
      console.log('👤 User ID:', user.id)
      
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Nova notificação recebida:', payload)
            console.log('🕐 isInitialLoad:', isInitialLoadRef.current)
            
            // Tocar som apenas se não for o carregamento inicial
            if (!isInitialLoadRef.current) {
              console.log('🔊 Chamando playNotificationSound...')
              playNotificationSound()
            } else {
              console.log('⏳ Pulando som (ainda no carregamento inicial)')
            }
            getNotifications()
          }
        )
        .subscribe((status) => {
          console.log('📡 Status da conexão realtime:', status)
        })

      return () => {
        console.log('🔌 Desconectando realtime de notificações')
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  // Marcar que o carregamento inicial terminou após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('⏰ Carregamento inicial finalizado - som habilitado')
      isInitialLoadRef.current = false
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Fechar menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
      
      if (showNotifications && !target.closest('.notifications-container')) {
        setShowNotifications(false)
      }
    }

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showUserMenu, showNotifications])

  async function getSpaces() {
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .order('display_order', { ascending: true })
    
    if (data) {
      setSpaces(data)
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch()
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(delaySearch)
  }, [searchQuery])

  async function performSearch() {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const query = searchQuery.toLowerCase()

      // Buscar posts
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          profiles!posts_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(5)

      // Buscar usuários
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .limit(5)

      // Buscar projetos
      const { data: projects } = await supabase
        .from('portfolio_projects')
        .select(`
          id,
          title,
          description,
          profiles!portfolio_projects_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5)

      // Buscar eventos
      const { data: events } = await supabase
        .from('events')
        .select('id, title, description, start_time')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5)

      const results = [
        ...(posts?.map(p => ({ ...p, type: 'post' })) || []),
        ...(users?.map(u => ({ ...u, type: 'user' })) || []),
        ...(projects?.map(p => ({ ...p, type: 'project' })) || []),
        ...(events?.map(e => ({ ...e, type: 'event' })) || [])
      ]

      setSearchResults(results)
      setShowSearchResults(results.length > 0)
    } catch (error) {
      console.error('Erro na busca:', error)
    } finally {
      setIsSearching(false)
    }
  }

  async function getNotifications() {
    if (!user) {
      console.log('❌ getNotifications: Usuário não autenticado')
      return
    }

    console.log('🔔 Buscando notificações para:', user.id)

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('📬 Resultado notificações:', { 
      error, 
      count: data?.length || 0,
      data: data?.slice(0, 3) // Mostrar apenas 3 primeiras
    })

    if (error) {
      console.error('❌ Erro ao buscar notificações:', error)
      return
    }

    if (data) {
      setNotifications(data)
      setUnreadCount(data.length)
      console.log(`✅ ${data.length} notificações não lidas carregadas`)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  async function markAsRead(notificationId: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    
    // Atualizar estado local
    setNotifications(notifications.filter(n => n.id !== notificationId))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    if (!user) return
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    
    setNotifications([])
    setUnreadCount(0)
    setShowNotifications(false)
  }

  function handleNotificationClick(notification: any) {
    markAsRead(notification.id)
    setShowNotifications(false)
    
    if (notification.related_post_id) {
      setSelectedPostId(notification.related_post_id)
    }
  }

  const handleAuthClick = () => {
    setShowAuthModal(true)
  }

  const handleResultClick = (result: any) => {
    setSearchQuery('')
    setShowSearchResults(false)
    
    switch (result.type) {
      case 'user':
        // Navegar para perfil do usuário usando SPA
        if ((window as any).navigateToProfile) {
          (window as any).navigateToProfile(result)
        }
        break
      case 'post':
        // Navegar para home e focar no post
        onPageChange('home')
        break
      case 'project':
        // Navegar para página de projetos
        onPageChange('projects')
        break
      case 'event':
        // Navegar para página de eventos
        onPageChange('events')
        break
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm overflow-visible">
      <div className="flex items-center justify-between h-20 px-4">
        {/* Logo Section - Aligned with Sidebar */}
        <div className="flex items-center w-64 flex-shrink-0 relative">
          <button
            onClick={onToggleMobileMenu || (() => setShowMobileMenu(!showMobileMenu))}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <button onClick={() => onPageChange('home')} className="ml-4 relative z-40">
            <Logo size="medium" showText={false} />
          </button>
        </div>

          {/* Search Bar - Center */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar posts, usuários, projetos, eventos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon/Avatar */}
                        <div className="flex-shrink-0 mt-1">
                          {result.type === 'user' ? (
                            result.avatar_url ? (
                              <Image
                                src={result.avatar_url}
                                alt={result.full_name || result.username}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                              </div>
                            )
                          ) : result.type === 'post' ? (
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                              <MessageCircle className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                            </div>
                          ) : result.type === 'project' ? (
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                              <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              <Home className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              {result.type === 'user' ? 'Usuário' : 
                               result.type === 'post' ? 'Post' : 
                               result.type === 'project' ? 'Projeto' : 'Evento'}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.type === 'user' 
                              ? result.full_name || result.username 
                              : result.title || 'Sem título'}
                          </p>
                          {result.type === 'user' && result.username && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{result.username}
                            </p>
                          )}
                          {(result.content || result.description) && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                              {result.content || result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Loading indicator */}
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* User Menu - Right */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>

                {/* Notifications */}
                <div className="relative notifications-container">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma notificação</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                  notification.type === 'like' ? 'bg-red-500' : 
                                  notification.type === 'comment' ? 'bg-blue-500' : 
                                  notification.type === 'mention' ? 'bg-purple-500' : 
                                  'bg-gray-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {notification.content}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Avatar'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <button
                        onClick={() => {
                          onPageChange('profile')
                          setShowUserMenu(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <UserIcon className="h-4 w-4 mr-3" />
                        Meu Perfil
                      </button>
                      {user?.email === 'helioarreche@gmail.com' && (
                        <>
                          <hr className="my-1 border-gray-200 dark:border-gray-600" />
                          <button
                            onClick={() => {
                              onPageChange('admin')
                              setShowUserMenu(false)
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left font-medium"
                          >
                            <Settings className="h-4 w-4 mr-3" />
                            Painel Admin
                          </button>
                        </>
                      )}
                      <hr className="my-1 border-gray-200 dark:border-gray-600" />
                      <button
                        onClick={signOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={handleAuthClick}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Entrar
              </button>
            )}
          </div>
      </div>

      {/* Mobile Search */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar posts, usuários, espaços..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          currentUser={user}
          profile={profile}
          spaces={spaces}
          onClose={() => setSelectedPostId(null)}
          onPostUpdated={() => getNotifications()}
        />
      )}
    </header>
  )
}
