'use client'

import { useState, useEffect } from 'react'
import { supabase, type Space, type SpaceGroup } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { 
  Settings, 
  Users, 
  FolderTree, 
  Shield, 
  BarChart3,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Edit,
  Image as ImageIcon,
  Folder,
  Calendar,
  ShoppingCart,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminPageProps {
  user: User | null
  onPageChange?: (page: any) => void
}

const ADMIN_EMAIL = 'helioarreche@gmail.com'

// Componente Modal de Espaço
function SpaceModal({ space, groups, onClose, onSave, loading }: any) {
  const [formData, setFormData] = useState({
    name: space?.name || '',
    description: space?.description || '',
    icon: space?.icon || '',
    group_id: space?.group_id || '',
    display_order: space?.display_order || 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome do espaço é obrigatório')
      return
    }

    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {space ? 'Editar Espaço' : 'Novo Espaço'}
          </h3>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Tecnologia"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Descrição do espaço..."
              />
            </div>

            {/* Ícone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ícone (emoji ou texto)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="💻 ou T"
              />
            </div>

            {/* Grupo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grupo
              </label>
              <select
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sem grupo</option>
                {groups.map((group: any) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ordem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvando...' : space ? 'Atualizar' : 'Criar Espaço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente Modal de Evento
function EventModal({ event, onClose, onSave, loading }: any) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start_time: event?.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '',
    end_time: event?.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
    location: event?.location || '',
    banner_url: event?.banner_url || ''
  })
  const [uploadingBanner, setUploadingBanner] = useState(false)

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem')
      return
    }

    setUploadingBanner(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `event-banner-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('community')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        toast.error('Erro ao fazer upload da imagem')
        console.error(uploadError)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('community')
        .getPublicUrl(filePath)

      setFormData({ ...formData, banner_url: publicUrl })
      toast.success('Banner carregado!')
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload')
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.start_time) {
      toast.error('Título e data de início são obrigatórios')
      return
    }

    onSave({
      title: formData.title,
      description: formData.description,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      location: formData.location,
      banner_url: formData.banner_url
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl my-8">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {event ? 'Editar Evento' : 'Novo Evento'}
          </h3>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Workshop de IA"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Descrição do evento..."
              />
            </div>

            {/* Data e Hora de Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data e Hora de Início *
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Data e Hora de Término */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data e Hora de Término
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Local */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Local
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Online, São Paulo, etc."
              />
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banner do Evento
              </label>
              
              {/* Preview do Banner */}
              {formData.banner_url && (
                <div className="mb-3">
                  <img
                    src={formData.banner_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Upload de Banner */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ImageIcon className="h-4 w-4 inline mr-2" />
                  Fazer Upload de Imagem
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                    {uploadingBanner ? (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2"></div>
                        Fazendo upload...
                      </div>
                    ) : (
                      <div className="text-center">
                        <Plus className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Clique para selecionar uma imagem
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          PNG, JPG, GIF até 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                — ou —
              </div>

              {/* URL do Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Banner (alternativa)
                </label>
                <input
                  type="url"
                  value={formData.banner_url}
                  onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ou cole a URL completa de uma imagem externa
                </p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvando...' : event ? 'Atualizar' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminPage({ user, onPageChange }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'spaces' | 'groups' | 'events' | 'users' | 'tags' | 'stats' | 'emails'>('settings')
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Community Settings
  const [settings, setSettings] = useState({
    banner: '',
    banner_title: '',
    banner_subtitle: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    allow_signup: true,
    allow_manual_signup: false
  })
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  // Spaces Management
  const [spaces, setSpaces] = useState<Space[]>([])
  const [spaceGroups, setSpaceGroups] = useState<SpaceGroup[]>([])
  const [showSpaceModal, setShowSpaceModal] = useState(false)
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  
  // Groups Management
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<SpaceGroup | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupOrder, setNewGroupOrder] = useState(1)

  // Events Management
  const [events, setEvents] = useState<any[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)

  // Users Management
  const [users, setUsers] = useState<any[]>([])
  const [searchUser, setSearchUser] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 20
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'username'>('date')

  // Tags Management
  const [allTags, setAllTags] = useState<any[]>([])
  const [showTagModal, setShowTagModal] = useState(false)
  const [editingTag, setEditingTag] = useState<any>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showCreateTagModal, setShowCreateTagModal] = useState(false)
  const [searchUserForTag, setSearchUserForTag] = useState('')
  const [filteredUsersForTag, setFilteredUsersForTag] = useState<any[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0
  })

  // Email Management
  const [emailTemplates, setEmailTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [emailVariables, setEmailVariables] = useState<Record<string, string>>({})
  const [sendingEmails, setSendingEmails] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [filteredUsersForEmail, setFilteredUsersForEmail] = useState<any[]>([])

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      console.log('👤 Admin verificado, carregando dados para tab:', activeTab)
      loadData()
    }
  }, [isAdmin, activeTab])

  // Carregar configurações imediatamente ao verificar admin
  useEffect(() => {
    if (isAdmin && activeTab === 'settings') {
      console.log('⚡ Carregamento inicial de configurações')
      loadSettings()
    }
  }, [isAdmin])

  function checkAdminAccess() {
    if (!user || user.email !== ADMIN_EMAIL) {
      setIsAdmin(false)
      return
    }
    setIsAdmin(true)
  }

  async function loadData() {
    if (activeTab === 'settings') {
      await loadSettings()
    } else if (activeTab === 'spaces') {
      await loadSpaces()
    } else if (activeTab === 'groups') {
      await loadGroups()
    } else if (activeTab === 'events') {
      await loadEvents()
    } else if (activeTab === 'users') {
      await loadUsers()
    } else if (activeTab === 'tags') {
      await loadTags()
    } else if (activeTab === 'stats') {
      await loadStats()
    } else if (activeTab === 'emails') {
      await loadEmailTemplates()
    }
  }

  async function loadTags() {
    const { data, error } = await supabase
      .from('user_tags')
      .select(`
        *,
        profiles (
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAllTags(data)
    }
  }

  async function deleteTag(tagId: string) {
    if (!confirm('Tem certeza que deseja deletar esta tag?')) return

    const { error } = await supabase
      .from('user_tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      toast.error('Erro ao deletar tag')
    } else {
      toast.success('Tag deletada!')
      loadTags()
      loadUsers() // Atualizar lista de usuários também
    }
  }

  async function addTagToUser(userId: string, tagName: string, tagColor: string) {
    const { error } = await supabase
      .from('user_tags')
      .insert({
        user_id: userId,
        tag_name: tagName,
        tag_color: tagColor
      })

    if (error) {
      toast.error('Erro ao adicionar tag')
      console.error(error)
    } else {
      toast.success('Tag adicionada!')
      loadUsers()
      loadTags()
    }
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_tags (
          tag_id,
          tags (
            id,
            name,
            color
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000) // Limitar para performance

    if (!error && data) {
      setUsers(data)
    }
  }

  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: false })

    if (!error && data) {
      setEvents(data)
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      toast.error('Erro ao deletar evento')
    } else {
      toast.success('Evento deletado!')
      loadEvents()
    }
  }

  async function saveEvent(eventData: any) {
    setLoading(true)

    try {
      if (editingEvent) {
        // Atualizar evento existente
        const { error } = await supabase
          .from('events')
          .update({
            ...eventData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEvent.id)

        if (error) {
          toast.error('Erro ao atualizar evento')
          console.error(error)
        } else {
          toast.success('Evento atualizado!')
          setShowEventModal(false)
          setEditingEvent(null)
          loadEvents()
        }
      } else {
        // Criar novo evento
        const { error } = await supabase
          .from('events')
          .insert({
            ...eventData,
            created_by: user?.id
          })

        if (error) {
          toast.error('Erro ao criar evento')
          console.error(error)
        } else {
          toast.success('Evento criado!')
          setShowEventModal(false)
          loadEvents()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error)
      toast.error('Erro inesperado')
    }

    setLoading(false)
  }

  function openEditEvent(event: any) {
    setEditingEvent(event)
    setShowEventModal(true)
  }

  function openNewEvent() {
    setEditingEvent(null)
    setShowEventModal(true)
  }

  async function loadGroups() {
    const { data: groupsData } = await supabase
      .from('space_groups')
      .select('*')
      .order('display_order', { ascending: true })

    if (groupsData) setSpaceGroups(groupsData)
  }

  async function loadSettings() {
    console.log('🔄 Carregando configurações...')
    const { data, error } = await supabase
      .from('community_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } else if (data && data.length > 0) {
      const settings = data[0]
      console.log('✅ Configurações carregadas:', settings)
      setSettings({
        banner: settings.banner || '',
        banner_title: settings.banner_title || '',
        banner_subtitle: settings.banner_subtitle || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || '',
        youtube: settings.youtube || '',
        allow_signup: settings.allow_signup !== undefined ? settings.allow_signup : true,
        allow_manual_signup: settings.allow_manual_signup !== undefined ? settings.allow_manual_signup : false
      })
    } else {
      console.log('⚠️ Nenhuma configuração encontrada')
    }
  }

  async function loadSpaces() {
    const { data: spacesData } = await supabase
      .from('spaces')
      .select('*')
      .order('display_order', { ascending: true })

    const { data: groupsData } = await supabase
      .from('space_groups')
      .select('*')
      .order('display_order', { ascending: true })

    if (spacesData) setSpaces(spacesData)
    if (groupsData) setSpaceGroups(groupsData)
  }

  async function loadStats() {
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })

    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })

    setStats({
      totalUsers: usersCount || 0,
      totalPosts: postsCount || 0,
      totalComments: commentsCount || 0,
      totalLikes: likesCount || 0
    })
  }

  async function loadEmailTemplates() {
    try {
      // Carregar templates de email
      const response = await fetch('/api/admin/send-email')
      const data = await response.json()
      
      if (data.templates) {
        setEmailTemplates(data.templates)
      }
      
      // Carregar usuários para a aba de emails
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          username,
          email,
          avatar_url,
          created_at,
          user_tags (
            tag_name,
            tag_color
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (!usersError && usersData) {
        console.log('✅ Usuários carregados para emails:', usersData.length)
        setUsers(usersData)
        // Inicializar lista filtrada com todos os usuários
        setFilteredUsersForEmail(usersData)
      } else {
        console.error('❌ Erro ao carregar usuários:', usersError)
      }
    } catch (error) {
      console.error('Erro ao carregar dados da aba de emails:', error)
      toast.error('Erro ao carregar dados da aba de emails')
    }
  }

  function handleUserSearch(searchTerm: string) {
    setUserSearchTerm(searchTerm)
    
    if (!searchTerm.trim()) {
      setFilteredUsersForEmail(users)
      return
    }
    
    const search = searchTerm.toLowerCase()
    const filtered = users.filter(u => 
      (u.full_name?.toLowerCase().includes(search)) ||
      (u.username?.toLowerCase().includes(search)) ||
      (u.email?.toLowerCase().includes(search))
    )
    setFilteredUsersForEmail(filtered)
  }

  async function sendEmails() {
    if (!selectedTemplate || selectedUsers.length === 0) {
      toast.error('Selecione um template e pelo menos um usuário')
      return
    }

    if (!emailSubject.trim() || !emailContent.trim()) {
      toast.error('Preencha o assunto e o conteúdo do email')
      return
    }

    if (!user?.email || user.email !== 'helioarreche@gmail.com') {
      console.error('❌ Usuário não é admin')
      toast.error('Erro: Acesso negado. Somente administradores podem enviar emails.')
      return
    }

    console.log('📧 Iniciando envio de emails:', {
      template: selectedTemplate,
      subject: emailSubject,
      recipients: selectedUsers.length,
      adminId: user?.id,
      userEmail: user?.email,
      expectedAdminId: 'e104636c-c004-45d7-ab0e-0aff02c78b1c',
      isCorrectId: user?.id === 'e104636c-c004-45d7-ab0e-0aff02c78b1c'
    })

    setSendingEmails(true)

    try {
      const variables = {
        ...emailVariables,
        subject: emailSubject,
        content: emailContent
      }

      console.log('📤 Enviando requisição para API...')

      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          recipientIds: selectedUsers,
          variables,
          adminId: user?.id
        })
      })

      console.log('📨 Resposta da API:', response.status, response.statusText)

      // Tentar ler o texto da resposta primeiro
      const responseText = await response.text()
      console.log('📄 Resposta (texto):', responseText)

      // Tentar fazer parse do JSON
      let result
      try {
        result = JSON.parse(responseText)
        console.log('📊 Resultado (JSON):', result)
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError)
        console.error('Resposta recebida:', responseText)
        toast.error(`Erro ao processar resposta do servidor: ${responseText || 'Resposta vazia'}`)
        return
      }

      if (result.success) {
        toast.success(result.message || 'Emails enviados com sucesso!')
        console.log('✅ Emails enviados com sucesso!')
        // Reset form
        setSelectedTemplate('')
        setEmailSubject('')
        setEmailContent('')
        setSelectedUsers([])
        setEmailVariables({})
      } else {
        console.error('❌ Erro ao enviar emails:', result.error)
        toast.error(result.error || 'Erro ao enviar emails')
      }
    } catch (error) {
      console.error('❌ Erro ao enviar emails:', error)
      toast.error('Erro ao enviar emails')
    } finally {
      setSendingEmails(false)
    }
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId)
    
    if (templateId) {
      const template = emailTemplates.find(t => t.id === templateId)
      if (template) {
        // Preencher automaticamente os campos com o template selecionado
        setEmailSubject(template.subject)
        
        // Extrair o conteúdo do HTML do template (removendo tags HTML)
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = template.html
        
        // Buscar o conteúdo dentro da div .content
        const contentDiv = tempDiv.querySelector('.content')
        if (contentDiv) {
          // Extrair apenas o texto, removendo HTML
          let content = contentDiv.textContent || (contentDiv as HTMLElement).innerText || ''
          // Limpar espaços extras e quebras de linha
          content = content.replace(/\s+/g, ' ').trim()
          // Remover partes que são comuns em todos os templates
          content = content.replace(/Olá \*\*{{name}}\*\*,/g, '').trim()
          content = content.replace(/Atenciosamente,.*Equipe Vibe Coding/g, '').trim()
          setEmailContent(content)
        } else {
          // Fallback: usar uma mensagem padrão baseada no template
          const defaultContent = {
            'welcome': 'Bem-vindo à nossa comunidade! Estamos felizes em tê-lo conosco.',
            'announcement': 'Temos um comunicado importante para compartilhar com você.',
            'campaign': 'Temos uma oferta especial que não pode perder!',
            'notification': 'Esta é uma notificação importante da nossa comunidade.'
          }
          setEmailContent(defaultContent[templateId as keyof typeof defaultContent] || '')
        }
        
        // Preencher variáveis específicas do template
        if (templateId === 'campaign') {
          setEmailVariables({
            cta_url: 'https://www.comunidadevibecoding.com',
            cta_text: 'Acessar Agora'
          })
        } else {
          setEmailVariables({})
        }
      }
    } else {
      setEmailSubject('')
      setEmailContent('')
      setEmailVariables({})
    }
  }

  function handleUserSelection(userId: string, checked: boolean) {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  async function uploadBanner(file: File) {
    setUploadingBanner(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `banner-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('community')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        toast.error('Erro ao fazer upload da imagem')
        console.error(uploadError)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('community')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao fazer upload')
      return null
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem')
      return
    }

    const url = await uploadBanner(file)
    if (url) {
      setSettings({ ...settings, banner: url })
      toast.success('Banner carregado! Não esqueça de salvar as configurações.')
    }
  }

  async function saveSettings() {
    setLoading(true)
    
    try {
      // Buscar o ID do registro mais recente
      const { data: existingSettings } = await supabase
        .from('community_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)

      const settingsId = existingSettings?.[0]?.id

      if (settingsId) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('community_settings')
          .update({
            ...settings,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', settingsId)

        if (error) {
          toast.error('Erro ao salvar configurações')
          console.error(error)
        } else {
          toast.success('Configurações salvas com sucesso!')
        }
      } else {
        // Criar novo registro se não existir
        const { error } = await supabase
          .from('community_settings')
          .insert({
            ...settings,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })

        if (error) {
          toast.error('Erro ao salvar configurações')
          console.error(error)
        } else {
          toast.success('Configurações salvas com sucesso!')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro inesperado ao salvar')
    }
    
    setLoading(false)
  }

  async function saveSpace(spaceData: any) {
    setLoading(true)

    try {
      if (editingSpace) {
        // Atualizar espaço existente
        const { error } = await supabase
          .from('spaces')
          .update({
            name: spaceData.name,
            description: spaceData.description,
            icon: spaceData.icon,
            group_id: spaceData.group_id || null,
            display_order: spaceData.display_order || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSpace.id)

        if (error) {
          toast.error('Erro ao atualizar espaço')
          console.error(error)
        } else {
          toast.success('Espaço atualizado!')
          setShowSpaceModal(false)
          setEditingSpace(null)
          loadSpaces()
        }
      } else {
        // Criar novo espaço
        const { error } = await supabase
          .from('spaces')
          .insert({
            name: spaceData.name,
            description: spaceData.description,
            icon: spaceData.icon,
            group_id: spaceData.group_id || null,
            display_order: spaceData.display_order || 0,
            created_at: new Date().toISOString()
          })

        if (error) {
          toast.error('Erro ao criar espaço')
          console.error(error)
        } else {
          toast.success('Espaço criado!')
          setShowSpaceModal(false)
          loadSpaces()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar espaço:', error)
      toast.error('Erro inesperado ao salvar')
    }

    setLoading(false)
  }

  async function deleteSpace(spaceId: string) {
    if (!confirm('Tem certeza que deseja deletar este espaço?')) return

    const { error } = await supabase
      .from('spaces')
      .delete()
      .eq('id', spaceId)

    if (error) {
      toast.error('Erro ao deletar espaço')
    } else {
      toast.success('Espaço deletado!')
      loadSpaces()
    }
  }

  async function saveGroup() {
    if (!newGroupName.trim()) {
      toast.error('Nome do grupo é obrigatório')
      return
    }

    setLoading(true)

    if (editingGroup) {
      // Atualizar grupo existente
      const { error } = await supabase
        .from('space_groups')
        .update({
          name: newGroupName,
          display_order: newGroupOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingGroup.id)

      if (error) {
        toast.error('Erro ao atualizar grupo')
      } else {
        toast.success('Grupo atualizado!')
        setShowGroupModal(false)
        setEditingGroup(null)
        setNewGroupName('')
        setNewGroupOrder(1)
        loadGroups()
      }
    } else {
      // Criar novo grupo
      const { error } = await supabase
        .from('space_groups')
        .insert({
          name: newGroupName,
          display_order: newGroupOrder
        })

      if (error) {
        toast.error('Erro ao criar grupo')
      } else {
        toast.success('Grupo criado!')
        setShowGroupModal(false)
        setNewGroupName('')
        setNewGroupOrder(1)
        loadGroups()
      }
    }

    setLoading(false)
  }

  async function deleteGroup(groupId: string) {
    if (!confirm('Tem certeza que deseja deletar este grupo? Os espaços dentro dele não serão deletados.')) return

    const { error } = await supabase
      .from('space_groups')
      .delete()
      .eq('id', groupId)

    if (error) {
      toast.error('Erro ao deletar grupo')
    } else {
      toast.success('Grupo deletado!')
      loadGroups()
    }
  }

  function openEditGroup(group: SpaceGroup) {
    setEditingGroup(group)
    setNewGroupName(group.name)
    setNewGroupOrder(group.display_order || 1)
    setShowGroupModal(true)
  }

  function openNewGroup() {
    setEditingGroup(null)
    setNewGroupName('')
    setNewGroupOrder((spaceGroups.length || 0) + 1)
    setShowGroupModal(true)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Email atual: {user.email}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Painel Administrativo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie a comunidade e suas configurações
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-5 w-5 inline mr-2" />
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('spaces')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'spaces'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderTree className="h-5 w-5 inline mr-2" />
            Espaços
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'groups'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Folder className="h-5 w-5 inline mr-2" />
            Grupos
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'events'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-5 w-5 inline mr-2" />
            Eventos
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-5 w-5 inline mr-2" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tags'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="h-5 w-5 inline mr-2" />
            Tags do Chat
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'stats'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-5 w-5 inline mr-2" />
            Estatísticas
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'emails'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-5 w-5 inline mr-2" />
            Enviar Emails
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Configurações da Comunidade
            </h2>

            {/* Kiwify Integration Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 rounded-lg p-3">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      Integração Kiwify
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Cadastro automático de clientes que comprarem seus produtos na Kiwify
                    </p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Cadastro automático ao comprar
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Vinculação por email
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Webhook em tempo real
                      </li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => onPageChange?.('kiwify-settings')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
                >
                  Configurar
                  <ExternalLink className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>

            {/* Banner Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Banner da Comunidade
              </h3>

              {/* Preview do Banner */}
              {settings.banner && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview do Banner
                  </label>
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                    <img
                      src={settings.banner}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          // Criar elemento de erro de forma segura (sem innerHTML)
                          const errorDiv = document.createElement('div')
                          errorDiv.className = 'flex items-center justify-center h-full text-gray-500'
                          const errorText = document.createElement('p')
                          errorText.textContent = 'Erro ao carregar imagem'
                          errorDiv.appendChild(errorText)
                          parent.appendChild(errorDiv)
                        }
                      }}
                    />
                    {/* Overlay com título e subtítulo */}
                    {(settings.banner_title || settings.banner_subtitle) && (
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 flex flex-col items-center justify-center text-white p-6">
                        {settings.banner_title && (
                          <h2 className="text-3xl font-bold mb-2 text-center">{settings.banner_title}</h2>
                        )}
                        {settings.banner_subtitle && (
                          <p className="text-xl text-center">{settings.banner_subtitle}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload de Banner */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ImageIcon className="h-4 w-4 inline mr-2" />
                  Fazer Upload de Nova Imagem
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                      className="hidden"
                      id="banner-upload"
                    />
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                      {uploadingBanner ? (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2"></div>
                          Fazendo upload...
                        </div>
                      ) : (
                        <div className="text-center">
                          <Plus className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Clique para selecionar uma imagem
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            PNG, JPG, GIF até 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                — ou —
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Banner (alternativa)
                </label>
                <input
                  type="text"
                  value={settings.banner}
                  onChange={(e) => setSettings({ ...settings, banner: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ou cole a URL completa de uma imagem externa
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título do Banner
                </label>
                <input
                  type="text"
                  value={settings.banner_title}
                  onChange={(e) => setSettings({ ...settings, banner_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Bem-vindo à Comunidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtítulo do Banner
                </label>
                <input
                  type="text"
                  value={settings.banner_subtitle}
                  onChange={(e) => setSettings({ ...settings, banner_subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Conecte-se, aprenda e cresça"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Redes Sociais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={settings.facebook}
                    onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={settings.instagram}
                    onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={settings.twitter}
                    onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://twitter.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    YouTube
                  </label>
                  <input
                    type="text"
                    value={settings.youtube}
                    onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Other Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Outras Configurações
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.allow_signup}
                    onChange={(e) => setSettings({ ...settings, allow_signup: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Permitir novos cadastros
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings.allow_manual_signup || false}
                    onChange={(e) => setSettings({ ...settings, allow_manual_signup: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Permitir cadastro manual
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Se desativado, apenas usuários da Kiwify poderão se cadastrar
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <button
                onClick={saveSettings}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-5 w-5 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'spaces' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gerenciar Espaços
              </h2>
              <button
                onClick={() => setShowSpaceModal(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Espaço
              </button>
            </div>

            <div className="space-y-4">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: space.icon_color || '#6b7280' }}
                    >
                      <span className="text-white font-semibold">
                        {space.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {space.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {space.description || 'Sem descrição'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingSpace(space)
                        setShowSpaceModal(true)
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteSpace(space.id)}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal de Criar/Editar Espaço */}
            {showSpaceModal && (
              <SpaceModal
                space={editingSpace}
                groups={spaceGroups}
                onClose={() => {
                  setShowSpaceModal(false)
                  setEditingSpace(null)
                }}
                onSave={saveSpace}
                loading={loading}
              />
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gerenciar Grupos de Espaços
              </h2>
              <button
                onClick={openNewGroup}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Grupo
              </button>
            </div>

            <div className="space-y-4">
              {spaceGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <Folder className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ordem: {group.display_order}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditGroup(group)}
                      className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal de Criar/Editar Grupo */}
            {showGroupModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nome do Grupo
                        </label>
                        <input
                          type="text"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Ex: Espaços, Prompts, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ordem de Exibição
                        </label>
                        <input
                          type="number"
                          value={newGroupOrder}
                          onChange={(e) => setNewGroupOrder(parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setShowGroupModal(false)
                          setEditingGroup(null)
                          setNewGroupName('')
                          setNewGroupOrder(1)
                        }}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={saveGroup}
                        disabled={loading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Salvando...' : editingGroup ? 'Atualizar' : 'Criar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gerenciar Eventos
              </h2>
              <button
                onClick={openNewEvent}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Evento
              </button>
            </div>

            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento cadastrado</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        {event.banner_url && (
                          <img
                            src={event.banner_url}
                            alt={event.title}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white text-lg">
                            {event.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>📅 {new Date(event.start_time).toLocaleDateString('pt-BR')}</span>
                            <span>⏰ {new Date(event.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {event.location && <span>📍 {event.location}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditEvent(event)}
                        className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal de Criar/Editar Evento */}
            {showEventModal && (
              <EventModal
                event={editingEvent}
                onClose={() => {
                  setShowEventModal(false)
                  setEditingEvent(null)
                }}
                onSave={saveEvent}
                loading={loading}
              />
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gerenciar Usuários
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {users.filter(u => {
                  const matchSearch = !searchUser || 
                    u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
                    u.username?.toLowerCase().includes(searchUser.toLowerCase())
                  const matchRole = filterRole === 'all' || u.role === filterRole
                  const matchTag = filterTag === 'all' || 
                    u.user_tags?.some((t: any) => t.tag_name === filterTag)
                  return matchSearch && matchRole && matchTag
                }).length} usuários
              </span>
            </div>

            {/* Filtros */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Busca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Nome ou username..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Filtro por Função */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Função
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'user')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Todas</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              {/* Filtro por Tag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tag
                </label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Todas</option>
                  {Array.from(
                    new Map(
                      allTags.map(tag => [tag.tag_name, tag.tag_name])
                    ).values()
                  ).map((tagName) => (
                    <option key={tagName} value={tagName}>
                      {tagName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ordenar por */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'username')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="date">Data de Cadastro</option>
                  <option value="name">Nome</option>
                  <option value="username">Username</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avatar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entrou em
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users
                    .filter(u => {
                      // Filtro de busca
                      const matchSearch = !searchUser || 
                        u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
                        u.username?.toLowerCase().includes(searchUser.toLowerCase())
                      
                      // Filtro de função
                      const matchRole = filterRole === 'all' || u.role === filterRole
                      
                      // Filtro de tag
                      const matchTag = filterTag === 'all' || 
                        u.user_tags?.some((t: any) => t.tag_name === filterTag)
                      
                      return matchSearch && matchRole && matchTag
                    })
                    .sort((a, b) => {
                      // Ordenação
                      if (sortBy === 'name') {
                        return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '')
                      } else if (sortBy === 'username') {
                        return (a.username || '').localeCompare(b.username || '')
                      } else {
                        // date
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      }
                    })
                    .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {/* Avatar */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username || 'User')}`}
                            alt={user.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        </td>
                        
                        {/* Nome */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.full_name || 'Sem nome'}
                          </div>
                        </td>
                        
                        {/* Username */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username || 'sem-username'}
                          </div>
                        </td>
                        
                        {/* Entrou em */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        
                        {/* Função (Role) */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        
                        {/* Status (Tags do Chat) */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.user_tags && user.user_tags.length > 0 ? (
                              user.user_tags.map((tag: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs rounded-full"
                                  style={{
                                    backgroundColor: tag.tag_color || '#3B82F6',
                                    color: 'white'
                                  }}
                                >
                                  {tag.tag_name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">Sem tags</span>
                            )}
                          </div>
                        </td>
                        
                        {/* Ações */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUserId(user.id)
                                setShowTagModal(true)
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="Gerenciar Tags do Usuário"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja deletar o usuário ${user.full_name || user.username}?`)) {
                                  // Função de deletar será implementada
                                  toast.error('Função de deletar usuário em desenvolvimento')
                                }
                              }}
                              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Deletar Usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {(() => {
              const filteredUsers = users.filter(u => {
                const matchSearch = !searchUser || 
                  u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
                  u.username?.toLowerCase().includes(searchUser.toLowerCase())
                const matchRole = filterRole === 'all' || u.role === filterRole
                const matchTag = filterTag === 'all' || 
                  u.user_tags?.some((t: any) => t.tag_name === filterTag)
                return matchSearch && matchRole && matchTag
              })
              
              return filteredUsers.length > usersPerPage && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Página {currentPage} de {Math.ceil(filteredUsers.length / usersPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / usersPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(filteredUsers.length / usersPerPage)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              )
            })()}

            {/* Modal de Gerenciar Tags do Usuário */}
            {showTagModal && selectedUserId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Gerenciar Tags do Usuário
                    </h3>

                    {/* Tags atuais do usuário */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags Atuais
                      </label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {users.find(u => u.id === selectedUserId)?.user_tags?.map((tag: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-sm rounded-full flex items-center space-x-2"
                            style={{
                              backgroundColor: tag.tag_color,
                              color: 'white'
                            }}
                          >
                            <span>{tag.tag_name}</span>
                            <button
                              onClick={() => {
                                // Remover tag
                                const tagToRemove = allTags.find(t => 
                                  t.user_id === selectedUserId && 
                                  t.tag_name === tag.tag_name
                                )
                                if (tagToRemove) {
                                  deleteTag(tagToRemove.id)
                                }
                              }}
                              className="hover:opacity-75"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {(!users.find(u => u.id === selectedUserId)?.user_tags || 
                          users.find(u => u.id === selectedUserId)?.user_tags.length === 0) && (
                          <span className="text-sm text-gray-400">Nenhuma tag</span>
                        )}
                      </div>
                    </div>

                    {/* Tags Existentes */}
                    {(() => {
                      const uniqueTags = Array.from(
                        new Map(
                          allTags.map(tag => [tag.tag_name, { name: tag.tag_name, color: tag.tag_color }])
                        ).values()
                      )
                      
                      return uniqueTags.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tags Existentes (clique para usar)
                          </label>
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            {uniqueTags.map((tag, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const nameInput = document.getElementById('new-tag-name') as HTMLInputElement
                                  const colorInput = document.getElementById('new-tag-color') as HTMLInputElement
                                  nameInput.value = tag.name
                                  colorInput.value = tag.color
                                }}
                                className="px-3 py-1 text-sm rounded-full hover:opacity-80 transition-opacity"
                                style={{
                                  backgroundColor: tag.color,
                                  color: 'white'
                                }}
                              >
                                {tag.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Adicionar nova tag */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nome da Tag
                        </label>
                        <input
                          type="text"
                          id="new-tag-name"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Ex: VIP, Moderador, Premium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cor da Tag
                        </label>
                        <input
                          type="color"
                          id="new-tag-color"
                          defaultValue="#3B82F6"
                          className="w-full h-10 px-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const nameInput = document.getElementById('new-tag-name') as HTMLInputElement
                          const colorInput = document.getElementById('new-tag-color') as HTMLInputElement
                          
                          if (nameInput.value.trim()) {
                            addTagToUser(selectedUserId, nameInput.value.trim(), colorInput.value)
                            nameInput.value = ''
                            colorInput.value = '#3B82F6'
                          } else {
                            toast.error('Digite o nome da tag')
                          }
                        }}
                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Adicionar Tag
                      </button>
                    </div>

                    {/* Botão Fechar */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setShowTagModal(false)
                          setSelectedUserId(null)
                        }}
                        className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tags' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Gerenciar Tags do Chat
              </h2>
              <button
                onClick={() => {
                  setShowCreateTagModal(true)
                  setFilteredUsersForTag(users)
                }}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Nova Tag
              </button>
            </div>

            <div className="space-y-4">
              {allTags.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma tag cadastrada</p>
                </div>
              ) : (
                allTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <span
                        className="px-3 py-1 text-sm rounded-full font-medium"
                        style={{
                          backgroundColor: tag.tag_color,
                          color: 'white'
                        }}
                      >
                        {tag.tag_name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {tag.profiles && (
                          <>
                            <img
                              src={tag.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tag.profiles.full_name || tag.profiles.username || 'User')}`}
                              alt={tag.profiles.full_name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {tag.profiles.full_name || 'Sem nome'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                @{tag.profiles.username || 'sem-username'}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(tag.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal de Criar Nova Tag */}
            {showCreateTagModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Adicionar Tag ao Usuário
                    </h3>

                    {/* Tags Existentes */}
                    {(() => {
                      // Pegar tags únicas
                      const uniqueTags = Array.from(
                        new Map(
                          allTags.map(tag => [tag.tag_name, { name: tag.tag_name, color: tag.tag_color }])
                        ).values()
                      )
                      
                      return uniqueTags.length > 0 && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tags Existentes (clique para usar)
                          </label>
                          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            {uniqueTags.map((tag, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const nameInput = document.getElementById('create-tag-name') as HTMLInputElement
                                  const colorInput = document.getElementById('create-tag-color') as HTMLInputElement
                                  nameInput.value = tag.name
                                  colorInput.value = tag.color
                                }}
                                className="px-3 py-1 text-sm rounded-full hover:opacity-80 transition-opacity"
                                style={{
                                  backgroundColor: tag.color,
                                  color: 'white'
                                }}
                              >
                                {tag.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Campos da Tag */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nome da Tag *
                        </label>
                        <input
                          type="text"
                          id="create-tag-name"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Ex: VIP, Moderador, Premium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cor da Tag *
                        </label>
                        <input
                          type="color"
                          id="create-tag-color"
                          defaultValue="#3B82F6"
                          className="w-full h-12 px-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>

                    {/* Buscar Usuário */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selecionar Usuário *
                      </label>
                      <input
                        type="text"
                        value={searchUserForTag}
                        onChange={(e) => {
                          setSearchUserForTag(e.target.value)
                          setFilteredUsersForTag(
                            users.filter(u => 
                              u.full_name?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                              u.username?.toLowerCase().includes(e.target.value.toLowerCase())
                            )
                          )
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Buscar por nome ou username..."
                      />
                    </div>

                    {/* Lista de Usuários */}
                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                      {filteredUsersForTag.slice(0, 10).map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            const nameInput = document.getElementById('create-tag-name') as HTMLInputElement
                            const colorInput = document.getElementById('create-tag-color') as HTMLInputElement
                            
                            if (!nameInput.value.trim()) {
                              toast.error('Digite o nome da tag')
                              return
                            }

                            addTagToUser(user.id, nameInput.value.trim(), colorInput.value)
                            setShowCreateTagModal(false)
                            setSearchUserForTag('')
                            setFilteredUsersForTag(users)
                          }}
                          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                        >
                          <img
                            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username || 'User')}`}
                            alt={user.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name || 'Sem nome'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username || 'sem-username'}
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredUsersForTag.length === 0 && (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Nenhum usuário encontrado
                        </div>
                      )}
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setShowCreateTagModal(false)
                          setSearchUserForTag('')
                          setFilteredUsersForTag(users)
                        }}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Estatísticas da Comunidade
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Usuários
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <ImageIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPosts}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Posts
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalComments}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Comentários
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalLikes}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de Curtidas
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'emails' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Enviar Emails para Usuários
            </h2>
            
            <div className="space-y-8">
              {/* Template Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  1. Escolha um Template
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {emailTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateChange(template.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTemplate === template.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-2xl mb-2 ${
                          selectedTemplate === template.id ? 'text-primary-600' : 'text-gray-400'
                        }`}>
                          {template.id === 'welcome' && '🎉'}
                          {template.id === 'announcement' && '📢'}
                          {template.id === 'campaign' && '🚀'}
                          {template.id === 'notification' && '🔔'}
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {template.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Email Button */}
              {selectedTemplate && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        🧪 Teste de Email
                      </h4>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                        Envie um email de teste para verificar se o sistema está funcionando
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          console.log('🧪 Iniciando teste de email...')
                          const response = await fetch('/api/test-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: user?.email || 'helioarreche@gmail.com',
                              name: 'Admin'
                            })
                          })
                          
                          const result = await response.json()
                          console.log('📊 Resultado do teste:', result)
                          
                          if (result.success) {
                            toast.success('✅ Email de teste enviado com sucesso!')
                          } else {
                            toast.error(`❌ Erro no teste: ${result.error}`)
                          }
                        } catch (error) {
                          console.error('❌ Erro no teste:', error)
                          toast.error('❌ Erro ao testar email')
                        }
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🧪 Testar Email
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('🔍 Verificando variáveis de ambiente...')
                          const response = await fetch('/api/debug-env')
                          const result = await response.json()
                          console.log('🔍 Variáveis de ambiente:', result)
                          
                          if (result.success) {
                            const missing = Object.entries(result.environment)
                              .filter(([, value]) => (value as string).includes('❌'))
                              .map(([key]) => key)
                            
                            if (missing.length > 0) {
                              toast.error(`❌ Variáveis faltando: ${missing.join(', ')}`)
                            } else {
                              toast.success('✅ Todas as variáveis estão configuradas!')
                            }
                          } else {
                            toast.error('❌ Erro ao verificar ambiente')
                          }
                        } catch (error) {
                          console.error('❌ Erro na verificação:', error)
                          toast.error('❌ Erro ao verificar ambiente')
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-2"
                    >
                      🔍 Verificar Env
                    </button>
                    <button
                      onClick={async () => {
                        const userInfo = {
                          userId: user?.id,
                          userEmail: user?.email,
                          expectedAdminEmail: 'helioarreche@gmail.com',
                          expectedAdminId: 'e104636c-c004-45d7-ab0e-0aff02c78b1c',
                          isCorrectEmail: user?.email === 'helioarreche@gmail.com',
                          isCorrectId: user?.id === 'e104636c-c004-45d7-ab0e-0aff02c78b1c'
                        }
                        
                        console.log('👤 Informações completas do usuário:', userInfo)
                        
                        if (userInfo.isCorrectEmail && userInfo.isCorrectId) {
                          toast.success('✅ Você é o admin correto!')
                        } else if (userInfo.isCorrectEmail && !userInfo.isCorrectId) {
                          toast.error(`❌ Email correto mas ID diferente. ID atual: ${user?.id}`)
                        } else if (!userInfo.isCorrectEmail && userInfo.isCorrectId) {
                          toast.error(`❌ ID correto mas email diferente. Email atual: ${user?.email}`)
                        } else {
                          toast.error(`❌ Usuário diferente. Email: ${user?.email}, ID: ${user?.id}`)
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-2"
                    >
                      👤 Info Usuário
                    </button>
                  </div>
                </div>
              )}

              {/* Email Editor */}
              {selectedTemplate && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    2. Edite o Conteúdo do Email
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assunto do Email
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Digite o assunto do email..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Conteúdo do Email
                      </label>
                      <textarea
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        placeholder="Digite o conteúdo do email..."
                        rows={6}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        💡 Dica: Use <strong>{'{{name}}'}</strong> para personalizar com o nome do usuário
                      </p>
                    </div>

                    {selectedTemplate === 'campaign' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL do Botão de Ação
                          </label>
                          <input
                            type="url"
                            value={emailVariables.cta_url || ''}
                            onChange={(e) => setEmailVariables(prev => ({ ...prev, cta_url: e.target.value }))}
                            placeholder="https://exemplo.com"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Texto do Botão
                          </label>
                          <input
                            type="text"
                            value={emailVariables.cta_text || ''}
                            onChange={(e) => setEmailVariables(prev => ({ ...prev, cta_text: e.target.value }))}
                            placeholder="Clique aqui"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Preview do Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preview do Email
                      </label>
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Assunto:</strong> {emailSubject || 'Sem assunto'}
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-200">
                          <strong>Conteúdo:</strong> {emailContent || 'Sem conteúdo'}
                        </div>
                        {selectedTemplate === 'campaign' && (emailVariables.cta_url || emailVariables.cta_text) && (
                          <div className="mt-2">
                            <span className="inline-block bg-primary-500 text-white px-3 py-1 rounded text-sm">
                              {emailVariables.cta_text || 'Botão'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Selection */}
              {selectedTemplate && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    3. Selecione os Destinatários
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4">
                    {/* Filtro de usuários */}
                    <div>
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        placeholder="🔍 Buscar usuário por nome, username ou email..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selectedUsers.length} de {users.length} usuários selecionados
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (selectedUsers.length === users.length) {
                            setSelectedUsers([])
                          } else {
                            setSelectedUsers(users.map(u => u.id))
                          }
                        }}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium px-3 py-1 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                      >
                        {selectedUsers.length === users.length ? '✓ Desmarcar Todos' : '☐ Selecionar Todos'}
                      </button>
                    </div>
                
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left w-12">
                            <input
                              type="checkbox"
                              checked={selectedUsers.length === (filteredUsersForEmail.length > 0 ? filteredUsersForEmail.length : users.length) && users.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  // Selecionar todos os usuários (filtrados ou todos)
                                  const usersToSelect = filteredUsersForEmail.length > 0 ? filteredUsersForEmail : users
                                  setSelectedUsers(usersToSelect.map(u => u.id))
                                } else {
                                  setSelectedUsers([])
                                }
                              }}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {(filteredUsersForEmail.length > 0 ? filteredUsersForEmail : users).map((user) => (
                          <tr 
                            key={user.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                              selectedUsers.includes(user.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                            }`}
                            onClick={() => handleUserSelection(user.id, !selectedUsers.includes(user.id))}
                          >
                            <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mr-3 shadow-sm">
                                  <span className="text-sm font-bold text-white">
                                    {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.full_name || user.username || 'Usuário'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    @{user.username || 'sem-username'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {user.email}
                              </p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                ✓ Válido
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(filteredUsersForEmail.length > 0 ? filteredUsersForEmail : users).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              Nenhum usuário encontrado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                  </div>
                </div>
              )}

              {/* Send Button */}
              {selectedTemplate && selectedUsers.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    4. Enviar Emails
                  </h3>
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Pronto para enviar!
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Você está prestes a enviar emails para <strong>{selectedUsers.length}</strong> usuário(s) selecionado(s).
                        </p>
                      </div>
                      <button
                        onClick={sendEmails}
                        disabled={sendingEmails || !emailSubject || !emailContent}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        {sendingEmails ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <span>📧</span>
                            <span>Enviar Emails</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
