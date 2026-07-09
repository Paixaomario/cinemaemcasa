import { getMovieDetails, getShowDetails } from './tmdb';
import { CinemaItem } from '@/app/HomeClient';

/**
 * Função centralizada para hidratar um item de conteúdo a partir de IDs diversos.
 * Suporta: UUIDs (tabela content), IDs legados (tabela cinema/series) e formato 'tipo-id'.
 * @param contentType - Opcional: 'movie' ou 'serie' para forçar busca na tabela correta
 */
export async function hydrateCinemaItem(sb: any, contentId: string, contentType?: 'movie' | 'serie'): Promise<CinemaItem | null> {
  const idStr = String(contentId);
  let hydratedItem: any = null;
  let itemType: 'movie' | 'serie' = 'movie';

  // 1. Tenta buscar na tabela unificada 'content' (UUID)
  const { data: contentData } = await sb.from('content').select('id,title,type,tmdb_id,thumbnail_url,backdrop_url,trailer_url,duration_seconds,year,rating,cast_names,director,parent_id,season_number,episode_number,is_published,is_featured,views_count,created_at,updated_at').eq('id', idStr).maybeSingle();
  
  if (contentData) {
    itemType = contentData.type === 'series' ? 'serie' : 'movie';
    if (contentData.tmdb_id) {
      try {
        hydratedItem = itemType === 'movie' 
          ? await getMovieDetails(contentData.tmdb_id) 
          : await getShowDetails(contentData.tmdb_id);
      } catch (e) {
        console.warn(`Erro TMDB (content): ${idStr}`, e);
      }
    }
    if (!hydratedItem) {
      hydratedItem = { ...contentData, id: idStr, type: itemType };
    }
  } 
  // 2. Fallback para formato 'tipo-id' (ex: filme-123)
  else if (idStr.includes('-')) {
    const [type, rawId] = idStr.split('-');
    itemType = (type === 'filme' || type === 'movie') ? 'movie' : 'serie';
    try {
      hydratedItem = itemType === 'movie' ? await getMovieDetails(rawId) : await getShowDetails(rawId);
    } catch (e) {
      console.warn(`Erro TMDB (legacy format): ${idStr}`, e);
    }
  } 
  // 3. Fallback para tabelas legadas (cinema/series) via BigInt/ID numérico
  else {
    // Se contentType foi fornecido, busca diretamente na tabela correta
    if (contentType === 'movie') {
      const { data: cinemaData } = await sb.from('cinema').select('id,titulo,poster,backdrop,banner,year,category,rating,duration,duration_seconds,created_at,tmdb_id').eq('id', idStr).maybeSingle();
      if (cinemaData) {
        itemType = 'movie';
        if (cinemaData.tmdb_id) {
          try { hydratedItem = await getMovieDetails(cinemaData.tmdb_id); } catch (e) {}
        }
        if (!hydratedItem) hydratedItem = { ...cinemaData, id: idStr, type: 'movie' };
      }
    } else if (contentType === 'serie') {
      const numericId = /^\d+$/.test(idStr) ? parseInt(idStr) : null;
      if (numericId !== null) {
        const { data: seriesData } = await sb.from('series').select('id_n,titulo,poster,backdrop,banner,ano,classificacao,genero,rating,trailer,created_at,tmdb_id').eq('id_n', numericId).maybeSingle();
        if (seriesData) {
          itemType = 'serie';
          if (seriesData.tmdb_id) {
            try { hydratedItem = await getShowDetails(seriesData.tmdb_id); } catch (e) {}
          }
          if (!hydratedItem) hydratedItem = { ...seriesData, id: idStr, type: 'serie' };
        }
      }
    } else {
      // Fallback original: tenta cinema primeiro, depois series
      const { data: cinemaData } = await sb.from('cinema').select('id,titulo,poster,backdrop,banner,year,category,rating,duration,duration_seconds,created_at,tmdb_id').eq('id', idStr).maybeSingle();
      if (cinemaData) {
        itemType = 'movie';
        if (cinemaData.tmdb_id) {
          try { hydratedItem = await getMovieDetails(cinemaData.tmdb_id); } catch (e) {}
        }
        if (!hydratedItem) hydratedItem = { ...cinemaData, id: idStr, type: 'movie' };
      } else {
        const numericId = /^\d+$/.test(idStr) ? parseInt(idStr) : null;
        if (numericId !== null) {
          const { data: seriesData } = await sb.from('series').select('id_n,titulo,poster,backdrop,banner,ano,classificacao,genero,rating,trailer,created_at,tmdb_id').eq('id_n', numericId).maybeSingle();
          if (seriesData) {
            itemType = 'serie';
            if (seriesData.tmdb_id) {
              try { hydratedItem = await getShowDetails(seriesData.tmdb_id); } catch (e) {}
            }
            if (!hydratedItem) hydratedItem = { ...seriesData, id: idStr, type: 'serie' };
          }
        }
      }
    }
  }

  if (!hydratedItem) return null;

  return {
    ...hydratedItem,
    id: idStr,
    titulo: hydratedItem.titulo || hydratedItem.title || hydratedItem.name || 'Sem título',
    poster: hydratedItem.poster || (hydratedItem.poster_path ? `https://image.tmdb.org/t/p/w500${hydratedItem.poster_path}` : null),
    // Qualidade 4K/8K: Sempre usa 'original' para o fundo em telas de projeção
    backdrop: hydratedItem.backdrop || (hydratedItem.backdrop_path ? `https://image.tmdb.org/t/p/original${hydratedItem.backdrop_path}` : null),
    type: itemType,
  } as CinemaItem;
}