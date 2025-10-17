'use client'

import { useEffect, useState } from 'react'
import { supabase, type Profile } from '@/lib/supabase'
import { Users, Search, Github, Linkedin, Globe, Instagram, Phone, ExternalLink, Crown, Shield, User as UserIcon } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface MembersPageProps {
  user: User | null
  onViewProfile?: (profile: Profile) => void
}

interface MemberStats {
  totalMembers: number
  withGithub: number
  withLinkedin: number
  withPortfolio: number
}

export default function MembersPage({ user, onViewProfile }: MembersPageProps) {
  const [members, setMembers] = useState<Profile[]>([])
  const [stats, setStats] = useState<MemberStats>({
    totalMembers: 0,
    withGithub: 0,
    withLinkedin: 0,
    withPortfolio: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    fetchMembers()
    loadData()
  }, [user])

  async function loadData() {
    await fetchUserProfile()
    await fetchStats()
  }

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserProfile() {
    if (!user) return
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  async function fetchStats() {
    try {
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: withGithub } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('github_url', 'is', null)

      const { count: withLinkedin } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('linkedin_url', 'is', null)

      const { count: withPortfolio } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('portfolio_url', 'is', null)

      setStats({
        totalMembers: totalMembers || 0,
        withGithub: withGithub || 0,
        withLinkedin: withLinkedin || 0,
        withPortfolio: withPortfolio || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return { icon: Crown, label: 'Admin', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
      case 'moderator':
        return { icon: Shield, label: 'Moderador', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }
      default:
        return { icon: UserIcon, label: 'Membro', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    }
  }

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleMemberClick = (member: Profile, event?: React.MouseEvent) => {
    // Prevenir qualquer comportamento padrão
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    console.log('🚀 Visualizando perfil de:', member.full_name || member.username)
    
    // Usar callback para navegar internamente
    if (onViewProfile) {
      onViewProfile(member)
    } else {
      console.warn('onViewProfile callback não fornecido')
    }
  }


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    )
  }
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Membros da Comunidade
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Conheça os desenvolvedores incríveis da nossa comunidade
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar membros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Stats - Apenas para Admin */}
      {userProfile?.role === 'admin' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                  Informações Administrativas
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Visível apenas para você
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stats.totalMembers}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total de Membros
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Cards */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Tente alterar os termos de busca.' : 'Os membros aparecerão aqui quando se cadastrarem.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredMembers.map((member) => {
            const roleBadge = getRoleBadge(member.role)
            const RoleIcon = roleBadge.icon
            
            const identifier = member.username || member.id
            
            return (
              <div 
                key={member.id}
                onClick={(e) => handleMemberClick(member, e)}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
              >
                {/* Cover */}
                {member.cover_url ? (
                  <div className="h-20 relative">
                    <Image
                      src={member.cover_url}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 bg-gradient-to-r from-cyan-400 to-blue-600"></div>
                )}
                
                {/* Profile */}
                <div className="p-6 relative">
                  {/* Avatar */}
                  <div className="absolute -top-10 left-6">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.full_name || member.username || 'Avatar'}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {(member.full_name || member.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {member.full_name || member.username || 'Usuário'}
                    </h3>
                    {member.username && member.full_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                        @{member.username}
                      </p>
                    )}
                    {member.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {member.bio}
                      </p>
                    )}

                    {/* Social Links */}
                    <div className="flex items-center space-x-3 mb-4">
                      {member.github_url && (
                        <a
                          href={member.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                      {member.linkedin_url && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {member.portfolio_url && (
                        <a
                          href={member.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {member.instagram_url && (
                        <a
                          href={member.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-pink-600 transition-colors"
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                      {member.whatsapp_number && (
                        <a
                          href={`https://wa.me/${member.whatsapp_number.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    {/* Role Badge and View Profile */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${roleBadge.color}`}>
                        <RoleIcon className="h-3 w-3" />
                        <span>{roleBadge.label}</span>
                      </span>
                      <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-3 w-3" />
                        <span>Ver perfil</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
