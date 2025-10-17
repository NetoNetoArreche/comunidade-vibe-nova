# 🛡️ Guia de Boas Práticas de Segurança

## 📚 Índice
1. [Proteção XSS](#proteção-xss)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Validação de Dados](#validação-de-dados)
4. [Upload de Arquivos](#upload-de-arquivos)
5. [Links Externos](#links-externos)
6. [Armazenamento de Dados](#armazenamento-de-dados)
7. [Tratamento de Erros](#tratamento-de-erros)

---

## 🚫 Proteção XSS

### ❌ NUNCA FAÇA:
```typescript
// PERIGOSO - Permite injeção de código
element.innerHTML = userInput
element.innerHTML += '<div>' + userInput + '</div>'
dangerouslySetInnerHTML={{ __html: userInput }}
eval(userInput)
new Function(userInput)
```

### ✅ SEMPRE FAÇA:
```typescript
// SEGURO - React escapa automaticamente
<div>{userInput}</div>

// SEGURO - Criar elementos via DOM
const div = document.createElement('div')
div.textContent = userInput // textContent escapa automaticamente
parent.appendChild(div)

// SEGURO - Se realmente precisar de HTML, sanitize primeiro
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)
```

---

## 🔐 Autenticação e Autorização

### ✅ Verificação de Usuário
```typescript
// SEMPRE verificar se o usuário está autenticado
if (!user) {
  toast.error('Você precisa estar logado')
  return
}

// SEMPRE verificar permissões
if (user.role !== 'admin') {
  toast.error('Acesso negado')
  return
}
```

### ✅ Proteção de Rotas
```typescript
// Verificar autenticação antes de renderizar
if (loading) return <LoadingSpinner />
if (!user) return <LoginPrompt />

// Verificar permissões específicas
if (user.role !== 'admin') {
  return <AccessDenied />
}
```

---

## 🎯 Validação de Dados

### ✅ Validação de Inputs
```typescript
// SEMPRE validar antes de enviar
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validar campos obrigatórios
  if (!title.trim()) {
    toast.error('Título é obrigatório')
    return
  }
  
  // Validar tamanho
  if (title.length > 100) {
    toast.error('Título muito longo (máx 100 caracteres)')
    return
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    toast.error('Email inválido')
    return
  }
  
  // Prosseguir com envio
  await submitData()
}
```

### ✅ Validação de URLs
```typescript
// Validar URLs antes de usar
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

if (!isValidUrl(externalLink)) {
  toast.error('URL inválida')
  return
}
```

---

## 📸 Upload de Arquivos

### ✅ Validação de Arquivos
```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  
  // 1. Validar tamanho (5MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    toast.error('Arquivo muito grande. Máximo 5MB.')
    return
  }
  
  // 2. Validar tipo
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.error('Tipo de arquivo não permitido')
    return
  }
  
  // 3. Validar extensão (dupla verificação)
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    toast.error('Extensão de arquivo inválida')
    return
  }
  
  // Prosseguir com upload
  uploadFile(file)
}
```

---

## 🌐 Links Externos

### ✅ SEMPRE use rel="noopener noreferrer"
```typescript
// CORRETO - Previne tabnabbing
<a 
  href={externalUrl} 
  target="_blank" 
  rel="noopener noreferrer"
>
  Link Externo
</a>

// INCORRETO - Vulnerável a tabnabbing
<a href={externalUrl} target="_blank">
  Link Externo
</a>
```

### ✅ Validar URLs de Usuários
```typescript
// Validar antes de criar link
const sanitizeUrl = (url: string) => {
  // Prevenir javascript: e data: URLs
  if (url.startsWith('javascript:') || url.startsWith('data:')) {
    return '#'
  }
  
  // Garantir que começa com http:// ou https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url
  }
  
  return url
}
```

---

## 💾 Armazenamento de Dados

### ❌ NUNCA armazene no localStorage:
- Tokens de autenticação (use Supabase)
- Senhas
- Dados sensíveis do usuário
- Informações de pagamento

### ✅ PODE armazenar no localStorage:
- Preferências de tema (dark/light)
- Preferências de idioma
- Estado de UI (sidebar aberta/fechada)
- Página atual de navegação

```typescript
// CORRETO - Apenas preferências
localStorage.setItem('theme', 'dark')
localStorage.setItem('currentPage', 'home')

// INCORRETO - Dados sensíveis
localStorage.setItem('authToken', token) // ❌
localStorage.setItem('password', password) // ❌
```

---

## 🚨 Tratamento de Erros

### ✅ Mensagens de Erro Seguras
```typescript
try {
  await supabase.from('posts').insert(data)
} catch (error) {
  console.error('Erro detalhado:', error) // OK no console
  
  // NUNCA mostrar erro técnico ao usuário
  toast.error('Erro ao criar post. Tente novamente.') // ✅
  
  // INCORRETO - Expõe detalhes técnicos
  toast.error(error.message) // ❌
}
```

### ✅ Logging Seguro
```typescript
// CORRETO - Log sem dados sensíveis
console.log('Usuário fez login:', user.id)

// INCORRETO - Log com dados sensíveis
console.log('Token:', authToken) // ❌
console.log('Senha:', password) // ❌
```

---

## 🔑 Variáveis de Ambiente

### ✅ Nomenclatura Correta
```bash
# PÚBLICO (pode ser exposto no front-end)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://...

# PRIVADO (apenas servidor)
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
SECRET_KEY=...
```

### ❌ NUNCA faça:
```typescript
// NUNCA exponha chaves privadas
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // ❌
```

---

## 📋 Checklist Rápido

Antes de fazer commit, verifique:

- [ ] Não há `innerHTML`, `eval()` ou `Function()`
- [ ] Todos os inputs são validados
- [ ] Links externos têm `rel="noopener noreferrer"`
- [ ] Arquivos são validados (tamanho e tipo)
- [ ] Erros não expõem informações sensíveis
- [ ] Não há dados sensíveis no localStorage
- [ ] Verificações de autenticação estão presentes
- [ ] Não há console.log com dados sensíveis
- [ ] URLs de usuários são sanitizadas
- [ ] Variáveis de ambiente estão corretas

---

## 🆘 Em Caso de Dúvida

**Regra de Ouro:** Se você não tem certeza se algo é seguro, **NÃO FAÇA**.

Pergunte ou pesquise antes de implementar:
- Manipulação de HTML de usuários
- Execução de código dinâmico
- Armazenamento de dados sensíveis
- Integração com APIs externas

---

**Lembre-se:** Segurança é responsabilidade de todos! 🛡️
