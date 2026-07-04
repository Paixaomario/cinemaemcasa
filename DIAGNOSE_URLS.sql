-- DIAGNÓSTICO: Verificar URLs nas diferentes tabelas

-- 1. Verificar alguns filmes em cinema
SELECT 'cinema' as source, id, titulo, url FROM public.cinema WHERE url IS NOT NULL LIMIT 5;

-- 2. Verificar alguns em search_catalog
SELECT 'search_catalog' as source, source_id, titulo, url FROM public.search_catalog WHERE source_table = 'cinema' AND url IS NOT NULL LIMIT 5;

-- 3. Contar filmes com URL em cada tabela
SELECT 
  'cinema' as table_name,
  COUNT(*) as total_com_url
FROM public.cinema 
WHERE url IS NOT NULL
UNION ALL
SELECT 
  'search_catalog',
  COUNT(*)
FROM public.search_catalog 
WHERE source_table = 'cinema' AND url IS NOT NULL;

-- 4. Teste de busca de um ID específico (substitua 123 pelo ID de um filme)
SELECT id, titulo, url FROM public.cinema WHERE id = 123 LIMIT 1;

-- 5. Teste de RLS - isso vai mostrar como o usuário vê os dados
SELECT id, titulo, url FROM public.cinema LIMIT 3;
