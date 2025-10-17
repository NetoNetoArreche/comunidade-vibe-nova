'use client'

import { useEffect, useState } from 'react'
import { supabase, type Event as BaseEvent } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Video, 
  Users,
  ExternalLink,
  User as UserIcon,
  CalendarDays,
  TrendingUp
} from 'lucide-react'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface EventsPageProps {
  user: User | null
}

interface Event extends BaseEvent {
  username: string
  full_name: string | null
  avatar_url: string | null
}

interface EventStats {
  totalEvents: number
  upcomingEvents: number
  pastEvents: number
  thisWeekEvents: number
  thisMonthEvents: number
}

export default function EventsPage({ user }: EventsPageProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0,
    thisWeekEvents: 0,
    thisMonthEvents: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    fetchEvents()
    fetchStats()
  }, [])

  async function fetchEvents() {
    try {
      // Buscar eventos
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: false })

      if (eventsError) throw eventsError

      if (!eventsData || eventsData.length === 0) {
        setEvents([])
        return
      }

      // Buscar perfis dos criadores
      const creatorIds = Array.from(new Set(eventsData.map(event => event.created_by)))
      
      if (creatorIds.length === 0) {
        setEvents(eventsData.map(event => ({
          ...event,
          username: '',
          full_name: '',
          avatar_url: null
        })))
        return
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', creatorIds)

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError)
        // Continue sem os dados do perfil
        setEvents(eventsData.map(event => ({
          ...event,
          username: '',
          full_name: '',
          avatar_url: null
        })))
        return
      }

      // Combinar dados
      const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || [])
      
      const formattedEvents = eventsData?.map(event => {
        const profile = profilesMap.get(event.created_by)
        return {
          ...event,
          username: profile?.username || '',
          full_name: profile?.full_name || '',
          avatar_url: profile?.avatar_url || null
        }
      }) || []

      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
      
      // Mostrar erro mais específico
      if (error instanceof Error) {
        toast.error(`Erro ao carregar eventos: ${error.message}`)
      } else {
        toast.error('Erro ao carregar eventos')
      }
      
      // Definir estado vazio em caso de erro
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const now = new Date()
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      // Upcoming events
      const { count: upcomingEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', now.toISOString())

      // Past events
      const { count: pastEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .lt('end_time', now.toISOString())

      // This week events
      const { count: thisWeekEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', weekStart.toISOString())
        .lt('start_time', new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())

      // This month events
      const { count: thisMonthEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', monthStart.toISOString())

      setStats({
        totalEvents: totalEvents || 0,
        upcomingEvents: upcomingEvents || 0,
        pastEvents: pastEvents || 0,
        thisWeekEvents: thisWeekEvents || 0,
        thisMonthEvents: thisMonthEvents || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Manter estatísticas em 0 em caso de erro
      setStats({
        totalEvents: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        thisWeekEvents: 0,
        thisMonthEvents: 0
      })
    }
  }

  const getEventStatus = (startTime: string, endTime: string) => {
    const now = new Date()
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (now < start) {
      return { status: 'upcoming', label: 'Em breve', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
    } else if (now >= start && now <= end) {
      return { status: 'live', label: 'Ao vivo', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    } else {
      return { status: 'past', label: 'Finalizado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    const { status } = getEventStatus(event.start_time, event.end_time)
    if (filter === 'upcoming') return status === 'upcoming' || status === 'live'
    if (filter === 'past') return status === 'past'
    return true
  })

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
    <div className="max-w-7xl mx-auto px-3 lg:px-4 py-4 lg:py-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Eventos da Comunidade
            </h1>
            <p className="text-sm lg:text-xl text-gray-600 dark:text-gray-400 mt-1 lg:mt-2">
              {stats.totalEvents} evento{stats.totalEvents !== 1 ? 's' : ''} • {stats.upcomingEvents} próximo{stats.upcomingEvents !== 1 ? 's' : ''}
            </p>
          </div>
          
          {user && (
            <button className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-xl transition-colors shadow-lg whitespace-nowrap flex-shrink-0">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Criar Evento</span>
              <span className="sm:hidden">Criar</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 lg:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                {stats.totalEvents}
              </div>
              <div className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Eventos
              </div>
            </div>
            <div className="p-2 lg:p-3 bg-primary-100 dark:bg-primary-900 rounded-xl">
              <CalendarDays className="h-6 w-6 lg:h-8 lg:w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 lg:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {stats.upcomingEvents}
              </div>
              <div className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Próximos Eventos
              </div>
            </div>
            <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900 rounded-xl">
              <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 lg:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {stats.thisWeekEvents}
              </div>
              <div className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Esta Semana
              </div>
            </div>
            <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 lg:p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {stats.thisMonthEvents}
              </div>
              <div className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Este Mês
              </div>
            </div>
            <div className="p-2 lg:p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 lg:gap-4 mb-6 lg:mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todos ({stats.totalEvents})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Próximos ({stats.upcomingEvents})
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-colors ${
            filter === 'past'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Passados ({stats.pastEvents})
        </button>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            {filter === 'all' ? 'Nenhum evento encontrado' : `Nenhum evento ${filter === 'upcoming' ? 'próximo' : 'passado'}`}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all' 
              ? 'Novos eventos serão exibidos aqui em breve!'
              : 'Tente alterar o filtro para ver outros eventos.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredEvents.map((event) => {
            const eventStatus = getEventStatus(event.start_time, event.end_time)
            
            return (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Event Banner */}
                {event.banner_url && (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={event.banner_url}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${eventStatus.color}`}>
                        {eventStatus.label}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                      {event.title}
                    </h3>
                    {!event.banner_url && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ml-3 ${eventStatus.color}`}>
                        {eventStatus.label}
                      </span>
                    )}
                  </div>

                  {/* Event Description */}
                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {/* Event Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-3 text-primary-600" />
                      <span className="font-medium">
                        {formatDate(event.start_time)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-3 text-primary-600" />
                      <span>
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        {event.location.toLowerCase().includes('online') ? (
                          <Video className="h-4 w-4 mr-3 text-primary-600" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-3 text-primary-600" />
                        )}
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Event Creator */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      {event.avatar_url ? (
                        <Image
                          src={event.avatar_url}
                          alt={event.full_name || event.username}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.full_name || event.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Organizador
                        </p>
                      </div>
                    </div>

                    {eventStatus.status === 'upcoming' && (
                      <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Participar
                      </button>
                    )}
                    
                    {eventStatus.status === 'live' && (
                      <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1">
                        <ExternalLink className="h-4 w-4" />
                        <span>Entrar</span>
                      </button>
                    )}
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
