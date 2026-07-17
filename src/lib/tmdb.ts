const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY || process.env.TMDB_API_KEY || ''
const TMDB_TOKEN = process.env.NEXT_PUBLIC_TMDB_TOKEN || process.env.TMDB_TOKEN || ''

function buildTmdbUrl(path: string, params: Record<string, string | number | boolean> = {}) {
  const url = new URL(`${TMDB_BASE}${path}`)
  if (TMDB_API_KEY) {
    url.searchParams.set('api_key', TMDB_API_KEY)
  }

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

async function tmdbFetch<T = any>(path: string, params: Record<string, string | number | boolean> = {}) {
  const url = buildTmdbUrl(path, params)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (TMDB_TOKEN) {
    headers.Authorization = `Bearer ${TMDB_TOKEN}`
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export function tmdbImageUrl(path: string | null | undefined, size = 'original') {
  if (!path) return null
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `https://image.tmdb.org/t/p/${size}${normalized}`
}

export function extractTmdbTrailer(videos: any[] = []) {
  const trailer = videos.find((item) =>
    item.site === 'YouTube' && item.type === 'Trailer'
  )
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
}

export async function getMovieDetails(id: string) {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: 'credits,videos,images',
    include_image_language: 'en,null',
  })
}

export async function getShowDetails(id: string) {
  return tmdbFetch(`/tv/${id}`, {
    append_to_response: 'credits,videos,images',
    include_image_language: 'en,null',
  })
}

export async function getMovieBackdrop(tmdbId: string | number) {
  try {
    const data = await tmdbFetch(`/movie/${tmdbId}`, {
      append_to_response: 'images',
    })
    return tmdbImageUrl(data?.backdrop_path || data?.images?.backdrops?.[0]?.file_path, 'original')
  } catch (error) {
    console.error('Erro ao buscar backdrop do filme:', error)
    return null
  }
}

export async function getShowBackdrop(tmdbId: string | number) {
  try {
    const data = await tmdbFetch(`/tv/${tmdbId}`, {
      append_to_response: 'images',
    })
    return tmdbImageUrl(data?.backdrop_path || data?.images?.backdrops?.[0]?.file_path, 'original')
  } catch (error) {
    console.error('Erro ao buscar backdrop da série:', error)
    return null
  }
}
