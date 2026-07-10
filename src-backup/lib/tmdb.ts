/**
 * Biblioteca de integração com a API TMDB
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TMDB_TOKEN

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
  media_type?: 'movie';
}

export interface TMDBShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  overview: string;
  media_type?: 'tv';
}

/**
 * Função base para realizar requisições autenticadas ao TMDB
 */
async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}/${endpoint}`)
  
  // Parâmetros padrão: idioma em PT-BR
  url.searchParams.append('language', 'pt-BR')
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json;charset=utf-8',
    },
    // Revalidação a cada 1 hora para manter os dados atualizados sem sobrecarregar a API
    next: { revalidate: 3600 } 
  })

  if (!res.ok) {
    console.error(`Erro TMDB (${endpoint}):`, res.statusText)
    return null
  }

  return res.json()
}

/**
 * Busca detalhes de um filme pelo ID do TMDB
 */
export async function getMovieDetails(id: number | string) {
  return fetchTMDB(`movie/${id}`, { append_to_response: 'credits,videos,recommendations' })
}

/**
 * Busca multi-conteúdo (filmes e séries)
 */
export async function searchMulti(query: string) {
  return fetchTMDB('search/multi', { query })
}

/**
 * Busca detalhes de uma série pelo ID do TMDB
 */
export async function getShowDetails(id: number | string) {
  return fetchTMDB(`tv/${id}`, { append_to_response: 'credits,videos,recommendations' })
}

/**
 * Helper para gerar URLs de imagens do TMDB
 */
export const TMDB_IMG = {
  poster: (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `https://image.tmdb.org/t/p/w500${path}`
  },
  backdrop: (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `https://image.tmdb.org/t/p/original${path}`
  },
  profile: (path: string | null) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `https://image.tmdb.org/t/p/w185${path}`
  },
}