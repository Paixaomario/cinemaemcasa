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
    // Gera offset aleatório para variedade
    const randomOffset = Math.floor(Math.random() * 50)
    const searchLimit = Math.max(limit * 5, 50)

    // Busca conteúdo com maior rating e mais recente
    const { data: movies, error: moviesError } = await sb
      .from('cinema')
      .select('*')
      .gte('rating', 7)
      .order('rating', { ascending: false })
      .order('year', { ascending: false })
      .range(randomOffset, randomOffset + searchLimit - 1)

    const { data: series, error: seriesError } = await sb
      .from('series')
      .select('*')
      .gte('rating', 7)
      .order('rating', { ascending: false })
      .order('year', { ascending: false })
      .range(randomOffset, randomOffset + searchLimit - 1)

    const items: ContentItem[] = []

    if (movies) {
      movies.forEach(movie => {
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

    if (series) {
      series.forEach(serie => {
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

    // Gera offset aleatório para variedade
    const randomOffset = Math.floor(Math.random() * 50)
    const searchLimit = Math.max(limit * 3, 30)

    // Busca filmes baseados nos gêneros favoritos
    for (const genre of favoriteGenres) {
      const { data: movies } = await sb
        .from('cinema')
        .select('*')
        .ilike('category', `%${genre}%`)
        .gte('rating', 6)
        .order('rating', { ascending: false })
        .range(randomOffset, randomOffset + searchLimit - 1)

      if (movies) {
        movies.forEach(movie => {
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

      const { data: series } = await sb
        .from('series')
        .select('*')
        .ilike('category', `%${genre}%`)
        .gte('rating', 6)
        .order('rating', { ascending: false })
        .range(randomOffset, randomOffset + searchLimit - 1)

      if (series) {
        series.forEach(serie => {
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

    // Gera um offset aleatório baseado no timestamp atual para trazer conteúdo diferente
    const randomOffset = Math.floor(Math.random() * 100)
    const searchLimit = Math.max(limit * 10, 100) // Aumenta significativamente o limite de busca

    // Busca filmes
    let movieQuery = sb.from('cinema').select('*')

    if (categories && categories.length > 0) {
      const catFilters = categories.map(c => `category.ilike.%${c}%`).join(',')
      movieQuery = movieQuery.or(catFilters)
    }

    // Aplica ordenação aleatória para variedade
    if (ordenacao === 'rating_desc') {
      movieQuery = movieQuery.order('rating', { ascending: false })
    } else if (ordenacao === 'year_desc') {
      movieQuery = movieQuery.order('year', { ascending: false })
    } else {
      movieQuery = movieQuery.order('created_at', { ascending: false })
    }

    // Adiciona offset aleatório e aumenta limite
    const { data: movies } = await movieQuery.range(randomOffset, randomOffset + searchLimit - 1)

    if (movies) {
      movies.forEach(movie => {
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
      seriesQuery = seriesQuery.or(catFilters)
    }

    // Aplica ordenação aleatória para variedade
    if (ordenacao === 'rating_desc') {
      seriesQuery = seriesQuery.order('rating', { ascending: false })
    } else if (ordenacao === 'year_desc') {
      seriesQuery = seriesQuery.order('year', { ascending: false })
    } else {
      seriesQuery = seriesQuery.order('created_at', { ascending: false })
    }

    // Adiciona offset aleatório e aumenta limite
    const { data: series } = await seriesQuery.range(randomOffset, randomOffset + searchLimit - 1)

    if (series) {
      series.forEach(serie => {
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

    // Remove duplicatas baseadas no título (incluindo temporadas e coleções)
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
 * Normaliza o título removendo temporadas, coleções e sequências
 */
function normalizeTitle(title: string): string {
  let normalized = title.toLowerCase().trim()

  // Remove padrões de temporadas
  normalized = normalized.replace(/\b(temporada|season|s)\s*\d+/gi, '')
  normalized = normalized.replace(/\b(temporada|season|s)\s*[ivxlcdm]+/gi, '')

  // Remove padrões de coleções
  normalized = normalized.replace(/\b(coleção|collection|colecao)\s*\d*/gi, '')
  normalized = normalized.replace(/\b(coleção|collection|colecao)\s*[ivxlcdm]+/gi, '')

  // Remove padrões de partes
  normalized = normalized.replace(/\b(parte|part|pt)\s*\d+/gi, '')
  normalized = normalized.replace(/\b(parte|part|pt)\s*[ivxlcdm]+/gi, '')

  // Remove números romanos no final
  normalized = normalized.replace(/\s+[ivxlcdm]+\s*$/gi, '')

  // Remove números no final (sequências)
  normalized = normalized.replace(/\s*\d+\s*$/gi, '')

  // Remove espaços extras
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

/**
 * Remove duplicatas baseadas no título (case insensitive e detecta temporadas/coleções)
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
