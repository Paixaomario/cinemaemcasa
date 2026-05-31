'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { TMDBMovie, TMDBShow, TMDB_IMG } from '@/lib/tmdb'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'
import { SearchSuggestions } from '@/components/SearchSuggestions'
import { VoiceSearchButton } from '@/components/VoiceSearchButton'
import { trackSearch } from '@/lib/searchSuggestions'

// Definir SpeechRecognition globalmente para evitar erros de tipo
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0B0F]" />}>
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
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [highlightedSuggestion, setHighlightedSuggestion] = useState<any>(null)
  const sb = createClient()
  const [lastQuery, setLastQuery] = useState('')
  const [isWebOS, setIsWebOS] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Habilita navegação por controle remoto
  useSpatialNavigation()
  
  // Detectar se é WebOS (usar user agent simples)
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    setIsWebOS(ua.includes('webos') || ua.includes('lg'))
  }, [])

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('searchHistory')
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {
      // Ignorar erros de localStorage
    }
  }, [])

  // Salvar histórico quando muda
  useEffect(() => {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(history))
    } catch {
      // Ignorar erros de localStorage
    }
  }, [history])

  useEffect(() => {
    // Limpa a URL ao carregar para não salvar busca anterior
    if (query) {
      router.replace('/search', { scroll: false })
    }
  }, [query, router])

  // Handler para entrada de voz
  const handleVoiceInput = (text: string, confidence: number) => {
    setSearchInput(text.trim())
    setVoiceError(null)
    // Focus no input para facilitar edição
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleVoiceError = (error: string) => {
    setVoiceError(error)
    console.error('Voice search error:', error)
  }

  // Effect para executar busca quando input muda
  useEffect(() => {
    // Só busca se houver texto ou filtro de categoria
    if (!searchInput.trim() && !categoryFilter) {
      setResults([])
      return
    }

    if (searchInput === lastQuery && !categoryFilter) return

    async function doSearch() {
      setLoading(true)
      setLastQuery(searchInput)
      
      try {
        let cinemaQuery = sb.from('cinema').select('*')
        let seriesQuery = sb.from('series').select('*')

        // Filtrar por texto de busca (case insensitive)
        if (searchInput.trim()) {
          cinemaQuery = cinemaQuery.ilike('titulo', `%${searchInput.trim()}%`)
          seriesQuery = seriesQuery.ilike('titulo', `%${searchInput.trim()}%`)
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

  // Rastrear buscas no analytics quando resultados aparecem
  useEffect(() => {
    if (results.length > 0 && searchInput.trim()) {
      trackSearch(searchInput.trim(), results.length).catch(() => {
        // Falha silenciosa em analytics
      })
    }
  }, [results.length, searchInput])

  function addToHistory(text: string) {
    if (!history.includes(text) && text.trim()) {
      setHistory(prev => [text, ...prev].slice(0, 20))
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchInput.trim()) {
      addToHistory(searchInput.trim())
    }
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
    if (categoryFilter === category) {
      setCategoryFilter('')
    } else {
      setCategoryFilter(category)
    }
    setSearchInput('')
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] text-white">
      <Navbar />

      <div className="pt-32 md:pt-40 px-4 md:px-8 lg:px-16 pb-20 max-w-[2400px] mx-auto">
        <header className="mb-8">
          {/* Mensagem de erro de voz */}
          {voiceError && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {voiceError}
              <button
                onClick={() => setVoiceError(null)}
                className="float-right font-bold hover:text-red-200"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input de busca com voz e sugestões */}
          <form onSubmit={(e) => e.preventDefault()} className="mb-6 relative">
            <div className="flex items-center gap-2 relative">
              {/* Input principal */}
              <div className="flex-1 relative">
                <input
                  ref={searchInputRef}
                  id="searchInput"
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  tabIndex={0}
                  placeholder="Buscar filmes, séries, genêros..."
                  className="w-full px-6 py-4 pl-14 pr-14 bg-white/10 border-2 border-white/20 rounded-[20px] text-white text-lg focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,173,239,0.3)] transition-all font-sans"
                  autoFocus
                  autoComplete="off"
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-cyan text-xl">🔍</span>

                {/* Botão limpar input */}
                {searchInput && (
                  <button
                    id="clearSearch"
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      setResults([])
                    }}
                    tabIndex={0}
                    className="absolute right-16 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[20px] bg-black/30 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20 transition-all flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}

                {/* Botão de voz aprimorado */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <VoiceSearchButton
                    onVoiceInput={handleVoiceInput}
                    onError={handleVoiceError}
                    isWebOS={isWebOS}
                  />
                </div>
              </div>
            </div>

            {/* Componente de sugestões em tempo real */}
            {searchInput.trim() && (
              <SearchSuggestions
                input={searchInput}
                searchHistory={history}
                onSuggestionSelect={(text) => {
                  setSearchInput(text)
                  addToHistory(text)
                  searchInputRef.current?.focus()
                }}
                onSuggestionHighlight={setHighlightedSuggestion}
                isWebOS={isWebOS}
                maxVisible={8}
              />
            )}
          </form>

          {/* Filtros principais */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {[
              { value: 'all', label: '✨ Tudo', icon: 'Tudo' },
              { value: 'movie', label: '🎬 Filmes', icon: 'Filmes' },
              { value: 'series', label: '📺 Séries', icon: 'Séries' }
            ].map(f => (
              <button
                key={f.value}
                tabIndex={0}
                onClick={() => setFilter(filter === f.value ? '' : (f.value as any))}
                className={`px-6 py-3 rounded-[20px] border font-montserrat font-black uppercase text-xs tracking-widest transition-all ${
                  filter === f.value
                    ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_15px_rgba(0,173,239,0.4)]'
                    : 'bg-black/38 border-white/10 text-white/75 hover:border-brand-cyan/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtros por gênero/categoria */}
          <div className="mb-6">
            <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-3">Gêneros</p>
            <div className="flex gap-2 flex-wrap">
              {['Ação', 'Comédia', 'Terror', 'Drama', 'Ficção', 'Romance', 'Animação', 'Documentário'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleCategoryFilter(suggestion)}
                  tabIndex={0}
                  className={`px-4 py-2 rounded-[20px] border font-montserrat font-bold text-[10px] uppercase tracking-wider transition-all ${
                    categoryFilter === suggestion
                      ? 'bg-brand-cyan text-black border-brand-cyan'
                      : 'bg-black/30 border-white/10 text-white/75 hover:border-brand-cyan/50 hover:text-white'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Histórico de buscas */}
          {history.length > 0 && !searchInput.trim() && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-brand-cyan font-black text-[10px] uppercase tracking-[0.2em]">🕐 Buscas Recentes</h3>
                <button
                  id="clearHistory"
                  onClick={clearHistory}
                  tabIndex={0}
                  className="text-[#FF7878] font-bold text-xs hover:text-[#FFB4B4] transition-all"
                >
                  Limpar tudo
                </button>
              </div>
              <div id="historyList" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {history.slice(0, 10).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchInput(item)
                      searchInputRef.current?.focus()
                    }}
                    tabIndex={0}
                    className="p-3 rounded-lg border border-white/10 bg-white/5 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-all text-left group"
                  >
                    <p className="font-bold text-sm text-white group-hover:text-brand-cyan transition-colors truncate">
                      🔍 {item}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Título com contador */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
              {categoryFilter ? (
                <>
                  <span className="text-brand-cyan">{categoryFilter}</span>
                </>
              ) : (
                <>
                  {searchInput.trim() ? (
                    <>Resultados: <span className="text-brand-cyan">{searchInput}</span></>
                  ) : (
                    <>Explorar <span className="text-brand-cyan">Conteúdo</span></>
                  )}
                </>
              )}
            </h1>
            <p id="resultCount" className="text-neutral-500 mt-3 font-black uppercase tracking-[0.2em] text-[10px]">
              {loading ? '⏳ Buscando no acervo...' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
            </p>
            {highlightedSuggestion && (
              <p className="text-brand-cyan text-xs mt-2">
                💡 Sugestão: {highlightedSuggestion.text}
              </p>
            )}
          </div>
        </header>

        {results.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-40">
            <span className="text-8xl mb-4">🎬</span>
            <p className="text-2xl font-black uppercase">
              {searchInput.trim() || categoryFilter 
                ? 'Nenhum conteúdo encontrado' 
                : 'Comece a buscar'}
            </p>
            <p className="text-white/40 text-sm mt-2 max-w-sm text-center">
              {searchInput.trim() || categoryFilter
                ? 'Tente ajustar sua busca ou filtros'
                : 'Use a barra de pesquisa ou filtros de gênero acima'}
            </p>
          </div>
        ) : (
          <>
            {/* Grade de resultados responsiva */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-6">
              {results.map((item) => {
                const rawPath = item.poster || item.backdrop
                const imageUrl = rawPath ? TMDB_IMG.backdrop(rawPath) : null

                return (
                  <Link
                    key={item.id}
                    href={item.type === 'series' ? `/series/${item.id}` : `/detalhes/${item.id}`}
                    tabIndex={0}
                    className="group relative aspect-[2/3] w-full rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-cyan shadow-xl hover:shadow-2xl"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.titulo || ''}
                        fill
                        className="object-cover transition-all duration-500 group-hover:scale-110"
                        unoptimized
                        priority={false}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl bg-gradient-to-br from-white/10 to-white/5 rounded-lg">
                        🎬
                      </div>
                    )}

                    {/* Overlay com informações */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                      <p className="text-sm font-black uppercase truncate text-white line-clamp-2">
                        {item.titulo}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {item.rating > 0 && (
                          <span className="text-xs text-brand-cyan font-black">
                            ⭐ {item.rating.toFixed(1)}
                          </span>
                        )}
                        {item.year && (
                          <span className="text-xs text-neutral-400 font-bold">
                            {item.year}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge do tipo */}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-white text-[9px] font-black uppercase tracking-widest">
                      {item.type === 'movie' ? 'Filme' : 'Série'}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mt-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className="aspect-[2/3] w-full bg-white/5 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}