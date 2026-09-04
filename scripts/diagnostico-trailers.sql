-- Rode isso no SQL Editor do Supabase — só leitura, não altera nada.
-- Mostra filmes/séries sem trailer ou com link quebrado (página de
-- busca do YouTube em vez do vídeo direto, ou a home do YouTube sem
-- nada depois).

select id, titulo, trailer, tmdb_id, 'cinema' as tabela
from public.cinema
where trailer is null
   or trailer = ''
   or trailer ilike 'https://www.youtube.com/results%'
   or trailer in ('https://www.youtube.com/', 'https://www.youtube.com', 'https://youtube.com/', 'https://youtube.com')

union all

select id_n as id, titulo, trailer, tmdb_id, 'series' as tabela
from public.series
where trailer is null
   or trailer = ''
   or trailer ilike 'https://www.youtube.com/results%'
   or trailer in ('https://www.youtube.com/', 'https://www.youtube.com', 'https://youtube.com/', 'https://youtube.com')

order by tabela, titulo;
