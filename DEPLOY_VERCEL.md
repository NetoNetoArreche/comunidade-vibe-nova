# 🚀 Deploy na Vercel - VIBE CODING

## ✅ Projeto Pronto para Deploy!

### 📋 **Pré-requisitos**

1. ✅ Conta na [Vercel](https://vercel.com)
2. ✅ Conta no [GitHub](https://github.com)
3. ✅ Projeto Supabase configurado

---

## 🔧 **Passo 1: Preparar Repositório GitHub**

### 1.1 Criar Repositório no GitHub

```bash
# Ir para https://github.com/new
# Nome: vibe-coding-comunidade
# Visibilidade: Private (recomendado)
```

### 1.2 Conectar Projeto ao GitHub

```bash
# No terminal, dentro da pasta do projeto:
cd c:/Users/helio/OneDrive/Documentos/COMUNIDADE/comunidade-vibe-nova

# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Preparar projeto para deploy na Vercel"

# Adicionar remote do GitHub (substituir SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/vibe-coding-comunidade.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

---

## 🚀 **Passo 2: Deploy na Vercel**

### 2.1 Importar Projeto

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Selecione **"Import Git Repository"**
4. Escolha seu repositório: `vibe-coding-comunidade`
5. Clique em **"Import"**

### 2.2 Configurar Variáveis de Ambiente

Na página de configuração do projeto, adicione as seguintes variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Onde encontrar essas informações:**

1. Acesse [supabase.com](https://supabase.com)
2. Vá para seu projeto
3. Clique em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.3 Configurações do Build

A Vercel detectará automaticamente que é um projeto Next.js.

**Configurações padrão:**
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 18.x (automático)

### 2.4 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. ✅ Projeto no ar!

---

## 🌐 **Passo 3: Configurar Domínio (Opcional)**

### 3.1 Domínio Vercel (Gratuito)

Seu projeto estará disponível em:
```
https://vibe-coding-comunidade.vercel.app
```

### 3.2 Domínio Personalizado

1. Na Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio: `vibecoding.com.br`
3. Configure DNS conforme instruções da Vercel

---

## 🔒 **Passo 4: Configurar Supabase para Produção**

### 4.1 Adicionar URL da Vercel no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Vá para **Authentication** → **URL Configuration**
3. Adicione em **Site URL:**
   ```
   https://vibe-coding-comunidade.vercel.app
   ```

4. Adicione em **Redirect URLs:**
   ```
   https://vibe-coding-comunidade.vercel.app/**
   ```

### 4.2 Configurar CORS

No Supabase, vá em **Settings** → **API** → **CORS**

Adicione:
```
https://vibe-coding-comunidade.vercel.app
```

---

## ✅ **Passo 5: Verificar Deploy**

### 5.1 Checklist Pós-Deploy

- [ ] Site carrega corretamente
- [ ] Login funciona
- [ ] Posts aparecem
- [ ] Chat funciona
- [ ] Imagens carregam
- [ ] Realtime funciona
- [ ] Notificações funcionam

### 5.2 Testar Funcionalidades

1. **Autenticação:**
   - Login com email
   - Registro de novo usuário
   - Logout

2. **Posts:**
   - Criar post
   - Curtir post
   - Comentar

3. **Chat:**
   - Enviar mensagem
   - Ver mensagens em tempo real
   - Upload de arquivo

4. **Perfil:**
   - Editar perfil
   - Upload de avatar
   - Ver projetos

---

## 🔄 **Atualizações Futuras**

### Deploy Automático

Toda vez que você fizer push para o GitHub, a Vercel fará deploy automaticamente!

```bash
# Fazer mudanças no código
git add .
git commit -m "Descrição da mudança"
git push

# ✅ Vercel faz deploy automático!
```

### Ambientes

- **Production:** `main` branch → `vibe-coding-comunidade.vercel.app`
- **Preview:** outras branches → URLs temporárias

---

## 🐛 **Solução de Problemas**

### Erro: "Module not found"

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```

### Erro: "Build failed"

1. Verifique os logs na Vercel
2. Teste o build localmente:
   ```bash
   npm run build
   ```
3. Corrija os erros
4. Faça commit e push

### Erro: "Environment variables not found"

1. Vá em **Settings** → **Environment Variables**
2. Verifique se todas as variáveis estão configuradas
3. Clique em **Redeploy**

### Erro: "Supabase connection failed"

1. Verifique as URLs no Supabase
2. Verifique as variáveis de ambiente
3. Teste a conexão localmente

---

## 📊 **Monitoramento**

### Analytics da Vercel

A Vercel fornece analytics gratuitos:
- Visitantes
- Performance
- Erros
- Tempo de carregamento

Acesse em: **Analytics** no dashboard da Vercel

### Logs

Para ver logs em tempo real:
1. Vá para **Deployments**
2. Clique no deployment ativo
3. Vá em **Functions** → **Logs**

---

## 💰 **Custos**

### Vercel (Hobby - Gratuito)

- ✅ 100 GB bandwidth/mês
- ✅ 100 GB-hours serverless
- ✅ Deploy automático
- ✅ SSL gratuito
- ✅ Analytics básico

### Supabase (Free Tier)

- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth
- ✅ 50 MB file uploads
- ✅ Realtime incluído

**Total: R$ 0,00/mês** (para começar)

---

## 🎉 **Pronto!**

Seu projeto **VIBE CODING** está no ar! 🚀

**URL:** https://vibe-coding-comunidade.vercel.app

**Próximos passos:**
1. ✅ Compartilhar com a comunidade
2. ✅ Monitorar performance
3. ✅ Coletar feedback
4. ✅ Adicionar novas features

---

## 📞 **Suporte**

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

**Desenvolvido com ❤️ por VIBE CODING** 🚀
