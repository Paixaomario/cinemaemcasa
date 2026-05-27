-- Script simples de debug - execute cada query separadamente

-- 1. Verificar tabela cinema
SELECT 
  COUNT(*) as total_filmes,
  COUNT(poster) as filmes_com_poster,
  COUNT(backdrop) as filmes_com_backdrop
FROM public.cinema;

-- 2. Verificar tabela series
SELECT 
  COUNT(*) as total_series,
  COUNT(poster) as series_com_poster,
  COUNT(capa) as series_com_capa,
  COUNT(banner) as series_com_banner
FROM public.series;

-- 3. Mostrar 3 exemplos de filmes
SELECT id, titulo, poster, backdrop 
FROM public.cinema 
LIMIT 3;

-- 4. Mostrar 3 exemplos de series
SELECT id_n, titulo, poster, capa, banner 
FROM public.series 
LIMIT 3;
