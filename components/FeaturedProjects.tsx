'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { ExternalLink, Github, Globe, Star, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

interface FeaturedProject {
  id: string
  title: string
  description: string
  tools_used: string[]
  external_links: {
    demo?: string
    github?: string
    website?: string
  }
  cover_image_url?: string
  user: {
    full_name: string
    username: string
    avatar_url?: string
  }
}

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<FeaturedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    getFeaturedProjects()
  }, [])

  async function getFeaturedProjects() {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select(`
        id,
        title,
        description,
        tools_used,
        external_links,
        cover_image_url,
        user:profiles(
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('is_featured', true)
      .order('display_order', { ascending: true })
      .limit(10)

    if (!error && data) {
      const formattedProjects = data.map(project => ({
        ...project,
        user: Array.isArray(project.user) ? project.user[0] : project.user
      }))
      setProjects(formattedProjects)
    }
    setLoading(false)
  }

  const nextProject = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length)
  }

  const prevProject = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length)
  }

  // Auto-slide a cada 5 segundos
  useEffect(() => {
    if (projects.length > 1) {
      const interval = setInterval(nextProject, 5000)
      return () => clearInterval(interval)
    }
  }, [projects.length])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (projects.length === 0) {
    return null
  }

  const currentProject = projects[currentIndex]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Star className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Projeto em Destaque
          </h3>
        </div>
        
        {/* Navigation Controls */}
        {projects.length > 1 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={prevProject}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <span className="text-xs text-gray-500 px-2">
              {currentIndex + 1}/{projects.length}
            </span>
            <button
              onClick={nextProject}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Single Project Display */}
      {currentProject && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          {/* Project Image */}
          {currentProject.cover_image_url && (
            <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
              <Image
                src={currentProject.cover_image_url}
                alt={currentProject.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Project Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-1">
              {currentProject.title}
            </h4>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {currentProject.description}
            </p>

            {/* Author */}
            <div className="flex items-center space-x-2">
              {currentProject.user?.avatar_url ? (
                <Image
                  src={currentProject.user.avatar_url}
                  alt={currentProject.user.full_name || 'Avatar'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {(currentProject.user?.full_name || currentProject.user?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentProject.user?.full_name || currentProject.user?.username}
              </span>
            </div>

            {/* Tools */}
            {currentProject.tools_used && currentProject.tools_used.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentProject.tools_used.slice(0, 4).map((tool, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                  >
                    {tool}
                  </span>
                ))}
                {currentProject.tools_used.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                    +{currentProject.tools_used.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Links */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentProject.external_links?.demo && (
                  <a
                    href={currentProject.external_links.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors text-sm"
                    title="Ver Demo"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Demo</span>
                  </a>
                )}
                {currentProject.external_links?.github && (
                  <a
                    href={currentProject.external_links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="Ver no GitHub"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {currentProject.external_links?.website && (
                  <a
                    href={currentProject.external_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                    title="Visitar Site"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dots Indicator */}
      {projects.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {projects.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-primary-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* Ver Todos */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
          Ver todos os projetos
        </button>
      </div>
    </div>
  )
}
