'use client'

import { useAuth } from '@/components/layout/SupabaseProvider'
import { Navbar } from '@/components/layout/Navbar'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getMovieDetails, getShowDetails } from '@/lib/tmdb'
import Image from 'next/image'

export default function AssistirDespoisPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadWatchLater()
    } else {
      // Se após 2s não houver user, redireciona (evita flash no loading)
      const timer = setTimeout(() => { if(!user) router.push('/login') }, 2000)
      return () => clearTimeout(timer)
    }
  }, [user, router])

  async function loadWatchLater() {
    try {
      const sb = createClient()
      const { data: wlData } = await sb
        .from('watch_later')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (wlData && wlData.length > 0) {
        const hydrated = await Promise.all(
          wlData.map(async (p: any) => {
            const idStr = String(p.content_id)
            // Busca o item diretamente do banco local
            let item: any = null
            const { data: localData } = await sb.from('cinema').select('*').eq('id', idStr).single()
            item = localData

            // Se o item local tiver tmdb_id, enriquece com metadados do TMDB
            if (item && item.tmdb_id) {
              const type = item.type === 'movie' ? 'filme' : 'serie'
              const rawId = item.tmdb_id
              try {
                item = type === 'filme' ? await getMovieDetails(Number(rawId)) : await getShowDetails(Number(rawId))
              } catch { return null }
            }

            if (item) {
              return {
                ...item,
                id_route: idStr,
                display_title: item.titulo || item.title || item.name,
                display_poster: item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null)
              }
            }
            return null
          })
        )
        setItems(hydrated.filter(Boolean))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(contentId: string) {
    if (!user) return
    
    try {
      const sb = createClient()
      const { error } = await sb
        .from('watch_later')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId)

      if (!error) {
        setItems(prev => prev.filter(item => item.id_route !== contentId))
      }
    } catch (err) {
      console.error('Erro ao remover item:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-32 px-[var(--container-px)]">
          <div className="skeleton w-64 h-10 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      
      <div className="pt-32 pb-20 px-[var(--container-px)]">
        <header className="mb-10">
          <h1 className="text-section-title flex items-center gap-3">
            <span className="text-white opacity-50 text-2xl">🕒</span>
            Minha Lista
          </h1>
          <p className="text-metadata -mt-4">Conteúdos salvos para assistir mais tarde</p>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <div className="text-6xl mb-6 grayscale opacity-30">🕒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Sua lista está vazia</h2>
            <p className="text-gray-400 max-w-xs mb-8">
              Encontre filmes e séries interessantes e clique no ícone de relógio para salvá-los aqui.
            </p>
            <button 
              onClick={() => router.push('/')}
              className="btn btn-red px-10 py-4 uppercase tracking-widest text-sm font-black"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(var(--grid-cols, 5), 1fr)', 
            gap: 'var(--card-gap, 16px)' 
          }}>
            {items.map((item) => (
              <div 
                key={item.id_route}
                onClick={() => router.push(`/detalhes/${item.id_route}`)}
                className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:z-10 bg-[#1A1A1F] ring-1 ring-white/10 hover:ring-[var(--gold-primary)]/50"
              >
                {item.display_poster ? (
                  <Image 
                    src={item.display_poster} 
                    alt={item.display_title} 
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">🎬</div>
                )}
                
                {/* Overlay no Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  
                  {/* Botão de Remover */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id_route);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600/20 hover:bg-red-600 border border-red-500/50 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 z-20"
                    title="Remover da lista"
                  >
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>✕</span>
                  </button>

                  <p className="text-white font-bold text-sm leading-tight mb-2 line-clamp-2">
                    {item.display_title}
                  </p>
                  <div className="flex items-center gap-2">
                     <span className="text-[var(--gold-primary)] text-xs font-black">▶ ASSISTIR</span>
                  </div>
                </div>

                {/* Badge de Ano se disponível */}
                {item.year && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                    {item.year}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .text-section-title {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: clamp(24px, 4vw, 42px);
          color: var(--gold-primary);
          text-transform: uppercase;
          letter-spacing: -1px;
        }
        .skeleton {
          background: linear-gradient(90deg, #121212 25%, #1a1a1a 50%, #121212 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </main>
  )
}
