import { getBackdropDoTMDB, getOrigemDoTMDB } from './tmdb';
import type { Cinema } from './types';

export interface HeroData extends Cinema {
  classificacao?: string | null;
  bandeira?: string | null;
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

  if (base.tmdb_id) {
    const tipo = base.type === 'series' ? 'series' : 'movie';
    if (!backdrop && !base.banner) {
      backdrop = await getBackdropDoTMDB(base.tmdb_id, tipo);
    }
    bandeira = await getOrigemDoTMDB(base.tmdb_id, tipo);
  }

  return { ...base, backdrop, classificacao: classificacao ?? null, bandeira };
}
