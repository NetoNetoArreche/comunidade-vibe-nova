import { NextRequest, NextResponse } from 'next/server'
import { sendTemplateEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Teste de envio de email iniciado')
    
    const body = await request.json()
    const { email, name } = body
    
    if (!email || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email e nome são obrigatórios'
      }, { status: 400 })
    }
    
    console.log('📧 Enviando email de teste para:', email)
    
    const result = await sendTemplateEmail(
      'notification',
      [email],
      {
        name: name,
        subject: 'Teste de Email - Admin',
        content: 'Este é um email de teste enviado pelo sistema administrativo. Se você recebeu este email, significa que o sistema de envio está funcionando corretamente!'
      }
    )
    
    console.log('📊 Resultado do teste:', result)
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Email de teste enviado com sucesso!' : 'Erro ao enviar email de teste',
      error: result.error
    })
    
  } catch (error: any) {
    console.error('❌ Erro no teste de email:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de teste de email. Use POST com { email, name } para testar.'
  })
}
