'use client'

import { useEffect, useState } from 'react'
import { supabase, type PortfolioProject, type Profile } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Search, 
  ExternalLink, 
  Github, 
  Globe, 
  Eye, 
  Star,
  Filter,
  Grid,
  List,
  Calendar,
  User as UserIcon,
  Tag
} from 'lucide-react'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ProjectsPageProps {
  user: User | null
  onViewProfile?: (profile: Profile) => void
}

interface ProjectWithUser extends PortfolioProject {
  profiles?: Profile
}

interface ProjectStats {
  totalProjects: number
  featuredProjects: number
  uniqueCreators: number
  thisMonthProjects: number
}

export default function ProjectsPage({ user, onViewProfile }: ProjectsPageProps) {
  const [projects, setProjects] = useState<ProjectWithUser[]>([])
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    featuredProjects: 0,
    uniqueCreators: 0,
    thisMonthProjects: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterFeatured, setFilterFeatured] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchStats()
  }, [])

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select(`
          *,
          profiles!portfolio_projects_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedProjects = data?.map(project => ({
        ...project,
        profiles: project.profiles as Profile
      })) || []

      setProjects(formattedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Total projects
      const { count: totalProjects } = await supabase
        .from('portfolio_projects')
        .select('*', { count: 'exact', head: true })

      // Featured projects
      const { count: featuredProjects } = await supabase
        .from('portfolio_projects')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true)

      // Unique creators
      const { data: uniqueCreatorsData } = await supabase
        .from('portfolio_projects')
        .select('user_id')

      const uniqueCreators = new Set(uniqueCreatorsData?.map(p => p.user_id) || []).size

      // This month projects
      const { count: thisMonthProjects } = await supabase
        .from('portfolio_projects')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString())

      setStats({
        totalProjects: totalProjects || 0,
        featuredProjects: featuredProjects || 0,
        uniqueCreators,
        thisMonthProjects: thisMonthProjects || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleProfileClick = (profile: Profile) => {
    if (onViewProfile) {
      onViewProfile(profile)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tools_used?.some(tool => tool.toLowerCase().includes(searchTerm.toLowerCase())) ||
      project.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFeatured = !filterFeatured || project.is_featured

    return matchesSearch && matchesFeatured
  })

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
    <div className="max-w-7xl mx-auto px-3 lg:px-4 py-4 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="text-center mb-6 lg:mb-8 px-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Vitrine de Projetos
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Descubra projetos incríveis criados pela nossa comunidade
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 lg:h-5 lg:w-5" />
              <input
                type="text"
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 lg:pl-10 pr-4 py-2 text-sm lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* Featured Filter */}
            <button
              onClick={() => setFilterFeatured(!filterFeatured)}
              className={`flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-2 rounded-lg transition-colors ${
                filterFeatured
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Star className={`h-3 w-3 lg:h-4 lg:w-4 ${filterFeatured ? 'fill-current' : ''}`} />
              <span className="text-xs lg:text-sm font-medium">Destacados</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 lg:p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Grid className="h-3 w-3 lg:h-4 lg:w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 lg:p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <List className="h-3 w-3 lg:h-4 lg:w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1 lg:mb-2">
              {stats.totalProjects}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Total de Projetos
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1 lg:mb-2">
              {stats.featuredProjects}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Projetos Destacados
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mb-1 lg:mb-2">
              {stats.uniqueCreators}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Criadores Únicos
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1 lg:mb-2">
              {stats.thisMonthProjects}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Este Mês
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            {searchTerm || filterFeatured ? 'Nenhum projeto encontrado' : 'Nenhum projeto cadastrado'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterFeatured 
              ? 'Tente alterar os filtros de busca.' 
              : 'Os projetos da comunidade aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6' 
          : 'space-y-4 lg:space-y-6'
        }>
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 ${
                viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''
              }`}
            >
              {/* Project Image */}
              <div className={`relative ${viewMode === 'list' ? 'h-48 sm:w-48 sm:h-auto flex-shrink-0' : 'h-48'}`}>
                {project.cover_image_url ? (
                  <Image
                    src={project.cover_image_url}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <div className="text-white text-4xl font-bold">
                      {project.title.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                
                {/* Featured Badge */}
                {project.is_featured && (
                  <div className="absolute top-2 lg:top-3 right-2 lg:right-3">
                    <div className="bg-yellow-500 text-white px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="hidden sm:inline">Destaque</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="p-4 lg:p-6 flex-1 min-w-0">
                {/* Creator Info */}
                <div className="flex items-center space-x-2 lg:space-x-3 mb-3 lg:mb-4">
                  <button
                    onClick={() => project.profiles && handleProfileClick(project.profiles)}
                    className="flex items-center space-x-2 hover:text-primary-600 transition-colors min-w-0"
                  >
                    {project.profiles?.avatar_url ? (
                      <Image
                        src={project.profiles.avatar_url}
                        alt={project.profiles.full_name || 'Avatar'}
                        width={28}
                        height={28}
                        className="lg:w-8 lg:h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-3 w-3 lg:h-4 lg:w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <p className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {project.profiles?.full_name || project.profiles?.username || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(project.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Project Title */}
                <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {project.title}
                </h3>

                {/* Project Description */}
                <p className="text-gray-600 dark:text-gray-300 text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-3">
                  {project.description}
                </p>

                {/* Tools Used */}
                {project.tools_used && project.tools_used.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-3 lg:mb-4">
                    {project.tools_used.slice(0, 3).map((tool, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 lg:py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                      >
                        {tool}
                      </span>
                    ))}
                    {project.tools_used.length > 3 && (
                      <span className="px-2 py-0.5 lg:py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                        +{project.tools_used.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* External Links */}
                {project.external_links && (
                  <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                    {project.external_links.github && (
                      <a
                        href={project.external_links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <Github className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="text-xs lg:text-sm">Código</span>
                      </a>
                    )}
                    {project.external_links.demo && (
                      <a
                        href={project.external_links.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="text-xs lg:text-sm">Demo</span>
                      </a>
                    )}
                    {project.external_links.website && (
                      <a
                        href={project.external_links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Globe className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="text-xs lg:text-sm">Site</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
