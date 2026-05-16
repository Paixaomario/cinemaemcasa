// ═══════════════════════════════════════════════════
// PAIXAOFLIX — TMDB API Client
// ═══════════════════════════════════════════════════

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_TOKEN = process.env.NEXT_PUBLIC_TMDB_TOKEN!
const TMDB_KEY   = process.env.NEXT_PUBLIC_TMDB_KEY!

// Helper para validar se a string do path é válida
const isValidPath = (p: string | null | undefined) => 
  p && typeof p === 'string' && p.length > 5 && p !== 'null' && p !== 'undefined';

export const IMG = {
  poster:   (p: string | null, size = 'w500')  => isValidPath(p) ? `https://image.tmdb.org/t/p/${size}${p}` : null,
  backdrop: (p: string | null, size = 'w1280') => isValidPath(p) ? `https://image.tmdb.org/t/p/${size}${p}` : null,
  original: (p: string | null)                 => isValidPath(p) ? `https://image.tmdb.org/t/p/original${p}` : null,
}

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!TMDB_TOKEN && !TMDB_KEY) {
    console.warn('TMDB API: Chaves de API não encontradas. Verifique seu arquivo .env.local')
  }

  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('language', 'pt-BR')
  
  // Sempre envia a API Key como parâmetro de segurança adicional
  if (TMDB_KEY) url.searchParams.set('api_key', TMDB_KEY)
  
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: {
      ...(TMDB_TOKEN ? { Authorization: `Bearer ${TMDB_TOKEN}` } : {}),
      accept: 'application/json',
    },
    cache: 'no-store' // Garante atualização a cada reload do sistema
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    console.error('TMDB API Detailed Error:', errorData)
    throw new Error(`TMDB error: ${res.status} - ${errorData.status_message || path}`)
  }

  return res.json()
}

// ─── Types ────────────────────────────────────────
export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  genres?: TMDBGenre[]
  runtime?: number
  origin_country?: string[]
  original_language: string
  adult: boolean
  production_countries?: { iso_3166_1: string; name: string }[]
  certification?: string // added by enrichment
  media_type?: 'movie'
}

export interface TMDBShow {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  genres?: TMDBGenre[]
  number_of_seasons?: number
  number_of_episodes?: number
  origin_country?: string[]
  original_language: string
  production_countries?: { iso_3166_1: string; name: string }[]
  certification?: string
  media_type?: 'tv'
}

export type TMDBItem = (TMDBMovie | TMDBShow) & { media_type: 'movie' | 'tv' }

export interface TMDBGenre { id: number; name: string }

export interface TMDBPage<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

// ─── Genre IDs → names (pt-BR) ────────────────────
export const GENRE_NAMES_MOVIE: Record<number, string> = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
  99: 'Documentário', 18: 'Drama', 10751: 'Família', 14: 'Fantasia',
  36: 'História', 27: 'Terror', 10402: 'Música', 9648: 'Mistério',
  10749: 'Romance', 878: 'Ficção Científica', 10770: 'Cinema TV',
  53: 'Thriller', 10752: 'Guerra', 37: 'Faroeste',
}

export const GENRE_NAMES_TV: Record<number, string> = {
  10759: 'Ação e Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
  99: 'Documentário', 18: 'Drama', 10751: 'Família', 10762: 'Kids',
  9648: 'Mistério', 10763: 'Notícias', 10764: 'Reality', 10765: 'Sci-Fi',
  10766: 'Novela', 10767: 'Talk Show', 10768: 'Guerra e Política', 37: 'Faroeste',
}

// ─── Country → flag emoji ─────────────────────────
export function countryFlag(code: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸', BR: '🇧🇷', GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪',
    JP: '🇯🇵', KR: '🇰🇷', IT: '🇮🇹', ES: '🇪🇸', MX: '🇲🇽',
    AR: '🇦🇷', CA: '🇨🇦', AU: '🇦🇺', IN: '🇮🇳', CN: '🇨🇳',
    RU: '🇷🇺', PT: '🇵🇹', SE: '🇸🇪', DK: '🇩🇰', NO: '🇳🇴',
    FI: '🇫🇮', NL: '🇳🇱', BE: '🇧🇪', CH: '🇨🇭', AT: '🇦🇹',
    PL: '🇵🇱', CZ: '🇨🇿', HU: '🇭🇺', TR: '🇹🇷', IL: '🇮🇱',
    ZA: '🇿🇦', NG: '🇳🇬', EG: '🇪🇬', TH: '🇹🇭', ID: '🇮🇩',
    PH: '🇵🇭', TW: '🇹🇼', HK: '🇭🇰', SG: '🇸🇬', NZ: '🇳🇿',
  }
  return flags[code?.toUpperCase()] ?? '🌐'
}

// ─── Certification / Rating ───────────────────────
export async function getMovieCertification(id: number): Promise<string> {
  try {
    const data = await tmdb<{ results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[] }>(
      `/movie/${id}/release_dates`
    )
    const br = data.results.find(r => r.iso_3166_1 === 'BR')
    const us = data.results.find(r => r.iso_3166_1 === 'US')
    const src = br || us
    const cert = src?.release_dates.find(r => r.certification)?.certification
    return cert || 'L'
  } catch { return 'L' }
}

export async function getShowCertification(id: number): Promise<string> {
  try {
    const data = await tmdb<{ results: { iso_3166_1: string; rating: string }[] }>(
      `/tv/${id}/content_ratings`
    )
    const br = data.results.find(r => r.iso_3166_1 === 'BR')
    const us = data.results.find(r => r.iso_3166_1 === 'US')
    return br?.rating || us?.rating || 'L'
  } catch { return 'L' }
}

// ─── Movies ───────────────────────────────────────
export async function getTrendingMovies(page = 1) {
  return tmdb<TMDBPage<TMDBMovie>>('/trending/movie/week', { page: String(page) })
}

export async function getPopularMovies(page = 1) {
  return tmdb<TMDBPage<TMDBMovie>>('/movie/popular', { page: String(page) })
}

export async function getNowPlayingMovies(page = 1) {
  return tmdb<TMDBPage<TMDBMovie>>('/movie/now_playing', { page: String(page) })
}

export async function getTopRatedMovies(page = 1) {
  return tmdb<TMDBPage<TMDBMovie>>('/movie/top_rated', { page: String(page) })
}

export async function getMoviesByGenre(genreId: number, page = 1) {
  return tmdb<TMDBPage<TMDBMovie>>('/discover/movie', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  })
}

export async function getMovieDetails(id: number) {
  return tmdb<TMDBMovie>(`/movie/${id}`, { append_to_response: 'credits,videos,similar,recommendations,release_dates,watch/providers' }).then(data => ({ ...data, media_type: 'movie' as const }))
}

// ─── TV Shows ─────────────────────────────────────
export async function getTrendingShows(page = 1) {
  return tmdb<TMDBPage<TMDBShow>>('/trending/tv/week', { page: String(page) })
}

export async function getPopularShows(page = 1) {
  return tmdb<TMDBPage<TMDBShow>>('/tv/popular', { page: String(page) })
}

export async function getTopRatedShows(page = 1) {
  return tmdb<TMDBPage<TMDBShow>>('/tv/top_rated', { page: String(page) })
}

export async function getShowsByGenre(genreId: number, page = 1) {
  return tmdb<TMDBPage<TMDBShow>>('/discover/tv', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  })
}

export async function getShowDetails(id: number) {
  return tmdb<TMDBShow>(`/tv/${id}`, { 
    append_to_response: 'credits,videos,similar,recommendations,content_ratings,watch/providers' 
  }).then(data => ({ ...data, media_type: 'tv' as const }))
}

export async function getShowSeason(showId: number, season: number) {
  return tmdb<{ episodes: TMDBEpisode[] }>(`/tv/${showId}/season/${season}`)
}

export interface TMDBEpisode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path: string | null
  runtime: number | null
  air_date: string
}

// ─── Search ───────────────────────────────────────
export async function searchMulti(query: string, page = 1) {
  return tmdb<TMDBPage<TMDBItem>>('/search/multi', { query, page: String(page) })
}

// ─── Helpers ─────────────────────────────────────
export function getTitle(item: TMDBMovie | TMDBShow): string {
  return (item as TMDBMovie).title || (item as TMDBShow).name || ''
}

export function getYear(item: TMDBMovie | TMDBShow): string {
  const d = (item as TMDBMovie).release_date || (item as TMDBShow).first_air_date || ''
  return d.slice(0, 4)
}

export function getOriginCountry(item: TMDBMovie | TMDBShow): string {
  const pc = item.production_countries?.[0]?.iso_3166_1
  const oc = item.origin_country?.[0]
  return pc || oc || 'US'
}

export function getGenreNames(item: TMDBMovie | TMDBShow): string[] {
  const isMovie = (item as any).media_type === 'movie'
  const map = isMovie ? GENRE_NAMES_MOVIE : GENRE_NAMES_TV
  return (item.genre_ids || []).slice(0, 3).map(id => map[id]).filter(Boolean)
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}
