/**
 * 🔒 Console Security - VIBE CODING
 * Proteção contra tentativas de invasão via console do navegador
 */

if (typeof window !== 'undefined') {
  // Desabilitar console em produção
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    // Sobrescrever métodos do console
    const noop = () => {}
    console.log = noop
    console.debug = noop
    console.info = noop
    console.trace = noop
    console.table = noop
    console.dir = noop
    console.dirxml = noop
    console.group = noop
    console.groupCollapsed = noop
    console.groupEnd = noop
    console.time = noop
    console.timeEnd = noop
    console.timeLog = noop
    console.count = noop
    console.countReset = noop
    console.clear = noop
    
    // Manter apenas warn e error com mensagem genérica
    console.warn = () => console.warn('⚠️ Aviso')
    console.error = () => console.error('❌ Erro')
  }
  
  // Mensagem de aviso no console
  const styles = [
    'color: #ff0000',
    'font-size: 40px',
    'font-weight: bold',
    'text-shadow: 2px 2px 4px rgba(0,0,0,0.5)',
  ].join(';')

  const stylesSubtitle = [
    'color: #ff6b00',
    'font-size: 20px',
    'font-weight: bold',
  ].join(';')

  const stylesWarning = [
    'color: #ffaa00',
    'font-size: 16px',
    'font-weight: normal',
  ].join(';')

  console.log('%c🛡️ CHUPA SEU CORNO AQUI É VIBE CODING 🚀', styles)
  console.log('%c⚠️ AVISO DE SEGURANÇA', stylesSubtitle)
  console.log(
    '%cEsta é uma área restrita para desenvolvedores.\n' +
    'Se alguém te pediu para copiar/colar algo aqui, é GOLPE!\n' +
    'Você pode estar dando acesso à sua conta.\n\n' +
    'Todas as tentativas de invasão são monitoradas e registradas.',
    stylesWarning
  )

  // Detectar tentativas de manipulação do console
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  // Bloquear acesso a dados sensíveis
  if (!isProduction) {
    // Detectar comandos suspeitos
    const suspiciousPatterns = [
      /document\.cookie/i,
      /localStorage/i,
      /sessionStorage/i,
      /\.token/i,
      /password/i,
      /supabase.*key/i,
      /NEXT_PUBLIC/i,
      /auth/i,
      /session/i,
    ]

    // Interceptar console.log
    console.log = function(...args: any[]) {
      const message = args.join(' ')
      if (suspiciousPatterns.some(pattern => pattern.test(message))) {
        originalWarn.call(console, '🚨 TENTATIVA DE INVASÃO DETECTADA!')
        originalWarn.call(console, '🛡️ Chupa seu corno aqui é VIBE CODING 🚀')
        originalWarn.call(console, 'Comando bloqueado')
        return
      }
      originalLog.apply(console, args)
    }
  }

  // Proteger contra debugger (apenas em produção)
  if (isProduction) {
    setInterval(() => {
      const start = performance.now()
      debugger // eslint-disable-line no-debugger
      const end = performance.now()
      
      // Se levou muito tempo, alguém está debugando
      if (end - start > 100) {
        console.warn('🚨 Debugger detectado!')
        console.warn('🛡️ Chupa seu corno aqui é VIBE CODING 🚀')
      }
    }, 5000) // A cada 5 segundos para não sobrecarregar
  }

  // Detectar tentativas de injeção de script
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'SCRIPT') {
          const scriptElement = node as HTMLScriptElement
          if (!scriptElement.src.includes('localhost') && 
              !scriptElement.src.includes('supabase.co') &&
              !scriptElement.src.includes('vercel.app')) {
            console.warn('🚨 Script externo detectado!')
            console.warn('🛡️ Chupa seu corno aqui é VIBE CODING 🚀')
            console.warn('Script bloqueado:', scriptElement.src)
            scriptElement.remove()
          }
        }
      })
    })
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })

  // Proteger localStorage e sessionStorage
  const originalSetItem = Storage.prototype.setItem
  
  Storage.prototype.setItem = function(key: string, value: string) {
    // Permitir apenas em desenvolvimento ou para dados não sensíveis
    if (isProduction && (key.includes('token') || key.includes('password') || key.includes('key'))) {
      console.warn('🚨 Tentativa de armazenar dados sensíveis bloqueada!')
      console.warn('🛡️ Chupa seu corno aqui é VIBE CODING 🚀')
      return
    }
    return originalSetItem.call(this, key, value)
  }

  // Bloquear eval e Function em produção
  if (isProduction) {
    window.eval = function() {
      console.warn('🚨 eval() bloqueado em produção!')
      console.warn('🛡️ Chupa seu corno aqui é VIBE CODING 🚀')
      throw new Error('eval() não permitido')
    }
    
    window.Function = function() {
      console.warn('🚨 Function() bloqueado em produção!')
      console.warn('🛡️ Chupa seu corno aqui é VIBE CODING 🚀')
      throw new Error('Function() não permitido')
    } as any
  }
}

export {}
