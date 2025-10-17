'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { X, Upload, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: User
  project?: any // Para edição
}

export default function ProjectModal({ isOpen, onClose, onSuccess, user, project }: ProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tools_used: [] as string[],
    external_links: {
      demo: '',
      github: '',
      website: ''
    },
    is_featured: false
  })
  const [newTool, setNewTool] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'basic', label: 'Informações Básicas', icon: '📝' },
    { id: 'links', label: 'Links & Tecnologias', icon: '🔗' },
    { id: 'image', label: 'Imagem', icon: '🖼️' }
  ]

  // Atualizar formData quando o projeto mudar
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        tools_used: project.tools_used || [],
        external_links: {
          demo: project.external_links?.demo || '',
          github: project.external_links?.github || '',
          website: project.external_links?.website || ''
        },
        is_featured: project.is_featured || false
      })
    } else {
      // Reset para novo projeto
      setFormData({
        title: '',
        description: '',
        tools_used: [],
        external_links: {
          demo: '',
          github: '',
          website: ''
        },
        is_featured: false
      })
    }
    setCoverImage(null)
    setActiveTab('basic')
  }, [project, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Título e descrição são obrigatórios')
      return
    }

    setLoading(true)

    try {
      let cover_image_url = project?.cover_image_url || null

      // Upload da imagem se houver
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('portfolio-covers')
          .upload(filePath, coverImage)

        if (uploadError) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-covers')
          .getPublicUrl(filePath)

        cover_image_url = publicUrl
      }

      const projectData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        tools_used: formData.tools_used,
        external_links: formData.external_links,
        cover_image_url,
        is_featured: formData.is_featured,
        display_order: project?.display_order || 0
      }

      if (project) {
        // Atualizar projeto existente
        const { error } = await supabase
          .from('portfolio_projects')
          .update(projectData)
          .eq('id', project.id)

        if (error) throw error
        toast.success('Projeto atualizado com sucesso!')
      } else {
        // Criar novo projeto
        const { error } = await supabase
          .from('portfolio_projects')
          .insert([projectData])

        if (error) throw error
        toast.success('Projeto adicionado com sucesso!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar projeto:', error)
      toast.error('Erro ao salvar projeto: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const addTool = () => {
    if (newTool.trim() && !formData.tools_used.includes(newTool.trim())) {
      setFormData(prev => ({
        ...prev,
        tools_used: [...prev.tools_used, newTool.trim()]
      }))
      setNewTool('')
    }
  }

  const removeTool = (toolToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tools_used: prev.tools_used.filter((tool: string) => tool !== toolToRemove)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {project ? 'Editar Projeto' : 'Adicionar Projeto'}
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
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título do Projeto *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nome do seu projeto"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Descreva seu projeto, tecnologias usadas, objetivos..."
                    required
                  />
                </div>

                {/* Featured */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Marcar como projeto em destaque
                  </label>
                </div>
              </>
            )}

            {/* Aba: Links & Tecnologias */}
            {activeTab === 'links' && (
              <>
                {/* Tools */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tecnologias/Ferramentas
                  </label>
                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      value={newTool}
                      onChange={(e) => setNewTool(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTool())}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: React, Node.js, MongoDB..."
                    />
                    <button
                      type="button"
                      onClick={addTool}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tools_used.map((tool: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                      >
                        {tool}
                        <button
                          type="button"
                          onClick={() => removeTool(tool)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* External Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Links Externos</h3>
                  
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Demo/Preview</label>
                    <input
                      type="url"
                      value={formData.external_links.demo}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        external_links: { ...prev.external_links, demo: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://meu-projeto.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">GitHub</label>
                    <input
                      type="url"
                      value={formData.external_links.github}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        external_links: { ...prev.external_links, github: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://github.com/usuario/projeto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.external_links.website}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        external_links: { ...prev.external_links, website: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://meu-site.com"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Aba: Imagem */}
            {activeTab === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Imagem de Capa
                </label>
                <div className="flex flex-col items-center space-y-4">
                  {project?.cover_image_url || coverImage ? (
                    <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={coverImage ? URL.createObjectURL(coverImage) : project?.cover_image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma imagem selecionada</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Escolher Imagem</span>
                    </button>
                    {coverImage && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {coverImage.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    JPG, PNG até 5MB. Recomendado: 800x400px
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
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
              {loading ? 'Salvando...' : project ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
