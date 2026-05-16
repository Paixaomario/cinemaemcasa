'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Navbar } from '@/components/layout/Navbar'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { getMovieDetails, getShowDetails } from '@/lib/tmdb'

interface ProfileItem {
  id: string | number;
  titulo: string | null;
  poster: string | null;
  backdrop?: string | null;
}

export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState<ProfileItem[]>([])
  const [history, setHistory] = useState<ProfileItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function loadData() {
      const sb = createClient()
      // 1. Buscar Favoritos
      const { data: favs } = await sb
        .from('favorites')
        .select('content_id')
        .eq('user_id', user.id)

      if (favs) {
        const hydratedFavs = await Promise.all(
          favs.map(async (f) => {
            const idStr = String(f.content_id)
            // Verifica se é um ID numérico puro (Cinema local)
            if (!isNaN(Number(idStr)) && !idStr.includes('-')) {
              const { data } = await sb.from('cinema').select('*').eq('id', f.content_id).single()
              return data
            }
            const [type, rawId] = idStr.split('-')
            try {
              const data = type === 'filme' ? await getMovieDetails(Number(rawId)) : await getShowDetails(Number(rawId))
              const item = data as TMDBMovie & TMDBShow;
              return {
                id: idStr,
                titulo: item.title || item.name,
                poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              }
            } catch { return null }
          })
        )
        setFavorites(hydratedFavs.filter(Boolean))
      }

      // 2. Buscar Histórico (view_progress)
      const { data: prog } = await sb
        .from('view_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (prog) {
        const hydratedHistory = await Promise.all(
          prog.map(async (p) => {
            const idStr = String(p.content_id)
            if (!idStr.includes('-')) {
              const { data } = await sb.from('cinema').select('*').eq('id', p.content_id).single()
              return { ...data, id: idStr }
            }
            const [type, rawId] = idStr.split('-')
            try {
              const data = type === 'filme' ? await getMovieDetails(Number(rawId)) : await getShowDetails(Number(rawId))
              const item = data as TMDBMovie & TMDBShow;
              return {
                id: idStr,
                titulo: item.title || item.name,
                poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              }
            } catch { return null }
          })
        )
        setHistory(hydratedHistory.filter(Boolean))
      }

      setLoading(false)
    }

    loadData()
  }, [user])

  if (authLoading || (user && loading)) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-[var(--gold-primary)] font-bold uppercase tracking-tighter text-2xl animate-pulse">Carregando Perfil Premium...</div>
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Navbar />
        <h1 className="text-3xl font-bold mb-4">Acesso Restrito</h1>
        <p className="text-gray-400 mb-8">Faça login para gerenciar seus favoritos e histórico.</p>
        <Link href="/login" className="px-10 py-4 bg-[var(--red-primary)] rounded-xl font-black uppercase transition-transform hover:scale-105">Entrar no PAIXÃOFLIX</Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <Navbar />

      {/* Marca d'água de fundo solicitada */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none scale-110">
        <Image 
          src="/bg-family.jpg" 
          alt="" 
          fill 
          className="object-cover blur-[2px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
      </div>

      <div className="relative z-10 pt-40 px-[var(--container-px)] pb-20 max-w-[2400px] mx-auto">
        <header className="mb-16 flex items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[var(--red-primary)] to-[var(--gold-primary)] p-1 shadow-2xl">
            <div className="w-full h-full rounded-[22px] bg-[#0B0B0F] flex items-center justify-center text-5xl">
              👤
            </div>
          </div>
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">Meu Perfil</h1>
            <p className="text-xl text-[var(--gold-primary)] font-bold mt-2 opacity-80">{user.email}</p>
          </div>
        </header>

        <div className="space-y-20">
          <Section title="Meus Favoritos" items={favorites} color="var(--gold-primary)" emptyMsg="Nenhum conteúdo favoritado ainda." />
          <Section title="Histórico de Reprodução" items={history} color="var(--red-primary)" emptyMsg="Você ainda não iniciou nenhum vídeo." />
        </div>
      </div>
    </main>
  )
}

function Section({ title, items, color, emptyMsg }: { title: string, items: ProfileItem[], color: string, emptyMsg: string }) {
  return (
    <section className="animate-in fade-in slide-in-from-left-4 duration-1000">
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4" style={{ color }}>
        <span className="w-2 h-10 rounded-full" style={{ backgroundColor: color }}></span>
        {title}
      </h2>
      
      {items.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white/5 border border-white/5 text-gray-500 font-medium italic">
          {emptyMsg}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
          {items.map(item => (
            <Link 
              key={item.id} 
              href={`/detalhes/${item.id}`}
              className="card-poster group"
            >
              {item.poster || item.backdrop ? (
                <Image 
                  src={item.poster || item.backdrop} 
                  alt={item.titulo} 
                  fill 
                  className="object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-5xl">🎬</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-xs font-black uppercase truncate text-white drop-shadow-md">{item.titulo}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}