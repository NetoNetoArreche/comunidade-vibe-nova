import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  console.log('🔑 Verificando RESEND_API_KEY:', apiKey ? 'Configurada ✅' : 'NÃO configurada ❌')
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY não encontrada nas variáveis de ambiente')
    throw new Error('RESEND_API_KEY não configurada')
  }
  console.log('✅ Cliente Resend criado com sucesso')
  return new Resend(apiKey)
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: 'Comunidade Vibe Coding <contato@comunidadevibecoding.com>',
      to: email,
      subject: '🎉 Bem-vindo à Comunidade!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
              }
              .steps {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .step {
                margin: 10px 0;
                padding-left: 30px;
                position: relative;
              }
              .step::before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #667eea;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Bem-vindo à Comunidade!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              
              <p>Sua compra foi confirmada com sucesso! Você já tem acesso completo à nossa comunidade.</p>
              
              <div class="steps">
                <h3>📝 Como acessar em 3 passos:</h3>
                <div class="step">Acesse a plataforma</div>
                <div class="step">Clique em "Esqueci minha senha"</div>
                <div class="step">Digite seu email: <strong>${email}</strong></div>
                <div class="step">Crie sua senha e faça login!</div>
              </div>
              
              <center>
                <a href="https://www.comunidadevibecoding.com/auth/reset-password" class="button">
                  🔑 Criar Minha Senha
                </a>
              </center>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Se você tiver alguma dúvida, responda este email que teremos prazer em ajudar!
              </p>
              
              <p style="color: #666; font-size: 14px;">
                Até logo,<br>
                <strong>Equipe Comunidade</strong>
              </p>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('❌ Erro ao enviar email:', error)
      return { success: false, error }
    }

    console.log('✅ Email enviado com sucesso:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return { success: false, error }
  }
}

// Templates de email para administradores
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html: string
  description: string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Bem-vindo à Comunidade',
    subject: '🎉 Bem-vindo à Comunidade!',
    description: 'Email de boas-vindas para novos membros',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .steps {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .step {
              margin: 10px 0;
              padding-left: 30px;
              position: relative;
            }
            .step::before {
              content: "✓";
              position: absolute;
              left: 0;
              color: #667eea;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Bem-vindo à Comunidade!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>{{name}}</strong>,</p>
            
            <p>Sua compra foi confirmada com sucesso! Você já tem acesso completo à nossa comunidade.</p>
            
            <div class="steps">
              <h3>📝 Como acessar em 3 passos:</h3>
              <div class="step">Acesse a plataforma</div>
              <div class="step">Clique em "Esqueci minha senha"</div>
              <div class="step">Digite seu email: <strong>{{email}}</strong></div>
              <div class="step">Crie sua senha e faça login!</div>
            </div>
            
            <center>
              <a href="https://www.comunidadevibecoding.com/auth/reset-password" class="button">
                🔑 Criar Minha Senha
              </a>
            </center>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Se você tiver alguma dúvida, responda este email que teremos prazer em ajudar!
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Até logo,<br>
              <strong>Equipe Comunidade</strong>
            </p>
          </div>
        </body>
      </html>
    `
  },
  {
    id: 'announcement',
    name: 'Anúncio Importante',
    subject: '📢 {{subject}}',
    description: 'Para comunicados importantes da comunidade',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .highlight {
              background: #fef3c7;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📢 {{subject}}</h1>
          </div>
          <div class="content">
            <p>Olá <strong>{{name}}</strong>,</p>
            
            <div class="highlight">
              <p><strong>Importante:</strong></p>
              <p>{{content}}</p>
            </div>
            
            <p>Atenciosamente,<br>Equipe Vibe Coding</p>
          </div>
        </body>
      </html>
    `
  },
  {
    id: 'campaign',
    name: 'Campanha de Marketing',
    subject: '🚀 {{subject}}',
    description: 'Para campanhas promocionais e ofertas especiais',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .cta-button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚀 {{subject}}</h1>
          </div>
          <div class="content">
            <p>Olá <strong>{{name}}</strong>,</p>
            
            <p>{{content}}</p>
            
            <div style="text-align: center;">
              <a href="{{cta_url}}" class="cta-button">{{cta_text}}</a>
            </div>
            
            <p>Atenciosamente,<br>Equipe Vibe Coding</p>
          </div>
        </body>
      </html>
    `
  },
  {
    id: 'notification',
    name: 'Notificação Geral',
    subject: '🔔 {{subject}}',
    description: 'Para notificações gerais da comunidade',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔔 {{subject}}</h1>
          </div>
          <div class="content">
            <p>Olá <strong>{{name}}</strong>,</p>
            
            <p>{{content}}</p>
            
            <p>Atenciosamente,<br>Equipe Vibe Coding</p>
          </div>
        </body>
      </html>
    `
  }
]

// Função para enviar email usando template
export async function sendTemplateEmail(
  templateId: string,
  recipients: string[],
  variables: Record<string, string>
) {
  try {
    console.log('📧 sendTemplateEmail iniciado:', { templateId, recipients: recipients.length, variables })
    
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId)
    if (!template) {
      console.error('❌ Template não encontrado:', templateId)
      throw new Error(`Template não encontrado: ${templateId}`)
    }

    console.log('✅ Template encontrado:', template.name)
    console.log('🔧 Criando cliente Resend...')
    
    const resend = getResendClient()
    
    console.log('🔧 Processando template com variáveis...')
    
    // Processar template com variáveis
    let processedSubject = template.subject
    let processedHtml = template.html
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value)
      processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value)
    })

    console.log('📤 Enviando email via Resend API...')
    console.log('📨 Para:', recipients)
    console.log('📝 Assunto:', processedSubject)

    const { data, error } = await resend.emails.send({
      from: 'Comunidade Vibe Coding <contato@comunidadevibecoding.com>',
      to: recipients,
      subject: processedSubject,
      html: processedHtml
    })

    if (error) {
      console.error('❌ Erro do Resend ao enviar email:', error)
      return { success: false, error }
    }

    console.log('✅ Email enviado com sucesso via Resend:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao enviar email:', error)
    return { success: false, error }
  }
}

// Função para enviar email em massa
export async function sendBulkEmail(
  templateId: string,
  recipients: Array<{ email: string; name: string }>,
  variables: Record<string, string>
) {
  try {
    console.log('📬 sendBulkEmail iniciado:', { templateId, recipientCount: recipients.length, variables })
    
    const results = []
    
    // Enviar para cada destinatário individualmente
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]
      console.log(`📧 Enviando email ${i + 1}/${recipients.length} para:`, recipient.email)
      
      const recipientVariables = {
        ...variables,
        name: recipient.name,
        email: recipient.email
      }
      
      const result = await sendTemplateEmail(
        templateId,
        [recipient.email],
        recipientVariables
      )
      
      results.push({
        email: recipient.email,
        name: recipient.name,
        success: result.success,
        error: result.error
      })
      
      console.log(`${result.success ? '✅' : '❌'} Email ${i + 1}/${recipients.length}:`, result.success ? 'Enviado' : result.error)
      
      // Pequena pausa entre envios para evitar rate limiting (Resend: 2 req/s = 500ms)
      await new Promise(resolve => setTimeout(resolve, 600))
    }
    
    const successCount = results.filter(r => r.success).length
    console.log(`✅ Envio em massa concluído: ${successCount}/${recipients.length} emails enviados com sucesso`)
    
    return { success: true, results }
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao enviar emails em massa:', error)
    return { success: false, error }
  }
}
