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
import PostModal from '@/components/PostModal'
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
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // Inicializar
    loadInitialData()
    
    // Expor funções globais para navegação SPA
    if (typeof window !== 'undefined') {
      (window as any).navigateToProfile = handleNavigateToProfile;
      (window as any).navigateToOwnProfile = handleNavigateToOwnProfile;
    }
    
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
      setCurrentPage('profile')
      if (profileId === 'own') {
        setViewingProfile(null)
      } else {
        loadProfileById(profileId)
      }
    }

    // Listener SIMPLES para auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadInitialData()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])
  
  async function loadInitialData() {
    try {
      setLoading(true)
      
      // Buscar usuário
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      setUser(user)
      
      // Buscar perfil e spaces em paralelo
      const [profileResult, spacesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('spaces').select('*').order('display_order', { ascending: true })
      ])
      
      if (profileResult.data) {
        setProfile(profileResult.data)
      }
      
      if (spacesResult.data) {
        setSpaces(spacesResult.data)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setLoading(false)
    }
  }

  // Limpar localStorage se usuário não estiver logado
  useEffect(() => {
    if (!user && !loading && currentPage !== 'home') {
      localStorage.removeItem('currentPage')
      setCurrentPage('home')
    }
  }, [user, loading, currentPage])

  const handleSpaceSelect = (spaceId: string | null) => {
    setSelectedSpace(spaceId)
    if (spaceId) {
      localStorage.setItem('selectedSpace', spaceId)
    }
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
        return targetProfile
      }
    } catch (error) {
      console.error('Error loading profile by ID:', error)
    }
    return null
  }

  const handlePostClick = (postId: string) => {
    console.log('🔗 Abrindo post:', postId)
    setSelectedPostId(postId)
  }

  const handleNavigateToProfile = async (profileData: any) => {
    console.log('👤 Navegando para perfil SPA:', profileData)
    
    try {
      setProfileLoading(true)
      
      // Primeiro definir o perfil que será visualizado
      if (profileData.id) {
        // Se já temos os dados do perfil, usar diretamente
        if (profileData.full_name || profileData.username) {
          setViewingProfile(profileData)
        } else {
          // Senão, buscar perfil completo
          const loadedProfile = await loadProfileById(profileData.id)
          if (!loadedProfile) {
            console.error('Não foi possível carregar o perfil')
            return
          }
        }
      } else {
        // Se não tem ID, usar os dados que temos
        setViewingProfile(profileData)
      }
      
      // Só depois mudar para a página de perfil
      setCurrentPage('profile')
      localStorage.setItem('currentPage', 'profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleNavigateToOwnProfile = () => {
    console.log('👤 Navegando para próprio perfil SPA')
    setViewingProfile(null) // null = próprio perfil
    setCurrentPage('profile')
    localStorage.setItem('currentPage', 'profile')
    // Limpar parâmetros da URL
    if (window.location.search.includes('profile=')) {
      window.history.replaceState({}, '', window.location.pathname)
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
        if (profileLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="large" />
            </div>
          )
        }
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
        onPostClick={handlePostClick}
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

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal
          postId={selectedPostId}
          currentUser={user}
          profile={profile}
          spaces={spaces}
          onClose={() => setSelectedPostId(null)}
          onPostUpdated={() => {
            // Recarregar dados se necessário
          }}
        />
      )}
    </div>
  )
}
