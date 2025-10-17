'use client'

import { useEffect, useState } from 'react'
import { supabase, type Profile } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  Star, 
  Medal,
  MessageCircle,
  Heart,
  FileText,
  Crown,
  Award,
  Target
} from 'lucide-react'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface LeaderboardPageProps {
  user: User | null
  profile?: Profile | null
}

interface LeaderboardUser {
  total_points: number
  level: number
  posts_count: number
  comments_count: number
  likes_received: number
  updated_at: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
}

interface Stats {
  totalMembers: number
  totalPoints: number
  userPosition: number | null
  userPoints: number | null
}

export default function LeaderboardPage({ user, profile }: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    totalPoints: 0,
    userPosition: null,
    userPoints: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
    fetchStats()
  }, [user])

  async function fetchLeaderboard() {
    try {
      const { data, error } = await supabase
        .rpc('get_leaderboard', { limit_count: 50 })

      if (error) {
        // Fallback para query manual se a função não existir
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_points')
          .select(`
            total_points,
            level,
            posts_count,
            comments_count,
            likes_received,
            updated_at,
            profiles!inner (
              username,
              full_name,
              avatar_url,
              bio
            )
          `)
          .order('total_points', { ascending: false })
          .limit(50)

        if (fallbackError) throw fallbackError

        const formattedData = fallbackData?.map(item => ({
          total_points: item.total_points,
          level: item.level,
          posts_count: item.posts_count,
          comments_count: item.comments_count,
          likes_received: item.likes_received,
          updated_at: item.updated_at,
          username: (item.profiles as any).username,
          full_name: (item.profiles as any).full_name,
          avatar_url: (item.profiles as any).avatar_url,
          bio: (item.profiles as any).bio
        })) || []

        setLeaderboard(formattedData)
      } else {
        setLeaderboard(data || [])
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      toast.error('Erro ao carregar ranking')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      // Total de membros
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Total de pontos
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_points')

      const totalPoints = pointsData?.reduce((sum, item) => sum + item.total_points, 0) || 0

      // Posição do usuário atual
      let userPosition = null
      let userPoints = null

      if (user) {
        const { data: userPointsData } = await supabase
          .from('user_points')
          .select('total_points')
          .eq('user_id', user.id)
          .single()

        if (userPointsData) {
          userPoints = userPointsData.total_points

          const { count } = await supabase
            .from('user_points')
            .select('*', { count: 'exact', head: true })
            .gt('total_points', userPointsData.total_points)

          userPosition = (count || 0) + 1
        }
      }

      setStats({
        totalMembers: totalMembers || 0,
        totalPoints,
        userPosition,
        userPoints
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-500">#{position}</span>
    }
  }

  const getRankBadge = (position: number) => {
    if (position <= 3) {
      const colors = {
        1: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
        2: 'bg-gradient-to-r from-gray-300 to-gray-500',
        3: 'bg-gradient-to-r from-amber-400 to-amber-600'
      }
      return colors[position as keyof typeof colors]
    }
    return 'bg-gray-100 dark:bg-gray-700'
  }

  const getLevelBadge = (level: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      3: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      4: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      5: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-3 lg:px-4 py-6 lg:py-12">
        {/* Hero Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-4 lg:mb-6 shadow-lg">
            <Trophy className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3 lg:mb-4 px-4">
            Ranking da Comunidade
          </h1>
          <p className="text-base lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Reconhecendo os membros mais ativos e engajados da nossa comunidade
          </p>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 ${profile?.role === 'admin' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} gap-4 lg:gap-8 mb-8 lg:mb-16`}>
          {/* Total de Membros - Apenas Admin */}
          {profile?.role === 'admin' && (
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-4 lg:p-8">
                <div className="flex items-center justify-between">
                  <div className="p-3 lg:p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <Users className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.totalMembers.toLocaleString()}
                    </p>
                    <p className="text-xs lg:text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total de Membros
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-4 lg:p-8">
              <div className="flex items-center justify-between">
                <div className="p-3 lg:p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPoints.toLocaleString()}
                  </p>
                  <p className="text-xs lg:text-sm font-medium text-green-600 dark:text-green-400">
                    Pontos Totais
                  </p>
                </div>
              </div>
            </div>
          </div>

          {user && stats.userPosition && (
            <div className="group relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative p-4 lg:p-8">
                <div className="flex items-center justify-between">
                  <div className="p-3 lg:p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Star className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl lg:text-3xl font-bold text-white">
                      #{stats.userPosition}
                    </p>
                    <p className="text-xs lg:text-sm font-medium text-white/90">
                      Sua Posição
                    </p>
                    <p className="text-xs text-white/70 mt-1">
                      {stats.userPoints} pontos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="mb-8 lg:mb-16">
            <div className="text-center mb-6 lg:mb-8 px-4">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Pódio</h2>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Os 3 membros mais ativos da comunidade</p>
            </div>
            <div className="flex items-end justify-center gap-4 lg:gap-12 px-4">
              {/* 2nd Place */}
              <div className="text-center flex-shrink-0">
                <div className="relative mb-4 lg:mb-6">
                  <div className="w-16 h-24 lg:w-24 lg:h-32 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex items-end justify-center pb-2 lg:pb-4 mx-auto">
                    <Medal className="h-5 w-5 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 lg:-top-4 left-1/2 transform -translate-x-1/2">
                    {leaderboard[1].avatar_url ? (
                      <Image
                        src={leaderboard[1].avatar_url}
                        alt={leaderboard[1].full_name || leaderboard[1].username}
                        width={48}
                        height={48}
                        className="lg:w-16 lg:h-16 rounded-full border-2 lg:border-4 border-white shadow-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary-600 rounded-full flex items-center justify-center border-2 lg:border-4 border-white shadow-lg">
                        <span className="text-white font-bold text-base lg:text-xl">
                          {(leaderboard[1].full_name || leaderboard[1].username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-xs lg:text-sm mb-1 max-w-[70px] lg:max-w-[100px] mx-auto truncate">
                  {leaderboard[1].full_name || leaderboard[1].username}
                </h3>
                <p className="text-lg lg:text-2xl font-bold text-gray-600 dark:text-gray-300">
                  {leaderboard[1].total_points.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">pontos</p>
              </div>

              {/* 1st Place */}
              <div className="text-center flex-shrink-0">
                <div className="relative mb-4 lg:mb-6">
                  <div className="w-20 h-32 lg:w-28 lg:h-40 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg flex items-end justify-center pb-2 lg:pb-4 mx-auto">
                    <Crown className="h-6 w-6 lg:h-10 lg:w-10 text-white" />
                  </div>
                  <div className="absolute -top-4 lg:-top-6 left-1/2 transform -translate-x-1/2">
                    {leaderboard[0].avatar_url ? (
                      <Image
                        src={leaderboard[0].avatar_url}
                        alt={leaderboard[0].full_name || leaderboard[0].username}
                        width={56}
                        height={56}
                        className="lg:w-[72px] lg:h-[72px] rounded-full border-2 lg:border-4 border-white shadow-xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 lg:w-[72px] lg:h-[72px] bg-primary-600 rounded-full flex items-center justify-center border-2 lg:border-4 border-white shadow-xl">
                        <span className="text-white font-bold text-xl lg:text-2xl">
                          {(leaderboard[0].full_name || leaderboard[0].username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs lg:text-base mb-1 max-w-[80px] lg:max-w-[120px] mx-auto truncate">
                  {leaderboard[0].full_name || leaderboard[0].username}
                </h3>
                <p className="text-xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {leaderboard[0].total_points.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">pontos</p>
              </div>

              {/* 3rd Place */}
              <div className="text-center flex-shrink-0">
                <div className="relative mb-4 lg:mb-6">
                  <div className="w-16 h-20 lg:w-24 lg:h-28 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg flex items-end justify-center pb-2 lg:pb-4 mx-auto">
                    <Award className="h-5 w-5 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <div className="absolute -top-3 lg:-top-4 left-1/2 transform -translate-x-1/2">
                    {leaderboard[2].avatar_url ? (
                      <Image
                        src={leaderboard[2].avatar_url}
                        alt={leaderboard[2].full_name || leaderboard[2].username}
                        width={48}
                        height={48}
                        className="lg:w-16 lg:h-16 rounded-full border-2 lg:border-4 border-white shadow-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary-600 rounded-full flex items-center justify-center border-2 lg:border-4 border-white shadow-lg">
                        <span className="text-white font-bold text-base lg:text-xl">
                          {(leaderboard[2].full_name || leaderboard[2].username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-xs lg:text-sm mb-1 max-w-[70px] lg:max-w-[100px] mx-auto truncate">
                  {leaderboard[2].full_name || leaderboard[2].username}
                </h3>
                <p className="text-lg lg:text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {leaderboard[2].total_points.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">pontos</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 lg:px-8 py-4 lg:py-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Ranking Completo
            </h2>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">Todos os membros da comunidade</p>
          </div>

          <div className="max-h-[600px] overflow-y-auto" style={{scrollbarWidth: 'thin'}}>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {leaderboard.map((member, index) => {
            const position = index + 1
            const isCurrentUser = user?.id && member.username === user.email?.split('@')[0]

            return (
              <div
                key={`${member.username}-${position}`}
                className={`p-3 lg:p-8 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                  isCurrentUser ? 'bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-l-4 border-primary-500' : ''
                } ${
                  position <= 3 ? 'bg-gradient-to-r from-yellow-50/30 to-orange-50/30 dark:from-yellow-900/10 dark:to-orange-900/10' : ''
                }`}
              >
                <div className="flex items-center gap-2 lg:gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <div className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl shadow-lg ${getRankBadge(position)}`}>
                      {getRankIcon(position)}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.full_name || member.username}
                        width={40}
                        height={40}
                        className="lg:w-12 lg:h-12 rounded-xl shadow-lg ring-2 ring-white dark:ring-gray-700 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-700">
                        <span className="text-white font-bold text-sm lg:text-lg">
                          {(member.full_name || member.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 lg:gap-2 mb-0.5 lg:mb-1 flex-wrap">
                      <h3 className="text-xs lg:text-lg font-bold text-gray-900 dark:text-white truncate">
                        {member.full_name || member.username}
                      </h3>
                      <span className={`px-1.5 lg:px-2 py-0.5 lg:py-1 text-xs font-bold rounded-full shadow-sm flex-shrink-0 ${getLevelBadge(member.level)}`}>
                        Nv.{member.level}
                      </span>
                      {position <= 3 && (
                        <span className="px-1.5 lg:px-2 py-0.5 lg:py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-medium rounded-full flex-shrink-0">
                          TOP 3
                        </span>
                      )}
                    </div>
                    {member.username && member.full_name && (
                      <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
                        @{member.username}
                      </p>
                    )}
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-base lg:text-xl font-bold text-gray-900 dark:text-white">
                      {member.total_points.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">pontos</p>
                  </div>

                  {/* Stats - Hidden on mobile */}
                  <div className="hidden lg:flex gap-3 flex-shrink-0">
                    <div className="text-center">
                      <div>
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg mb-1 mx-auto">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                          {member.posts_count}
                        </p>
                        <p className="text-xs text-gray-500 hidden md:block">posts</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg mb-1 mx-auto">
                          <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                          {member.comments_count}
                        </p>
                        <p className="text-xs text-gray-500 hidden md:block">coment.</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg mb-1 mx-auto">
                          <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                          {member.likes_received}
                        </p>
                        <p className="text-xs text-gray-500 hidden md:block">likes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
            </div>
          </div>
        </div>

        {/* How Points Work */}
        <div className="mt-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-900/20 dark:via-gray-800 dark:to-purple-900/20 rounded-3xl p-8 shadow-lg border border-indigo-100 dark:border-indigo-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Como Ganhar Pontos?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Participe ativamente da comunidade e suba no ranking!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl mb-4">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">+10</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Por post criado</p>
              <p className="text-xs text-gray-500 mt-1">Compartilhe conhecimento</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl mb-4">
                <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">+5</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Por comentário</p>
              <p className="text-xs text-gray-500 mt-1">Engaje com a comunidade</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-xl mb-4">
                <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">+2</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Por like recebido</p>
              <p className="text-xs text-gray-500 mt-1">Conteúdo valorizado</p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl mb-4">
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">Bônus</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Por engajamento</p>
              <p className="text-xs text-gray-500 mt-1">Atividade consistente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
