import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
})

// Types based on the database schema
export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
  cover_url: string | null
  role: string | null
  portfolio_url: string | null
  linkedin_url: string | null
  github_url: string | null
  instagram_url: string | null
  whatsapp_number: string | null
}

export interface Space {
  id: string
  name: string
  path: string
  icon: string
  description: string | null
  created_at: string
  updated_at: string
  icon_color: string | null
  icon_shape: string | null
  icon_image_url: string | null
  display_order: number | null
  group_id: string | null
}

export interface SpaceGroup {
  id: string
  name: string
  display_order: number | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  content: string
  image_url: string | null
  author_id: string
  space_id: string | null
  created_at: string
  updated_at: string
  video_url: string | null
  title: string | null
  is_pinned: boolean | null
  author?: Profile
  space?: Space
  likes_count?: number
  comments_count?: number
  user_has_liked?: boolean
}

export interface Comment {
  id: string
  content: string
  author_id: string
  post_id: string
  created_at: string
  image_url: string | null
  author?: Profile
  likes_count?: number
  user_has_liked?: boolean
}

export interface Like {
  id: string
  user_id: string
  post_id: string | null
  comment_id: string | null
  created_at: string
  project_id: string | null
}

export interface ChatMessage {
  id: string
  user_id: string | null
  content: string
  created_at: string
  updated_at: string
  image_url: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  is_system_message: boolean | null
  user?: Profile
}

export interface ChatParticipant {
  id: string
  user_id: string
  last_seen: string
  is_online: boolean
  user?: Profile
}

export interface JobOpportunity {
  id: string
  title: string
  company: string
  description: string
  requirements: string[] | null
  salary_range: string | null
  location: string | null
  location_type: 'remoto' | 'presencial' | 'hibrido'
  job_type: 'estagio' | 'junior' | 'pleno' | 'senior' | 'freelance'
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'design' | 'devops' | 'data' | 'qa' | 'product' | 'outros'
  external_link: string | null
  contact_info: string | null
  is_active: boolean
  expires_at: string | null
  posted_by: string
  created_at: string
  updated_at: string
}

export interface PortfolioProject {
  id: string
  user_id: string
  title: string
  description: string
  tools_used: string[] | null
  external_links: any | null
  cover_image_url: string | null
  display_order: number | null
  is_featured: boolean | null
  created_at: string
  updated_at: string
  user?: Profile
}

export interface UserPoints {
  id: string
  user_id: string
  total_points: number
  level: number | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  banner_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface LessonSuggestion {
  id: string
  title: string
  description: string | null
  user_id: string
  status: string | null
  votes: number | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface LessonVote {
  id: string
  user_id: string
  suggestion_id: string
  created_at: string
}

