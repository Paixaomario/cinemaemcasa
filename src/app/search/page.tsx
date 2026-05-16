'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { IMG, TMDBItem, TMDBMovie, TMDBShow, getTitle } from '@/lib/tmdb'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SearchContent />
    </Suspense>
  )
}

interface SearchResult {
  id: string | number;
  titulo: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  year: number | null;
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(query)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const sb = createClient()

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    async function doSearch() {
      setLoading(true)
      try {
        // 1. Busca no Banco Local (tabela cinema)
        const { data: localItems } = await sb
          .from('cinema')
          .select('*')
          .ilike('titulo', `%${query}%`)
          .limit(20)

        // 2. Busca na TMDB API (Multi-search)
        const TMDB_KEY = 'c80875e533c3933c04f981d33190df09'
        const tmdbRes = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`
        ).then(r => r.json())

        const tmdbItems: SearchResult[] = tmdbRes.results
          ?.filter((i: TMDBItem) => i.media_type === 'movie' || i.media_type === 'tv')
          .map((item: TMDBItem) => ({
            id: `${item.media_type === 'tv' ? 'serie' : 'filme'}-${item.id}`,
            titulo: getTitle(item),
            poster: item.poster_path ? IMG.poster(item.poster_path, 'w500') : null,
            backdrop: item.backdrop_path ? IMG.backdrop(item.backdrop_path, 'w780') : null,
            rating: item.vote_average,
            year: item.media_type === 'movie'
              ? ((item as TMDBMovie).release_date ? new Date((item as TMDBMovie).release_date).getFullYear() : null)
              : ((item as TMDBShow).first_air_date ? new Date((item as TMDBShow).first_air_date).getFullYear() : null)
          })) || []

        // Combinar resultados sem duplicados
        const combined: SearchResult[] = [...((localItems as unknown as SearchResult[]) || [])]
        tmdbItems.forEach((tmdb) => {
            if (!combined.find(c => String(c.id) === String(tmdb.id))) {
                combined.push(tmdb)
            }
        })

        setResults(combined)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(doSearch, 400)
    return () => clearTimeout(timer)
  }, [query, sb])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      <Navbar />
      
      <div className="pt-32 md:pt-40 px-[var(--container-px)] pb-20 max-w-[2400px] mx-auto">
        <header className="mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Digite para buscar..."
              className="w-full max-w-2xl px-6 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-xl focus:outline-none focus:border-[var(--gold-primary)] focus:shadow-lg transition-all"
              autoFocus
            />
          </form>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            Busca: <span className="text-[var(--gold-primary)]">{query || '...'}</span>
          </h1>
          <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-xs">
            {loading ? 'Buscando no acervo...' : `${results.length} títulos localizados`}
          </p>
        </header>

        {results.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-20">
            <span className="text-8xl mb-4">🎬</span>
            <p className="text-2xl font-black uppercase">Nenhum conteúdo localizado</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(var(--grid-cols, 5), 1fr)', 
            gap: 'var(--card-gap, 24px)' 
          }}>
            {results.map((item) => (
              <Link key={item.id} href={`/detalhes/${item.id}`} className="card-poster group tv-focus">
                {item.poster || item.backdrop ? (
                  <Image 
                    src={item.poster || item.backdrop} 
                    alt={item.titulo || ''} 
                    fill 
                    className="object-cover transition-all duration-500 group-hover:scale-110" 
                    unoptimized 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl bg-white/5 rounded-2xl">🎬</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                  <p className="text-sm font-black uppercase truncate text-white">{item.titulo}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {item.rating > 0 && <span className="text-xs text-[var(--gold-primary)] font-black">⭐ {item.rating.toFixed(1)}</span>}
                    {item.year && <span className="text-xs text-gray-400 font-bold">{item.year}</span>}
                  </div>
                </div>
              </Link>
            ))}
            {loading && [1,2,3,4,5].map(i => <div key={i} className="skeleton aspect-[2/3] w-full" />)}
          </div>
        )}
      </div>
    </main>
  )
}