import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { userId, adminId } = body

    console.log('🗑️ Requisição de exclusão de usuário:', { userId, adminId })

    if (!userId || !adminId) {
      return NextResponse.json({
        success: false,
        error: 'userId e adminId são obrigatórios'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Verificar se o usuário é admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('role, email, username')
      .eq('id', adminId)
      .single()

    console.log('👤 Verificação de admin:', { 
      role: adminProfile?.role, 
      isAdmin: adminProfile?.role === 'admin' 
    })

    if (adminError || !adminProfile || adminProfile.role !== 'admin') {
      console.error('❌ Acesso negado:', { adminError, role: adminProfile?.role })
      return NextResponse.json({ 
        success: false,
        error: 'Acesso negado. Somente administradores podem deletar usuários.' 
      }, { status: 403 })
    }

    // Buscar dados do usuário antes de deletar
    const { data: userToDelete, error: userError } = await supabase
      .from('profiles')
      .select('username, full_name, email')
      .eq('id', userId)
      .single()

    if (userError || !userToDelete) {
      console.error('❌ Usuário não encontrado:', userError)
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }

    console.log('👤 Usuário a ser deletado:', userToDelete)

    // 1. Deletar tags do usuário
    console.log('🏷️ Deletando tags do usuário...')
    const { error: tagsError } = await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', userId)

    if (tagsError) {
      console.error('❌ Erro ao deletar tags:', tagsError)
    } else {
      console.log('✅ Tags deletadas')
    }

    // 2. Deletar perfil do usuário
    console.log('👤 Deletando perfil do usuário...')
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('❌ Erro ao deletar perfil:', profileError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao deletar perfil do usuário'
      }, { status: 500 })
    }

    console.log('✅ Perfil deletado')

    // 3. Deletar usuário da auth (usando Admin API)
    console.log('🔐 Deletando usuário da autenticação...')
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('❌ Erro ao deletar da auth:', authError)
      // Não retornar erro aqui pois o perfil já foi deletado
      console.log('⚠️ Perfil foi deletado mas auth pode ter falhado')
    } else {
      console.log('✅ Usuário deletado da auth')
    }

    console.log('🎉 Usuário deletado completamente!')

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso',
      deletedUser: {
        id: userId,
        username: userToDelete.username,
        full_name: userToDelete.full_name
      }
    })

  } catch (error: any) {
    console.error('❌ Erro crítico ao deletar usuário:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para deletar usuário. Use POST com { userId, adminId }.'
  })
}
