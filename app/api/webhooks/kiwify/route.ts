import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔔 Webhook Kiwify recebido:', body)

    // Verificar se a integração está ativa
    const { data: settings } = await supabase
      .from('kiwify_settings')
      .select('*')
      .single()

    if (!settings || !settings.is_active) {
      console.log('❌ Integração Kiwify não está ativa')
      return NextResponse.json({ error: 'Integration not active' }, { status: 400 })
    }

    // Validar webhook secret se configurado
    if (settings.webhook_secret) {
      const signature = request.headers.get('x-kiwify-signature')
      // TODO: Implementar validação de assinatura se a Kiwify fornecer
      console.log('🔐 Signature recebida:', signature)
    }

    const event = body.event || body.type
    const data = body.data || body

    console.log('📦 Evento:', event)
    console.log('📊 Dados:', data)

    // Processar eventos
    switch (event) {
      case 'order.paid':
      case 'sale':
      case 'purchase':
        await handlePurchase(data, body)
        break
      
      case 'order.refunded':
      case 'refund':
        await handleRefund(data, body)
        break
      
      default:
        console.log('⚠️ Evento não tratado:', event)
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function handlePurchase(data: any, fullPayload: any) {
  console.log('💰 Processando compra...')

  // Extrair dados (adaptar conforme estrutura real da Kiwify)
  const orderId = data.order_id || data.id || data.transaction_id
  const productId = data.product_id || data.product?.id
  const customerEmail = data.customer?.email || data.email || data.customer_email
  const customerName = data.customer?.name || data.name || data.customer_name

  if (!orderId || !productId || !customerEmail) {
    console.error('❌ Dados incompletos:', { orderId, productId, customerEmail })
    return
  }

  console.log('📧 Email do cliente:', customerEmail)
  console.log('🛒 Produto:', productId)

  // Verificar se o produto está vinculado
  const { data: product } = await supabase
    .from('kiwify_products')
    .select('*')
    .eq('product_id', productId)
    .eq('grant_access', true)
    .single()

  if (!product) {
    console.log('⚠️ Produto não vinculado ou sem permissão de acesso:', productId)
    return
  }

  console.log('✅ Produto vinculado encontrado:', product.product_name)

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
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
      user_metadata: {
        full_name: customerName,
        from_kiwify: true,
        needs_password: true
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError)
      return
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
    await sendWelcomeEmail(customerEmail, customerName)
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
        content: `Bem-vindo à comunidade! Sua compra de ${product.product_name} foi confirmada.`,
        is_read: false
      })
  }

  console.log('🎉 Processamento de compra concluído!')
}

async function handleRefund(data: any, fullPayload: any) {
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

    // Enviar email de reembolso
    await sendRefundEmail(purchase.customer_email, purchase.customer_name)
  }

  console.log('✅ Reembolso processado!')
}

async function sendWelcomeEmail(email: string, name: string) {
  console.log('📧 Enviando email de boas-vindas para:', email)
  
  // TODO: Implementar envio de email real
  // Por enquanto, apenas log
  
  const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?email=${encodeURIComponent(email)}`
  
  console.log('🔗 Link para criar senha:', resetLink)
  console.log(`
    Olá ${name}!
    
    Bem-vindo à comunidade!
    
    Sua compra foi confirmada e sua conta foi criada.
    
    Para acessar, você precisa criar uma senha:
    ${resetLink}
    
    Seu email de acesso é: ${email}
    
    Qualquer dúvida, estamos à disposição!
  `)
}

async function sendRefundEmail(email: string, name: string) {
  console.log('📧 Enviando email de reembolso para:', email)
  
  // TODO: Implementar envio de email real
  
  console.log(`
    Olá ${name}!
    
    Seu reembolso foi processado com sucesso.
    
    Seu acesso à comunidade foi removido conforme solicitado.
    
    Se tiver alguma dúvida, entre em contato conosco.
  `)
}
