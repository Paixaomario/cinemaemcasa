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
