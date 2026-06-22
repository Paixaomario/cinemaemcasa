-- Migration: Create search_catalog table
-- Description: Cria tabela unificada para catalogo de busca (cinema e series)

-- 1. Criar tabela search_catalog
CREATE TABLE IF NOT EXISTS public.search_catalog (
  id BIGSERIAL PRIMARY KEY,
  source_table TEXT NOT NULL, -- 'cinema' ou 'series'
  source_id TEXT NOT NULL, -- ID da tabela de origem
  tipo TEXT NOT NULL, -- 'movie' ou 'series'
  titulo TEXT,
  descricao TEXT,
  genero TEXT,
  ano INTEGER,
  poster TEXT,
  banner TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir unicidade de source_table + source_id
  UNIQUE(source_table, source_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_search_catalog_tipo ON public.search_catalog(tipo);
CREATE INDEX IF NOT EXISTS idx_search_catalog_titulo ON public.search_catalog(titulo);
CREATE INDEX IF NOT EXISTS idx_search_catalog_genero ON public.search_catalog(genero);
CREATE INDEX IF NOT EXISTS idx_search_catalog_ano ON public.search_catalog(ano);
CREATE INDEX IF NOT EXISTS idx_search_catalog_source ON public.search_catalog(source_table, source_id);

-- 3. Adicionar comentários
COMMENT ON TABLE public.search_catalog IS 'Catálogo unificado para buscas (cinema e séries)';
COMMENT ON COLUMN public.search_catalog.source_table IS 'Tabela de origem: "cinema" ou "series"';
COMMENT ON COLUMN public.search_catalog.source_id IS 'ID do registro na tabela de origem';
COMMENT ON COLUMN public.search_catalog.tipo IS 'Tipo de conteúdo: "movie" ou "series"';
COMMENT ON COLUMN public.search_catalog.url IS 'URL do arquivo de vídeo para streaming';

-- 4. Sincronizar dados existentes de cinema
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
WHERE url IS NOT NULL AND url != ''
ON CONFLICT (source_table, source_id) DO NOTHING;

-- 5. Sincronizar dados existentes de series
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
WHERE url IS NOT NULL AND url != ''
ON CONFLICT (source_table, source_id) DO NOTHING;
