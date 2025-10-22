import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import PostPageClient from './PostPageClient'

// Gerar metadados dinâmicos para cada post
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // Buscar dados do post para os metadados
    const { data: postData, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(full_name, username),
        space:spaces(name)
      `)
      .eq('id', params.id)
      .single()

    if (error || !postData) {
      return {
        title: 'Post não encontrado | Vibe Coding',
        description: 'Este post não foi encontrado.',
      }
    }

    // Preparar título e descrição
    const authorName = postData.author?.full_name || postData.author?.username || 'Usuário'
    const title = postData.title || `Post de ${authorName}`
    const description = postData.content.substring(0, 155) + (postData.content.length > 155 ? '...' : '')
    const spaceName = postData.space?.name || 'Vibe Coding'

    // URL do post
    const postUrl = `https://www.comunidadevibecoding.com/post/${params.id}`

    // Imagem para compartilhamento (usar imagem do post ou logo padrão)
    const imageUrl = postData.image_url || 'https://www.comunidadevibecoding.com/vibe-coding-community.png'

    return {
      title: `${title} | ${spaceName}`,
      description: description,
      openGraph: {
        type: 'article',
        url: postUrl,
        title: title,
        description: description,
        siteName: 'Vibe Coding',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [imageUrl],
      },
    }
  } catch (error) {
    console.error('Erro ao gerar metadados:', error)
    return {
      title: 'Vibe Coding - Comunidade',
      description: 'Uma comunidade moderna para desenvolvedores apaixonados por IA e programação',
    }
  }
}

export default function PostPage({ params }: { params: { id: string } }) {
  return <PostPageClient id={params.id} />
}
