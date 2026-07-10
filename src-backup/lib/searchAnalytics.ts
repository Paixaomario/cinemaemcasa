import { createClient } from '@/lib/supabase'

export interface SearchAnalytics {
  id?: number
  query: string
  count?: number
  resultCount?: number
  date: string
  createdAt?: string
  updatedAt?: string
  region?: string
}

/**
 * Registra uma busca para analytics
 */
export async function trackSearch(
  query: string,
  resultCount: number,
  region: string = 'BR'
): Promise<void> {
  const sb = createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Tenta atualizar se já existe
    const { data: existing } = await sb
      .from('search_analytics')
      .select('*')
      .eq('query', query)
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      // Atualiza contador
      await sb
        .from('search_analytics')
        .update({
          count: (existing.count || 0) + 1,
          result_count: resultCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Cria novo registro
      await sb
        .from('search_analytics')
        .insert({
          query,
          count: 1,
          result_count: resultCount,
          date: today,
          region
        })
    }
  } catch (error) {
    console.error('[SearchAnalytics] Erro ao rastrear busca:', error)
  }
}

/**
 * Busca as buscas mais populares
 */
export async function getPopularSearches(
  limit: number = 10,
  region?: string
): Promise<SearchAnalytics[]> {
  const sb = createClient()

  let query = sb
    .from('search_analytics')
    .select('*')
    .order('count', { ascending: false })
    .limit(limit)

  if (region) {
    query = query.eq('region', region)
  }

  const { data, error } = await query

  if (error) {
    console.error('[SearchAnalytics] Erro ao buscar buscas populares:', error)
    return []
  }

  return data || []
}

/**
 * Busca as buscas recentes sem resultados (para identificar conteúdo faltante)
 */
export async function getSearchesWithNoResults(
  limit: number = 20
): Promise<SearchAnalytics[]> {
  const sb = createClient()

  const { data, error } = await sb
    .from('search_analytics')
    .select('*')
    .eq('result_count', 0)
    .order('count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[SearchAnalytics] Erro ao buscar buscas sem resultados:', error)
    return []
  }

  return data || []
}
