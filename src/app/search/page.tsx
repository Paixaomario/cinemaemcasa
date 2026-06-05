'use client'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/layout/SupabaseProvider'
import { ContentCard } from '@/components/ui/ContentCard'
import { Search, Mic, X, Trash2, History, Sparkles, ChevronDown, Flame } from 'lucide-react'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'
import Image from 'next/image'
import { 
  getPersonalizedRecommendations, 
  getTrendingContent,
  getDisplayedCache,
  addBatchToDisplayedCache
} from '@/lib/homeContentManager'
import type { SuggestionItem } from '@/lib/searchSuggestions'

export default function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [popularSearches, setPopularSearches] = useState<any[]>([])
  const [liveSuggestions, setLiveSuggestions] = useState<SuggestionItem[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [userRegion, setUserRegion] = useState('BR')
  const [selectedArtist, setSelectedArtist] = useState<string>('') // Novo estado para artista selecionado
  const [regionName, setRegionName] = useState('Brasil')
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const sb = createClient()

  useSpatialNavigation()

  // Detecção de Localização com Fallback
  useEffect(() => {
    async function detectLocation() {
      try {
        const { getLocationWithFallback, getRegionDisplay } = await import('@/lib/geolocation')
        const loc = await getLocationWithFallback()
        if (loc && loc.region) {
          setUserRegion(loc.region)
          setRegionName(getRegionDisplay(loc.region))
        }
      } catch (err) {
        console.info("Usando região padrão (BR) devido a restrições de geolocalização.")
      }
    }
    detectLocation()
  }, [])

  // 1. Carregar Sugestões Iniciais (6 itens relevantes) e Histórico
  const loadInitialData = useCallback(async () => {
    try {
      // 1.1 Carregar opções de filtro
      const [genresRes, yearsRes, typesRes] = await Promise.all([
        sb.from('search_catalog').select('genero'),
        sb.from('search_catalog').select('ano'),
        sb.from('search_catalog').select('tipo'),
      ]);

      const cleanRegex = /[\[\]"']/g;
      const cleanValue = (val: any) => String(val || '').replace(cleanRegex, '').trim();

      // 1.2 Recomendações Inteligentes e Dinâmicas (Estilo Streaming Premium)
      const displayedIds = getDisplayedCache();
      let recs: any[] = [];
      
      if (user) {
        recs = await getPersonalizedRecommendations(user.id, 10, displayedIds, false);
      } else {
        recs = await getTrendingContent(10, false);
      }
      
      if (recs?.length) {
        setSuggestions(recs);
        addBatchToDisplayedCache(recs.map(r => String(r.id)));
      }

      if (genresRes.data) {
        const genresSet = new Set<string>();
        genresRes.data.forEach((f: any) => {
          if (f.genero) cleanValue(f.genero).split(',').forEach(g => { const s = g.trim(); if(s.length > 1) genresSet.add(s); });
        });
        setAvailableGenres(Array.from(genresSet).sort());
      }

      if (yearsRes.data) {
        const yearsSet = new Set<string>();
        yearsRes.data.forEach((f: any) => { const y = cleanValue(f.ano); if (y.length === 4) yearsSet.add(y); });
        setAvailableYears(Array.from(yearsSet).sort((a, b) => Number(b) - Number(a)));
      }

      if (typesRes.data) {
        const typesSet = new Set<string>();
        typesRes.data.forEach((f: any) => { const t = cleanValue(f.tipo); if (t.length > 2) typesSet.add(t); });
        setAvailableTypes(Array.from(typesSet).sort());
      }

    } catch (err) {
      console.error("Erro ao carregar dados iniciais:", err);
    }

    // 1.2 Carregar buscas populares (Independente de usuário)
    const { getPopularSearches } = await import('@/lib/searchSuggestions')
    getPopularSearches(userRegion).then(setPopularSearches)

    if (user) {
      const { data: hist } = await sb
        .from('user_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (hist) setHistory(hist)
    }
  }, [user, sb, userRegion])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // 2. Busca Global em Tempo Real
  useEffect(() => {
    // Feedback visual imediato ao começar a digitar ou filtrar
    if (query.trim().length >= 1 || selectedGenre || selectedYear || selectedType || selectedArtist) {
      setIsLoadingResults(true);
    }

    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 1 || selectedGenre || selectedYear || selectedType || selectedArtist) {
        // Busca sugestões visuais para o dropdown
        if (query.trim().length >= 1) {
          const { generateSuggestions } = await import('@/lib/searchSuggestions')
          const live = await generateSuggestions(query)
          setLiveSuggestions(live)
        } else {
          setLiveSuggestions([])
        }

        setIsSearching(true)
        let searchBuilder = sb
          .from('search_catalog')
          .select('*')
          .limit(24);
        
        if (query.trim().length >= 1) {
          searchBuilder = searchBuilder.ilike('titulo', `%${query}%`);
        }
        if (selectedGenre) {
          searchBuilder = searchBuilder.eq('genero', selectedGenre);
        }
        if (selectedYear) {
          searchBuilder = searchBuilder.eq('ano', parseInt(selectedYear));
        }
        if (selectedType) {
          searchBuilder = searchBuilder.eq('tipo', selectedType);
        }
        // Novo: Filtrar por artista selecionado
        if (selectedArtist) {
          searchBuilder = searchBuilder.or(`cast_names.cs.{${selectedArtist}},director_names.cs.{${selectedArtist}}`);
        }

        const { data, error } = await searchBuilder;
        
        if (!error && data) {
          setResults(data);
        } else {
          setResults([]);
        }
        setIsLoadingResults(false);
      } else if (!query && !selectedGenre && !selectedYear && !selectedType) {
        setResults([]);
        setIsSearching(false);
        setIsLoadingResults(false);
      }
    }, 300); // Debounce para evitar muitas requisições

    return () => clearTimeout(delayDebounceFn);
  }, [query, sb, selectedGenre, selectedYear, selectedType, selectedArtist]);

  // 3. Voz
  const { isListening, toggleListening, isSupported } = useVoiceSearch((text) => {
    setQuery(text)
  })

  // 4. Salvar Histórico (Apenas se clicado, conforme regra de negócio)
  const handleResultClick = async (item: any) => {
    if (!user) return

    // Rastrear busca global para tendências (Popular Searches)
    const { trackSearch } = await import('@/lib/searchSuggestions')
    await trackSearch(query || item.titulo, results.length, userRegion)

    await sb.from('user_search_history').upsert({
      user_id: user.id,
      query: query || item.titulo,
      clicked_result_id: `${item.source_table}-${item.source_id}`,
      clicked_at: new Date().toISOString(),
      result_count: results.length
    })
  }

  // 5. Limpar Histórico
  const clearHistory = async () => {
    if (!user) return
    await sb.from('user_search_history').delete().eq('user_id', user.id)
    setHistory([])
    setSelectedArtist('') // Limpa também o artista selecionado
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Barra de Busca Fixa - Estilo Glassmorphism */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 md:px-16">
        <div className="max-w-7xl mx-auto relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className={`w-6 h-6 ${isLoadingResults ? 'text-brand-cyan animate-pulse' : isSearching ? 'text-brand-cyan' : 'text-neutral-500'} transition-colors`} />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                // Permite que o foco saia para os filtros ou resultados
                e.currentTarget.blur();
              } else if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="Títulos, gêneros ou pessoas..."
            className="w-full bg-white/5 border-2 border-transparent focus:border-brand-cyan/50 rounded-2xl py-5 pl-14 pr-32 text-xl md:text-2xl font-medium outline-none transition-all placeholder:text-neutral-600 focus:bg-white/10"
            autoFocus
          />

          {/* Auto-complete Visual Profissional (Sugestões de Títulos) */}
          {query.length >= 2 && liveSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2">
                {liveSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      // Ao clicar na sugestão, preenche a busca e limpa o artista selecionado
                      setQuery(suggestion.text)
                      setLiveSuggestions([])
                    }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all group text-left"
                  >
                    {suggestion.poster ? (
                      <div className="relative w-12 h-16 rounded-md overflow-hidden flex-shrink-0 shadow-lg border border-white/5">
                        <Image 
                          src={suggestion.poster} 
                          alt="" 
                          fill 
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-16 bg-neutral-800 rounded-md flex items-center justify-center text-xl">
                        {suggestion.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white group-hover:text-brand-cyan transition-colors truncate">
                        {suggestion.text}
                      </p>
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-black flex items-center gap-1">
                        {suggestion.type === 'history' && <History size={10} />}
                        {suggestion.type === 'popular' && <Flame size={10} className="text-orange-500" />}
                        {suggestion.type === 'prediction' && <Sparkles size={10} className="text-brand-cyan" />}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                      <div className="w-8 h-8 rounded-full bg-brand-cyan flex items-center justify-center text-black">
                        <Search size={16} strokeWidth={3} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            {query && (
              <button 
                onClick={() => setQuery('')}
                tabIndex={0}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            
            {isSupported && (
              <button
                onClick={toggleListening}
                tabIndex={0}
                className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-brand-cyan hover:scale-105'} shadow-lg`}
              >
                <Mic className={`w-6 h-6 ${isListening ? 'text-white' : 'text-black'}`} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Filtros de Pesquisa */}
      <div className="sticky top-[100px] z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 md:px-16 flex flex-wrap gap-4 justify-center items-center">
        {/* Filtro por Gênero */}
        <div className="relative">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            tabIndex={0}
            className="bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm font-medium text-white focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 outline-none appearance-none pr-8"
          >
            <option value="">Todos os Gêneros</option>
            {availableGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
            <ChevronDown size={16} />
          </div>
        </div>

        {/* Filtro por Ano */}
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            tabIndex={0}
            className="bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm font-medium text-white focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 outline-none appearance-none pr-8"
          >
            <option value="">Todos os Anos</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
            <ChevronDown size={16} />
          </div>
        </div>

        {/* Filtro por Tipo (Filme/Série) */}
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            tabIndex={0}
            className="bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm font-medium text-white focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/50 outline-none appearance-none pr-8"
          >
            <option value="">Todos os Tipos</option>
            <option value="movie">Filmes</option>
            <option value="series">Séries</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
            <ChevronDown size={16} />
          </div>
        </div>

        {/* Botão para Limpar Filtros */}
        {(selectedGenre || selectedYear || selectedType || selectedArtist) && (
          <button
            onClick={() => { setSelectedGenre(''); setSelectedYear(''); setSelectedType(''); setSelectedArtist(''); }}
            tabIndex={0}
            className="bg-red-500/10 border border-red-500/30 rounded-full px-5 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Limpar Filtros
          </button>
        )}

        {/* Indicador de Artista Selecionado */}
        {selectedArtist && (
          <div className="flex items-center gap-2 px-4 py-2 bg-brand-cyan/10 rounded-full border border-brand-cyan/30 text-brand-cyan text-sm font-medium">
            Artista: <span className="font-bold">{selectedArtist}</span>
            <button
              onClick={() => setSelectedArtist('')}
              tabIndex={0}
              className="ml-2 text-brand-cyan hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-16 py-10 pb-32">
        
        {/* ESTADO 1: ANTES DE DIGITAR - SUGESTÕES INTELIGENTES */}
        {!query && !isSearching && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Histórico Recente */}
            {history.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-neutral-400 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <History className="w-4 h-4" /> Buscas Recentes
                  </h3>
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar Tudo
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setQuery(h.query)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-brand-cyan hover:text-black rounded-full border border-white/10 text-sm font-bold transition-all"
                    >
                      {h.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Buscas Populares (Bombando) */}
            {popularSearches.length > 0 && (
              <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                <h3 className="text-neutral-400 font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
                  <Flame className="w-4 h-4 text-orange-500" /> Bombando em {regionName}
                </h3>
                <div className="flex flex-wrap gap-4">
                  {popularSearches.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setQuery(item.text)}
                      tabIndex={0}
                      className="group flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 focus:ring-2 focus:ring-brand-cyan outline-none"
                    >
                      <span className="text-xl">{item.icon || '🔥'}</span>
                      <span className="font-bold text-lg group-hover:text-brand-cyan transition-colors">
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6 Conteúdos Relevantes */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                <Sparkles className="text-brand-cyan w-6 h-6" /> Recomendados para você
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
                {suggestions.map((item) => (
                  <ContentCard 
                    key={item.id} 
                    item={{
                      id: item.source_id || item.id,
                      id_n: (item.source_table === 'series' || item.type === 'series') ? (item.source_id || item.id_n || item.id) : undefined,
                      titulo: item.titulo || item.title,
                      poster: item.poster || item.banner || item.backdrop || item.capa || item.poster_path,
                      type: item.tipo || item.type
                    }} 
                    onClick={() => handleResultClick(item)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ESTADO 2: DURANTE A BUSCA - RESULTADOS */}
        {query && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                Resultados para <span className="text-brand-cyan">"{query}"</span>
              </h2>
              <p className="text-neutral-500 font-bold mb-1">{results.length} encontrados</p>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-10">
                {results.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <ContentCard 
                      item={{
                        id: item.source_id,
                        id_n: item.source_table === 'series' ? item.source_id : undefined,
                        titulo: item.titulo,
                        poster: item.poster || item.banner || item.backdrop || item.capa,
                        type: item.tipo,
                        year: item.ano
                      }} 
                      onClick={() => handleResultClick(item)}
                    />
                    {(item.cast_names && item.cast_names.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.cast_names.slice(0, 2).map((name: string) => ( // Limita a 2 nomes para não poluir
                          <button
                            key={`cast-${item.id}-${name}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedArtist(name); setQuery(''); }}
                            tabIndex={0}
                            className="text-xs text-neutral-400 hover:text-brand-cyan transition-colors focus:outline-none focus:ring-1 focus:ring-brand-cyan rounded-md px-1"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                    {(item.director_names && item.director_names.length > 0) && (
                      <button
                        key={`director-${item.id}-${item.director_names[0]}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedArtist(item.director_names[0]); setQuery(''); }}
                        tabIndex={0}
                        className="text-xs text-neutral-400 hover:text-brand-cyan transition-colors focus:outline-none focus:ring-1 focus:ring-brand-cyan rounded-md px-1 mt-1"
                      >
                        Dir: {item.director_names[0]}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-neutral-700" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Ops, não encontramos nada</h3>
                <p className="text-neutral-500 max-w-md">
                  Tente buscar por termos mais genéricos ou verifique se o nome está correto.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Efeito Visual de "Escuta" por Voz */}
      {isListening && (
        <div className="fixed inset-0 z-[100] bg-brand-cyan/20 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-black p-12 rounded-full border-4 border-brand-cyan shadow-[0_0_50px_rgba(0,173,239,0.5)] flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-cyan rounded-full animate-ping opacity-25"></div>
              <Mic className="w-16 h-16 text-brand-cyan relative z-10" />
            </div>
            <p className="mt-8 text-2xl font-black uppercase tracking-widest animate-pulse">Estou ouvindo...</p>
            <button 
              onClick={toggleListening}
              className="mt-12 px-8 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}