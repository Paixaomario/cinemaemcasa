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
  type?: 'movie' | 'series';
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'movie' | 'series' | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [history, setHistory] = useState<string[]>([])
  const sb = createClient()

  useEffect(() => {
    // Limpa a URL ao carregar para não salvar busca anterior
    if (query) {
      router.replace('/search', { scroll: false })
    }
  }, [query, router])

  useEffect(() => {
    // Só busca se houver texto ou filtro de categoria
    if (!searchInput.trim() && !categoryFilter) {
      setResults([])
      return
    }

    async function doSearch() {
      setLoading(true)
      setResults([])

      try {
        let cinemaQuery = sb.from('cinema').select('*')
        let seriesQuery = sb.from('series').select('*')

        // Filtrar por texto de busca
        if (searchInput.trim()) {
          cinemaQuery = cinemaQuery.ilike('titulo', `%${searchInput}%`)
          seriesQuery = seriesQuery.ilike('titulo', `%${searchInput}%`)
        }

        // Filtrar por categoria/gênero
        if (categoryFilter) {
          cinemaQuery = cinemaQuery.eq('category', categoryFilter)
          seriesQuery = seriesQuery.eq('genero', categoryFilter)
        }

        // Buscar dados sem limite
        const { data: cinemaItems } = await cinemaQuery
        const { data: seriesItems } = await seriesQuery

        // Converter resultados para formato unificado
        const cinemaResults: SearchResult[] = (cinemaItems || []).map((item: any) => ({
          id: item.id,
          titulo: item.titulo,
          poster: item.poster || item.capa,
          backdrop: item.banner || item.backdrop,
          rating: item.rating || 0,
          year: item.ano || null,
          type: 'movie' as const
        }))

        const seriesResults: SearchResult[] = (seriesItems || []).map((item: any) => ({
          id: `serie-${item.id_n}`,
          titulo: item.titulo,
          poster: item.poster || item.capa,
          backdrop: item.banner,
          rating: item.rating || 0,
          year: item.ano || null,
          type: 'series' as const
        }))

        // Combinar e filtrar por tipo
        let combined: SearchResult[] = [...cinemaResults, ...seriesResults]

        if (filter === 'movie') {
          combined = combined.filter(r => r.type === 'movie')
        } else if (filter === 'series') {
          combined = combined.filter(r => r.type === 'series')
        }
        // Se filter === '' ou 'all', mostra tudo (sem filtro visual)

        setResults(combined)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(doSearch, 400)
    return () => clearTimeout(timer)
  }, [searchInput, categoryFilter, sb, filter])

  function addToHistory(text: string) {
    if (!history.includes(text)) {
      setHistory(prev => [text, ...prev].slice(0, 10))
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim()) {
      addToHistory(searchInput.trim())
    }
    // Não salva na URL - busca é apenas local
  }

  function clearInput() {
    setSearchInput('')
    setResults([])
  }

  function clearCategoryFilter() {
    setCategoryFilter('')
  }

  function clearHistory() {
    setHistory([])
  }

  function handleCategoryFilter(category: string) {
    // Se clicar no mesmo filtro, desmarca
    if (categoryFilter === category) {
      setCategoryFilter('')
    } else {
      setCategoryFilter(category)
    }
    setSearchInput('')
    // Não salva na URL - filtro é apenas local
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      <Navbar />
      
      <div className="pt-32 md:pt-40 px-[var(--container-px)] pb-20 max-w-[2400px] mx-auto">
        <header className="mb-8">
          <form onSubmit={handleSearch} className="mb-6 relative">
            <input
              id="searchInput"
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Digite para buscar..."
              className="w-full max-w-2xl px-6 py-4 pl-14 pr-14 bg-white/10 border-2 border-white/20 rounded-xl text-white text-xl focus:outline-none focus:border-[#D7A84B] focus:shadow-lg transition-all"
              autoFocus
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D7A84B] text-xl">🔍</span>
            {searchInput && (
              <button
                id="clearSearch"
                type="button"
                onClick={clearInput}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/30 border border-[#D7A84B]/30 text-[#D7A84B] hover:bg-[#D7A84B]/20 transition-all"
              >
                ✕
              </button>
            )}
          </form>

          {/* Filtro de categoria ativo */}
          {categoryFilter && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[#D7A84B] font-bold text-sm">Filtro: <span className="text-white">{categoryFilter}</span></span>
              <button
                onClick={clearCategoryFilter}
                className="text-[#FF7878] font-bold text-xs hover:text-[#FFB4B4] transition-all"
              >
                ✕ Limpar
              </button>
            </div>
          )}

          {/* Filtros */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {[
              { value: 'all', label: 'Tudo' },
              { value: 'movie', label: 'Filmes' },
              { value: 'series', label: 'Séries' }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-lg border font-bold text-sm transition-all ${
                  filter === f.value
                    ? 'bg-[#B40000]/22 border-[#B40000]/35 text-[#FF7878]'
                    : 'bg-black/38 border-[#D7A84B]/14 text-white/75 hover:border-[#D7A84B]/30'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sugestões */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['Ação', 'Comédia', 'Terror', 'Drama', 'Ficção'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => handleCategoryFilter(suggestion)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  categoryFilter === suggestion
                    ? 'bg-[#B40000]/22 border-[#B40000]/35 text-[#FF7878]'
                    : 'bg-black/30 border-[#D7A84B]/12 text-white/75 hover:border-[#D7A84B]/25'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Histórico */}
          {history.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[#D7A84B] font-bold text-xs uppercase tracking-wider">Recentes</h3>
                <button
                  id="clearHistory"
                  onClick={clearHistory}
                  className="text-[#FF7878] font-bold text-xs hover:text-[#FFB4B4] transition-all"
                >
                  Limpar
                </button>
              </div>
              <div id="historyList" className="flex flex-col gap-2">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchInput(item)}
                    className="flex justify-between items-center p-3 rounded-lg border border-[#D7A84B]/10 bg-black/35 hover:border-[#B40000]/18 transition-all text-left"
                  >
                    <span className="font-bold text-sm">{item}</span>
                    <span className="text-xs text-white/60">Pesquisa</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            {categoryFilter ? (
              <><span className="text-[#D7A84B]">{categoryFilter}</span></>
            ) : (
              <>Busca: <span className="text-[#D7A84B]">{query || '...'}</span></>
            )}
          </h1>
          <p id="resultCount" className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-xs">
            {loading ? 'Buscando no acervo...' : `${results.length} resultados encontrados`}
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
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[#B40000]/80 border border-[#B40000]/50 text-white text-[10px] font-black uppercase">
                  {item.type === 'movie' ? 'Filme' : 'Série'}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                  <p className="text-sm font-black uppercase truncate text-white">{item.titulo}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {item.rating > 0 && <span className="text-xs text-[#D7A84B] font-black">⭐ {item.rating.toFixed(1)}</span>}
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