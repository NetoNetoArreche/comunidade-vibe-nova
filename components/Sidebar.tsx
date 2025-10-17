'use client'

import { useState, useEffect } from 'react'
import { supabase, type Space, type SpaceGroup } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { type PageType } from './Navigation'
import { 
  Home, 
  Hash, 
  Plus, 
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Briefcase,
  Trophy,
  Users,
  Calendar,
  BookOpen,
  Folder,
  GraduationCap
} from 'lucide-react'
import Image from 'next/image'

interface SidebarProps {
  spaces: Space[]
  selectedSpace: string | null
  onSpaceSelect: (spaceId: string | null) => void
  user: User | null
  currentPage: PageType
  onPageChange: (page: PageType) => void
  showMobileMenu?: boolean
  onCloseMobileMenu?: () => void
}

export default function Sidebar({ spaces, selectedSpace, onSpaceSelect, user, currentPage, onPageChange, showMobileMenu, onCloseMobileMenu }: SidebarProps) {
  const [spaceGroups, setSpaceGroups] = useState<SpaceGroup[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<number>(0)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [unreadChatMessages, setUnreadChatMessages] = useState<number>(0)

  useEffect(() => {
    getSpaceGroups()
    getOnlineUsers()
    
    if (user) {
      getUnreadCounts()
      getUnreadChatMessages()
      
      // Atualizar mensagens não lidas a cada 10 segundos
      const interval = setInterval(() => {
        getUnreadChatMessages()
      }, 10000)
      
      // Configurar Realtime para atualizar contagem de usuários online
      const participantsChannel = supabase
        .channel('sidebar-participants')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_participants'
          },
          () => {
            // Atualizar contagem quando houver mudanças
            getOnlineUsers()
          }
        )
        .subscribe()
      
      return () => {
        clearInterval(interval)
        participantsChannel.unsubscribe()
      }
    }
    
    // Expand all groups by default
    const allGroupIds = new Set(spaces.map(space => space.group_id).filter(Boolean) as string[])
    setExpandedGroups(allGroupIds)
  }, [spaces, user])

  async function getUnreadCounts() {
    if (!user) return

    const counts: Record<string, number> = {}
    
    for (const space of spaces) {
      const { data, error } = await supabase
        .rpc('get_unread_posts_count', {
          p_user_id: user.id,
          p_space_id: space.id
        })

      if (!error && data !== null) {
        counts[space.id] = data
      }
    }

    setUnreadCounts(counts)
  }

  async function markSpaceAsViewed(spaceId: string) {
    if (!user) return

    await supabase
      .from('user_space_views')
      .upsert({
        user_id: user.id,
        space_id: spaceId,
        last_viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,space_id'
      })

    // Atualizar contagem local
    setUnreadCounts(prev => ({
      ...prev,
      [spaceId]: 0
    }))
  }

  const handleSpaceClick = (spaceId: string) => {
    onSpaceSelect(spaceId)
    markSpaceAsViewed(spaceId)
  }

  async function getSpaceGroups() {
    const { data, error } = await supabase
      .from('space_groups')
      .select('*')
      .order('display_order', { ascending: true })

    if (!error && data) {
      setSpaceGroups(data)
    }
  }

  async function getOnlineUsers() {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('is_online', true)

    if (!error && data) {
      setOnlineUsers(data.length)
    }
  }

  async function getUnreadChatMessages() {
    if (!user) return

    // Buscar a última vez que o usuário viu o chat
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('last_seen')
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      setUnreadChatMessages(0)
      return
    }

    // Contar mensagens após a última visualização
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', participant.last_seen)
      .neq('user_id', user.id) // Não contar próprias mensagens

    if (!error && count !== null) {
      setUnreadChatMessages(count)
    }
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const groupedSpaces = spaceGroups.map(group => ({
    ...group,
    spaces: spaces.filter(space => space.group_id === group.id)
  }))

  const ungroupedSpaces = spaces.filter(space => !space.group_id)

  const handleNavigation = (callback: () => void) => {
    callback()
    if (onCloseMobileMenu) {
      onCloseMobileMenu()
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-50 transition-transform duration-300 lg:top-20 lg:z-30 lg:translate-x-0 ${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } lg:block`}>
        <div className="p-4">
        {/* Main Navigation */}
        <nav className="space-y-2 mb-6">
          <button
            onClick={() => handleNavigation(() => {
              onPageChange('home')
              onSpaceSelect(null)
            })}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === 'home' && selectedSpace === null
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Home className="h-5 w-5 mr-3" />
            Feed Principal
          </button>

          <button
            onClick={() => {
              onPageChange('chat')
              setUnreadChatMessages(0) // Zerar ao clicar
            }}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === 'chat'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <MessageCircle className="h-5 w-5 mr-3" />
            <span className="flex-1">Chat Geral</span>
            <div className="flex items-center space-x-1">
              {unreadChatMessages > 0 && (
                <span 
                  className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium"
                  title={`${unreadChatMessages} mensagem${unreadChatMessages > 1 ? 's' : ''} não lida${unreadChatMessages > 1 ? 's' : ''}`}
                >
                  {unreadChatMessages > 99 ? '99+' : unreadChatMessages}
                </span>
              )}
              <span 
                className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center"
                title={`${onlineUsers} usuário${onlineUsers !== 1 ? 's' : ''} online`}
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full mr-1"></span>
                {onlineUsers}
              </span>
            </div>
          </button>

          <button
            onClick={() => onPageChange('jobs')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === 'jobs'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Briefcase className="h-5 w-5 mr-3" />
            Oportunidades
          </button>

          <button
            onClick={() => onPageChange('leaderboard')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === 'leaderboard'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Trophy className="h-5 w-5 mr-3" />
            Ranking
          </button>

          <button
            onClick={() => onPageChange('events')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === 'events'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="h-5 w-5 mr-3" />
            Eventos
          </button>

          <button
            onClick={() => onPageChange('members')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === 'members'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="h-5 w-5 mr-3" />
            Membros
          </button>

          <button
            onClick={() => onPageChange('projects')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === 'projects'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Folder className="h-5 w-5 mr-3" />
            Projetos
          </button>

          <button
            onClick={() => onPageChange('lessons')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              currentPage === 'lessons'
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <GraduationCap className="h-5 w-5 mr-3" />
            Aulas
          </button>
        </nav>

        {/* Spaces Section - Only show on Home page */}
        {currentPage === 'home' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Espaços
            </h3>
            {user && (
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {/* Grouped Spaces */}
            {groupedSpaces.map(group => (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center px-2 py-1 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                  )}
                  {group.name}
                </button>

                {expandedGroups.has(group.id) && (
                  <div className="ml-4 space-y-1">
                    {group.spaces.map(space => (
                      <button
                        key={space.id}
                        onClick={() => handleSpaceClick(space.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedSpace === space.id
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          {space.icon_image_url ? (
                            <Image
                              src={space.icon_image_url}
                              alt={space.name}
                              width={20}
                              height={20}
                              className="rounded mr-3 flex-shrink-0"
                            />
                          ) : (
                            <div 
                              className="w-5 h-5 rounded mr-3 flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: space.icon_color || '#6b7280' }}
                            >
                              <Hash className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <span className="text-sm truncate">{space.name}</span>
                        </div>
                        {unreadCounts[space.id] > 0 && (
                          <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                            {unreadCounts[space.id] > 99 ? '99+' : unreadCounts[space.id]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Ungrouped Spaces */}
            {ungroupedSpaces.map(space => (
              <button
                key={space.id}
                onClick={() => handleSpaceClick(space.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedSpace === space.id
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  {space.icon_image_url ? (
                    <Image
                      src={space.icon_image_url}
                      alt={space.name}
                      width={20}
                      height={20}
                      className="rounded mr-3 flex-shrink-0"
                    />
                  ) : (
                    <div 
                      className="w-5 h-5 rounded mr-3 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: space.icon_color || '#6b7280' }}
                    >
                      <Hash className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <span className="text-sm truncate">{space.name}</span>
                </div>
                {unreadCounts[space.id] > 0 && (
                  <span className="ml-2 bg-primary-600 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                    {unreadCounts[space.id] > 99 ? '99+' : unreadCounts[space.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Links Úteis
          </h3>
          <div className="space-y-2">
            <a
              href="https://dashboard.kiwify.com.br/login?redirect=%2Fcourse%2Fpremium%2Fbc811707-8e85-4d22-a8ca-cb1d8d054e0a%3Fmod%3D551de203-35cb-451c-ae1a-bff3562ab73e%26lesson%3D5d6139cf-15e9-4897-b1f3-e5f1dee6cbb6%26sec%3Df3cd9475-13fd-44c2-ba21-f44b95778fd9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <GraduationCap className="h-4 w-4 mr-3" />
              Aulas Kiwify
            </a>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}
