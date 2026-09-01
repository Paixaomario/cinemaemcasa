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

export interface MetadadosTMDB {
  backdrop: string | null;
  poster: string | null;
  descricao: string | null;
  elenco: { nome: string; personagem?: string; foto?: string }[];
  trailerYoutube: string | null;
  classificacao: string | null;
  duracao: string | null;
  generos: string[];
  bandeira: string | null;
  idiomasAudio: string[];
  idiomasLegenda: string[];
}

/**
 * Busca, numa única chamada, TODOS os metadados que a página de
 * detalhes pode precisar como fallback quando o Supabase não tiver:
 * imagem de fundo, pôster, sinopse, elenco principal, trailer do
 * YouTube, classificação etária, duração, gêneros, bandeira do país e
 * idiomas de áudio/legenda disponíveis. Usado nas páginas de detalhes
 * de filme/série — sempre como ÚLTIMO recurso, nunca substituindo um
 * valor que já existe no banco.
 *
 * NOTA HONESTA: o TMDB não tem nenhum campo de "prêmios/premiações" —
 * essa informação simplesmente não existe na API deles, então não tem
 * como buscar isso de lá. Se você tiver essa informação disponível em
 * outro lugar, me avise que conecto.
 */
export async function getMetadadosDoTMDB(
  tmdbId: number,
  tipo: 'movie' | 'series'
): Promise<MetadadosTMDB> {
  const endpoint = tipo === 'series' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const classificacaoEndpoint =
    tipo === 'series' ? `${endpoint}/content_ratings` : `${endpoint}/release_dates`;

  const [detalhes, creditos, videos, classificacoes] = await Promise.all([
    tmdbFetch(endpoint),
    tmdbFetch(`${endpoint}/credits`),
    tmdbFetch(`${endpoint}/videos`),
    tmdbFetch(classificacaoEndpoint)
  ]);

  const elenco = (creditos?.cast || [])
    .slice(0, 8)
    .map((p: { name: string; character?: string; profile_path?: string }) => ({
      nome: p.name,
      personagem: p.character,
      foto: p.profile_path ? `${TMDB_IMG_BASE}${p.profile_path}` : undefined
    }));

  const trailer = (videos?.results || []).find(
    (v: { site: string; type: string }) => v.site === 'YouTube' && v.type === 'Trailer'
  );

  // Classificação etária: prioriza o Brasil (BR); se não tiver, usa a
  // primeira disponível — sempre real, nunca um palpite.
  let classificacao: string | null = null;
  if (tipo === 'series') {
    const resultados = classificacoes?.results || [];
    const br = resultados.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'BR');
    classificacao = br?.rating || resultados[0]?.rating || null;
  } else {
    const resultados = classificacoes?.results || [];
    const br = resultados.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'BR');
    const certBr = br?.release_dates?.find((d: { certification: string }) => d.certification)?.certification;
    if (certBr) classificacao = certBr;
    else {
      for (const r of resultados) {
        const cert = r.release_dates?.find((d: { certification: string }) => d.certification)?.certification;
        if (cert) {
          classificacao = cert;
          break;
        }
      }
    }
  }

  const codigoPais: string | undefined =
    detalhes?.origin_country?.[0] || detalhes?.production_countries?.[0]?.iso_3166_1;

  const runtimeMinutos: number | null =
    tipo === 'series' ? detalhes?.episode_run_time?.[0] : detalhes?.runtime;

  return {
    backdrop: detalhes?.backdrop_path ? `${TMDB_IMG_BASE}${detalhes.backdrop_path}` : null,
    poster: detalhes?.poster_path ? `${TMDB_IMG_BASE}${detalhes.poster_path}` : null,
    descricao: detalhes?.overview || null,
    elenco,
    trailerYoutube: trailer?.key || null,
    classificacao,
    duracao: runtimeMinutos ? `${runtimeMinutos} min` : null,
    generos: (detalhes?.genres || []).map((g: { name: string }) => g.name),
    bandeira: codigoPais ? codigoParaBandeira(codigoPais) : null,
    idiomasAudio: (detalhes?.spoken_languages || []).map(
      (l: { english_name?: string; name?: string }) => l.english_name || l.name || ''
    ),
    idiomasLegenda: [] // TMDB não informa legendas disponíveis por título
  };
}

/**
 * Versão leve do fallback de trailer — busca só o vídeo do YouTube,
 * sem elenco nem sinopse (usada pelo banner hero, que roda pra vários
 * títulos de uma vez e não precisa do resto dos metadados).
 */
export async function getTrailerYoutubeDoTMDB(
  tmdbId: number,
  tipo: 'movie' | 'series'
): Promise<string | null> {
  const endpoint = tipo === 'series' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
  const videos = await tmdbFetch(`${endpoint}/videos`);
  const trailer = (videos?.results || []).find(
    (v: { site: string; type: string }) => v.site === 'YouTube' && v.type === 'Trailer'
  );
  return trailer?.key || null;
}
