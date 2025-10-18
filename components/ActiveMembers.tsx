'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Users, Circle } from 'lucide-react'

interface ActiveMember {
  id: string
  full_name: string
  username: string
  avatar_url?: string
  role: string
}

export default function ActiveMembers() {
  const [members, setMembers] = useState<ActiveMember[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getActiveMembers()
  }, [])

  async function getActiveMembers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, role')
      .order('created_at', { ascending: false })
      .limit(8)

    if (!error && data) {
      setMembers(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (members.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center mb-4">
        <Users className="h-5 w-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Membros Ativos
        </h3>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            onClick={() => router.push(`/profile/${member.username || member.id}`)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {/* Avatar */}
            <div className="relative">
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={member.full_name || member.username}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(member.full_name || member.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              {/* Online indicator */}
              <Circle className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500 fill-current" />
            </div>

            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {member.full_name || member.username}
              </p>
              {member.role && member.role !== 'user' && (
                <p className="text-xs text-primary-600 capitalize">
                  {member.role}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
