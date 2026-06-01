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
          {/* Input de busca com voz e sugestões */}
          <form onSubmit={(e) => e.preventDefault()} className="relative max-w-4xl mx-auto">
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
                  placeholder="Digite aqui para pesquisar..."
                  className="w-full px-8 py-6 pl-16 pr-28 bg-white/5 border-2 border-white/10 rounded-[30px] text-white text-2xl focus:outline-none focus:border-brand-cyan focus:bg-white/10 focus:shadow-[0_0_40px_rgba(0,173,239,0.2)] transition-all font-sans"
                  autoFocus
                  autoComplete="off"
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-cyan text-3xl">🔍</span>

                {/* Botão de voz aprimorado restaurado */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <VoiceSearchButton
                    onVoiceInput={handleVoiceInput}
                    onError={handleVoiceError}
                    isWebOS={isWebOS}
                  />
                </div>
              </div>
            </div>
          </form>
        </header>
      </div>
    </main>
  )
}