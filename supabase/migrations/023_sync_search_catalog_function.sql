-- Migration: Create sync_search_catalog RPC function
-- Date: 2024
-- Description: Create a function to manually sync all content from cinema and series to search_catalog

-- Drop função existente se houver (para evitar conflito de tipo de retorno)
DROP FUNCTION IF EXISTS sync_search_catalog();

-- Função RPC para sincronizar todo o catálogo de busca
CREATE FUNCTION sync_search_catalog()
RETURNS JSON AS $$
DECLARE
  result JSON;
  cinema_count INT;
  series_count INT;
BEGIN
  -- Sincroniza filmes
  INSERT INTO public.search_catalog (source_table, source_id, tipo, titulo, descricao, genero, ano, poster, banner)
  SELECT 
    'cinema' as source_table,
    id::TEXT as source_id,
    'movie' as tipo,
    titulo,
    descricao,
    category as genero,
    ano,
    poster,
    backdrop as banner
  FROM public.cinema
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao,
    genero = EXCLUDED.genero,
    ano = EXCLUDED.ano,
    poster = EXCLUDED.poster,
    banner = EXCLUDED.banner;
  
  GET DIAGNOSTICS cinema_count = ROW_COUNT;
  
  -- Sincroniza séries
  INSERT INTO public.search_catalog (source_table, source_id, tipo, titulo, descricao, genero, ano, poster, banner)
  SELECT 
    'series' as source_table,
    id_n::TEXT as source_id,
    'series' as tipo,
    titulo,
    descricao,
    genero,
    ano,
    capa as poster,
    banner
  FROM public.series
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao,
    genero = EXCLUDED.genero,
    ano = EXCLUDED.ano,
    poster = EXCLUDED.poster,
    banner = EXCLUDED.banner;
  
  GET DIAGNOSTICS series_count = ROW_COUNT;
  
  result := json_build_object(
    'success', true,
    'cinema_synced', cinema_count,
    'series_synced', series_count,
    'total', cinema_count + series_count
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION sync_search_catalog() TO service_role;
