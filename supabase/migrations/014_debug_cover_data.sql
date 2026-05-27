-- Script de debug para verificar dados de capas
-- Execute no SQL Editor do Supabase para diagnosticar o problema

-- 1. Verificar se há dados na tabela cinema
SELECT 
  COUNT(*) as total_cinema,
  COUNT(poster) as cinema_com_poster,
  COUNT(backdrop) as cinema_com_backdrop,
  COUNT(CASE WHEN poster IS NULL AND backdrop IS NULL THEN 1 END) as cinema_sem_capa
FROM public.cinema;

-- 2. Verificar se há dados na tabela series
SELECT 
  COUNT(*) as total_series,
  COUNT(poster) as series_com_poster,
  COUNT(capa) as series_com_capa,
  COUNT(banner) as series_com_banner,
  COUNT(CASE WHEN poster IS NULL AND capa IS NULL AND banner IS NULL THEN 1 END) as series_sem_capa
FROM public.series;

-- 3. Verificar se há dados na tabela temporadas
SELECT 
  COUNT(*) as total_temporadas,
  COUNT(capa) as temporadas_com_capa,
  COUNT(banner) as temporadas_com_banner,
  COUNT(CASE WHEN capa IS NULL AND banner IS NULL THEN 1 END) as temporadas_sem_capa
FROM public.temporadas;

-- 4. Mostrar exemplos de dados da tabela cinema
SELECT id, titulo, poster, backdrop 
FROM public.cinema 
LIMIT 5;

-- 5. Mostrar exemplos de dados da tabela series
SELECT id_n, titulo, poster, capa, banner 
FROM public.series 
LIMIT 5;

-- 6. Mostrar exemplos de dados da tabela temporadas
SELECT id_n, serie_id, numero_temporada, capa, banner 
FROM public.temporadas 
LIMIT 5;
