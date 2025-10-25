import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'helioarreche@gmail.com'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId } = body
    
    console.log('🔍 Debug Admin - Verificando ID:', adminId)
    
    if (!adminId) {
      return NextResponse.json({
        success: false,
        error: 'adminId é obrigatório'
      }, { status: 400 })
    }
    
    const supabase = getSupabaseClient()
    
    // Buscar perfil do admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminId)
      .single()
    
    console.log('👤 Perfil encontrado:', adminProfile)
    console.log('❌ Erro (se houver):', adminError)
    
    const isAdmin = adminProfile?.email === ADMIN_EMAIL
    
    return NextResponse.json({
      success: true,
      debug: {
        adminId,
        profileFound: !!adminProfile,
        profileEmail: adminProfile?.email,
        expectedEmail: ADMIN_EMAIL,
        isAdmin,
        error: adminError,
        fullProfile: adminProfile
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro no debug admin:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de debug admin. Use POST com { adminId } para verificar.'
  })
}
