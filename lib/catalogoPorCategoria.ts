import { supabasePublic } from './supabase/server';
import type { Cinema } from './types';

const TAMANHO_PAGINA = 24;

/**
 * Busca uma "página" de filmes de uma categoria — usada tanto na
 * primeira renderização da página de Filmes (servidor) quanto na API
 * de rolagem infinita (app/api/categoria/route.ts).
 *
 * CORREÇÃO DE PERFORMANCE IMPORTANTE: essa função ANTES buscava o
 * pôster no TMDB, um por um, para cada item sem imagem, ANTES de
 * responder — com muitos itens sem capa numa mesma categoria, isso
 * podia demorar dezenas de segundos (ou minutos) só numa página,
 * porque a resposta ficava esperando todas essas chamadas externas
 * terminarem. Agora essa função só lê o banco (rápida, sempre) — o
 * reforço de capa via TMDB roda no NAVEGADOR, sob demanda, só para os
 * itens que realmente aparecerem sem imagem (ver TitleCard.tsx +
 * /api/poster), sem nunca travar o carregamento da página.
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

  return { items, fim: items.length < limit };
}

export { TAMANHO_PAGINA };
