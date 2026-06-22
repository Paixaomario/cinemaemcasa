-- EXECUTE ISSO NO SUPABASE SQL EDITOR AGORA!
-- Adicionar coluna url à tabela search_catalog existente

-- 1. Adicionar coluna url
ALTER TABLE public.search_catalog 
ADD COLUMN IF NOT EXISTS url TEXT;

-- 2. Sincronizar URLs dos filmes (cinema)
UPDATE public.search_catalog sc
SET url = c.url
FROM public.cinema c
WHERE sc.source_table = 'cinema' 
  AND sc.source_id::BIGINT = c.id
  AND sc.url IS NULL
  AND c.url IS NOT NULL;

-- 3. NOTA: Séries não têm URL direta (têm episódios com arquivos)
-- Por enquanto deixamos NULL para séries - buscarão URL quando necessário

-- 4. Verificar quantas linhas têm URL agora
SELECT COUNT(*) as total_com_url FROM search_catalog WHERE url IS NOT NULL;

-- 5. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_search_catalog_url ON public.search_catalog(url);

-- 6. Comentário
COMMENT ON COLUMN public.search_catalog.url IS 'URL do arquivo de vídeo para streaming';
