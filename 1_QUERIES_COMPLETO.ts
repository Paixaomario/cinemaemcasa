import { supabase } from './supabase'

// ============================================================
// HOME - home_sections
// ============================================================

export async function getHomeSections() {
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
}

export async function getSectionContent(section: any) {
  try {
    let query = supabase.from('cinema').select('*')
    
    if (section.categorias && section.categorias.length > 0) {
      query = query.in('category', section.categorias)
    }

    if (section.ordenacao === 'created_at_desc') {
      query = query.order('created_at', { ascending: false })
    } else if (section.ordenacao === 'rating_desc') {
      query = query.order('rating', { ascending: false })
    } else if (section.ordenacao === 'year_desc') {
      query = query.order('year', { ascending: false })
    }

    query = query.limit(section.limite || 5)

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar conteúdo da seção:', error)
    return []
  }
}

// ============================================================
// FILMES - cinema
// ============================================================

export async function getMovies(category?: string, limit = 50) {
  try {
    let query = supabase
      .from('cinema')
      .select('*')
      .eq('type', 'movie')

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.limit(limit).order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar filmes:', error)
    return []
  }
}

export async function getMovieById(id: string | number) {
  try {
    const { data, error } = await supabase
      .from('cinema')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar filme:', error)
    return null
  }
}

export async function getMovieCategories() {
  try {
    const { data, error } = await supabase
      .from('cinema')
      .select('category')
      .eq('type', 'movie')
      .not('category', 'is', null)

    if (error) throw error
    
    const categories = new Set(data?.map(d => d.category).filter(Boolean))
    return Array.from(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return []
  }
}

// ============================================================
// SÉRIES - series
// ============================================================

export async function getSeries(category?: string, limit = 50) {
  try {
    let query = supabase.from('series').select('*')

    if (category) {
      query = query.eq('genero', category)
    }

    const { data, error } = await query.limit(limit).order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar séries:', error)
    return []
  }
}

export async function getSeriesById(id: string | number) {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('id_n', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar série:', error)
    return null
  }
}

export async function getSeriesSeasons(seriesId: string | number) {
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
}

export async function getSeriesEpisodes(seasonId: string | number) {
  try {
    const { data, error } = await supabase
      .from('episodios')
      .select('*')
      .eq('temporada_id', seasonId)
      .order('numero_episodio', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar episódios:', error)
    return []
  }
}

export async function getSeriesCategories() {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('genero')
      .not('genero', 'is', null)

    if (error) throw error
    
    const categories = new Set(data?.map(d => d.genero).filter(Boolean))
    return Array.from(categories)
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return []
  }
}

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
