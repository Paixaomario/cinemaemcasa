'use client'

import { useAuth } from '@/components/layout/SupabaseProvider'
import { Navbar } from '@/components/layout/Navbar'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getMovieDetails, getShowDetails, TMDBMovie, TMDBShow } from '@/lib/tmdb'
import { CinemaItem } from '../HomeClient'
import Image from 'next/image'

export default function FavoritosPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<CinemaItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadFavorites = useCallback(async () => {
    try {
      const sb = createClient()
      const { data: favData } = await sb
        .from('favorites')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (favData && favData.length > 0) {
        const hydrated = await Promise.all(
          favData.map(async (p) => {
            const idStr = String(p.content_id)
            let hydratedItem: TMDBMovie | TMDBShow | CinemaItem | null = null
            let itemType: 'movie' | 'serie' = 'movie'

            // 1. Tenta buscar na tabela unificada content (UUID)
            const { data: contentData } = await sb.from('content').select('*').eq('id', idStr).single()
            
            if (contentData) {
              itemType = contentData.type === 'movie' ? 'movie' : 'serie'
              if (contentData.tmdb_id) {
                try {
                  hydratedItem = itemType === 'movie' 
                    ? await getMovieDetails(contentData.tmdb_id) 
                    : await getShowDetails(contentData.tmdb_id)
                } catch (e) {
                  console.warn(`Erro TMDB (content): ${idStr}`, e)
                }
              }
              if (!hydratedItem) {
                hydratedItem = { ...contentData, id: idStr, type: itemType } as CinemaItem
              }
            } 
            // 2. Fallback para busca direta em cinema/series se for BigInt
            else {
              const { data: cinemaData } = await sb.from('cinema').select('*').eq('id', p.content_id).single()
              if (cinemaData) {
                itemType = 'movie'
                if (cinemaData.tmdb_id) {
                  try {
                    hydratedItem = cinemaData.type === 'movie' ? await getMovieDetails(cinemaData.tmdb_id) : await getShowDetails(cinemaData.tmdb_id)
                  } catch (e) {
                    console.warn(`Erro TMDB (cinema fallback): ${p.content_id}`, e)
                  }
                }
                if (!hydratedItem) hydratedItem = { ...cinemaData, id: String(cinemaData.id), type: 'movie' } as CinemaItem
              } else {
                const { data: seriesData } = await sb.from('series').select('*').eq('id_n', p.content_id).single()
                if (seriesData) {
                  itemType = 'serie'
                  if (seriesData.tmdb_id) {
                    try {
                      hydratedItem = await getShowDetails(seriesData.tmdb_id)
                    } catch (e) {
                      console.warn(`Erro TMDB (series fallback): ${p.content_id}`, e)
                    }
                  }
                  if (!hydratedItem) hydratedItem = { ...seriesData, id: String(seriesData.id_n), type: 'serie' } as any
                }
              }
            }

            if (!hydratedItem) return null

            const finalItem = {
              ...hydratedItem,
              id: (hydratedItem as any).id_n ? String((hydratedItem as any).id_n) : String((hydratedItem as any).id),
              titulo: (hydratedItem as CinemaItem).titulo || (hydratedItem as TMDBMovie).title || (hydratedItem as TMDBShow).name || 'Sem título',
              poster: (hydratedItem as CinemaItem).poster || ((hydratedItem as TMDBMovie).poster_path ? `https://image.tmdb.org/t/p/w500${(hydratedItem as TMDBMovie).poster_path}` : null),
              type: itemType,
            } as CinemaItem;

            return finalItem;
          })
        )
        setItems(hydrated.filter(Boolean) as CinemaItem[])
      } else {
        setItems([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFavorites()
    } else if (!loading) {
      router.push('/login')
    }
  }, [user, router, loadFavorites, loading])

  async function handleRemove(contentId: string) {
    if (!user) return
    try {
      const sb = createClient()
      const { error } = await sb
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId)

      if (!error) {
        setItems(prev => prev.filter(item => item.id !== contentId))
      }
    } catch (err) {
      console.error('Erro ao remover favorito:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-40 px-10">
          <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-40 pb-20 px-10 max-w-[2400px] mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-brand-cyan drop-shadow-[0_0_10px_rgba(0,173,239,0.3)]">
            ❤️ Meus Favoritos
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-2">Sua coleção pessoal de sucessos</p>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
            <span className="text-8xl mb-6">🎬</span>
            <h2 className="text-2xl font-black uppercase tracking-widest">Sua lista está vazia</h2>
            <p className="mt-4 max-w-sm">Adicione filmes e séries aos seus favoritos para que eles apareçam aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(item.type === 'serie' || item.type === 'tv' ? `/series/${item.id}` : `/detalhes/${item.id}`)}
                className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:z-50 shadow-2xl shadow-black"
              >
                {item.poster ? (
                  <Image src={item.poster} alt={item.titulo || ''} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl bg-neutral-900">🎬</div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-600/20 hover:bg-red-600 border border-red-500/50 flex items-center justify-center text-white transition-all transform hover:scale-110"
                    title="Remover"
                  >
                    ✕
                  </button>
                  <p className="text-white font-black uppercase text-sm leading-tight mb-2 line-clamp-2">{item.titulo}</p>
                  <span className="text-[var(--gold-primary)] text-[10px] font-black tracking-widest">▶ ASSISTIR</span>
                </div>

                {item.year && (
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
                    {item.year}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}