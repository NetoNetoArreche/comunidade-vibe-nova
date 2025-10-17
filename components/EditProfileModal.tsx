'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { X, Upload, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: User
  profile: any
}

export default function EditProfileModal({ isOpen, onClose, onSuccess, user, profile }: EditProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    portfolio_url: profile?.portfolio_url || '',
    linkedin_url: profile?.linkedin_url || '',
    github_url: profile?.github_url || '',
    instagram_url: profile?.instagram_url || '',
    whatsapp_number: profile?.whatsapp_number || ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'basic', label: 'Informações Básicas', icon: '👤' },
    { id: 'social', label: 'Links Sociais', icon: '🔗' },
    { id: 'images', label: 'Imagens', icon: '🖼️' }
  ]

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim()) {
      toast.error('Nome completo é obrigatório')
      return
    }

    setLoading(true)

    try {
      let avatar_url = profile?.avatar_url
      let cover_url = profile?.cover_url

      // Upload avatar se houver
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `avatar-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatar_url = publicUrl
      }

      // Upload cover se houver
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop()
        const fileName = `cover-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(filePath, coverFile)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(filePath)

        cover_url = publicUrl
      }

      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          username: formData.username.trim() || null,
          bio: formData.bio.trim() || null,
          portfolio_url: formData.portfolio_url.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          github_url: formData.github_url.trim() || null,
          instagram_url: formData.instagram_url.trim() || null,
          whatsapp_number: formData.whatsapp_number.trim() || null,
          avatar_url,
          cover_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Editar Perfil
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Aba: Informações Básicas */}
            {activeTab === 'basic' && (
              <>
                {/* Nome Completo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome de Usuário
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="@seuusername"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="+55 11 99999-9999"
                  />
                </div>
              </>
            )}

            {/* Aba: Links Sociais */}
            {activeTab === 'social' && (
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Portfolio
                  </label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://meuportfolio.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://linkedin.com/in/usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GitHub
                  </label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://github.com/usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://instagram.com/usuario"
                  />
                </div>
              </div>
            )}

            {/* Aba: Imagens */}
            {activeTab === 'images' && (
              <>
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Foto de Perfil
                  </label>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      {profile?.avatar_url || avatarFile ? (
                        <Image
                          src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url}
                          alt="Avatar"
                          width={120}
                          height={120}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-30 h-30 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-3xl">
                            {(formData.full_name || user.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Alterar Foto de Perfil
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        JPG, PNG até 5MB
                      </p>
                    </div>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                {/* Cover Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Imagem de Capa
                  </label>
                  <div className="relative h-40 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {profile?.cover_url || coverFile ? (
                      <Image
                        src={coverFile ? URL.createObjectURL(coverFile) : profile.cover_url}
                        alt="Cover"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-primary-600 to-primary-800 flex items-center justify-center">
                        <Upload className="h-12 w-12 text-white" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center"
                    >
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium opacity-0 hover:opacity-100 transition-opacity">
                        Alterar Imagem de Capa
                      </div>
                    </button>
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
