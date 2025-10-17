'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, type Profile } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import ProfilePage from '@/components/pages/ProfilePage'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
    getTargetProfile()
  }, [username])

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profile)
    }
  }

  async function getTargetProfile() {
    try {
      const decodedUsername = decodeURIComponent(username)
      console.log('Looking for profile with username:', decodedUsername)
      
      // Buscar perfil pelo username ou ID
      const { data: targetProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.eq.${decodedUsername},id.eq.${decodedUsername}`)
        .single()

      console.log('Profile search result:', { targetProfile, error })

      if (error) {
        console.error('Error fetching target profile:', error)
        
        // Tentar busca parcial se não encontrou exato
        const { data: partialProfiles } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${decodedUsername}%,full_name.ilike.%${decodedUsername}%`)
        
        console.log('Partial profile search:', partialProfiles)
        
        if (partialProfiles && partialProfiles.length > 0) {
          setTargetProfile(partialProfiles[0])
        }
      } else {
        setTargetProfile(targetProfile)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    if (targetProfile) {
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetProfile.id)
        .single()
      
      if (updatedProfile) {
        setTargetProfile(updatedProfile)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!targetProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Usuário não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O perfil que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProfilePage 
        user={user} 
        profile={targetProfile}
        onProfileUpdate={updateProfile}
      />
    </div>
  )
}
