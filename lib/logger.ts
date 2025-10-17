/**
 * 🔒 Logger Seguro - VIBE CODING
 * Remove logs sensíveis em produção
 */

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Log seguro - só funciona em desenvolvimento
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    } else {
      // Em produção, apenas registrar erro genérico
      console.error('Erro na aplicação')
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  }
}

/**
 * Remove console.log em produção
 */
export function disableConsoleInProduction() {
  if (!isDevelopment) {
    console.log = () => {}
    console.debug = () => {}
    console.info = () => {}
    // Manter apenas warn e error para monitoramento crítico
  }
}
