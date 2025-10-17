# 🚀 Comunidade IA Code

Uma plataforma moderna e responsiva para a comunidade de desenvolvedores apaixonados por IA e programação.

## ✨ Funcionalidades

### 🏠 **Feed Principal**
- Posts com texto, imagens e vídeos
- Sistema de likes e comentários
- Organização por espaços/grupos
- Posts fixados e destacados

### 💬 **Chat em Tempo Real**
- Chat geral da comunidade
- Status online dos usuários
- Mensagens com imagens e arquivos
- Notificações em tempo real

### 💼 **Oportunidades de Trabalho**
- Vagas categorizadas por área
- Filtros por nível e tipo de trabalho
- Sistema de favoritos
- Links externos para candidatura

### 🏆 **Sistema de Gamificação**
- Ranking de pontos
- Níveis e badges
- Leaderboard da comunidade
- Progresso visual

### 📅 **Eventos**
- Eventos online e presenciais
- Sistema de inscrições
- Calendário integrado
- Notificações automáticas

### 👥 **Membros**
- Perfis completos dos usuários
- Portfólio de projetos
- Links para redes sociais
- Busca e filtros avançados

### 🎯 **Espaços Organizados**
- Grupos por tecnologia/interesse
- Hierarquia de categorias
- Ícones personalizados
- Navegação intuitiva

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Arquitetura**: SPA (Single Page Application)
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **UI/UX**: Lucide Icons, Responsive Design
- **Deployment**: Vercel Ready

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd COMUNIDADE
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.local.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://eskyfehxzleqoamoapkh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. **Execute o projeto**
```bash
npm run dev
```

5. **Acesse a aplicação**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📱 Design Responsivo

A aplicação foi desenvolvida com foco em responsividade:

- **Mobile First**: Design otimizado para dispositivos móveis
- **Breakpoints**: Suporte para tablets e desktops
- **Touch Friendly**: Elementos otimizados para toque
- **Dark Mode**: Suporte completo ao modo escuro

## 🎨 Identidade Visual

A interface segue uma identidade visual moderna e profissional com:

- **Paleta de Cores**: Azul primário com tons complementares
- **Logo**: Ícone de foguete com gradiente azul
- **Tipografia**: Inter (moderna e legível)
- **Elementos**: Bordas arredondadas, sombras suaves, animações fluidas

### Cores Principais
- **Azul Primário**: `#0ea5e9` - Tecnologia e confiança
- **Cinza Secundário**: `#78716c` - Neutralidade e elegância
- **Verde Accent**: `#22c55e` - Sucesso e crescimento

## 🎨 Componentes Principais

### `Header`
- Navegação principal
- Menu de usuário
- Busca global
- Notificações

### `Sidebar`
- Navegação por espaços
- Links rápidos
- Status online
- Menu colapsível

### `PostCard`
- Exibição de posts
- Interações (like, comentário)
- Media player integrado
- Timestamps relativos

### `CreatePost`
- Editor de posts
- Upload de imagens
- Seleção de espaços
- Preview em tempo real

## 🔐 Autenticação

Sistema completo de autenticação via Supabase:

- **Login Social**: Google OAuth
- **Perfis**: Criação automática de perfis
- **Permissões**: Sistema de roles (user, moderator, admin)
- **Segurança**: RLS (Row Level Security) habilitado

## 📊 Banco de Dados

### Principais Tabelas

- `profiles`: Perfis dos usuários
- `posts`: Posts da comunidade
- `comments`: Comentários nos posts
- `likes`: Sistema de curtidas
- `spaces`: Espaços/grupos
- `chat_messages`: Mensagens do chat
- `job_opportunities`: Vagas de emprego
- `events`: Eventos da comunidade
- `user_points`: Sistema de pontuação

## 🌟 Funcionalidades Avançadas

### Real-time
- Chat ao vivo
- Notificações instantâneas
- Status online dos usuários
- Atualizações automáticas

### Gamificação
- Sistema de pontos
- Níveis baseados em atividade
- Badges e conquistas
- Ranking competitivo

### Media
- Upload de imagens
- Player de vídeo integrado
- Suporte a YouTube
- Compressão automática

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte seu repositório ao Vercel**
2. **Configure as variáveis de ambiente**
3. **Deploy automático a cada push**

### Outras Plataformas

A aplicação é compatível com:
- Netlify
- Railway
- AWS Amplify
- Heroku

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙋‍♂️ Suporte

Para suporte e dúvidas:
- Abra uma [issue](https://github.com/seu-usuario/comunidade-ia-code/issues)
- Entre em contato via [email](mailto:suporte@comunidadeiacode.com)
- Junte-se ao nosso [Discord](https://discord.gg/comunidadeiacode)

---

**Desenvolvido com ❤️ para a Comunidade IA Code**
