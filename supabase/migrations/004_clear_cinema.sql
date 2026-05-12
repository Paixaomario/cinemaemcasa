-- ============================================================
-- PAIXAOFLIX — Remover apenas filmes fake da tabela cinema
-- Execute no Supabase SQL Editor
-- ============================================================

-- Verificar estrutura da tabela cinema
-- \d public.cinema

-- Remover apenas filmes que não têm URL válida (conteúdo fake)
-- Assumindo que filmes fake têm URL nula, vazia ou inválida
DELETE FROM public.cinema 
WHERE url IS NULL 
   OR url = '' 
   OR url LIKE '%fake%'
   OR url LIKE '%example%'
   OR url LIKE '%test%';

-- Remover filmes com títulos genéricos que parecem fake
DELETE FROM public.cinema 
WHERE titulo LIKE '%Test%'
   OR titulo LIKE '%Fake%'
   OR titulo LIKE '%Sample%'
   OR titulo LIKE '%Example%';

-- Remover filmes sem categoria definida (possivelmente fake)
DELETE FROM public.cinema 
WHERE category IS NULL 
   OR category = '';

-- Verificar quantos filmes restam
-- SELECT COUNT(*) FROM public.cinema;

-- Mostrar alguns exemplos dos filmes restantes para verificação
-- SELECT id, titulo, category, url FROM public.cinema LIMIT 10;
