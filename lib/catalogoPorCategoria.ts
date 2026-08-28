import { supabasePublic } from './supabase/server';
import { getPosterDoTMDB } from './tmdb';
import type { Cinema } from './types';

const TAMANHO_PAGINA = 24;

/**
 * Busca uma "página" de filmes de uma categoria — usada tanto na
 * primeira renderização da página de Filmes (servidor) quanto na API
 * de rolagem infinita (app/api/categoria/route.ts), pra garantir que
 * as duas fontes usem exatamente a mesma consulta/ordem.
 *
 * Sem LIMITE MÁXIMO por categoria: o `offset` avança conforme o
 * usuário rola, e a rota de API é chamada de novo até esgotar tudo que
 * existe no banco para aquela categoria — só então a rolagem reinicia
 * do começo (nunca antes de mostrar tudo).
 */
export async function buscarFilmesPorCategoria(
  categoria: string,
  offset: number,
  limit: number = TAMANHO_PAGINA
): Promise<{ items: Cinema[]; fim: boolean }> {
  const { data } = await supabasePublic
    .from('cinema')
    .select('*')
    .eq('type', 'movie')
    .ilike('category', `%${categoria}%`)
    .order('rating', { ascending: false })
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  const items = data || [];
  return { items, fim: items.length < limit };
}

export async function buscarSeriesPorGenero(
  genero: string,
  offset: number,
  limit: number = TAMANHO_PAGINA
): Promise<{ items: Cinema[]; fim: boolean }> {
  const { data } = await supabasePublic
    .from('series')
    .select('*')
    .eq('genero', genero)
    .order('rating', { ascending: false })
    .order('id_n', { ascending: true })
    .range(offset, offset + limit - 1);

  const items: Cinema[] = (data || []).map((s) => ({
    id: s.id_n,
    titulo: s.titulo || '',
    description: s.descricao,
    tmdb_id: s.tmdb_id,
    url: null,
    trailer: s.trailer,
    year: s.ano,
    rating: s.rating,
    duration: s.tmdb_runtime,
    duration_seconds: null,
    category: s.genero,
    genre: s.genero,
    type: 'series',
    poster: s.poster || s.capa,
    banner: s.banner,
    backdrop: null,
    created_at: '',
    subtitles: null,
    audio_tracks: null,
    elenco: s.elenco,
    relacionados: s.relacionados
  }));

  // Se a série não tem NENHUMA imagem própria mas tem tmdb_id, busca o
  // pôster no TMDB como último recurso — evita capa em branco.
  const itemsComFallback = await Promise.all(
    items.map(async (item) => {
      if (item.poster || item.banner || !item.tmdb_id) return item;
      const posterTMDB = await getPosterDoTMDB(item.tmdb_id, 'series');
      return posterTMDB ? { ...item, poster: posterTMDB } : item;
    })
  );

  return { items: itemsComFallback, fim: items.length < limit };
}

export { TAMANHO_PAGINA };
