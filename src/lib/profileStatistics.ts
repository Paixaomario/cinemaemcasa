import { createClient } from '@/lib/supabase'

export interface ProfileStatistics {
  total_watch_time?: number
  movies_watched?: number
  series_watched?: number
  episodes_watched?: number
  last_watch_date?: string
  most_watched_genre?: string
}

/**
 * Atualiza as estatísticas do perfil baseado no histórico
 */
export async function updateProfileStatistics(userId: string): Promise<void> {
  const sb = createClient()

  // Buscar todo o histórico de visualização
  const { data: history } = await sb
    .from('view_progress')
    .select('*')
    .eq('user_id', userId)

  if (!history || history.length === 0) {
    return
  }

  // Calcular estatísticas
  let totalWatchTime = 0
  let moviesWatched = new Set<string>()
  let seriesWatched = new Set<string>()
  let episodesWatched = 0
  let lastWatchDate: string | null = null

  for (const item of history) {
    totalWatchTime += item.last_position || 0

    // Verificar se é episódio (content_id tem formato UUID-ep-XXXX)
    const isEpisode = item.content_id.includes('-ep-')

    if (isEpisode) {
      episodesWatched++
      // Extrair UUID da série
      const seriesUuid = item.content_id.split('-ep-')[0]
      seriesWatched.add(seriesUuid)
    } else {
      moviesWatched.add(item.content_id)
    }

    // Atualizar última data de visualização
    if (item.updated_at) {
      if (!lastWatchDate || new Date(item.updated_at) > new Date(lastWatchDate)) {
        lastWatchDate = item.updated_at
      }
    }
  }

  // Buscar gênero mais assistido (simplificado - pode ser melhorado com dados do conteúdo)
  const mostWatchedGenre = 'Ação' // Placeholder - pode ser implementado com dados reais

  // Verificar se já existe estatística para o usuário
  const { data: existing } = await sb
    .from('profile_statistics')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const statsData = {
    total_watch_time: totalWatchTime,
    movies_watched: moviesWatched.size,
    series_watched: seriesWatched.size,
    episodes_watched: episodesWatched,
    last_watch_date: lastWatchDate,
    most_watched_genre: mostWatchedGenre,
  }

  if (existing) {
    // Atualizar estatística existente
    await sb
      .from('profile_statistics')
      .update(statsData)
      .eq('user_id', userId)
  } else {
    // Criar nova estatística
    await sb
      .from('profile_statistics')
      .insert({
        user_id: userId,
        ...statsData
      })
  }
}

/**
 * Busca as estatísticas do perfil
 */
export async function getProfileStatistics(userId: string): Promise<ProfileStatistics> {
  const sb = createClient()

  const { data, error } = await sb
    .from('profile_statistics')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return {}
  }

  if (!data) {
    // Se não existe, tenta calcular do histórico
    await updateProfileStatistics(userId)
    const { data: newData } = await sb
      .from('profile_statistics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    return newData || {}
  }

  return {
    total_watch_time: data.total_watch_time,
    movies_watched: data.movies_watched,
    series_watched: data.series_watched,
    episodes_watched: data.episodes_watched,
    last_watch_date: data.last_watch_date,
    most_watched_genre: data.most_watched_genre,
  }
}
