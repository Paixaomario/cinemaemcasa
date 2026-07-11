import * as tmdb from '@/lib/tmdb'

function normalizeResult(payload: any, type: 'movie' | 'serie') {
  const posterPath = payload.poster_path || payload.poster || payload.capa
  const backdropPath = payload.backdrop_path || payload.backdrop || payload.banner

  const poster = posterPath
    ? posterPath.startsWith('http')
      ? posterPath
      : tmdb.tmdbImageUrl(posterPath, 'w500')
    : undefined

  const backdrop = backdropPath
    ? backdropPath.startsWith('http')
      ? backdropPath
      : tmdb.tmdbImageUrl(backdropPath, 'original')
    : undefined

  return {
    type,
    titulo: payload.title || payload.name || payload.titulo || 'Sem título',
    poster,
    backdrop,
    descricao: payload.description || payload.descricao || payload.overview || '',
    tmdb_id: payload.tmdb_id || payload.id,
    rating: payload.rating || payload.vote_average,
    year: payload.year || payload.ano || payload.release_date?.slice(0, 4) || payload.first_air_date?.slice(0, 4),
    ...payload,
  }
}

function parseLegacyId(id: string) {
  const match = id.match(/^(serie|movie)-(\d+)$/i)
  if (!match) return null
  return { type: match[1].toLowerCase() as 'movie' | 'serie', tmdbId: match[2] }
}

export async function hydrateCinemaItem(sb: any, id: string) {
  const { data, error } = await sb.from('content').select('*').eq('id', id).maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    const type = data.type === 'serie' ? 'serie' : 'movie'
    const result = normalizeResult(data, type)

    if (data.tmdb_id) {
      try {
        const details = type === 'serie'
          ? await tmdb.getShowDetails(String(data.tmdb_id))
          : await tmdb.getMovieDetails(String(data.tmdb_id))

        return normalizeResult({ ...result, ...details }, type)
      } catch {
        return result
      }
    }

    return result
  }

  const legacy = parseLegacyId(id)
  if (!legacy) return null

  try {
    const details = legacy.type === 'serie'
      ? await tmdb.getShowDetails(legacy.tmdbId)
      : await tmdb.getMovieDetails(legacy.tmdbId)

    return normalizeResult(details, legacy.type)
  } catch {
    return null
  }
}
