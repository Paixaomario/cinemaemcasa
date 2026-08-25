// Uso restrito: apenas para enriquecer metadados (banner hero, capas
// ausentes) — NUNCA usado pelo motor de recomendações por IA (ver
// lib/recommendations.ts), que deve indicar somente títulos do
// catálogo próprio.

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/original';

export async function tmdbFetch(path: string) {
  const token = process.env.TMDB_API_READ_TOKEN;
  if (!token) return null;

  const res = await fetch(`${TMDB_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 }
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Bandeira do país de origem — resolvida a partir do código ISO que o
 * TMDB retorna (production_countries/origin_country), nunca inventada.
 * Conversão padrão de código de país para emoji de bandeira.
 */
function codigoParaBandeira(codigo: string): string {
  return codigo
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export async function getOrigemDoTMDB(
  tmdbId: number,
  tipo: 'movie' | 'series'
): Promise<string | null> {
  const endpoint = tipo === 'series' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const data = await tmdbFetch(endpoint);
  const codigo: string | undefined =
    data?.origin_country?.[0] || data?.production_countries?.[0]?.iso_3166_1;
  if (!codigo) return null;
  return codigoParaBandeira(codigo);
}

/**
 * Busca o backdrop (imagem de fundo) de um título direto no TMDB pelo
 * tmdb_id salvo na tabela — usado como fallback para o banner hero
 * quando as colunas `backdrop`/`banner` do próprio título estiverem
 * vazias no Supabase.
 */
export async function getBackdropDoTMDB(
  tmdbId: number,
  tipo: 'movie' | 'series'
): Promise<string | null> {
  const endpoint = tipo === 'series' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const data = await tmdbFetch(endpoint);
  if (!data?.backdrop_path) return null;
  return `${TMDB_IMG_BASE}${data.backdrop_path}`;
}

/**
 * Busca o pôster de um título direto no TMDB pelo tmdb_id — usado como
 * ÚLTIMO fallback nas capas (grades/carrosséis) quando as colunas
 * `poster`/`capa`/`banner` do próprio título estiverem todas vazias no
 * Supabase. Nunca usado quando alguma dessas colunas já tem valor.
 */
export async function getPosterDoTMDB(
  tmdbId: number,
  tipo: 'movie' | 'series'
): Promise<string | null> {
  const endpoint = tipo === 'series' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const data = await tmdbFetch(endpoint);
  if (!data?.poster_path) return null;
  return `${TMDB_IMG_BASE}${data.poster_path}`;
}
