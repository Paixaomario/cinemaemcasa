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
    // Busca muitos itens sem offset para respeitar ordenação
    const searchLimit = 1000

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
    } catch (error) {
      console.warn('Erro ao buscar trending series:', error)
      series = await sb
        .from('series')
        .select('*')
        .gte('rating', 7)
        .order('rating', { ascending: false })
        .order('year', { ascending: false })
        .limit(searchLimit)
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

    // Remove duplicatas incluindo temporadas e coleções
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

    // Busca muitos itens sem offset para respeitar ordenação
    const searchLimit = 1000

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

      let series = null
      try {
        series = await sb
          .from('series')
          .select('*')
          .ilike('category', `%${genre}%`)
          .gte('rating', 6)
          .order('rating', { ascending: false })
          .limit(searchLimit)
      } catch (error) {
        console.warn('Erro ao buscar personalized series:', error)
        series = await sb
          .from('series')
          .select('*')
          .ilike('category', `%${genre}%`)
          .gte('rating', 6)
          .order('rating', { ascending: false })
          .limit(searchLimit)
      }

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
    }

    // Remove duplicatas incluindo temporadas e coleções
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

    console.log(`getSectionContent - sectionId: ${sectionId}, categories:`, categories, `limit: ${limit}, ordenacao: ${ordenacao}`)

    // Busca muitos itens para variedade (sem offset para respeitar ordenação do banco)
    const searchLimit = 1000

    // Busca filmes
    let movieQuery = sb.from('cinema').select('*')

    if (categories && categories.length > 0) {
      const catFilters = categories.map(c => `category.ilike.%${c}%`).join(',')
      console.log(`Filtros de categoria para filmes:`, catFilters)
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

    console.log(`Filmes encontrados:`, movies?.data?.length || 0)

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

    // Busca séries
    let seriesQuery = sb.from('series').select('*')

    if (categories && categories.length > 0) {
      const catFilters = categories.map(c => `category.ilike.%${c}%`).join(',')
      console.log(`Filtros de categoria para séries:`, catFilters)
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

    // Busca sem offset para respeitar a ordenação configurada
    let series = null
    try {
      series = await seriesQuery.limit(searchLimit)
    } catch (error) {
      console.warn('Erro ao buscar séries:', error)
      series = await seriesQuery.limit(searchLimit)
    }

    console.log(`Séries encontradas:`, series?.data?.length || 0)

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

    console.log(`Total de itens antes de remover duplicatas:`, items.length)

    // Remove duplicatas baseadas no título (apenas temporadas de séries)
    const uniqueItems = removeDuplicatesByTitle(items)

    console.log(`Total de itens após remover duplicatas:`, uniqueItems.length)

    // Embaralha para variedade a cada carregamento
    const shuffled = shuffleArray(uniqueItems)

    // Limita ao número solicitado
    const result = shuffled.slice(0, limit)
    console.log(`Total de itens retornados:`, result.length)

    return result
  } catch (error) {
    console.error('Erro ao buscar conteúdo da seção:', error)
    return []
  }
}

/**
 * Normaliza o título removendo APENAS temporadas de séries
 * NÃO remove coleções ou continuações de filmes
 */
function normalizeTitle(title: string): string {
  let normalized = title.toLowerCase().trim()

  // Remove APENAS padrões de temporadas (séries)
  normalized = normalized.replace(/\b(temporada|season|s)\s*\d+/gi, '')
  normalized = normalized.replace(/\b(temporada|season|s)\s*[ivxlcdm]+/gi, '')

  // Remove espaços extras
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

/**
 * Remove duplicatas baseadas no título (apenas temporadas de séries)
 * Coleções e continuações de filmes são mantidas como itens distintos
 */
function removeDuplicatesByTitle(items: ContentItem[]): ContentItem[] {
  const uniqueMap = new Map<string, ContentItem>()

  items.forEach(item => {
    const normalizedTitle = normalizeTitle(item.titulo)
    if (!uniqueMap.has(normalizedTitle)) {
      uniqueMap.set(normalizedTitle, item)
    }
  })

  return Array.from(uniqueMap.values())
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
