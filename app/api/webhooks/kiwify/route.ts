import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/email'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient()
  let logId: string | null = null
  
  try {
    const body = await request.json()
    
    console.log('🔔 Webhook Kiwify recebido:', JSON.stringify(body, null, 2))

    // Estrutura real da Kiwify
    const event = body.webhook_event_type || body.event || 'unknown'
    const customerEmail = body.Customer?.email || body.customer?.email || 'unknown'
    const customerName = body.Customer?.full_name || body.customer?.name || body.Customer?.first_name
    const orderId = body.order_id || body.id
    const productId = body.Product?.product_id || body.product_id

    // Criar log inicial
    const { data: logData } = await supabase
      .from('kiwify_webhook_logs')
      .insert({
        event_type: event,
        customer_email: customerEmail,
        customer_name: customerName,
        order_id: orderId,
        product_id: productId,
        status: 'processing',
        webhook_data: body
      })
      .select('id')
      .single()

    logId = logData?.id || null

    // Verificar se a integração está ativa
    const { data: settings, error: settingsError } = await supabase
      .from('kiwify_settings')
      .select('*')
      .single()

    console.log('⚙️ Settings:', settings)
    console.log('⚙️ Settings Error:', settingsError)

    if (!settings || !settings.is_active) {
      console.log('❌ Integração Kiwify não está ativa')
      if (logId) {
        await supabase
          .from('kiwify_webhook_logs')
          .update({ status: 'error', error_message: 'Integração não está ativa' })
          .eq('id', logId)
      }
      return NextResponse.json({ error: 'Integration not active' }, { status: 400 })
    }

    console.log('📦 Evento:', event)
    console.log('📊 Dados:', { customerEmail, orderId, productId })

    // Processar eventos
    try {
      switch (event) {
        case 'order_approved':
          await handlePurchase(body, body, supabase)
          break
        
        case 'order_refunded':
        case 'chargeback':
          await handleRefund(body, body, supabase)
          break
        
        case 'subscription_canceled':
          await handleRefund(body, body, supabase)
          break
        
        default:
          console.log('⚠️ Evento não tratado:', event)
          if (logId) {
            await supabase
              .from('kiwify_webhook_logs')
              .update({ status: 'success', error_message: `Evento recebido mas não processado: ${event}` })
              .eq('id', logId)
          }
          return NextResponse.json({ success: true, message: 'Event received but not processed' })
      }

      // Atualizar log como sucesso
      if (logId) {
        await supabase
          .from('kiwify_webhook_logs')
          .update({ status: 'success' })
          .eq('id', logId)
      }

      return NextResponse.json({ success: true, message: 'Webhook processed' })
    } catch (processingError) {
      console.error('❌ Erro ao processar evento:', processingError)
      if (logId) {
        await supabase
          .from('kiwify_webhook_logs')
          .update({ 
            status: 'error', 
            error_message: processingError instanceof Error ? processingError.message : 'Erro desconhecido'
          })
          .eq('id', logId)
      }
      throw processingError
    }
  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    if (logId) {
      await supabase
        .from('kiwify_webhook_logs')
        .update({ 
          status: 'error', 
          error_message: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        .eq('id', logId)
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handlePurchase(data: any, fullPayload: any, supabase: ReturnType<typeof getSupabaseClient>) {
  console.log('💰 Processando compra...')

  // Extrair dados (adaptar conforme estrutura real da Kiwify)
  const orderId = data.order_id || data.id
  const productId = data.Product?.product_id || data.product_id
  const customerEmail = data.Customer?.email || data.customer?.email
  const customerName = data.Customer?.full_name || data.customer?.name

  if (!orderId || !customerEmail) {
    console.error('❌ Dados incompletos:', { orderId, customerEmail })
    throw new Error('Dados incompletos no webhook')
  }

  console.log('📧 Email do cliente:', customerEmail)
  console.log('🛒 Produto:', productId)
  console.log('✅ Processando compra para dar acesso à comunidade')

  // Buscar ou criar usuário
  let userId: string | null = null

  // Verificar se já existe usuário com este email
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single()

  if (existingProfile) {
    userId = existingProfile.id
    console.log('👤 Usuário já existe:', userId)
  } else {
    // Criar novo usuário no Auth
    console.log('🆕 Criando novo usuário...')
    
    // Gerar senha temporária aleatória
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: customerName,
        from_kiwify: true
      }
    })
    
    console.log('🔍 Auth Data:', authData)
    console.log('🔍 Auth Error:', authError)

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError)
      throw new Error(`Erro ao criar usuário: ${authError.message}`)
    }

    if (!authData?.user) {
      console.error('❌ Nenhum usuário retornado')
      throw new Error('Nenhum usuário retornado do Auth')
    }

    userId = authData.user.id
    console.log('✅ Usuário criado:', userId)

    // Criar perfil
    const username = customerEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    
    await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: customerEmail,
        username: username,
        full_name: customerName,
        role: 'user'
      })

    console.log('✅ Perfil criado')

    // Enviar email de boas-vindas
    await sendWelcomeEmail(customerEmail, customerName || 'Cliente')
    console.log('📧 Email de boas-vindas enviado')
  }

  // Registrar compra
  const { error: purchaseError } = await supabase
    .from('kiwify_purchases')
    .insert({
      order_id: orderId,
      product_id: productId,
      customer_email: customerEmail,
      customer_name: customerName,
      user_id: userId,
      status: 'paid',
      access_granted: true,
      purchase_date: new Date().toISOString(),
      webhook_data: fullPayload
    })

  if (purchaseError) {
    console.error('❌ Erro ao registrar compra:', purchaseError)
  } else {
    console.log('✅ Compra registrada com sucesso')
  }

  // Criar notificação para o usuário
  if (userId) {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'purchase',
        content: `Bem-vindo à comunidade! Sua compra foi confirmada e você já tem acesso.`,
        is_read: false
      })
  }

  console.log('🎉 Processamento de compra concluído!')
}

async function handleRefund(data: any, fullPayload: any, supabase: ReturnType<typeof getSupabaseClient>) {
  console.log('💸 Processando reembolso...')

  const orderId = data.order_id || data.id || data.transaction_id

  if (!orderId) {
    console.error('❌ Order ID não encontrado')
    return
  }

  // Buscar compra
  const { data: purchase } = await supabase
    .from('kiwify_purchases')
    .select('*')
    .eq('order_id', orderId)
    .single()

  if (!purchase) {
    console.log('⚠️ Compra não encontrada:', orderId)
    return
  }

  console.log('📦 Compra encontrada:', purchase.id)

  // Atualizar status e remover acesso
  const { error: updateError } = await supabase
    .from('kiwify_purchases')
    .update({
      status: 'refunded',
      access_granted: false,
      access_revoked_at: new Date().toISOString(),
      webhook_data: fullPayload
    })
    .eq('id', purchase.id)

  if (updateError) {
    console.error('❌ Erro ao atualizar compra:', updateError)
  } else {
    console.log('✅ Acesso removido')
  }

  // Criar notificação
  if (purchase.user_id) {
    await supabase
      .from('notifications')
      .insert({
        user_id: purchase.user_id,
        type: 'refund',
        content: 'Seu reembolso foi processado e seu acesso à comunidade foi removido.',
        is_read: false
      })

    // TODO: Enviar email de reembolso
    console.log('📧 Reembolso processado para:', purchase.customer_email)
  }

  console.log('✅ Reembolso processado!')
}
