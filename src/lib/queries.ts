import { cache } from 'react'
import { supabase } from './supabase'
import { getMovieBackdrop, getShowBackdrop } from './tmdb'

export const MOVIE_CATEGORY_ORDER = [
  'Lançamento 2026',
  'Lançamento 2025',
  'Animação',
  'Comédia',
  'Ação',
  'Aventura',
  'Dorama',
  'Negritude',
  'Finanças',
  'Infantil',
  'Clássicos',
  'Crime',
  'Anime',
  'Romance',
  'Religioso',
  'Nacional',
  'Documentários',
  'Drama',
  'Família',
  'Musical',
  'Faroeste',
  'Ficção',
  'Policial',
  'Suspense',
  'Terror',
  'Adulto',
]

export function getContentKey(item: any) {
  return [item?.id, item?.id_n, item?.slug, item?.titulo].filter(Boolean).map(String).join('-')
}

export function selectUniqueItems<T extends Record<string, any>>(items: T[], limit: number, usedIds = new Set<string>()) {
  const safeLimit = Math.max(0, limit)
  const normalizedSeen = new Set(Array.from(usedIds).map((value) => String(value)))
  const available = (items || []).filter((item) => {
    const key = getContentKey(item)
    return Boolean(key) && !normalizedSeen.has(key)
  })

  // Remove a aleatoriedade no servidor para evitar erros de hidratação.
  // A lista já vem ordenada do banco de dados.
  const selected = available.slice(0, safeLimit)

  selected.forEach((item) => {
    const key = String(item.id ?? item.id_n) // Usar um ID consistente
    if (key) {
      normalizedSeen.add(key)
      usedIds.add(key)
    }
  })

  return selected
}

// ============================================================
// HOME - home_sections
// ============================================================

export const getHomeSections = cache(async () => {
  try {
    const { data, error } = await supabase
      .from('home_sections')
      .select('*')
      .eq('ativo', true)
      .order('posicao', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar seções da home:', error)
    return []
  }
})

export const getHomeBannerItems = cache(async (limit = 12) => {
  try {
    const [cinemaResponse, seriesResponse] = await Promise.all([
      supabase.from('cinema').select('*').eq('type', 'movie').order('created_at', { ascending: false }).limit(limit),
      supabase.from('series').select('*').order('created_at', { ascending: false }).limit(limit),
    ])

    const cinemaItems = (cinemaResponse.data || []).filter((item) => item.banner || item.backdrop || item.poster)
    const seriesItems = (seriesResponse.data || []).filter((item) => item.banner || item.capa || item.poster)

    // Enrich items with TMDB backdrops if missing banner
    const enrichedCinema = await Promise.all(
      cinemaItems.map(async (item) => {
        if (!item.banner && item.tmdb_id) {
          const tmdbBackdrop = await getMovieBackdrop(item.tmdb_id)
          return { ...item, banner: tmdbBackdrop || item.backdrop || item.poster }
        }
        return item
      })
    )

    const enrichedSeries = await Promise.all(
      seriesItems.map(async (item) => {
        if (!item.banner && item.tmdb_id) {
          const tmdbBackdrop = await getShowBackdrop(item.tmdb_id)
          return { ...item, banner: tmdbBackdrop || item.capa || item.poster }
        }
        return item
      })
    )

    const combined = [...enrichedCinema, ...enrichedSeries]

    return selectUniqueItems(combined, Math.max(1, limit), new Set<string>())
  } catch (error) {
    console.error('Erro ao buscar banner da home:', error)
    return []
  }
})

export const getMovieBannerItems = cache(async (category?: string, limit = 12) => {
  try {
    let query = supabase.from('cinema').select('*').eq('type', 'movie')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)

    if (error) throw error

    const items = (data || []).filter((item) => item.banner || item.backdrop || item.poster)

    // Enrich items with TMDB backdrops if missing banner
    const enriched = await Promise.all(
      items.map(async (item) => {
        if (!item.banner && item.tmdb_id) {
          const tmdbBackdrop = await getMovieBackdrop(item.tmdb_id)
          return { ...item, banner: tmdbBackdrop || item.backdrop || item.poster }
        }
        return item
      })
    )

    return enriched
  } catch (error) {
    console.error('Erro ao buscar banner de filmes:', error)
    return []
  }
})

export const getSeriesBannerItems = cache(async (category?: string, limit = 12) => {
  try {
    let query = supabase.from('series').select('*')

    if (category) {
      query = query.eq('genero', category)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)

    if (error) throw error

    const items = (data || []).filter((item) => item.banner || item.capa || item.poster)

    // Enrich items with TMDB backdrops if missing banner
    const enriched = await Promise.all(
      items.map(async (item) => {
        if (!item.banner && item.tmdb_id) {
          const tmdbBackdrop = await getShowBackdrop(item.tmdb_id)
          return { ...item, banner: tmdbBackdrop || item.capa || item.poster }
        }
        return item
      })
    )

    return enriched
  } catch (error) {
    console.error('Erro ao buscar banner de séries:', error)
    return []
  }
})

export const getSectionContent = cache(async (section: any, usedIds = new Set<string>()) => {
  try {
    let query = supabase.from('cinema').select('*').eq('type', 'movie')

    // Se for a seção "Lançamento", ordena pelos mais recentes.
    if (section.posicao === 1) {
      query = query.order('created_at', { ascending: false })
    } else if (section.categorias) {
      const categoryArray = Array.isArray(section.categorias)
        ? section.categorias
        : String(section.categorias).split(',').map(c => c.trim())
      
      if (categoryArray.length > 0) {
        const orFilter = categoryArray.map((cat: string) => `category.ilike.%${cat}%`).join(',')
        query = query.or(orFilter)
      }
    }

    // Buscamos um "pool" grande de itens para garantir variedade na aleatorização.
    const { data, error } = await query.limit(200)

    if (error) throw error

    const rowLimit = Math.min(15, Number(section.limite) || 15)
    
    // Para a primeira seção, não aplicamos o filtro de 'usedIds' para garantir que ela sempre tenha conteúdo.
    if (section.posicao === 1) {
      return selectUniqueItems(data || [], rowLimit, usedIds)
    }

    // Para as demais, mantemos o filtro para evitar repetições.
    return selectUniqueItems(data || [], rowLimit, usedIds)
  } catch (error) {
    console.error('Erro ao buscar conteúdo da seção:', error)
    return []
  }
})

// ============================================================
// FILMES - cinema
// ============================================================

export const getMovies = cache(async (category?: string, limit = 50) => {
  try {
    let query = supabase
      .from('cinema')
      .select('*')
      .eq('type', 'movie')

    if (category) query = query.ilike('category', `%${category}%`)

    const { data, error } = await query.limit(limit).order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar filmes:', error)
    return []
  }
})

export const getMovieById = cache(async (id: string | number) => {
  try {
    const { data, error } = await supabase
      .from('cinema')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar filme:', error)
    return null
  }
})

export const getMovieCategories = cache(async () => {
  try {
    const { data, error } = await supabase
      .from('cinema')
      .select('category')
      .eq('type', 'movie')
      .not('category', 'is', null)

    if (error) throw error

    // Handle multiple categories separated by commas
    const categories = new Set<string>()
    data?.forEach(d => {
      if (d.category) {
        // Split by comma and trim each category
        const categoryList = d.category.split(',').map((c: string) => c.trim()).filter(Boolean)
        categoryList.forEach((c: string) => categories.add(c))
      }
    })

    const available = Array.from(categories) as string[]
    const ordered = MOVIE_CATEGORY_ORDER.filter((category) => available.includes(category))
    const extras = available.filter((category) => !ordered.includes(category))
    return [...ordered, ...extras]
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return []
  }
})

// ============================================================
// SÉRIES - series
// ============================================================

export const getSeries = cache(async (category?: string, limit = 50) => {
  try {
    let query = supabase.from('series').select('*')

    if (category) query = query.ilike('genero', `%${category}%`)

    const { data, error } = await query.limit(limit).order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar séries:', error)
    return []
  }
})

export const getSeriesById = cache(async (id: string | number) => {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('id_n', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar série:', error)
    return null
  }
})

export const getSeriesSeasons = cache(async (seriesId: string | number) => {
  try {
    const { data, error } = await supabase
      .from('temporadas')
      .select('*')
      .eq('serie_id', seriesId)
      .order('numero_temporada', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar temporadas:', error)
    return []
  }
})

export const getSeriesEpisodes = cache(async (seasonId: string | number) => {
  try {
    const { data, error } = await supabase
      .from('episodios')
      .select('*')
      .eq('temporada_id', seasonId)
      .order('numero_episodio', { ascending: true })

    if (error) throw error

    // Enrich episodes with TMDB backdrops if missing images
    const enriched = await Promise.all(
      (data || []).map(async (episode) => {
        if (!episode.banner && episode.tmdb_id) {
          const tmdbBackdrop = await getMovieBackdrop(episode.tmdb_id)
          return { ...episode, banner: tmdbBackdrop || episode.imagem_500 || episode.imagem_342 || episode.imagem_185 }
        }
        return episode
      })
    )

    return enriched
  } catch (error) {
    console.error('Erro ao buscar episódios:', error)
    return []
  }
})

export const getSeriesCategories = cache(async () => {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('genero')
      .not('genero', 'is', null)

    if (error) throw error
    
    // Handle multiple genres separated by commas
    const categories = new Set<string>()
    data?.forEach(d => {
      if (d.genero) {
        // Split by comma and trim each category
        const genreList = d.genero.split(',').map((g: string) => g.trim()).filter(Boolean)
        genreList.forEach((g: string) => categories.add(g))
      }
    })
    
    return Array.from(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return []
  }
})

// ============================================================
// PESQUISA - search_catalog
// ============================================================

export async function searchCatalog(query: string, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('search_catalog')
      .select('*')
      .ilike('titulo', `%${query}%`)
      .limit(limit)

    if (error) throw error
    
    // Registrar busca em analytics
    await recordSearch(query, data?.length || 0)
    
    return data || []
  } catch (error) {
    console.error('Erro ao buscar:', error)
    return []
  }
}

export async function recordSearch(query: string, resultCount: number) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: existing, error: fetchError } = await supabase
      .from('search_analytics')
      .select('*')
      .eq('query', query)
      .eq('date', today)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existing) {
      await supabase
        .from('search_analytics')
        .update({ count: existing.count + 1, result_count: resultCount })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('search_analytics')
        .insert({ query, date: today, result_count: resultCount, count: 1 })
    }
  } catch (error) {
    console.error('Erro ao registrar busca:', error)
  }
}

// ============================================================
// PERFIL - profiles
// ============================================================

export async function getProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
}

export async function updateProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return null
  }
}

// ============================================================
// ASSISTIR MAIS TARDE - watch_later
// ============================================================

export async function getWatchLater(userId: string) {
  try {
    const { data, error } = await supabase
      .from('watch_later')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar assistir mais tarde:', error)
    return []
  }
}

export async function addToWatchLater(userId: string, contentId: string) {
  try {
    const { data, error } = await supabase
      .from('watch_later')
      .insert({ user_id: userId, content_id: contentId })
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Erro ao adicionar para assistir:', error)
    return null
  }
}

export async function removeFromWatchLater(userId: string, contentId: string) {
  try {
    const { error } = await supabase
      .from('watch_later')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', contentId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao remover de assistir:', error)
    return false
  }
}