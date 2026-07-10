'use client'

import { useAuth } from '@/components/layout/SupabaseProvider'
import { Navbar } from '@/components/layout/Navbar'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase' // Keep createClient
import { CinemaItem } from '../HomeClient'
import { hydrateCinemaItem } from '@/lib/content'
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
          wlData.map(p => hydrateCinemaItem(sb, p.content_id))
        )
        setItems(hydrated.filter(Boolean) as CinemaItem[])
      } else { setItems([]) }
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
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-40 px-10">
          <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-xl" />)}
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
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[var(--gold-primary)] drop-shadow-[0_0_10px_rgba(255,215,0,0.2)] flex items-center gap-4">
            <span>🕒</span> Minha Lista
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-2">Conteúdos salvos para assistir mais tarde</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(item.type === 'serie' || item.type === 'tv' ? `/series/${item.id}` : `/detalhes/${item.id}`)}
                className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:z-50 shadow-2xl shadow-black"
              >
                {item.poster ? (
                  <Image 
                    src={item.poster} 
                    alt={item.titulo || ''} 
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl bg-neutral-900">🎬</div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-600/20 hover:bg-red-600 border border-red-500/50 flex items-center justify-center text-white transition-all transform hover:scale-110"
                    title="Remover"
                  >
                    ✕
                  </button>

                  <p className="text-white font-black uppercase text-sm leading-tight mb-2 line-clamp-2">{item.titulo}</p>
                  <span className="text-brand-cyan text-[10px] font-black tracking-widest">▶ ASSISTIR</span>
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
