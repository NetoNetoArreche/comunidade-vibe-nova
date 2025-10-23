import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ FALTANDO',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ FALTANDO',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Configurada' : '❌ FALTANDO',
    }
    
    console.log('🔍 Verificação de variáveis de ambiente:', envCheck)
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Erro ao verificar ambiente:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
