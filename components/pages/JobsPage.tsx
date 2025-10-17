'use client'

import { useEffect, useState } from 'react'
import { supabase, type JobOpportunity } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Briefcase, 
  Plus, 
  MapPin, 
  Clock, 
  Building, 
  ExternalLink,
  Phone,
  Filter,
  Search
} from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface JobsPageProps {
  user: User | null
}

export default function JobsPage({ user }: JobsPageProps) {
  const [jobs, setJobs] = useState<JobOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('job_opportunities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Erro ao carregar oportunidades')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory
    const matchesType = selectedType === 'all' || job.job_type === selectedType
    const matchesLocation = selectedLocation === 'all' || job.location_type === selectedLocation

    return matchesSearch && matchesCategory && matchesType && matchesLocation
  })

  const getJobTypeLabel = (type: string) => {
    const types = {
      'estagio': 'Estágio',
      'junior': 'Júnior',
      'pleno': 'Pleno',
      'senior': 'Sênior',
      'freelance': 'Freelance'
    }
    return types[type as keyof typeof types] || type
  }

  const getCategoryLabel = (category: string) => {
    const categories = {
      'frontend': 'Frontend',
      'backend': 'Backend',
      'fullstack': 'Fullstack',
      'mobile': 'Mobile',
      'design': 'Design',
      'devops': 'DevOps',
      'data': 'Data Science',
      'qa': 'QA/Testes',
      'product': 'Produto',
      'outros': 'Outros'
    }
    return categories[category as keyof typeof categories] || category
  }

  const getLocationTypeLabel = (type: string) => {
    const types = {
      'remoto': 'Remoto',
      'presencial': 'Presencial',
      'hibrido': 'Híbrido'
    }
    return types[type as keyof typeof types] || type
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-3 lg:px-4 py-4 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Oportunidades de Trabalho
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1 lg:mt-2">
              {jobs.length} oportunidade{jobs.length !== 1 ? 's' : ''} disponível{jobs.length !== 1 ? 'eis' : ''}
            </p>
          </div>
          
          {user && (
            <button className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Postar Vaga</span>
              <span className="sm:hidden">Nova</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 lg:h-5 lg:w-5" />
            <input
              type="text"
              placeholder="Buscar por título, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2 text-sm lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas as áreas</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="fullstack">Fullstack</option>
              <option value="mobile">Mobile</option>
              <option value="design">Design</option>
              <option value="devops">DevOps</option>
              <option value="data">Data Science</option>
              <option value="qa">QA/Testes</option>
              <option value="product">Produto</option>
              <option value="outros">Outros</option>
            </select>

            {/* Job Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-sm lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os níveis</option>
              <option value="estagio">Estágio</option>
              <option value="junior">Júnior</option>
              <option value="pleno">Pleno</option>
              <option value="senior">Sênior</option>
              <option value="freelance">Freelance</option>
            </select>

            {/* Location Type Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 text-sm lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas as modalidades</option>
              <option value="remoto">Remoto</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            {searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedLocation !== 'all' 
              ? 'Nenhuma oportunidade encontrada' 
              : 'Nenhuma oportunidade disponível'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedLocation !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Novas oportunidades serão exibidas aqui em breve!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 hover:shadow-md transition-shadow">
              {/* Job Header */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {job.title}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Building className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                      <span className="truncate">{job.company}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                      <span className="truncate">{getLocationTypeLabel(job.location_type)}</span>
                      {job.location && <span className="hidden sm:inline">• {job.location}</span>}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                      <span>{new Date(job.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Job Tags */}
                <div className="flex flex-row lg:flex-col items-start lg:items-end gap-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs font-medium rounded-full whitespace-nowrap">
                      {getCategoryLabel(job.category)}
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full whitespace-nowrap">
                      {getJobTypeLabel(job.job_type)}
                    </span>
                  </div>
                  {job.salary_range && (
                    <span className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {job.salary_range}
                    </span>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                {job.description}
              </p>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Requisitos:
                  </h4>
                  <div className="flex flex-wrap gap-1.5 lg:gap-2">
                    {job.requirements.map((req, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-3">
                  {job.external_link && (
                    <a
                      href={job.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-xs lg:text-sm font-medium"
                    >
                      <ExternalLink className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span>Ver detalhes</span>
                    </a>
                  )}
                  {job.contact_info && (
                    <a
                      href={job.contact_info.includes('@') ? `mailto:${job.contact_info}` : `tel:${job.contact_info}`}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-xs lg:text-sm font-medium"
                    >
                      <Phone className="h-3 w-3 lg:h-4 lg:w-4" />
                      <span>Contato</span>
                    </a>
                  )}
                </div>
                
                {job.expires_at && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Expira: {new Date(job.expires_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
