'use client'

import { useAuth } from '@/components/layout/SupabaseProvider'
import { Navbar } from '@/components/layout/Navbar'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase' // Keep createClient
import { getMovieDetails, getShowDetails, TMDBMovie, TMDBShow } from '@/lib/tmdb'
import { CinemaItem } from '../HomeClient'
import Image from 'next/image'

export default function AssistirDepoisPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<CinemaItem[]>([]) // Use CinemaItem directly
  const [loading, setLoading] = useState(true)

  const loadWatchLater = useCallback(async () => {
    try {
      const sb = createClient()
      const { data: wlData } = await sb
        .from('watch_later')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (wlData && wlData.length > 0) {
        const hydrated = await Promise.all(
          wlData.map(async (p) => {
            const idStr = String(p.content_id) // This should be a UUID from public.content
            let hydratedItem: TMDBMovie | TMDBShow | CinemaItem | null = null

            // Try to fetch from 'content' table first
            const { data: contentData } = await sb.from('content').select('*').eq('id', idStr).maybeSingle()
            if (contentData) {
              if (contentData.tmdb_id) {
                try {
                  hydratedItem = contentData.type === 'movie' ? await getMovieDetails(contentData.tmdb_id) : await getShowDetails(contentData.tmdb_id)
                } catch (e) {
                  console.warn(`Failed to fetch TMDB details for content_id: ${idStr}, tmdb_id: ${contentData.tmdb_id}`, e)
                }
              }
              if (!hydratedItem) {
                hydratedItem = { ...contentData, id: idStr, type: contentData.type === 'series' ? 'serie' : contentData.type } as CinemaItem
              }
            } else if (idStr.includes('-')) { // Fallback for 'type-id' format (legacy/direct TMDB)
              const [type, rawId] = idStr.split('-')
              try {
                hydratedItem = type === 'filme' ? await getMovieDetails(Number(rawId)) : await getShowDetails(Number(rawId))
              } catch (e) {
                console.warn(`Failed to fetch TMDB details for idStr: ${idStr}`, e)
              }
            } else {
              // Fallback for old 'cinema' table IDs (numeric or non-UUID string without hyphen)
              const { data: cinemaData } = await sb.from('cinema').select('*').eq('id', p.content_id).maybeSingle()
              if (cinemaData) {
                if (cinemaData.tmdb_id) {
                  try {
                    hydratedItem = cinemaData.type === 'movie' ? await getMovieDetails(cinemaData.tmdb_id) : await getShowDetails(cinemaData.tmdb_id)
                  } catch (e) {
                    console.warn(`Failed to fetch TMDB details for cinema_id: ${idStr}, tmdb_id: ${cinemaData.tmdb_id}`, e)
                  }
                }
                if (!hydratedItem) {
                  hydratedItem = { ...cinemaData, id: idStr, type: cinemaData.type === 'series' ? 'serie' : cinemaData.type } as CinemaItem
                }
              }
            }

            if (!hydratedItem) return null

            // Map to CinemaItem structure for consistent display
            const finalItem = {
              ...hydratedItem,
              id: idStr, // Use the original content_id for routing/keys
              titulo: (hydratedItem as CinemaItem).titulo || (hydratedItem as TMDBMovie).title || (hydratedItem as TMDBShow).name || 'Sem título',
              poster: (hydratedItem as CinemaItem).poster || ((hydratedItem as TMDBMovie).poster_path ? `https://image.tmdb.org/t/p/w500${(hydratedItem as TMDBMovie).poster_path}` : null),
              backdrop: (hydratedItem as CinemaItem).backdrop || ((hydratedItem as TMDBMovie).backdrop_path ? `https://image.tmdb.org/t/p/w780${(hydratedItem as TMDBMovie).backdrop_path}` : null),
              type: (hydratedItem as CinemaItem).type || ((hydratedItem as TMDBMovie).media_type === 'movie' ? 'movie' : ((hydratedItem as TMDBShow).media_type === 'tv' ? 'serie' : null)),
              // Add other relevant fields from TMDB or local DB
            } as CinemaItem;

            // Ensure poster_path and backdrop_path are present for Image component if TMDB item
            if ((hydratedItem as TMDBMovie).poster_path && !finalItem.poster) {
              finalItem.poster = `https://image.tmdb.org/t/p/w500${(hydratedItem as TMDBMovie).poster_path}`;
            }
            if ((hydratedItem as TMDBMovie).backdrop_path && !finalItem.backdrop) {
              finalItem.backdrop = `https://image.tmdb.org/t/p/w780${(hydratedItem as TMDBMovie).backdrop_path}`;
            }

            return finalItem;
          })
        )
        setItems(hydrated.filter(Boolean) as CinemaItem[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadWatchLater()
    } else if (!loading) { // Only redirect if not loading and user is null
      router.push('/login')
    }
  }, [user, router, loadWatchLater])

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
        setItems(prev => prev.filter(item => item.id !== contentId)) // Use item.id
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(item.type === 'serie' || item.type === 'tv' ? `/series/${item.id}` : `/detalhes/${item.id}`)}
                className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:z-10 bg-[#1A1A1F] ring-1 ring-white/10 hover:ring-[var(--gold-primary)]/50 shadow-2xl shadow-black/80"
              >
                {item.poster ? (
                  <Image 
                    src={item.poster} 
                    alt={item.titulo || ''} 
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
                      handleRemove(item.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-600/20 hover:bg-red-600 border border-red-500/50 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 z-20"
                    title="Remover da lista"
                  >
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>✕</span>
                  </button>

                  <p className="text-white font-bold text-sm leading-tight mb-2 line-clamp-2"> {/* Use item.titulo */}
                    {item.titulo}
                  </p>
                  <div className="flex items-center gap-2">
                     <span className="text-brand-cyan text-xs font-black">▶ ASSISTIR</span>
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
