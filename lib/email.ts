import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY não configurada')
  }
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
