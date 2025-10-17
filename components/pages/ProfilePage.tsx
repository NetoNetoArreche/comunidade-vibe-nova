'use client'

import { useState, useEffect } from 'react'
import { supabase, type Profile, type PortfolioProject } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import { 
  Settings, 
  Plus, 
  Edit3, 
  ExternalLink, 
  Github, 
  Globe, 
  Linkedin, 
  Instagram,
  MapPin,
  Calendar,
  Star,
  Eye,
  Trash2,
  ArrowLeft
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import ProjectModal from '@/components/ProjectModal'
import ProfileStats from '@/components/ProfileStats'
import EditProfileModal from '@/components/EditProfileModal'

interface ProfilePageProps {
  user: User | null
  profile: Profile | null
  onProfileUpdate?: () => void
  onGoBack?: () => void
}

export default function ProfilePage({ user, profile, onProfileUpdate, onGoBack }: ProfilePageProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  
  // Verificar se é o próprio perfil do usuário logado
  const isOwnProfile = user && profile && user.id === profile.id

  const goToMyProfile = () => {
    window.location.href = '/?profile=own'
  }

  useEffect(() => {
    if (profile) {
      getUserProjects()
    }
  }, [profile])

  async function getUserProjects() {
    if (!profile) return

    console.log('Loading projects for profile:', profile.id, profile.full_name)

    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('user_id', profile.id)
      .order('display_order', { ascending: true })

    console.log('Projects loaded:', data?.length || 0, 'Error:', error)

    if (!error && data) {
      setProjects(data)
    }
    setLoading(false)
  }

  const handleProfileUpdate = () => {
    // Chamar a função de callback do componente pai para atualizar o perfil
    if (onProfileUpdate) {
      onProfileUpdate()
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Faça login para ver seu perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Você precisa estar logado para acessar esta página
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Cover */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-80 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
          {profile?.cover_url && (
            <Image
              src={profile.cover_url}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        {/* Profile Card - Overlapping */}
        <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Avatar Section */}
              <div className="lg:col-span-3 flex flex-col items-center lg:items-start">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Avatar'}
                      width={160}
                      height={160}
                      className="rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
                      <span className="text-white font-bold text-5xl">
                        {(profile?.full_name || profile?.username || user.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Online Status */}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 w-full">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowEditProfile(true)}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Editar Perfil
                    </button>
                  ) : (
                    <button
                      onClick={goToMyProfile}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Ver Meu Perfil
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="lg:col-span-6 mt-6 lg:mt-0">
                {/* Back Button and Name */}
                <div className="mb-4">
                  {!isOwnProfile && onGoBack && (
                    <button
                      onClick={onGoBack}
                      className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group mb-3"
                    >
                      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                      <span className="text-sm font-medium">Voltar</span>
                    </button>
                  )}
                  
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {profile?.full_name || profile?.username || 'Usuário'}
                  </h1>
                  {profile?.username && (
                    <p className="text-lg text-primary-600 dark:text-primary-400">@{profile.username}</p>
                  )}
                </div>

                {/* Bio */}
                {profile?.bio ? (
                  <div className="mb-6">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      Adicione uma bio para contar mais sobre você
                    </p>
                  </div>
                )}

                {/* Social Links */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {profile?.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      <span className="text-sm font-medium">GitHub</span>
                    </a>
                  )}
                  {profile?.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </a>
                  )}
                  {profile?.instagram_url && (
                    <a
                      href={profile.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                      <span className="text-sm font-medium">Instagram</span>
                    </a>
                  )}
                  {profile?.portfolio_url && (
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">Portfolio</span>
                    </a>
                  )}
                </div>

                {/* Member Since */}
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Membro desde {formatDistanceToNow(new Date(profile?.created_at || ''), { 
                      addSuffix: false, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="lg:col-span-3 mt-6 lg:mt-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Atividade
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isOwnProfile ? 'Suas interações na comunidade' : 'Interações na comunidade'}
                  </p>
                </div>
                <ProfileStats 
                  user={profile ? { id: profile.id, email: '' } as User : user} 
                  projectsCount={projects.length} 
                  featuredCount={projects.filter(p => p.is_featured).length} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Portfólio
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'} • {projects.filter(p => p.is_featured).length} em destaque
                </p>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setShowAddProject(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Novo Projeto</span>
                </button>
              )}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="p-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <div className="text-4xl">📁</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {isOwnProfile ? 'Seu portfólio está vazio' : 'Nenhum projeto público'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {isOwnProfile 
                    ? 'Mostre seus projetos incríveis para a comunidade. Adicione seu primeiro projeto e comece a construir seu portfólio.'
                    : 'Este usuário ainda não adicionou projetos ao seu portfólio.'
                  }
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAddProject(true)}
                    className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Adicionar Primeiro Projeto</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-2xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Project Image */}
                    <div className="relative h-56 overflow-hidden">
                      {project.cover_image_url ? (
                        <Image
                          src={project.cover_image_url}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 flex items-center justify-center">
                          <div className="text-6xl opacity-50">🚀</div>
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      {project.is_featured && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Destaque
                          </div>
                        </div>
                      )}

                      {/* Overlay with Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-3">
                          {project.external_links?.demo && (
                            <a
                              href={project.external_links.demo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                              title="Ver Demo"
                            >
                              <Eye className="h-5 w-5 text-gray-900" />
                            </a>
                          )}
                          {project.external_links?.github && (
                            <a
                              href={project.external_links.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                              title="Ver no GitHub"
                            >
                              <Github className="h-5 w-5 text-gray-900" />
                            </a>
                          )}
                          {project.external_links?.website && (
                            <a
                              href={project.external_links.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                              title="Visitar Site"
                            >
                              <Globe className="h-5 w-5 text-gray-900" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 flex-1">
                          {project.title}
                        </h3>
                        {isOwnProfile && (
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => setEditingProject(project)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              title="Editar Projeto"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Excluir Projeto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Tools */}
                      {project.tools_used && project.tools_used.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.tools_used.slice(0, 4).map((tool, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full border border-primary-200 dark:border-primary-800"
                            >
                              {tool}
                            </span>
                          ))}
                          {project.tools_used.length > 4 && (
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                              +{project.tools_used.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSuccess={handleProfileUpdate}
        user={user}
        profile={profile}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={showAddProject || !!editingProject}
        onClose={() => {
          setShowAddProject(false)
          setEditingProject(null)
        }}
        onSuccess={() => {
          getUserProjects()
          setShowAddProject(false)
          setEditingProject(null)
        }}
        user={user!}
        project={editingProject}
      />
    </div>
  )
}
