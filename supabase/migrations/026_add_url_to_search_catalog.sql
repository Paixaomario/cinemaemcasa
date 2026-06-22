-- Migration: Add URL field to search_catalog table
-- Description: Adiciona campo url à tabela search_catalog para sincronizar URLs de vídeos

-- 1. Adicionar coluna url se não existir
ALTER TABLE public.search_catalog 
ADD COLUMN IF NOT EXISTS url TEXT;

-- 2. Re-sincronizar todos os dados com URLs
-- Limpar dados existentes para re-sincronizar
DELETE FROM public.search_catalog;

-- 3. Sincronizar filmes da tabela cinema com URLs
INSERT INTO public.search_catalog (source_table, source_id, tipo, titulo, descricao, genero, ano, poster, banner, url)
SELECT 
  'cinema' as source_table,
  id::TEXT as source_id,
  'movie' as tipo,
  titulo,
  descricao,
  category as genero,
  ano,
  poster,
  backdrop as banner,
  url
FROM public.cinema
ON CONFLICT (source_table, source_id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao = EXCLUDED.descricao,
  genero = EXCLUDED.genero,
  ano = EXCLUDED.ano,
  poster = EXCLUDED.poster,
  banner = EXCLUDED.banner,
  url = EXCLUDED.url;

-- 4. Sincronizar séries da tabela series com URLs
INSERT INTO public.search_catalog (source_table, source_id, tipo, titulo, descricao, genero, ano, poster, banner, url)
SELECT 
  'series' as source_table,
  id_n::TEXT as source_id,
  'series' as tipo,
  titulo,
  descricao,
  genero,
  ano,
  capa as poster,
  banner,
  url
FROM public.series
ON CONFLICT (source_table, source_id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao = EXCLUDED.descricao,
  genero = EXCLUDED.genero,
  ano = EXCLUDED.ano,
  poster = EXCLUDED.poster,
  banner = EXCLUDED.banner,
  url = EXCLUDED.url;

-- 5. Criar índice para melhor performance de buscas por URL
CREATE INDEX IF NOT EXISTS idx_search_catalog_url ON public.search_catalog(url);

-- 6. Adicionar comentário ao campo
COMMENT ON COLUMN public.search_catalog.url IS 'URL do arquivo de vídeo para streaming';
