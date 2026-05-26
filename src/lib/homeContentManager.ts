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

// Cache de capas já exibidas nesta sessão
let displayedContentIds = new Set<string>()
let sessionStartTime: number | null = null

/**
 * Inicializa uma nova sessão de capas
 */
export function initializeContentSession() {
  displayedContentIds = new Set()
  sessionStartTime = Date.now()
}

/**
 * Verifica se a sessão expirou (mais de 1 hora)
 */
function isSessionExpired(): boolean {
  if (!sessionStartTime) return true
  const oneHour = 60 * 60 * 1000
  return Date.now() - sessionStartTime > oneHour
}

/**
 * Adiciona um conteúdo ao cache de exibidos
 */
export function addToDisplayedCache(contentId: string) {
  if (isSessionExpired()) {
    initializeContentSession()
  }
  displayedContentIds.add(contentId)
}

/**
 * Verifica se um conteúdo já foi exibido
 */
export function isContentDisplayed(contentId: string): boolean {
  if (isSessionExpired()) {
    initializeContentSession()
  }
  return displayedContentIds.has(contentId)
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

    // Busca os gêneros de cada conteúdo visualizado
    const genreCounts: Record<string, number> = {}

    for (const item of historyData) {
      const idStr = String(item.content_id)

      // Tenta buscar na tabela content
      const { data: contentData } = await sb
        .from('content')
        .select('genres')
        .eq('id', idStr)
        .maybeSingle()

      if (contentData?.genres) {
        const genres = Array.isArray(contentData.genres) ? contentData.genres : []
        genres.forEach(genre => {
          const genreName = genre.toLowerCase().trim()
          genreCounts[genreName] = (genreCounts[genreName] || 0) + 1
        })
      }
    }

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
    // Busca conteúdo com maior rating e mais recente
    const { data: movies, error: moviesError } = await sb
      .from('cinema')
      .select('*')
      .gte('rating', 7)
      .order('rating', { ascending: false })
      .order('year', { ascending: false })
      .limit(limit)

    const { data: series, error: seriesError } = await sb
      .from('series')
      .select('*')
      .gte('rating', 7)
      .order('rating', { ascending: false })
      .order('year', { ascending: false })
      .limit(limit)

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

    // Embaralha para variedade
    return shuffleArray(items).slice(0, limit)
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

    // Busca filmes baseados nos gêneros favoritos
    for (const genre of favoriteGenres) {
      const { data: movies } = await sb
        .from('cinema')
        .select('*')
        .ilike('category', `%${genre}%`)
        .gte('rating', 6)
        .order('rating', { ascending: false })
        .limit(10)

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
        .limit(10)

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

    // Remove duplicatas baseadas no título
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

    // Busca filmes
    let movieQuery = sb.from('cinema').select('*')

    if (categories && categories.length > 0) {
      const catFilters = categories.map(c => `category.ilike.%${c}%`).join(',')
      movieQuery = movieQuery.or(catFilters)
    }

    // Aplica ordenação
    if (ordenacao === 'rating_desc') movieQuery = movieQuery.order('rating', { ascending: false })
    else if (ordenacao === 'year_desc') movieQuery = movieQuery.order('year', { ascending: false })
    else movieQuery = movieQuery.order('created_at', { ascending: false })

    // Busca mais itens do que o limite para poder filtrar duplicatas
    const { data: movies } = await movieQuery.limit(limit * 2)

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

    // Aplica ordenação
    if (ordenacao === 'rating_desc') seriesQuery = seriesQuery.order('rating', { ascending: false })
    else if (ordenacao === 'year_desc') seriesQuery = seriesQuery.order('year', { ascending: false })
    else seriesQuery = seriesQuery.order('created_at', { ascending: false })

    const { data: series } = await seriesQuery.limit(limit * 2)

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

    // Remove duplicatas baseadas no título
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
 * Remove duplicatas baseadas no título (case insensitive)
 */
function removeDuplicatesByTitle(items: ContentItem[]): ContentItem[] {
  const uniqueMap = new Map<string, ContentItem>()

  items.forEach(item => {
    const key = item.titulo.toLowerCase().trim()
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
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
