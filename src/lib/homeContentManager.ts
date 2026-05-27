import { createClient } from './supabase'

interface ContentItem {
  id: string | number
  id_n?: number | string
  titulo: string
  poster: string | null
  backdrop: string | null
  type: 'movie' | 'serie' | 'series' | 'tv' | null
  year?: number | string | null
  category?: string | null
  rating?: number | null
  genres?: string[] | null
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
  return Date.now() - parseInt(startTime) > oneHour
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

    // Busca os gêneros de todos os conteúdos em uma única query
    const { data: contentData, error: contentError } = await sb
      .from('content')
      .select('id, genres')
      .in('id', contentIds)

    if (contentError || !contentData) {
      return []
    }

    // Conta os gêneros
    const genreCounts: Record<string, number> = {}

    contentData.forEach(item => {
      if (item.genres) {
        const genres = Array.isArray(item.genres) ? item.genres : []
        genres.forEach(genre => {
          const genreName = genre.toLowerCase().trim()
          genreCounts[genreName] = (genreCounts[genreName] || 0) + 1
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
export async function getTrendingContent(limit: number = 20): Promise<ContentItem[]> {
  const sb = createClient()

  try {
    // Reduzindo limite para evitar erros 400
    const searchLimit = 100

    // Busca conteúdo com maior rating e mais recente
    let movies = null
    try {
      movies = await sb
        .from('cinema')
        .select('*')
        .gte('rating', 7)
        .order('rating', { ascending: false })
        .order('year', { ascending: false })
        .limit(searchLimit)
    } catch (error) {
      console.warn('Erro ao buscar trending movies:', error)
      movies = await sb
        .from('cinema')
        .select('*')
        .gte('rating', 7)
        .order('rating', { ascending: false })
        .order('year', { ascending: false })
        .limit(searchLimit)
    }

    let series = null
    try {
      series = await sb
        .from('series')
        .select('*')
        .gte('rating', 7)
        .order('rating', { ascending: false })
        .order('year', { ascending: false })
        .limit(searchLimit)
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
          poster: movie.poster || movie.capa || movie.poster_path || movie.banner,
          backdrop: movie.backdrop || movie.banner,
          type: 'movie',
          year: movie.year,
          category: movie.category,
          rating: movie.rating,
          genres: movie.genres || []
        })
      })
    }

    if (series?.data) {
      series.data.forEach(serie => {
        items.push({
          id: serie.id,
          titulo: serie.titulo,
          poster: serie.poster || serie.capa || serie.poster_path || serie.banner,
          backdrop: serie.backdrop || serie.banner,
          type: 'series',
          year: serie.year,
          category: serie.category,
          rating: serie.rating,
          genres: serie.genres || []
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
  excludeIds: Set<string> = new Set()
): Promise<ContentItem[]> {
  const favoriteGenres = await getUserFavoriteGenres(userId)

  if (favoriteGenres.length === 0) {
    // Se não há gêneros favoritos, retorna conteúdo em alta
    return getTrendingContent(limit)
  }

  const sb = createClient()

  try {
    const items: ContentItem[] = []

    // Reduzindo limite para evitar erros 400
    const searchLimit = 100

    // Busca filmes baseados nos gêneros favoritos
    for (const genre of favoriteGenres) {
      let movies = null
      try {
        movies = await sb
          .from('cinema')
          .select('*')
          .ilike('category', `%${genre}%`)
          .gte('rating', 6)
          .order('rating', { ascending: false })
          .limit(searchLimit)
      } catch (error) {
        console.warn('Erro ao buscar personalized movies:', error)
        movies = await sb
          .from('cinema')
          .select('*')
          .ilike('category', `%${genre}%`)
          .gte('rating', 6)
          .order('rating', { ascending: false })
          .limit(searchLimit)
      }

      if (movies?.data) {
        movies.data.forEach(movie => {
          const idStr = String(movie.id)
          if (!excludeIds.has(idStr)) {
            items.push({
              id: movie.id,
              titulo: movie.titulo,
              poster: movie.poster || movie.capa || movie.poster_path || movie.banner,
              backdrop: movie.backdrop || movie.banner,
              type: 'movie',
              year: movie.year,
              category: movie.category,
              rating: movie.rating,
              genres: movie.genres || []
            })
          }
        })
      }

      try {
        const series = await sb
          .from('series')
          .select('*')
          .ilike('category', `%${genre}%`)
          .gte('rating', 6)
          .order('rating', { ascending: false })
          .limit(searchLimit)

        if (series?.data) {
          series.data.forEach(serie => {
            const idStr = String(serie.id)
            if (!excludeIds.has(idStr)) {
              items.push({
                id: serie.id,
                titulo: serie.titulo,
                poster: serie.poster || serie.capa || serie.poster_path || serie.banner,
                backdrop: serie.backdrop || serie.banner,
                type: 'series',
                year: serie.year,
                category: serie.category,
                rating: serie.rating,
                genres: serie.genres || []
              })
            }
          })
        }
      } catch (seriesError) {
        console.warn('Erro ao buscar personalized series:', seriesError)
        console.warn('A tabela series pode não existir ou ter estrutura diferente')
        // Continua apenas com filmes
      }
    }

    // NÃO remove duplicatas - cada item é único
    const uniqueItems = removeDuplicatesByTitle(items)

    // Embaralha e limita
    return shuffleArray(uniqueItems).slice(0, limit)
  } catch (error) {
    console.error('Erro ao buscar recomendações personalizadas:', error)
    return getTrendingContent(limit)
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
  excludeIds: Set<string> = new Set()
): Promise<ContentItem[]> {
  const sb = createClient()

  try {
    const items: ContentItem[] = []

    // Reduzindo limite para evitar erros 400
    const searchLimit = 100

    // Busca filmes
    let movieQuery = sb.from('cinema').select('*')

    if (categories && categories.length > 0) {
      const catFilters = categories.map(c => `category.ilike.%${c}%`).join(',')
      movieQuery = movieQuery.or(catFilters)
    }

    // Aplica ordenação conforme configurado no banco
    if (ordenacao === 'rating_desc') {
      movieQuery = movieQuery.order('rating', { ascending: false })
    } else if (ordenacao === 'year_desc') {
      movieQuery = movieQuery.order('year', { ascending: false })
    } else {
      movieQuery = movieQuery.order('created_at', { ascending: false })
    }

    // Busca sem offset para respeitar a ordenação configurada
    let movies = null
    try {
      movies = await movieQuery.limit(searchLimit)
    } catch (error) {
      console.warn('Erro ao buscar filmes:', error)
      movies = await movieQuery.limit(searchLimit)
    }

    if (movies?.data) {
      movies.data.forEach(movie => {
        const idStr = String(movie.id)
        if (!excludeIds.has(idStr)) {
          const poster = movie.poster || movie.capa || movie.poster_path || movie.banner
          items.push({
            id: movie.id,
            titulo: movie.titulo,
            poster: poster,
            backdrop: movie.backdrop || movie.banner,
            type: 'movie',
            year: movie.year,
            category: movie.category,
            rating: movie.rating,
            genres: movie.genres || []
          })
        }
      })
    }

    // Busca séries com tratamento de erro detalhado
    try {
      let seriesQuery = sb.from('series').select('*')

      if (categories && categories.length > 0) {
        const catFilters = categories.map(c => `category.ilike.%${c}%`).join(',')
        seriesQuery = seriesQuery.or(catFilters)
      }

      // Aplica ordenação conforme configurado no banco
      if (ordenacao === 'rating_desc') {
        seriesQuery = seriesQuery.order('rating', { ascending: false })
      } else if (ordenacao === 'year_desc') {
        seriesQuery = seriesQuery.order('year', { ascending: false })
      } else {
        seriesQuery = seriesQuery.order('created_at', { ascending: false })
      }

      const series = await seriesQuery.limit(searchLimit)

      if (series?.data) {
        series.data.forEach(serie => {
          const idStr = String(serie.id)
          if (!excludeIds.has(idStr)) {
            items.push({
              id: serie.id,
              titulo: serie.titulo,
              poster: serie.poster || serie.capa || serie.poster_path || serie.banner,
              backdrop: serie.backdrop || serie.banner,
              type: 'series',
              year: serie.year,
              category: serie.category,
              rating: serie.rating,
              genres: serie.genres || []
            })
          }
        })
      }
    } catch (seriesError) {
      console.warn('Erro ao buscar séries:', seriesError)
      console.warn('A tabela series pode não existir ou ter estrutura diferente')
      // Continua apenas com filmes
    }

    // NÃO remove duplicatas - cada item é único
    const uniqueItems = removeDuplicatesByTitle(items)

    // Embaralha para variedade a cada carregamento
    const shuffled = shuffleArray(uniqueItems)

    // Limita ao número solicitado
    return shuffled.slice(0, limit)
  } catch (error) {
    console.error('Erro ao buscar conteúdo da seção:', error)
    return []
  }
}

/**
 * NÃO remove duplicatas - cada item é único
 * Filmes com continuações são mantidos como itens distintos
 */
function removeDuplicatesByTitle(items: ContentItem[]): ContentItem[] {
  // Retorna todos os itens sem remover duplicatas
  return items
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
