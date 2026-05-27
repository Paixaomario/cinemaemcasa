'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { TMDBMovie, TMDBShow, TMDB_IMG } from '@/lib/tmdb'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'

// Definir SpeechRecognition globalmente para evitar erros de tipo
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

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
  const [lastQuery, setLastQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)
  const [isSpeechSupported, setIsSpeechSupported] = useState(false)

  // Habilita navegação por controle remoto
  useSpatialNavigation()

  useEffect(() => {
    // Verifica suporte a voz apenas no cliente para evitar erros de hidratação
    setIsSpeechSupported(typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window))
  }, [])

  useEffect(() => {
    // Limpa a URL ao carregar para não salvar busca anterior
    if (query) {
      router.replace('/search', { scroll: false })
    }
  }, [query, router])

  // Lógica de busca por voz
  const startVoiceSearch = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setRecognitionError('Seu navegador não suporta reconhecimento de voz.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false // Para parar após a primeira frase
    recognition.lang = 'pt-BR' // Define o idioma para português do Brasil
    recognition.interimResults = false // Retorna apenas resultados finais

    recognition.onstart = () => {
      setIsListening(true)
      setRecognitionError(null)
      setSearchInput('') // Limpa o input ao iniciar a escuta
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setSearchInput(transcript)
      setIsListening(false)
      // Dispara a busca automaticamente após o reconhecimento
      // A busca será acionada pelo useEffect que monitora searchInput
    }

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz:', event.error)
      setRecognitionError(`Erro no reconhecimento de voz: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const stopVoiceSearch = () => { /* A API para automaticamente com continuous=false */ }

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

      <div className="pt-32 md:pt-40 px-4 md:px-8 lg:px-16 pb-20 max-w-[2400px] mx-auto">
        <header className="mb-8">
          <form onSubmit={handleSearch} className="mb-6 relative">
            <input
              id="searchInput"
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              tabIndex={0}
              placeholder="Digite para buscar..."
              className="w-full max-w-2xl px-6 py-4 pl-14 pr-14 bg-white/10 border-2 border-white/20 rounded-[20px] text-white text-xl focus:outline-none focus:border-brand-cyan focus:shadow-[0_0_20px_rgba(0,173,239,0.3)] transition-all font-sans"
              autoFocus
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-cyan text-xl">🔍</span>
            {searchInput && (
              <button
                id="clearSearch"
                type="button"
                onClick={clearInput}
                tabIndex={0}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[20px] bg-black/30 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20 transition-all"
              >
                ✕
              </button>
            )}
            {/* Botão de busca por voz */}
            {isSpeechSupported && (
              <button
                type="button"
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                tabIndex={0}
                className={`absolute right-14 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[20px] flex items-center justify-center transition-all ${
                  isListening ? 'bg-red-500/30 text-red-400 animate-pulse' : 'bg-black/30 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/20'
                }`}
                title={isListening ? 'Parar de ouvir' : 'Buscar por voz'}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
            )}
          </form>

          {/* Filtro de categoria ativo */}
          {categoryFilter && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-brand-cyan font-bold text-sm">Filtro: <span className="text-white">{categoryFilter}</span></span>
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
                tabIndex={0}
                onClick={() => {
                  if (filter === f.value) {
                    setFilter('')
                  } else {
                    setFilter(f.value as any)
                  }
                }}
                className={`px-6 py-2 rounded-[20px] border font-montserrat font-black uppercase text-xs tracking-widest transition-all ${
                  filter === f.value
                    ? 'bg-brand-cyan text-black border-brand-cyan shadow-[0_0_15px_rgba(0,173,239,0.4)]'
                    : 'bg-black/38 border-white/10 text-white/75 hover:border-brand-cyan/50'
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
                tabIndex={0}
                className={`px-4 py-2 rounded-[20px] border font-montserrat font-bold text-[10px] uppercase tracking-wider transition-all ${
                  categoryFilter === suggestion
                    ? 'bg-brand-cyan text-black border-brand-cyan'
                    : 'bg-black/30 border-white/10 text-white/75 hover:border-brand-cyan/50'
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
                <h3 className="text-brand-cyan font-black text-[10px] uppercase tracking-[0.2em]">Recentes</h3>
                <button
                  id="clearHistory"
                  onClick={clearHistory}
                  tabIndex={0}
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
                    tabIndex={0}
                    className="flex justify-between items-center p-4 rounded-[20px] border border-white/5 bg-white/5 hover:border-brand-cyan/30 transition-all text-left group"
                  >
                    <span className="font-bold text-sm group-hover:text-brand-cyan transition-colors">{item}</span>
                    <span className="text-xs text-white/60">Pesquisa</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            {categoryFilter ? (
              <><span className="text-brand-cyan">{categoryFilter}</span></>
            ) : (
              <>Busca: <span className="text-brand-cyan">{query || '...'}</span></>
            )}
          </h1>
          <p id="resultCount" className="text-neutral-500 mt-2 font-black uppercase tracking-[0.2em] text-[10px]">
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
            {results.map((item) => {
              const rawPath = item.poster || item.backdrop;
              // Resolvemos a URL da imagem e garantimos que o TypeScript entenda que não é nula
              const imageUrl = rawPath ? TMDB_IMG.backdrop(rawPath) : null;
              
              return (
              <Link 
                key={item.id} 
                href={item.type === 'series' ? `/series/${item.id}` : `/detalhes/${item.id}`} 
                tabIndex={0}
                className="group relative aspect-[2/3] w-full rounded-xl overflow-hidden transition-all duration-300 hover:scale-110 focus:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-cyan shadow-2xl">
                {imageUrl ? (
                  <Image 
                    src={imageUrl} 
                    alt={item.titulo || ''} 
                    fill 
                    className="object-cover transition-all duration-500 group-hover:scale-110" 
                    unoptimized 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl bg-white/5 rounded-2xl">🎬</div>
                )}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
                  {item.type === 'movie' ? 'Filme' : 'Série'}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                  <p className="text-sm font-black uppercase truncate text-white">{item.titulo}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {item.rating > 0 && <span className="text-xs text-brand-cyan font-black">⭐ {item.rating.toFixed(1)}</span>}
                    {item.year && <span className="text-xs text-neutral-400 font-bold">{item.year}</span>}
                  </div>
                </div>
              </Link>
            )})}
            {loading && [1,2,3,4,5].map(i => <div key={i} className="skeleton aspect-[2/3] w-full" />)}
          </div>
        )}
      </div>
    </main>
  )
}