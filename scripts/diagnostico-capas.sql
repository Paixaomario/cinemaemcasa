-- =====================================================================
-- DIAGNÓSTICO: capas quebradas e capas duplicadas ("coleção")
-- =====================================================================
-- Rode isso no SQL Editor do Supabase. É só leitura — não altera nada.

-- 1) Links literalmente quebrados (terminam em /w500 sem nome de
--    arquivo depois — o link do TMDB sem a parte final do hash da
--    imagem, que não carrega nada).
select id, titulo, poster
from public.cinema
where poster ~ '^https://image\.tmdb\.org/t/p/w\d+/?$';

-- 2) Capas "de coleção": o MESMO valor de poster usado em filmes
--    DIFERENTES (tmdb_id diferente) — é o padrão exato do bug que
--    você reportou na saga Velozes e Furiosos. Mostra cada grupo de
--    filmes que compartilha a mesma imagem errada.
select poster, count(*) as quantos_filmes, array_agg(titulo order by titulo) as filmes, array_agg(tmdb_id order by titulo) as tmdb_ids
from public.cinema
where poster is not null
group by poster
having count(distinct tmdb_id) > 1
order by quantos_filmes desc;
