/**
 * 🔒 Security Module - VIBE CODING
 * Proteção contra tentativas de invasão e ataques
 */

// Mensagem para invasores
const SECURITY_MESSAGE = '🛡️ Chupa seu corno aqui é VIBE CODING 🚀'

/**
 * Detecta e bloqueia tentativas de XSS
 */
export function detectXSSAttempt(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /<iframe/i,
    /eval\(/i,
    /alert\(/i,
    /document\.cookie/i,
    /window\.location/i,
  ]

  const hasXSS = xssPatterns.some(pattern => pattern.test(input))
  
  if (hasXSS) {
    console.warn(SECURITY_MESSAGE)
    console.warn('🚨 Tentativa de XSS detectada e bloqueada!')
    return true
  }
  
  return false
}

/**
 * Detecta tentativas de SQL Injection
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bor\b|\band\b).*=.*\d/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i,
    /update.*set/i,
    /--/,
    /;.*drop/i,
    /exec\(/i,
    /execute\(/i,
  ]

  const hasSQL = sqlPatterns.some(pattern => pattern.test(input))
  
  if (hasSQL) {
    console.warn(SECURITY_MESSAGE)
    console.warn('🚨 Tentativa de SQL Injection detectada e bloqueada!')
    return true
  }
  
  return false
}

/**
 * Detecta tentativas de Path Traversal
 */
export function detectPathTraversal(input: string): boolean {
  const pathPatterns = [
    /\.\.\//,
    /\.\.%2f/i,
    /\.\.%5c/i,
    /%2e%2e/i,
    /etc\/passwd/i,
    /windows\/system32/i,
  ]

  const hasPath = pathPatterns.some(pattern => pattern.test(input))
  
  if (hasPath) {
    console.warn(SECURITY_MESSAGE)
    console.warn('🚨 Tentativa de Path Traversal detectada e bloqueada!')
    return true
  }
  
  return false
}

/**
 * Detecta tentativas de Command Injection
 */
export function detectCommandInjection(input: string): boolean {
  const cmdPatterns = [
    /;.*rm\s/i,
    /\|.*cat/i,
    /&&.*ls/i,
    /`.*`/,
    /\$\(.*\)/,
    />\s*\/dev\/null/i,
  ]

  const hasCmd = cmdPatterns.some(pattern => pattern.test(input))
  
  if (hasCmd) {
    console.warn(SECURITY_MESSAGE)
    console.warn('🚨 Tentativa de Command Injection detectada e bloqueada!')
    return true
  }
  
  return false
}

/**
 * Validação de segurança completa
 */
export function validateSecureInput(input: string): boolean {
  if (detectXSSAttempt(input)) return false
  if (detectSQLInjection(input)) return false
  if (detectPathTraversal(input)) return false
  if (detectCommandInjection(input)) return false
  return true
}

/**
 * Sanitiza input do usuário
 */
export function sanitizeInput(input: string): string {
  if (!validateSecureInput(input)) {
    throw new Error('Input inválido detectado')
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Rate Limiting - Detecta tentativas de brute force
 */
const attemptTracker = new Map<string, { count: number; timestamp: number }>()

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 60000): boolean {
  const now = Date.now()
  const record = attemptTracker.get(identifier)

  if (!record || now - record.timestamp > windowMs) {
    attemptTracker.set(identifier, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= maxAttempts) {
    console.warn(SECURITY_MESSAGE)
    console.warn(`🚨 Rate limit excedido para: ${identifier}`)
    return false
  }

  record.count++
  return true
}

/**
 * Detecta tentativas de acesso não autorizado
 */
export function detectUnauthorizedAccess(userId: string | null, requiredRole?: string): boolean {
  if (!userId) {
    console.warn(SECURITY_MESSAGE)
    console.warn('🚨 Tentativa de acesso sem autenticação!')
    return true
  }
  
  return false
}

/**
 * Log de segurança
 */
export function logSecurityEvent(event: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.warn(`[SECURITY] ${timestamp} - ${event}`, details || '')
  
  // Em produção, enviar para serviço de monitoramento
  if (process.env.NODE_ENV === 'production') {
    // TODO: Enviar para Sentry, LogRocket, etc.
  }
}
