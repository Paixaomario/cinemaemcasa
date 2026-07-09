import { createClient } from './supabase'

interface ContentItem {
  id: string | number
  id_n?: number | string
  titulo: string
  description?: string | null
  poster?: string | null
  capa?: string | null
  backdrop?: string | null
  banner?: string | null
  type: 'movie' | 'serie' | 'series' | 'tv' | null
  year?: number | string | null
  category?: string | null
  rating?: number | null
  genres?: string[] | null
  url?: string | null
  trailer?: string | null
  duration?: string | null
  duration_seconds?: number | null
  created_at?: string | null
  last_position?: number | null
}

interface UserPreferences {
  userId: string
  favoriteGenres: string[]
  watchHistory: string[]
  isNewUser: boolean
}

const CACHE_KEY = 'home_content_cache'
const SESSION_START_KEY = 'home_session_start'

/**
 * Inicializa uma nova sessão de capas
 */
export function initializeContentSession() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify([]))
    localStorage.setItem(SESSION_START_KEY, Date.now().toString())
  }
}

/**
 * Verifica se a sessão expirou (mais de 1 hora)
 */
function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return true
  const startTime = localStorage.getItem(SESSION_START_KEY)
  if (!startTime) return true
  const oneHour = 60 * 60 * 1000
  
  const expired = Date.now() - parseInt(startTime) > oneHour;
  // Se estiver no browser, verifica se o usuário está interagindo antes de expirar
  if (expired && typeof document !== 'undefined' && document.visibilityState === 'visible') {
    return false; // Adia a expiração se o usuário estiver com a página aberta
  }
  return expired;
}

/**
 * Adiciona um conteúdo ao cache de exibidos
 */
export function addToDisplayedCache(contentId: string) {
  if (typeof window === 'undefined') return
  if (isSessionExpired()) {
    initializeContentSession()
  }
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
  if (!cache.includes(contentId)) {
    cache.push(contentId)
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  }
}

/**
 * Adiciona múltiplos conteúdos ao cache de uma vez (Otimizado para Smart TVs)
 */
export function addBatchToDisplayedCache(contentIds: string[]) {
  if (typeof window === 'undefined' || contentIds.length === 0) return
  if (isSessionExpired()) {
    initializeContentSession()
  }
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
  const newIds = contentIds.filter(id => !cache.includes(id))
  if (newIds.length > 0) {
    const updatedCache = [...cache, ...newIds]
    localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache))
  }
}

/**
 * Verifica se um conteúdo já foi exibido
 */
export function isContentDisplayed(contentId: string): boolean {
  if (typeof window === 'undefined') return false
  if (isSessionExpired()) {
    initializeContentSession()
  }
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
  return cache.includes(contentId)
}

/**
 * Obtém o cache atual de IDs exibidos
 */
export function getDisplayedCache(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  if (isSessionExpired()) {
    initializeContentSession()
  }
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
  return new Set(cache)
}

/**
 * Obtém os gêneros mais assistidos do usuário
 */
export async function getUserFavoriteGenres(userId: string): Promise<string[]> {
  const sb = createClient()

  try {
    // Busca o histórico de visualização do usuário
    const { data: historyData, error: historyError } = await sb
      .from('view_progress')
      .select('content_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (historyError || !historyData || historyData.length === 0) {
      return []
    }

    // Extrai todos os content_ids
    const contentIds = historyData.map(item => String(item.content_id))

    const validIds = contentIds.filter(id => id && id !== 'null' && id !== 'undefined');
    if (validIds.length === 0) return ['lançamentos', 'ação'];

    const numericIds = validIds.filter(id => /^\d+$/.test(id));
    const stringIds = validIds.filter(id => !/^\d+$/.test(id));
    
    let query = sb.from('search_catalog').select('genero, category');
    
    if (numericIds.length > 0 && stringIds.length > 0) {
      // Para buscas mistas (BIGINT + UUID), usamos or com condições individuais
      const idConditions = numericIds.map(id => `id.eq.${id}`).join(',');
      const sourceIdConditions = stringIds.map(id => `source_id.eq.${id}`).join(',');
      query = query.or(`${idConditions},${sourceIdConditions}`);
    } else if (numericIds.length > 0) {
      query = query.in('id', numericIds);
    } else if (stringIds.length > 0) {
      // Para UUIDs, usamos or com condições eq individuais
      const conditions = stringIds.map(id => `source_id.eq.${id}`).join(',');
      query = query.or(conditions);
    } else {
      return ['lançamentos'];
    }

    const { data: catalogRes } = await query;

    // Conta os gêneros
    const genreCounts: Record<string, number> = {}

    // Processa resultados do catálogo unificado
    catalogRes?.forEach(item => {
      const rawGenres = (item.category || item.genero || '')
      if (rawGenres) {
        rawGenres.split(',').forEach((g: string) => {
          const name = g.trim().toLowerCase()
          if (name) genreCounts[name] = (genreCounts[name] || 0) + 1
        })
      }
    })

    // Ordena por contagem e retorna os top 5
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre)

    return sortedGenres
  } catch (error) {
    console.error('Erro ao buscar gêneros favoritos:', error)
    return []
  }
}

/**
 * Obtém conteúdo em alta (para novos usuários)
 */
export async function getTrendingContent(limit: number = 20, isChild: boolean = false): Promise<ContentItem[]> {
  const sb = createClient()

  try {
    // Busca todos os conteúdos sem limite para permitir variedade completa
    let movies = null
    let moviesQuery = sb.from('cinema').select('id,titulo,category,rating,created_at,poster,capa,banner,backdrop')
    
    if (isChild) {
      moviesQuery = moviesQuery
        .filter('category', 'not.ilike', '%+18%')
        .filter('category', 'not.ilike', '%Terror%')
        .filter('category', 'not.ilike', '%Adulto%')
    }

    try {
      movies = await moviesQuery
        // DESBLOQUEADO: Exibe novos conteúdos imediatamente (mesmo rating 0)
        .order('created_at', { ascending: false }) // Prioriza os conteúdos mais recentes
        .order('rating', { ascending: false })
    } catch (movieError) {
      console.warn('Erro ao buscar trending movies:', movieError)
    }

    let series = null
    try {
      series = await sb
        .from('series')
        .select('id_n,titulo,ano,rating,created_at,poster,capa,banner,backdrop')
        // DESBLOQUEADO: Novas séries aparecem no topo
        .order('created_at', { ascending: false })
        .order('rating', { ascending: false })
    } catch (seriesError) {
      console.warn('Erro ao buscar trending series:', seriesError)
      console.warn('A tabela series pode não existir ou ter estrutura diferente')
      // Continua apenas com filmes
    }

    const items: ContentItem[] = []

    if (movies?.data) {
      movies.data.forEach(movie => {
        items.push({
          id: movie.id,
          titulo: movie.titulo,
          type: 'movie',
          category: movie.category,
          rating: movie.rating,
          poster: movie.poster,
          capa: movie.capa,
          banner: movie.banner,
          backdrop: movie.backdrop,
          genres: movie.category ? movie.category.split(',').map((c: string) => c.trim()) : [],
          created_at: movie.created_at
        })
      })
    }

    if (series?.data) {
      series.data.forEach(serie => {
        items.push({
          id: serie.id_n,
          titulo: serie.titulo,
          type: 'series',
          year: serie.ano,
          rating: serie.rating,
          poster: serie.poster,
          capa: serie.capa,
          banner: serie.banner,
          backdrop: serie.backdrop,
          created_at: serie.created_at
        })
      })
    }

    // NÃO remove duplicatas - cada item é único
    const uniqueItems = removeDuplicatesByTitle(items)

    // Embaralha para variedade
    return shuffleArray(uniqueItems).slice(0, limit)
  } catch (error) {
    console.error('Erro ao buscar conteúdo em alta:', error)
    return []
  }
}

/**
 * Obtém recomendações personalizadas baseadas em gêneros
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 20,
  excludeIds: Set<string> = new Set(),
  isChild: boolean = false
): Promise<ContentItem[]> {
  const favoriteGenres = await getUserFavoriteGenres(userId)

  if (favoriteGenres.length === 0) {
    // Se não há gêneros favoritos, retorna conteúdo em alta
    return getTrendingContent(limit, isChild)
  }

  const sb = createClient()

  try {
    // Constrói filtros OR para todos os gêneros favoritos de uma vez
    // Isso evita o loop de requisições sequenciais (Otimização crítica para TVs)
    const movieFilters = favoriteGenres.map(genre => `category.ilike.%${genre}%`).join(',')
    const seriesFilters = favoriteGenres.map(genre => `genero.ilike.%${genre}%`).join(',')

    // Removido filtro de rating em recomendações para não bloquear novos itens
    let moviesQuery = sb.from('cinema').select('id,titulo,category,rating,created_at').or(movieFilters);
    let seriesQuery = sb.from('series').select('id_n,titulo,ano,rating,created_at').or(seriesFilters);

    if (isChild) {
      moviesQuery = moviesQuery.not('category', 'ilike', '%+18%').not('category', 'ilike', '%Terror%');
    }

    // Busca filmes e séries em paralelo sem limite para permitir variedade completa
    const [moviesRes, seriesRes] = await Promise.all([
      moviesQuery.order('created_at', { ascending: false }).order('rating', { ascending: false }),
      seriesQuery.order('created_at', { ascending: false }).order('rating', { ascending: false })
    ])

    const items: ContentItem[] = []

    if (moviesRes.data) {
      moviesRes.data.forEach(movie => {
        const idStr = String(movie.id)
        if (!excludeIds.has(idStr)) {
          items.push({
            id: movie.id,
            titulo: movie.titulo,
            type: 'movie',
            category: movie.category,
            rating: movie.rating,
            genres: movie.category ? movie.category.split(',').map((c: string) => c.trim()) : [],
            created_at: movie.created_at
          })
        }
      })
    }

    if (seriesRes.data) {
      seriesRes.data.forEach(serie => {
        const idStr = String(serie.id_n)
        if (!excludeIds.has(idStr)) {
          items.push({
            id: serie.id_n,
            titulo: serie.titulo,
            type: 'series',
            year: serie.ano,
            rating: serie.rating,
            created_at: serie.created_at
          })
        }
      });
    }

    const uniqueItems = removeDuplicatesByTitle(items)
    return shuffleArray(uniqueItems).slice(0, limit)
  } catch (error) {
    console.error('Erro ao buscar recomendações personalizadas:', error)
    return getTrendingContent(limit, isChild)
  }
}

/**
 * Obtém conteúdo para uma seção específica, evitando duplicatas
 */
export async function getSectionContent(
  sectionId: string,
  categories: string[],
  limit: number,
  ordenacao: string,
  excludeIds: Set<string> = new Set(),
  isChild: boolean = false
): Promise<ContentItem[]> {
  const sb = createClient()

  try {
    const items: ContentItem[] = []

    // Busca filmes
    let movieQuery = sb.from('cinema').select('id,titulo,category,rating,created_at,poster,capa,banner,backdrop')

    if (categories && categories.length > 0) {
      const catFilters = categories.map(c => `category.ilike.%${c}%`).join(',')
      movieQuery = movieQuery.or(catFilters)
    }

    // Aplica filtro parental
    if (isChild) {
      movieQuery = movieQuery.not('category', 'ilike', '%+18%').not('category', 'ilike', '%Terror%');
    }

    // Aplica ordenação conforme configurado no banco
    if (ordenacao === 'random') {
      // Para ordenação aleatória, busca todos e embaralha depois
      movieQuery = movieQuery.order('created_at', { ascending: false })
    } else if (ordenacao === 'rating_desc') {
      movieQuery = movieQuery.order('rating', { ascending: false })
    } else if (ordenacao === 'year_desc') {
      movieQuery = movieQuery.order('year', { ascending: false })
    } else {
      movieQuery = movieQuery.order('created_at', { ascending: false })
    }

    // Busca sem limite para permitir variedade completa
    let movies = null
    try {
      movies = await movieQuery
    } catch (error) {
      console.warn('Erro ao buscar filmes:', error)
    }

    if (movies?.data) {
      movies.data.forEach(movie => {
        const idStr = String(movie.id)
        if (!excludeIds.has(idStr)) {
          items.push({
            id: movie.id,
            titulo: movie.titulo,
            type: 'movie',
            category: movie.category,
            rating: movie.rating,
            poster: movie.poster,
            capa: movie.capa,
            banner: movie.banner,
            backdrop: movie.backdrop,
            genres: movie.category ? movie.category.split(',').map((c: string) => c.trim()) : [],
            created_at: movie.created_at
          })
        }
      })
    }

    // Busca séries com tratamento de erro detalhado
    try {
      let seriesQuery = sb.from('series').select('id_n,titulo,ano,rating,created_at,poster,capa,banner,backdrop')

      if (categories && categories.length > 0) {
        // Usando classificacao ou genero em vez de category
        const catFilters = categories.map(c => `genero.ilike.%${c}%`).join(',')
        seriesQuery = seriesQuery.or(catFilters)
      }

      // Aplica ordenação conforme configurado no banco
      if (ordenacao === 'random') {
        // Para ordenação aleatória, busca todos e embaralha depois
        seriesQuery = seriesQuery.order('created_at', { ascending: false })
      } else if (ordenacao === 'rating_desc') {
        seriesQuery = seriesQuery.order('rating', { ascending: false, nullsFirst: false })
      } else if (ordenacao === 'year_desc') {
        seriesQuery = seriesQuery.order('ano', { ascending: false })
      } else {
        seriesQuery = seriesQuery.order('created_at', { ascending: false })
      }

      let series = await seriesQuery
      
      // Fallback caso a coluna rating não exista ou cause erro 400
      if (series.error && ordenacao === 'rating_desc') {
        series = await sb.from('series').select('id_n,titulo,ano,rating,created_at,poster,capa,banner,backdrop').order('created_at', { ascending: false });
      }

      if (series?.data) {
        series.data.forEach(serie => {
          const idStr = String(serie.id_n)
          if (!excludeIds.has(idStr)) {
            items.push({
              id: serie.id_n,
              titulo: serie.titulo,
              type: 'series',
              year: serie.ano,
              rating: serie.rating,
              poster: serie.poster,
              capa: serie.capa,
              banner: serie.banner,
              backdrop: serie.backdrop,
              created_at: serie.created_at
            })
          }
        });
      }
    } catch (seriesError) {
      console.warn('Erro ao buscar séries:', seriesError)
      console.warn('A tabela series pode não existir ou ter estrutura diferente')
      // Continua apenas com filmes
    }

    // NÃO remove duplicatas - cada item é único
    const uniqueItems = removeDuplicatesByTitle(items)

    // Se ordenação for aleatória, embaralha para variedade
    let result = uniqueItems
    if (ordenacao === 'random') {
      result = shuffleArray(uniqueItems)
    }

    // Limita ao número solicitado
    return result.slice(0, limit)
  } catch (error) {
    console.error('Erro ao buscar conteúdo da seção:', error)
    return []
  }
}

/**
 * NÃO remove duplicatas - cada item é único
 * Remove duplicatas baseadas no título para polir a interface
 */
export function removeDuplicatesByTitle(items: ContentItem[]): ContentItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const duplicate = seen.has(item.titulo.toLowerCase());
    seen.add(item.titulo.toLowerCase());
    return !duplicate;
  });
}

/**
 * Embaralha array usando Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Verifica se o usuário é novo (menos de 5 visualizações)
 */
export async function isNewUser(userId: string): Promise<boolean> {
  const sb = createClient()

  try {
    const { count, error } = await sb
      .from('view_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) return true
    return (count || 0) < 5
  } catch (error) {
    console.error('Erro ao verificar se usuário é novo:', error)
    return true
  }
}
