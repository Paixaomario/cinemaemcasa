-- Remover filmes sem URL válida
DELETE FROM public.cinema 
WHERE url IS NULL 
   OR url = '' 
   OR url LIKE '%fake%'
   OR url LIKE '%example%'
   OR url LIKE '%test%';

-- Remover filmes com títulos genéricos
DELETE FROM public.cinema 
WHERE titulo LIKE '%Test%'
   OR titulo LIKE '%Fake%'
   OR titulo LIKE '%Sample%'
   OR titulo LIKE '%Example%';

-- Remover filmes sem categoria definida
DELETE FROM public.cinema 
WHERE category IS NULL 
   OR category = '';

-- Verificar resultado
SELECT COUNT(*) as filmes_restantes FROM public.cinema;
