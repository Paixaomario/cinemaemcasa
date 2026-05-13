'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { VideoPlayer } from './detalhes/[id]/VideoPlayer'
import { Navbar } from '@/components/layout/Navbar'
import { getMovieDetails, getShowDetails } from '@/lib/tmdb'
import { HomeClient } from './HomeClient'
import { IMG } from '@/lib/tmdb'

export default function DetailsPage() {
  const params = useParams()
  const id = params?.id
  const searchParams = useSearchParams()
  const roomId = searchParams.get('room') || searchParams.get('party')
  const [content, setContent] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const sb = createClient()

  useEffect(() => {
    async function load() {
      // 1. Verificar sessão
      const { data: { session } } = await sb.auth.getSession()
      setUser(session?.user)

      // Só busca conteúdo se o ID existir (evita erro 400 no Supabase)
      if (!id) return

      // 2. Buscar conteúdo (Cinema ou TMDB)
      const { data } = await sb.from('cinema').select('*').eq('id', id).single()

      let contentData = data
      if (!data && String(id).includes('-')) {
        const [type, rawId] = String(id).split('-')
        try {
        const tmdb: any = type === 'filme' ? await getMovieDetails(Number(rawId)) : await getShowDetails(Number(rawId))
        contentData = {
          titulo: tmdb.title || tmdb.name || 'Sem título',
          url: '', // Trailer ou logic de stream
          backdrop: tmdb.backdrop_path
        }
        } catch (e) { console.warn("Modo Demo: TMDB offline") }
      }
      setContent(contentData)

      // 3. Verificar se é favorito (Garante que a tabela existe)
      if (session?.user && id) {
        const { data: fav } = await sb.from('favorites').select('*').eq('user_id', session.user.id).eq('content_id', String(id)).single()
        setIsFavorite(!!fav)
      }
    }
    load()
  }, [id, sb])

  const toggleFavorite = async () => {
    if (!user) return window.location.href = '/login'
    if (isFavorite) {
      await sb.from('favorites').delete().eq('user_id', user.id).eq('content_id', String(id))
      setIsFavorite(false)
    } else {
      const { error } = await sb.from('favorites').insert({ user_id: user.id, content_id: String(id) })
      if (!error) setIsFavorite(true)
    }
  }

  // Se não houver ID, renderiza a página inicial (Catálogo)
  if (!id) {
    return (
      <main className="min-h-screen bg-black">
        <Navbar />
        <HomeClient />
      </main>
    )
  }

  if (!content) return <div className="min-h-screen bg-black" />

  // Se houver um roomId na URL, abre o player IMEDIATAMENTE (padrão Join Party)
  if (roomId) {
    return (
      <VideoPlayer 
        src={content.url || ''} 
        title={content.titulo} 
        isGuest={true} 
        partyRoomId={roomId}
        backdrop={content.backdrop}
        onClose={() => window.location.href = '/'} 
      />
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      
      <div className="relative h-[70vh] w-full">
        <Image src={content.backdrop ? IMG.original(content.backdrop) : '/logo.png'} alt="" fill className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute bottom-20 left-10 max-w-2xl">
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-6">{content.titulo}</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.href += (window.location.href.includes('?') ? '&play=true' : '?play=true')}
              className="px-10 py-4 bg-white text-black font-black rounded-xl hover:scale-105 transition-all text-xl uppercase"
            >
              ▶ Assistir Agora
            </button>
            <button 
              onClick={toggleFavorite}
              className="px-6 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-xl"
            >
              {isFavorite ? '❤️ Salvo' : '🤍 Favoritar'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}