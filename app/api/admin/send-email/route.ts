import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBulkEmail, EMAIL_TEMPLATES } from '@/lib/email'

const ADMIN_EMAIL = 'helioarreche@gmail.com'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔍 Verificando variáveis de ambiente:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ FALTANDO')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ FALTANDO')
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada')
  }
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  console.log('==================================================')
  console.log('🔵 POST /api/admin/send-email - INÍCIO')
  console.log('==================================================')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Request URL:', request.url)
  console.log('Request Method:', request.method)
  
  let supabase
  
  try {
    console.log('🔧 Criando cliente Supabase...')
    supabase = getSupabaseClient()
    console.log('✅ Cliente Supabase criado')
  } catch (error: any) {
    console.error('❌ ERRO ao criar cliente Supabase:', error.message)
    return NextResponse.json({ 
      success: false,
      error: `Erro ao criar cliente Supabase: ${error.message}` 
    }, { status: 500 })
  }
  
  try {
    console.log('📦 Fazendo parse do body...')
    const body = await request.json()
    console.log('✅ Body parseado')
    
    const { templateId, recipientIds, variables, adminId } = body

    console.log('📧 Requisição de envio de email recebida:', { 
      templateId, 
      recipientCount: recipientIds?.length, 
      adminId,
      adminIdType: typeof adminId,
      adminIdLength: adminId?.length
    })

    // Verificar se o usuário é admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', adminId)
      .single()

    console.log('👤 Perfil do admin:', { email: adminProfile?.email, isAdmin: adminProfile?.email === ADMIN_EMAIL })

    if (adminError || !adminProfile || adminProfile.email !== ADMIN_EMAIL) {
      console.error('❌ Acesso negado:', { adminError, email: adminProfile?.email })
      return NextResponse.json({ 
        success: false,
        error: 'Acesso negado. Somente administradores podem enviar emails.' 
      }, { status: 403 })
    }

    // Verificar se o template existe
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId)
    if (!template) {
      console.error('❌ Template não encontrado:', templateId)
      return NextResponse.json({ 
        success: false,
        error: 'Template não encontrado' 
      }, { status: 400 })
    }

    console.log('✅ Template encontrado:', template.name)

    // Buscar dados dos destinatários usando função RPC
    const { data: allProfiles, error: profilesError } = await supabase
      .rpc('get_profiles_with_email')

    if (profilesError || !allProfiles) {
      console.error('❌ Erro ao buscar perfis:', profilesError)
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao buscar destinatários' 
      }, { status: 500 })
    }

    // Filtrar apenas os destinatários selecionados
    const recipients = allProfiles.filter((profile: any) => recipientIds.includes(profile.id))

    console.log('📋 Destinatários com emails:', recipients.filter((r: any) => r.email).length)
    console.log('📋 Destinatários sem emails:', recipients.filter((r: any) => !r.email).length)

    console.log('📋 Destinatários encontrados:', recipients.length)

    // Filtrar apenas usuários com email válido
    const validRecipients = recipients.filter((r: any) => r.email)

    console.log('✅ Destinatários válidos:', validRecipients.length)

    if (validRecipients.length === 0) {
      console.error('❌ Nenhum destinatário válido')
      return NextResponse.json({ 
        success: false,
        error: 'Nenhum destinatário válido encontrado' 
      }, { status: 400 })
    }

    console.log('📤 Iniciando envio de emails...')

    // Enviar emails
    const result = await sendBulkEmail(
      templateId,
      validRecipients.map((r: any) => ({
        email: r.email!,
        name: r.full_name || r.username || 'Usuário'
      })),
      variables
    )

    console.log('📊 Resultado do envio:', result)

    if (!result.success) {
      console.error('❌ Erro ao enviar emails:', result.error)
      return NextResponse.json({ 
        success: false,
        error: `Erro ao enviar emails: ${JSON.stringify(result.error)}` 
      }, { status: 500 })
    }

    console.log('✅ Emails enviados com sucesso!')

    // Log da ação de admin
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action: 'send_email',
        details: {
          templateId,
          recipientCount: validRecipients.length,
          variables
        }
      })

    return NextResponse.json({
      success: true,
      message: `Emails enviados com sucesso para ${validRecipients.length} destinatários`,
      results: result.results
    })

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO ao enviar emails:', error)
    console.error('Stack trace:', error.stack)
    console.error('Mensagem:', error.message)
    return NextResponse.json({ 
      success: false,
      error: `Erro interno do servidor: ${error.message || 'Erro desconhecido'}` 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Retornar templates disponíveis
    return NextResponse.json({
      success: true,
      templates: EMAIL_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
