'use client'

import { useEffect, useState } from 'react'
import { supabase, type Profile, type Space } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import LoadingSpinner from '@/components/LoadingSpinner'
import AuthModal from '@/components/AuthModal'
import HomePage from '@/components/pages/HomePage'
import ChatPage from '@/components/pages/ChatPage'
import JobsPage from '@/components/pages/JobsPage'
import LeaderboardPage from '@/components/pages/LeaderboardPage'
import EventsPage from '@/components/pages/EventsPage'
import MembersPage from '@/components/pages/MembersPage'
import ProjectsPage from '@/components/pages/ProjectsPage'
import LessonsPage from '@/components/pages/LessonsPage'
import ProfilePage from '@/components/pages/ProfilePage'
import AdminPage from '@/components/pages/AdminPage'
import KiwifySettingsPage from '@/components/pages/KiwifySettingsPage'
// DESABILITADO TEMPORARIAMENTE - Estava causando problemas
// import '@/app/security-console'
import { type PageType } from '@/components/Navigation'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageType>('home')

  useEffect(() => {
    getUser()
    getSpaces()
    
    // Timeout de segurança para evitar loading infinito
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forçando fim do loading')
        setLoading(false)
      }
    }, 10000) // 10 segundos
    
    // Carregar página salva do localStorage
    if (typeof window !== 'undefined') {
      const savedPage = localStorage.getItem('currentPage') as PageType
      if (savedPage) {
        setCurrentPage(savedPage)
      }
    }
    
    // Verificar se há parâmetro de perfil na URL
    const urlParams = new URLSearchParams(window.location.search)
    const profileId = urlParams.get('profile')
    
    if (profileId) {
      // Só mudar para perfil se há parâmetro específico
      setCurrentPage('profile')
      if (profileId === 'own') {
        // Mostrar próprio perfil
        setViewingProfile(null)
      } else {
        // Mostrar perfil de outro usuário
        loadProfileById(profileId)
      }
    }

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)
      
      if (event === 'SIGNED_IN') {
        setLoading(true)
        await getUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Não fazer nada, apenas ignorar esses eventos
        console.log('Token refreshed ou user updated - ignorando')
      }
    })

    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Limpar localStorage se usuário não estiver logado
  useEffect(() => {
    if (!user && !loading && currentPage !== 'home') {
      localStorage.removeItem('currentPage')
      setCurrentPage('home')
    }
  }, [user, loading, currentPage])
  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.error('Erro ao buscar perfil:', error)
        }
        
        setProfile(profile)
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  async function getSpaces() {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching spaces:', error)
    } else {
      setSpaces(data || [])
    }
  }

  const handleSpaceSelect = (spaceId: string | null) => {
    setSelectedSpace(spaceId)
  }

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page)
    // Salvar página atual no localStorage
    localStorage.setItem('currentPage', page)
    
    if (page !== 'profile') {
      // Limpar viewingProfile quando sair da página de perfil
      setViewingProfile(null)
      // Limpar parâmetros da URL quando sair do perfil
      if (window.location.search.includes('profile=')) {
        window.history.replaceState({}, '', window.location.pathname)
      }
    } else if (page === 'profile') {
      // Se foi para perfil via menu (não via URL), mostrar próprio perfil
      if (!window.location.search.includes('profile=')) {
        setViewingProfile(null)
      }
    }
  }

  const updateProfile = async () => {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profile)
    }
  }

  const handleViewProfile = (profile: Profile) => {
    // Salvar página anterior para voltar corretamente
    localStorage.setItem('previousPage', currentPage)
    // Definir o perfil que está sendo visualizado
    setViewingProfile(profile)
    // Navegar para a página de perfil
    setCurrentPage('profile')
    // Salvar no localStorage
    localStorage.setItem('currentPage', 'profile')
  }

  const handleGoBackToMembers = () => {
    // Voltar para a página de membros
    setCurrentPage('members')
    setViewingProfile(null)
    localStorage.setItem('currentPage', 'members')
  }

  const handleGoBackToProjects = () => {
    // Voltar para a página de projetos
    setCurrentPage('projects')
    setViewingProfile(null)
    localStorage.setItem('currentPage', 'projects')
  }

  const loadProfileById = async (profileId: string) => {
    try {
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()
      
      if (targetProfile) {
        setViewingProfile(targetProfile)
        console.log('Loaded profile for mention:', targetProfile.full_name)
      }
    } catch (error) {
      console.error('Error loading profile by ID:', error)
    }
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            user={user}
            profile={profile}
            spaces={spaces}
            selectedSpace={selectedSpace}
            onSpaceSelect={handleSpaceSelect}
          />
        )
      case 'chat':
        return <ChatPage user={user} profile={profile} onViewProfile={handleViewProfile} />
      case 'kiwify-settings':
        return <KiwifySettingsPage user={user} profile={profile} />
      case 'jobs':
        return <JobsPage user={user} />
      case 'leaderboard':
        return <LeaderboardPage user={user} profile={profile} />
      case 'events':
        return <EventsPage user={user} />
      case 'members':
        return <MembersPage user={user} onViewProfile={handleViewProfile} />
      case 'projects':
        return <ProjectsPage user={user} onViewProfile={handleViewProfile} />
      case 'lessons':
        return <LessonsPage user={user} onViewProfile={handleViewProfile} />
      case 'profile':
        return (
          <ProfilePage 
            user={user} 
            profile={viewingProfile || profile} 
            onProfileUpdate={updateProfile}
            onGoBack={viewingProfile ? (
              // Detectar de onde veio para voltar para a página correta
              localStorage.getItem('previousPage') === 'projects' 
                ? handleGoBackToProjects 
                : handleGoBackToMembers
            ) : undefined}
          />
        )
      case 'admin':
        return <AdminPage user={user} onPageChange={handlePageChange} />
      default:
        return (
          <HomePage
            user={user}
            profile={profile}
            spaces={spaces}
            selectedSpace={selectedSpace}
            onSpaceSelect={handleSpaceSelect}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // Se não estiver logado, mostrar apenas página de autenticação
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
                Bem-vindo à Comunidade
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Faça login para acessar o conteúdo exclusivo
              </p>
            </div>
            <AuthModal isOpen={true} onClose={() => {}} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        user={user} 
        profile={profile} 
        currentPage={currentPage}
        onPageChange={handlePageChange}
        showMobileMenu={showMobileMenu}
        onToggleMobileMenu={() => setShowMobileMenu(!showMobileMenu)}
      />
      
      <div className="flex">
        <Sidebar 
          spaces={spaces} 
          selectedSpace={selectedSpace}
          onSpaceSelect={handleSpaceSelect}
          user={user}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          showMobileMenu={showMobileMenu}
          onCloseMobileMenu={() => setShowMobileMenu(false)}
        />
        
        <main className="flex-1 lg:ml-64 pt-20">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  )
}
