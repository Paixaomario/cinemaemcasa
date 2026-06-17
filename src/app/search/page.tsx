'use client'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation' // Importar useRouter
import { useAuth } from '@/components/layout/SupabaseProvider'
import { ContentCard } from '@/components/ui/ContentCard'
import { Search, Mic, X, Trash2, History, Sparkles, ChevronDown, Flame } from 'lucide-react'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation'
import { useDebounce } from '@/hooks/useDebounce'
import Image from 'next/image'
import { 
  getPersonalizedRecommendations, 
  getTrendingContent,
  getDisplayedCache,
  addBatchToDisplayedCache
} from '@/lib/homeContentManager'
import type { SuggestionItem } from '@/lib/searchSuggestions'

// Interface para os itens de conteúdo (Filmes/Séries) do catálogo
export interface SearchResultItem {
  id: string | number;
  source_id?: string;
  source_table?: 'cinema' | 'series';
  titulo?: string; // Supabase field
  title?: string;  // TMDB fallback
  name?: string;   // TMDB TV fallback
  poster?: string; // Supabase field
  capa?: string;   // Alternative Supabase field
  poster_path?: string; // TMDB field
  type?: string;   // TMDB field
  tipo?: string;   // Supabase field
  media_type?: string; // TMDB mixed search result field
  year?: string | number; 
  ano?: string | number;  
  cast_names?: string[]; 
  director_names?: string[];
  genero?: string; 
  category?: string;
  rating?: number;
  vote_average?: number;
  release_date?: string;
  url?: string;
  trailer?: string;
  duration?: string;
  created_at?: string;
  subtitles?: any;
  audio_tracks?: any;
}

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter() // Inicializar useRouter aqui
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([])
  const [popularSearches, setPopularSearches] = useState<SuggestionItem[]>([])
  const [liveSuggestions, setLiveSuggestions] = useState<SuggestionItem[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [userRegion, setUserRegion] = useState('BR')
  const [selectedArtist, setSelectedArtist] = useState<string>('')
  const [regionName, setRegionName] = useState('Brasil')
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [trendingItems, setTrendingItems] = useState<any[]>([])
  
  const sb = useMemo(() => createClient(), [])

  // Padronização do objeto enviado para o ContentCard
  const formatContentItem = (item: SearchResultItem) => ({
    // Prioriza o ID da fonte original para navegação e histórico
    id: item.source_id || String(item.id),
    // Mantém compatibilidade com o player que espera id_n para séries
    id_n: (item.source_table === 'series' || item.tipo === 'series' || item.media_type === 'tv' || item.type === 'series') 
      ? (item.source_id || String(item.id)) 
      : undefined,
    titulo: item.titulo || item.title || item.name || '',
    poster: item.poster || item.capa || item.poster_path || '',
    type: (item.source_table === 'series' || item.tipo === 'series' || item.media_type === 'tv' || item.type === 'tv' || item.type === 'series') 
      ? 'series' 
      : 'movie',
    year: item.ano || item.year || item.release_date?.slice(0, 4)
  });

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

  const [initialFiltersLoaded, setInitialFiltersLoaded] = useState(false);

  // 1.1 Carregar opções de filtro (executa apenas uma vez)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoadingResults(true);
        // Garantia de seleção apenas de colunas existentes
        const [genresRes, yearsRes, typesRes] = await Promise.all([
          sb.from('search_catalog').select('genero').not('genero', 'is', null),
          sb.from('search_catalog').select('ano'),
          sb.from('search_catalog').select('tipo'),
        ]);
  
        const cleanRegex = /[\[\]"']/g;
        const cleanValue = (val: any) => String(val || '').replace(cleanRegex, '').trim();
  
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
        console.error("Erro ao carregar opções de filtro:", err);
      } finally {
        // GARANTIA: Remove o overlay de carregamento mesmo em caso de erro no banco
        setInitialFiltersLoaded(true);
        setIsLoadingResults(false);
      }
    };
    loadFilterOptions();
  }, [sb]); // Dependência apenas do Supabase client

  // 1.2 Carregar Sugestões Iniciais (6 itens relevantes), Histórico e Buscas Populares (depende do user e userRegion)
  useEffect(() => {
    if (!initialFiltersLoaded) return; // Espera os filtros carregarem primeiro

    const loadUserAndPopularData = async () => {
      try {
        // Recomendações Inteligentes e Dinâmicas (Estilo Streaming Premium)
        const displayedIds = getDisplayedCache();
        let recs: any[] = [];
        
        if (user) {
          recs = await getPersonalizedRecommendations(user.id, 4, displayedIds, false);
        } else {
          recs = await getTrendingContent(4, false);
        }
        
        if (recs?.length) {
          setSuggestions(recs);
          addBatchToDisplayedCache(recs.map(r => String(r.id)));
        }

        // Carregar buscas populares (Independente de usuário)
        const { getPopularSearches } = await import('@/lib/searchSuggestions')
        getPopularSearches(userRegion).then(setPopularSearches)

        // Carregar itens trending para a seção Bombando
        const trending = await getTrendingContent(4, false)
        if (trending?.length) {
          setTrendingItems(trending)
        }

        // Carregar histórico do usuário
        if (user) {
          const { data: hist } = await sb
            .from('user_search_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
          if (hist) setHistory(hist)
        }
      } catch (err) {
        console.error("Erro ao carregar dados iniciais do usuário/popular:", err);
      }
    };
    loadUserAndPopularData();
  }, [user, sb, userRegion, initialFiltersLoaded]); // Dependências para dados do usuário e região

  // 2. Busca Global em Tempo Real
  const debouncedQuery = useDebounce(query, 500);
  const debouncedGenre = useDebounce(selectedGenre, 500);
  const debouncedYear = useDebounce(selectedYear, 500);
  const debouncedType = useDebounce(selectedType, 500);
  const debouncedArtist = useDebounce(selectedArtist, 500);

  // Sinaliza carregamento assim que o usuário começa a interagir para feedback imediato
  useEffect(() => {
    if (query.trim() || selectedGenre || selectedYear || selectedType || selectedArtist) {
      setIsLoadingResults(true);
    }
  }, [query, selectedGenre, selectedYear, selectedType, selectedArtist]);

  useEffect(() => {
    const performSearch = async () => {
      // Se não houver termos debouncados e nenhum filtro, limpa os resultados
      if (!debouncedQuery.trim() && !debouncedGenre && !debouncedYear && !debouncedType && !debouncedArtist) {
        setResults([]);
        setIsSearching(false);
        setIsLoadingResults(false);
        setLiveSuggestions([]);
        return;
      }

      // Leitura COMPLETA da tabela para garantir trailers e metadados
      let searchBuilder = sb.from('search_catalog')
        .select('*')
        .order('created_at', { ascending: false, nullsFirst: false }) 
        .order('id', { ascending: false }) // Fallback para ID garante que o último inserido venha primeiro
        .limit(48);

      if (debouncedQuery.trim().length >= 1) { 
        searchBuilder = searchBuilder.ilike('titulo', `%${debouncedQuery}%`); 
      }
      if (debouncedGenre) {
        searchBuilder = searchBuilder.eq('genero', debouncedGenre);
      }
      if (debouncedYear) {
        searchBuilder = searchBuilder.eq('ano', parseInt(debouncedYear));
      }
      if (debouncedType) {
        searchBuilder = searchBuilder.eq('tipo', debouncedType);
      }
      // Novo: Filtrar por artista selecionado
      if (debouncedArtist) {
        const artistFilter = `{"${debouncedArtist.replace(/"/g, '\\"')}"}`;
        searchBuilder = searchBuilder.or(`cast_names.cs.${artistFilter},director_names.cs.${artistFilter}`);
      }

      const { data } = await searchBuilder;
      
      if (data) {
        setLiveSuggestions([]); // Garante que sugestões suspensas sejam limpas
        setResults(data);
      }
      setIsLoadingResults(false);
      setIsSearching(true); // Define como busca concluída
    };

    performSearch();
  }, [debouncedQuery, debouncedGenre, debouncedYear, debouncedType, debouncedArtist, sb]);

  // 3. Voz
  const { isListening, toggleListening, isSupported } = useVoiceSearch((text) => {
    setQuery(text)
  })

  // 4. Salvar Histórico (Apenas se clicado, conforme regra de negócio)
  const handleResultClick = async (item: any) => {
    if (user) {
      // Rastrear busca global para tendências (Popular Searches)
      const { trackSearch } = await import('@/lib/searchSuggestions')
      await trackSearch(query || item.titulo || item.title || item.name, results.length, userRegion)

      await sb.from('user_search_history').upsert({
        user_id: user.id,
        query: query || item.titulo || item.title || item.name,
        clicked_result_id: `${item.source_table || 'catalog'}-${item.source_id || item.id}`,
        clicked_at: new Date().toISOString(),
        result_count: results.length
      })
    }

    // Executa a navegação programática
    const formatted = formatContentItem(item);
    const detailPath = formatted.type === 'series' 
      ? `/series/${formatted.id}` 
      : `/detalhes/${formatted.id}`;
    
    router.push(detailPath);
  }

  // 5. Limpar Histórico
  const clearHistory = async () => {
    if (!user) return
    await sb.from('user_search_history').delete().eq('user_id', user.id)
    setHistory([])
    setSelectedArtist('') // Limpa também o artista selecionado
  }

  const isShowResults = !!(query.trim().length >= 1 || selectedGenre || selectedYear || selectedType || selectedArtist);

  return (
    <>
      {/* Adiciona um overlay de carregamento se os filtros iniciais ainda não foram carregados */}
      {!initialFiltersLoaded && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black">
          <p className="text-xl text-brand-cyan animate-pulse">Carregando...</p>
        </div>
      )}

    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Barra de Busca Fixa - Estilo Glassmorphism */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 md:px-16">
        <div className="max-w-7xl mx-auto relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className={`w-6 h-6 ${isLoadingResults ? 'text-brand-cyan animate-pulse' : isSearching ? 'text-brand-cyan' : 'text-neutral-500'} transition-colors`} />
          </div>
          
          <input
            type="text"
            id="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                // Foca no primeiro card de resultado ou filtro
                const firstFocusable = document.querySelector('main [tabindex="0"]') as HTMLElement;
                if (firstFocusable) firstFocusable.focus(); // Garante que o foco vá para o primeiro item do grid
              } else if (e.key === 'Enter' || e.key === 'ArrowLeft') {
                // ArrowLeft sobe para o provedor global lidar com a abertura da Sidebar
                e.currentTarget.blur();
              }
            }}
            placeholder="Títulos, gêneros ou pessoas..."
            className="w-full bg-white/5 border-2 border-transparent focus:border-brand-cyan/50 rounded-2xl py-5 pl-14 pr-32 text-xl md:text-2xl font-medium outline-none transition-all placeholder:text-neutral-600 focus:bg-white/10"
            autoFocus
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2">
            {query && (
              <button 
                onClick={() => { setQuery(''); setResults([]); setLiveSuggestions([]); }}
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

        {/* ESTADO 1: ANTES DE DIGITAR/FILTRAR - RECOMENDAÇÕES */}
        {!isShowResults && (
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
            {trendingItems.length > 0 && (
              <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                <h3 className="text-neutral-400 font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
                  <Flame className="w-4 h-4 text-orange-500" /> Bombando em {regionName}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
                  {trendingItems.slice(0, 4).map((item) => (
                    <ContentCard 
                      key={item.id} 
                      item={formatContentItem(item)} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 6 Conteúdos Relevantes */}
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                <Sparkles className="text-brand-cyan w-6 h-6" /> Recomendados para você
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
                {suggestions.map((item) => (
                  <ContentCard 
                    key={item.id} 
                    item={formatContentItem(item)} 
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ESTADO 2: DURANTE A BUSCA/FILTRO - RESULTADOS */}
        {isShowResults && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
                {query ? (
                  <>Resultados para <span className="text-brand-cyan">"{query}"</span></>
                ) : 'Resultados filtrados'}
              </h2>
              <p className="text-neutral-500 font-bold mb-1">{isLoadingResults ? 'Buscando...' : `${results.length} encontrado${results.length === 1 ? '' : 's'}`}</p>
            </div>

            {isLoadingResults && results.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {isLoadingResults || results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
                {results.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <ContentCard 
                      item={formatContentItem(item)}
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
                        key={`director-${item.id}-${item.director_names?.[0]}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (item.director_names?.[0]) setSelectedArtist(item.director_names[0]); 
                          setQuery(''); 
                        }}
                        tabIndex={0}
                        className="text-xs text-neutral-400 hover:text-brand-cyan transition-colors focus:outline-none focus:ring-1 focus:ring-brand-cyan rounded-md px-1 mt-1"
                      >
                        Dir: {item.director_names[0]}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : !isLoadingResults && isSearching && (
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
    </>
  )
}