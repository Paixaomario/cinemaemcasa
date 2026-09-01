import { supabasePublic } from './supabase/server';
import { limparTituloExibicao, qualidadeMaximaTMDB } from './exibicao';
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
  return { items: ajustarExibicao(removerPosterDeColecaoDuplicado(items)), fim: items.length < limit };
}

/**
 * CORREÇÃO DO BUG DA "CAPA DE COLEÇÃO": confirmado com dados reais do
 * banco (ex: toda a saga "Velozes e Furiosos") que o campo `poster`
 * pode estar preenchido com a MESMA imagem em vários filmes diferentes
 * — provavelmente uma capa de coleção/franquia salva por engano no
 * lugar da capa individual de cada um, enquanto `banner`/`backdrop`
 * e `tmdb_id` estão corretos e diferentes em cada filme.
 *
 * Detecta isso automaticamente: se o mesmo valor de `poster` aparece
 * em mais de um item do MESMO lote (itens com tmdb_id diferentes —
 * ou seja, são filmes diferentes de verdade), trata esse poster como
 * inválido (limpa pra null) só para esses itens. O TitleCard já busca
 * sozinho, no navegador, o pôster individual certo no TMDB usando o
 * tmdb_id de cada um (ver /api/poster) sempre que `poster` chega vazio
 * — então essa "limpeza" já resolve o problema automaticamente, sem
 * precisar alterar nada no banco.
 */
/**
 * Aplica, num só lugar, os dois ajustes de exibição pedidos: remove
 * ano solto no final do título (mantém números de sequência) e força
 * qualidade máxima nas imagens vindas do TMDB (1080p+).
 */
function ajustarExibicao(items: Cinema[]): Cinema[] {
  return items.map((item) => ({
    ...item,
    titulo: limparTituloExibicao(item.titulo),
    poster: qualidadeMaximaTMDB(item.poster),
    banner: qualidadeMaximaTMDB(item.banner),
    backdrop: qualidadeMaximaTMDB(item.backdrop)
  }));
}

function removerPosterDeColecaoDuplicado(items: Cinema[]): Cinema[] {
  const contagem = new Map<string, Set<number | null>>();
  for (const item of items) {
    if (!item.poster) continue;
    const tmdbIds = contagem.get(item.poster) || new Set();
    tmdbIds.add(item.tmdb_id);
    contagem.set(item.poster, tmdbIds);
  }

  return items.map((item) => {
    if (!item.poster) return item;
    const tmdbIds = contagem.get(item.poster);
    const compartilhadoEntreFilmesDiferentes = !!tmdbIds && tmdbIds.size > 1;
    return compartilhadoEntreFilmesDiferentes ? { ...item, poster: null } : item;
  });
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

  return { items: ajustarExibicao(removerPosterDeColecaoDuplicado(items)), fim: items.length < limit };
}

export { TAMANHO_PAGINA };
