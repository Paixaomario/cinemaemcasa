import { supabaseServer } from './supabase/server';
import type { Cinema } from './types';

/**
 * REGRA OBRIGATÓRIA E INEGOCIÁVEL:
 * Esta função NUNCA deve chamar TMDB ou qualquer API externa para decidir
 * o que recomendar. Toda indicação vem exclusivamente das tabelas
 * `cinema` e `recommendations` do próprio Supabase. Não remova este
 * comentário nem os filtros abaixo sem atualizar também o Agente QA Final.
 *
 * Filtro de conteúdo adulto: qualquer título cujo `category` ou `genre`
 * contenha "adulto" (case-insensitive) é excluído desta seção.
 */
export async function getHomeRecommendations(
  userId: string | null,
  limit = 5
): Promise<Cinema[]> {
  const ADULT_TERMS = ['adulto', '+18', 'adult'];

  // 1) Se houver linhas pré-calculadas na tabela `recommendations` para o usuário,
  //    prioriza-as (elas já referenciam content_id do próprio catálogo).
  if (userId) {
    const { data: recs } = await supabaseServer
      .from('recommendations')
      .select('content_id, score')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(limit * 2);

    if (recs && recs.length > 0) {
      const ids = recs.map((r) => Number(r.content_id)).filter((n) => !Number.isNaN(n));
      if (ids.length > 0) {
        const { data: titles } = await supabaseServer
          .from('cinema')
          .select('*')
          .in('id', ids);

        const filtered = (titles || []).filter((t) => !isAdult(t, ADULT_TERMS));
        if (filtered.length >= limit) return filtered.slice(0, limit);
      }
    }
  }

  // 2) Fallback: melhores avaliados do próprio catálogo, excluindo adulto.
  const { data, error } = await supabaseServer
    .from('cinema')
    .select('*')
    .order('rating', { ascending: false })
    .limit(limit * 3);

  if (error || !data) return [];

  return data.filter((t) => !isAdult(t, ADULT_TERMS)).slice(0, limit);
}

function isAdult(item: Cinema, terms: string[]): boolean {
  const haystack = `${item.category ?? ''} ${item.genre ?? ''}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}
