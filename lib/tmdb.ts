// Uso restrito: apenas para enriquecer metadados de seções marcadas
// explicitamente com fonte = 'tmdb' em `home_sections`. NUNCA usado
// pelo motor de recomendações por IA (ver lib/recommendations.ts),
// que deve indicar somente títulos do catálogo próprio.

const TMDB_BASE = 'https://api.themoviedb.org/3';

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

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/original';

/**
 * Busca o backdrop (imagem de fundo) de um título direto no TMDB pelo
 * tmdb_id salvo na tabela — usado SOMENTE como fallback para o banner
 * hero da Home, quando as colunas `backdrop`/`banner` do próprio
 * título estiverem vazias no Supabase. A capa do banner hero deve
 * sempre vir de uma dessas duas fontes exatas (coluna da tabela ou
 * TMDB), nunca de qualquer outro lugar.
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
