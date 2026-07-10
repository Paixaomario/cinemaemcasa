import { createClient } from '@/lib/supabase'

export interface Recommendation {
  id?: string
  user_id: string
  content_id: string
  score?: number
  reason?: string
  created_at?: string
  viewed?: boolean
}

/**
 * Busca recomendações personalizadas para o usuário
 */
export async function getRecommendations(
  userId: string,
  limit: number = 20
): Promise<Recommendation[]> {
  const sb = createClient()

  const { data, error } = await sb
    .from('recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('viewed', false)
    .order('score', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('[Recommendations] Erro ao buscar recomendações:', error)
    return []
  }

  return data || []
}

/**
 * Marca uma recomendação como visualizada
 */
export async function markRecommendationAsViewed(
  userId: string,
  contentId: string
): Promise<void> {
  const sb = createClient()

  try {
    await sb
      .from('recommendations')
      .update({ viewed: true })
      .eq('user_id', userId)
      .eq('content_id', contentId)
  } catch (error) {
    console.error('[Recommendations] Erro ao marcar como visualizada:', error)
  }
}

/**
 * Cria uma nova recomendação
 */
export async function createRecommendation(
  userId: string,
  contentId: string,
  score?: number,
  reason?: string
): Promise<Recommendation | null> {
  const sb = createClient()

  const { data, error } = await sb
    .from('recommendations')
    .insert({
      user_id: userId,
      content_id: contentId,
      score,
      reason,
      viewed: false
    })
    .select()
    .single()

  if (error) {
    console.error('[Recommendations] Erro ao criar recomendação:', error)
    return null
  }

  return data
}

/**
 * Limpa recomendações antigas visualizadas
 */
export async function cleanupViewedRecommendations(userId: string): Promise<void> {
  const sb = createClient()

  try {
    // Remove recomendações visualizadas com mais de 30 dias
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    await sb
      .from('recommendations')
      .delete()
      .eq('user_id', userId)
      .eq('viewed', true)
      .lt('created_at', thirtyDaysAgo.toISOString())
  } catch (error) {
    console.error('[Recommendations] Erro ao limpar recomendações:', error)
  }
}
