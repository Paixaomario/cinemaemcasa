import { getBackdropDoTMDB, getOrigemDoTMDB, getTrailerYoutubeDoTMDB } from './tmdb';
import { limparTituloExibicao, qualidadeMaximaTMDB } from './exibicao';
import type { Cinema } from './types';

export interface HeroData extends Cinema {
  classificacao?: string | null;
  bandeira?: string | null;
  trailerYoutube?: string | null;
}

/**
 * Mesma resolução do enrichHero, mas para uma LISTA de títulos — usada
 * pelo banner hero rotativo (várias capas em sequência, como Netflix/
 * YouTube), em vez de mostrar sempre o mesmo único título.
 */
export async function enrichHeroes(
  bases: Cinema[],
  classificacaoPorId?: Map<number | string, string | null>
): Promise<HeroData[]> {
  return Promise.all(bases.map((b) => enrichHero(b, classificacaoPorId?.get(b.id) ?? null)));
}

/**
 * Resolve os dados extras do banner hero, usados nas 5 páginas que o
 * exibem (Home, Filmes, Séries, Minha Lista, Busca):
 *  - imagem: coluna backdrop/banner do próprio título ou, na ausência,
 *    o backdrop do TMDB pelo tmdb_id salvo — nunca outra fonte;
 *  - bandeira do país de origem: resolvida via TMDB (código ISO real,
 *    nunca um palpite);
 *  - classificação: só é exibida quando o próprio registro já traz
 *    essa informação (ex: `classificacao` de séries) — nunca inventada
 *    para filmes, cuja tabela não tem essa coluna.
 */
export async function enrichHero(base: Cinema, classificacao?: string | null): Promise<HeroData> {
  let backdrop = base.backdrop;
  let bandeira: string | null = null;
  let trailerYoutube: string | null = null;

  if (base.tmdb_id) {
    const tipo = base.type === 'series' ? 'series' : 'movie';
    if (!backdrop && !base.banner) {
      backdrop = await getBackdropDoTMDB(base.tmdb_id, tipo);
    }
    // Sem trailer próprio no banco: busca um trailer do YouTube no
    // TMDB — melhor mostrar ALGUM movimento do que ficar preto/parado.
    if (!base.trailer) {
      trailerYoutube = await getTrailerYoutubeDoTMDB(base.tmdb_id, tipo);
    }
    bandeira = await getOrigemDoTMDB(base.tmdb_id, tipo);
  }

  return {
    ...base,
    titulo: limparTituloExibicao(base.titulo),
    backdrop: qualidadeMaximaTMDB(backdrop),
    banner: qualidadeMaximaTMDB(base.banner),
    poster: qualidadeMaximaTMDB(base.poster),
    classificacao: classificacao ?? null,
    bandeira,
    trailerYoutube
  };
}
