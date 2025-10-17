'use client'

import { useEffect, useState } from 'react'
import { supabase, type LessonSuggestion, type Profile } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Search, 
  Plus,
  ThumbsUp,
  Filter,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  User as UserIcon,
  MessageSquare
} from 'lucide-react'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface LessonsPageProps {
  user: User | null
  onViewProfile?: (profile: Profile) => void
}

interface LessonWithUser extends LessonSuggestion {
  user_has_voted?: boolean
}

interface LessonStats {
  totalSuggestions: number
  pendingSuggestions: number
  approvedSuggestions: number
  completedLessons: number
}

export default function LessonsPage({ user, onViewProfile }: LessonsPageProps) {
  const [lessons, setLessons] = useState<LessonWithUser[]>([])
  const [stats, setStats] = useState<LessonStats>({
    totalSuggestions: 0,
    pendingSuggestions: 0,
    approvedSuggestions: 0,
    completedLessons: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchLessons()
    fetchStats()
  }, [user])

  async function fetchLessons() {
    try {
      const { data, error } = await supabase
        .from('lesson_suggestions')
        .select(`
          *,
          profiles!lesson_suggestions_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order('votes', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      // Check if user has voted
      if (user && data) {
        const { data: votesData } = await supabase
          .from('lesson_votes')
          .select('suggestion_id')
          .eq('user_id', user.id)

        const votedIds = new Set(votesData?.map(v => v.suggestion_id) || [])

        const lessonsWithVotes = data.map(lesson => ({
          ...lesson,
          user_has_voted: votedIds.has(lesson.id)
        }))

        setLessons(lessonsWithVotes)
      } else {
        setLessons(data || [])
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
      toast.error('Erro ao carregar sugestões de aulas')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const { count: totalSuggestions } = await supabase
        .from('lesson_suggestions')
        .select('*', { count: 'exact', head: true })

      const { count: pendingSuggestions } = await supabase
        .from('lesson_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      const { count: approvedSuggestions } = await supabase
        .from('lesson_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      const { count: completedLessons } = await supabase
        .from('lesson_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      setStats({
        totalSuggestions: totalSuggestions || 0,
        pendingSuggestions: pendingSuggestions || 0,
        approvedSuggestions: approvedSuggestions || 0,
        completedLessons: completedLessons || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function handleVote(lessonId: string) {
    if (!user) {
      toast.error('Você precisa estar logado para votar')
      return
    }

    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson) return

    try {
      if (lesson.user_has_voted) {
        // Remove vote
        const { error } = await supabase
          .from('lesson_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('suggestion_id', lessonId)

        if (error) throw error

        // Update local state
        setLessons(lessons.map(l => 
          l.id === lessonId 
            ? { ...l, votes: (l.votes || 0) - 1, user_has_voted: false }
            : l
        ))

        toast.success('Voto removido')
      } else {
        // Add vote
        const { error } = await supabase
          .from('lesson_votes')
          .insert({
            user_id: user.id,
            suggestion_id: lessonId
          })

        if (error) throw error

        // Update local state
        setLessons(lessons.map(l => 
          l.id === lessonId 
            ? { ...l, votes: (l.votes || 0) + 1, user_has_voted: true }
            : l
        ))

        toast.success('Voto registrado!')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Erro ao registrar voto')
    }
  }

  const handleProfileClick = (profile: Profile) => {
    if (onViewProfile) {
      onViewProfile(profile)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock }
      case 'approved':
        return { label: 'Aprovado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle }
      case 'in_progress':
        return { label: 'Em Produção', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Loader }
      case 'completed':
        return { label: 'Concluído', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: CheckCircle }
      case 'rejected':
        return { label: 'Rejeitado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle }
      default:
        return { label: 'Pendente', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Clock }
    }
  }

  const getDifficultyBadge = (difficulty: string | null) => {
    switch (difficulty) {
      case 'iniciante':
        return { label: 'Iniciante', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
      case 'intermediario':
        return { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
      case 'avancado':
        return { label: 'Avançado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
      default:
        return { label: 'Não definido', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    }
  }

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = 
      lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || lesson.status === filterStatus

    return matchesSearch && matchesStatus
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sugestões de Aulas
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Vote nas aulas que você gostaria de ver na plataforma
            </p>
          </div>
          
          {user && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center space-x-2 px-3 lg:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium whitespace-nowrap flex-shrink-0"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Sugerir Aula</span>
              <span className="sm:hidden">Sugerir</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 lg:gap-4">
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 lg:h-5 lg:w-5" />
              <input
                type="text"
                placeholder="Buscar sugestões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 lg:pl-10 pr-4 py-2 text-sm lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="w-full">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 lg:px-4 py-2 text-sm lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="in_progress">Em Produção</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1 lg:mb-2">
              {stats.totalSuggestions}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Total de Sugestões
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1 lg:mb-2">
              {stats.pendingSuggestions}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Aguardando Análise
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mb-1 lg:mb-2">
              {stats.approvedSuggestions}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Aprovadas
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <div className="text-center">
            <div className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1 lg:mb-2">
              {stats.completedLessons}
            </div>
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
              Aulas Concluídas
            </div>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      {filteredLessons.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            {searchTerm || filterStatus !== 'all' 
              ? 'Nenhuma sugestão encontrada' 
              : 'Nenhuma sugestão ainda'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all'
              ? 'Tente alterar os filtros de busca.' 
              : 'Seja o primeiro a sugerir uma aula!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {filteredLessons.map((lesson) => {
            const statusBadge = getStatusBadge(lesson.status)
            const StatusIcon = statusBadge.icon

            return (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 lg:gap-4">
                  {/* Left: Vote Button */}
                  <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                    <button
                      onClick={() => handleVote(lesson.id)}
                      disabled={!user}
                      className={`flex flex-col items-center p-2 lg:p-3 rounded-lg transition-colors ${
                        lesson.user_has_voted
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <ThumbsUp className={`h-4 w-4 lg:h-5 lg:w-5 ${lesson.user_has_voted ? 'fill-current' : ''}`} />
                      <span className="text-sm lg:text-lg font-bold mt-0.5 lg:mt-1">{lesson.votes || 0}</span>
                    </button>
                  </div>

                  {/* Center: Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <h3 className="text-base lg:text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {lesson.title}
                      </h3>
                      
                      {lesson.description && (
                        <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mb-3 break-words">
                          {lesson.description}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusBadge.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusBadge.label}</span>
                        </span>
                      </div>

                      {/* Author Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                        <button
                          onClick={() => lesson.profiles && handleProfileClick(lesson.profiles)}
                          className="flex items-center space-x-2 hover:text-primary-600 transition-colors"
                        >
                          {lesson.profiles?.avatar_url ? (
                            <Image
                              src={lesson.profiles.avatar_url}
                              alt={lesson.profiles.full_name || 'Avatar'}
                              width={20}
                              height={20}
                              className="lg:w-6 lg:h-6 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-5 h-5 lg:w-6 lg:h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                            </div>
                          )}
                          <span className="truncate">
                            Sugerido por {lesson.profiles?.full_name || lesson.profiles?.username || 'Usuário'}
                          </span>
                        </button>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(lesson.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Sugerir Aula */}
      {showAddModal && (
        <AddLessonModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchLessons()
            fetchStats()
          }}
          user={user}
        />
      )}
    </div>
  )
}

// Modal Component
function AddLessonModal({ onClose, onSuccess, user }: { onClose: () => void, onSuccess: () => void, user: User | null }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('lesson_suggestions')
        .insert({
          title,
          description,
          user_id: user.id,
          status: 'pending',
          votes: 0
        })

      if (error) throw error

      toast.success('Sugestão de aula enviada com sucesso!')
      onSuccess()
    } catch (error) {
      console.error('Error creating suggestion:', error)
      toast.error('Erro ao enviar sugestão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sugerir Nova Aula
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título da Aula *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Introdução ao React Hooks"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Descreva o conteúdo que você gostaria de aprender..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Enviar Sugestão</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
